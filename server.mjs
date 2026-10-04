import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { analyze, buildContext, nivelDe } from './lib/analyzer.mjs';
import { fetchSite } from './lib/fetcher.mjs';
import { llmReview, llmEnabled } from './lib/llm.mjs';

const PORT = Number(process.env.PORT || 3000);
const PESO_IA = Math.min(0.6, Math.max(0, Number(process.env.LLM_WEIGHT ?? 0.3)));
const RATE = Number(process.env.RATE_PER_MIN || 8);
const SITE_URL = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
const page = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');

// Recursos estáticos permitidos: solo estos, leídos una vez al arrancar
const ESTATICOS = { '/favicon.svg': 'image/svg+xml', '/og.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
const estaticos = new Map(await Promise.all(Object.entries(ESTATICOS).map(async ([ruta, tipo]) =>
  [ruta, { tipo, cuerpo: await readFile(new URL('./public' + ruta, import.meta.url)) }])));

// Dominio público: SITE_URL si está; si no, el host y protocolo con que llega la petición (CapRover manda x-forwarded-proto)
function sitio(req) {
  if (SITE_URL) return SITE_URL;
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  return `${proto === 'https' ? 'https' : 'http'}://${host.replace(/[^a-z0-9.:[\]-]/gi, '')}`;
}
const robots = (base) => `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
const sitemap = (base) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc><changefreq>monthly</changefreq></url>\n</urlset>\n`;

const cache = new Map(); // url -> { at, data }
const hits = new Map();  // ip -> [timestamps]

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE;
}

const send = (res, code, body, type = 'application/json; charset=utf-8', extra = {}) => {
  res.writeHead(code, {
    'content-type': type,
    ...extra,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:",
  });
  if (res.req.method === 'HEAD') return res.end();
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

async function readBody(req, limit = 4096) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('Petición demasiado grande'); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}

async function analizar(url) {
  const key = url.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return { ...hit.data, cache: true };

  const site = await fetchSite(url);
  const rep = analyze(site);
  let ia = null;
  if (llmEnabled()) {
    ia = await llmReview({ text: buildContext(site).text, hallazgos: rep.hallazgos, url: site.finalUrl });
  }
  const heuristico = rep.score;
  const score = ia && ia.score != null ? Math.round(heuristico * (1 - PESO_IA) + ia.score * PESO_IA) : heuristico;
  const data = { url, finalUrl: site.finalUrl, ...rep, heuristico, ia, score, nivel: nivelDe(score), recursos: site.recursos, analizadoEn: new Date().toISOString() };
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return data;
}

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  try {
    const lee = req.method === 'GET' || req.method === 'HEAD';
    if (lee && (pathname === '/' || pathname === '/index.html')) return send(res, 200, page.replaceAll('{{SITE_URL}}', sitio(req)), 'text/html; charset=utf-8', { 'cache-control': 'public, max-age=300' });
    if (lee && estaticos.has(pathname)) { const f = estaticos.get(pathname); return send(res, 200, f.cuerpo, f.tipo, { 'cache-control': 'public, max-age=604800' }); }
    if (lee && pathname === '/robots.txt') return send(res, 200, robots(sitio(req)), 'text/plain; charset=utf-8', { 'cache-control': 'public, max-age=86400' });
    if (lee && pathname === '/sitemap.xml') return send(res, 200, sitemap(sitio(req)), 'application/xml; charset=utf-8', { 'cache-control': 'public, max-age=86400' });
    if (lee && pathname === '/salud') return send(res, 200, { ok: true, ia: llmEnabled() });
    if (req.method === 'POST' && pathname === '/api/analizar') {
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      if (limited(ip)) return send(res, 429, { error: 'Demasiados análisis seguidos. Espera un minuto.' });
      let url;
      try { url = JSON.parse(await readBody(req)).url; } catch { return send(res, 400, { error: 'Envía JSON con el campo "url".' }); }
      if (!url || typeof url !== 'string' || url.length > 2000) return send(res, 400, { error: 'Falta la dirección de la página.' });
      return send(res, 200, await analizar(url));
    }
    send(res, 404, { error: 'No encontrado' });
  } catch (e) {
    send(res, 422, { error: e.message || 'No se pudo analizar la página' });
  }
}).listen(PORT, () => console.log(`Huella IA escuchando en :${PORT}${llmEnabled() ? ' (con segunda opinión de Claude)' : ''}`));
