#!/usr/bin/env node
// Uso: node huella.mjs <url | carpeta | archivo> [--max 25] [--json]
// Sale con código 1 si la huella supera --max (útil en CI o antes de entregar).
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { analyze } from './analyzer.mjs';
import { fetchSite } from './fetcher.mjs';
import { formatText } from './report.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--max');

if (!target || flag('--help') || flag('-h')) {
  console.log('Uso: node huella.mjs <url | carpeta | archivo.html> [--max 25] [--json]');
  process.exit(target ? 0 : 2);
}

const HTMLISH = /\.(html?|jsx|tsx|vue|svelte|astro|mdx)$/i;
const CSSISH = /\.(css|scss|sass|less)$/i;
const JSISH = /\.(m?js|cjs|ts)$/i;
const IGNORE = new Set(['node_modules', '.git', '.next', '.nuxt', '.turbo', '.vercel', 'coverage', '.cache', '.expo', 'ios', 'android', 'test', 'tests', '__tests__', 'fixtures', 'stories', 'storybook-static']);

async function walk(dir, acc, budget) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (budget.files <= 0 || budget.bytes <= 0) return;
    if (IGNORE.has(e.name) || e.name.startsWith('.') && e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { await walk(p, acc, budget); continue; }
    if (/\.min\.|\.map$|\.d\.ts$|\.test\.|\.spec\.|tailwind\.config|vite\.config|next\.config/.test(e.name)) continue;
    const kind = HTMLISH.test(e.name) ? 'html' : CSSISH.test(e.name) ? 'css' : JSISH.test(e.name) ? 'js' : null;
    if (!kind) continue;
    const s = await stat(p); if (s.size > 4_000_000) continue;
    const txt = await readFile(p, 'utf8');
    if (txt.includes('huella-ia:ignorar')) continue;
    acc[kind].push(txt); budget.files--; budget.bytes -= txt.length;
  }
}

async function load(t) {
  if (/^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t) && !(await exists(t))) {
    const r = await fetchSite(t, { allowPrivate: true });
    return { html: r.html, css: r.css, js: r.js, origen: r.finalUrl };
  }
  const s = await stat(t);
  if (s.isDirectory()) {
    const acc = { html: [], css: [], js: [] };
    await walk(t, acc, { files: 600, bytes: 25_000_000 });
    return { html: acc.html.join('\n'), css: acc.css, js: acc.js, origen: path.resolve(t) };
  }
  const txt = await readFile(t, 'utf8');
  if (CSSISH.test(t)) return { html: '', css: [txt], js: [], origen: path.resolve(t) };
  if (JSISH.test(t)) return { html: '', css: [], js: [txt], origen: path.resolve(t) };
  return { html: txt, css: [], js: [], origen: path.resolve(t) };
}
const exists = (p) => stat(p).then(() => true, () => false);

try {
  const input = await load(target);
  const rep = analyze(input);
  rep.origen = input.origen;
  const max = opt('--max') != null ? Number(opt('--max')) : null;
  if (max != null) rep.objetivo = max;
  console.log(flag('--json') ? JSON.stringify(rep, null, 2) : formatText(rep));
  process.exit(max != null && rep.score > max ? 1 : 0);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(2);
}
