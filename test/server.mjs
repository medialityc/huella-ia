// Arranca el servidor en un puerto libre y comprueba SEO, recursos estáticos y HEAD.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const libre = () => new Promise((ok) => { const s = createServer().listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); }); });

async function arrancar(env) {
  const port = await libre();
  const child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((ok, mal) => {
    child.stdout.on('data', (d) => { if (String(d).includes('escuchando')) ok(); });
    child.on('exit', (c) => mal(new Error(`el servidor salió con código ${c}`)));
  });
  return { base: `http://127.0.0.1:${port}`, port, cerrar: () => child.kill() };
}

// Con SITE_URL fijo
const a = await arrancar({ SITE_URL: 'https://huella.ejemplo.com/' });
try {
  const r = await fetch(a.base + '/');
  const html = await r.text();
  assert.equal(r.status, 200);
  assert.ok(!html.includes('{{SITE_URL}}'), 'quedó la marca {{SITE_URL}} sin sustituir');
  assert.ok(html.includes('<link rel="canonical" href="https://huella.ejemplo.com/">'), 'canonical');
  assert.ok(html.includes('content="https://huella.ejemplo.com/og.png"'), 'og:image absoluta');
  assert.match(html, /<meta name="description" content="[^"]{70,170}">/, 'meta description de 70–170 caracteres');
  assert.match(html, /<script type="application\/ld\+json">[\s\S]*"WebApplication"/, 'JSON-LD');

  const robots = await fetch(a.base + '/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type'), /text\/plain/);
  const rt = await robots.text();
  assert.ok(rt.includes('Disallow: /api/'), 'robots bloquea /api/');
  assert.ok(rt.includes('Sitemap: https://huella.ejemplo.com/sitemap.xml'), 'robots apunta al sitemap');

  const sm = await fetch(a.base + '/sitemap.xml');
  assert.equal(sm.status, 200);
  assert.match(sm.headers.get('content-type'), /xml/);
  assert.ok((await sm.text()).includes('<loc>https://huella.ejemplo.com/</loc>'), 'sitemap con la portada');

  for (const [ruta, tipo] of [['/favicon.svg', 'image/svg+xml'], ['/og.png', 'image/png'], ['/apple-touch-icon.png', 'image/png']]) {
    const f = await fetch(a.base + ruta);
    assert.equal(f.status, 200, ruta);
    assert.equal(f.headers.get('content-type'), tipo, ruta);
    assert.match(f.headers.get('cache-control') || '', /max-age=\d+/, `${ruta} con caché`);
    assert.ok((await f.arrayBuffer()).byteLength > 100, `${ruta} no vacío`);
  }

  const head = await fetch(a.base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200, 'HEAD /');
  assert.match(head.headers.get('content-type'), /text\/html/);

  assert.equal((await fetch(a.base + '/../server.mjs')).status, 404, 'no sirve archivos fuera de la lista');
  assert.equal((await fetch(a.base + '/no-existe.png')).status, 404);
} finally { a.cerrar(); }

// Sin SITE_URL: se deduce del host y del protocolo que manda el proxy
const b = await arrancar({ SITE_URL: '' });
try {
  const html = await (await fetch(b.base + '/', { headers: { 'x-forwarded-proto': 'https' } })).text();
  assert.ok(html.includes(`<link rel="canonical" href="https://127.0.0.1:${b.port}/">`), 'canonical deducida del host');
} finally { b.cerrar(); }

console.log('ok · servidor, SEO y recursos');
