import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';

const UA = 'Mozilla/5.0 (compatible; HuellaIA/1.0; +https://github.com/)';

// ---------- protección SSRF ----------
const PRIVATE_V4 = [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4]];
const v4int = (ip) => ip.split('.').reduce((a, o) => ((a << 8) + Number(o)) >>> 0, 0);
const inCidr = (ip, [base, bits]) => {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (v4int(ip) & mask) === (v4int(base) & mask);
};
export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) return PRIVATE_V4.some((c) => inCidr(ip, c));
  const l = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (l === '::' || l === '::1') return true;
  const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return /^f[cd]|^fe[89ab]|^ff/.test(l);
}

function makeLookup(allowPrivate) {
  return (hostname, options, cb) => {
    if (typeof options === 'function') { cb = options; options = {}; }
    dns.lookup(hostname, { all: true }, (err, addrs) => {
      if (err) return cb(err);
      if (!allowPrivate && addrs.some((a) => isPrivateIp(a.address))) {
        return cb(Object.assign(new Error('El dominio apunta a una red privada'), { code: 'EPRIVATE' }));
      }
      if (options && options.all) return cb(null, addrs);
      cb(null, addrs[0].address, addrs[0].family);
    });
  };
}

export function validateUrl(raw, { allowPrivate = false } = {}) {
  let u;
  raw = String(raw).trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error('Solo se aceptan direcciones http o https');
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { throw new Error('La dirección no es válida'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Solo se aceptan direcciones http o https');
  if (u.username || u.password) throw new Error('La dirección no puede llevar credenciales');
  if (!allowPrivate) {
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('No se analizan direcciones locales');
    if (net.isIP(host) && isPrivateIp(host)) throw new Error('No se analizan direcciones de red privada');
    if (u.port && !['80', '443', '8080', '8443'].includes(u.port)) throw new Error('Puerto no permitido');
  }
  return u;
}

// ---------- GET con límites ----------
export function get(rawUrl, { maxBytes = 3_000_000, timeout = 12000, allowPrivate = false, redirects = 5, accept = '*/*' } = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = validateUrl(rawUrl, { allowPrivate }); } catch (e) { return reject(e); }
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(u, {
      headers: { 'user-agent': UA, accept, 'accept-encoding': 'gzip, deflate, br', 'accept-language': 'es,en;q=0.8' },
      lookup: makeLookup(allowPrivate),
      timeout,
    }, (res) => {
      const { statusCode: status, headers } = res;
      if (status >= 300 && status < 400 && headers.location) {
        res.resume();
        if (redirects <= 0) return reject(new Error('Demasiadas redirecciones'));
        const next = new URL(headers.location, u).toString();
        return get(next, { maxBytes, timeout, allowPrivate, redirects: redirects - 1, accept }).then(resolve, reject);
      }
      let stream = res;
      const enc = (headers['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
      else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

      const chunks = []; let size = 0; let truncated = false; let done = false;
      const finish = () => {
        if (done) return; done = true;
        resolve({ status, headers, finalUrl: u.toString(), body: Buffer.concat(chunks).toString('utf8'), truncated });
      };
      stream.on('data', (c) => {
        if (done) return;
        size += c.length;
        if (size > maxBytes) { chunks.push(c.subarray(0, c.length - (size - maxBytes))); truncated = true; req.destroy(); finish(); return; }
        chunks.push(c);
      });
      stream.on('end', finish);
      stream.on('error', (e) => (done ? null : chunks.length ? finish() : reject(e)));
    });
    req.on('timeout', () => req.destroy(new Error('La página tardó demasiado en responder')));
    req.on('error', (e) => reject(e.code === 'EPRIVATE' ? e : e.code === 'ENOTFOUND' ? new Error('No existe ese dominio') : e));
  });
}

// ---------- página + recursos ----------
const SKIP = /googletagmanager|google-analytics|gtag\/|facebook\.net|connect\.facebook|hotjar|clarity\.ms|segment\.|intercom|crisp\.chat|tawk\.to|recaptcha|stripe\.com|cloudflareinsights|plausible|umami|sentry|doubleclick|youtube|vimeo|maps\.googleapis/i;

function sameSite(a, b) {
  const root = (h) => h.split('.').slice(-2).join('.');
  return root(a) === root(b);
}

export async function fetchSite(rawUrl, { allowPrivate = false, maxCss = 6, maxJs = 6 } = {}) {
  const page = await get(rawUrl, { allowPrivate, maxBytes: 3_000_000, accept: 'text/html,application/xhtml+xml' });
  if (page.status >= 400) throw new Error(`La página respondió con error ${page.status}`);
  const ctype = String(page.headers['content-type'] || '');
  if (ctype && !/html|xml|text\/plain/i.test(ctype)) throw new Error('La dirección no devuelve una página HTML');

  const base = new URL(page.finalUrl);
  const html = page.body;
  const abs = (href) => { try { const x = new URL(href.replace(/&amp;/g, '&'), base); return /^https?:$/.test(x.protocol) ? x : null; } catch { return null; } };

  const cssUrls = [...html.matchAll(/<link\b[^>]*rel=["']?(?:stylesheet|preload)["']?[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /rel=["']?stylesheet|as=["']?style/i.test(tag))
    .map((tag) => (tag.match(/href=["']?([^"' >]+)/i) || [])[1])
    .filter(Boolean).map(abs).filter(Boolean)
    .filter((u) => !/fonts\.googleapis/.test(u.hostname));

  const jsUrls = [...html.matchAll(/<script\b[^>]*\bsrc=["']?([^"' >]+)/gi), ...html.matchAll(/<link\b[^>]*rel=["']?modulepreload["']?[^>]*href=["']?([^"' >]+)/gi)]
    .map((m) => abs(m[1])).filter(Boolean)
    .filter((u) => !SKIP.test(u.href) && sameSite(u.hostname, base.hostname))
    .sort((a, b) => rank(b.pathname) - rank(a.pathname));

  const uniqHref = (list) => [...new Map(list.map((u) => [u.href, u])).values()];
  const cssList = uniqHref(cssUrls).slice(0, maxCss);
  const jsList = uniqHref(jsUrls).slice(0, maxJs);

  const recursos = [];
  const load = async (u, kind, maxBytes) => {
    try {
      const r = await get(u.href, { allowPrivate, maxBytes, timeout: 10000 });
      if (r.status >= 400) throw new Error(`HTTP ${r.status}`);
      recursos.push({ url: u.href, tipo: kind, bytes: r.body.length, recortado: r.truncated });
      return r.body;
    } catch (e) {
      recursos.push({ url: u.href, tipo: kind, error: e.message });
      return '';
    }
  };
  const [css, js] = await Promise.all([
    Promise.all(cssList.map((u) => load(u, 'css', 1_500_000))),
    Promise.all(jsList.map((u) => load(u, 'js', 4_000_000))),
  ]);

  return { html, css: css.filter(Boolean), js: js.filter(Boolean), finalUrl: page.finalUrl, recursos };
}

function rank(p) {
  if (/(?:^|\/)(?:index|main|app|entry)[-.][\w-]*\.js$/i.test(p)) return 3;
  if (/app\/(?:\(.*\)\/)?page|pages\/index|layout/i.test(p)) return 2;
  if (/framework|polyfill|webpack|runtime|vendor/i.test(p)) return -1;
  return 0;
}
