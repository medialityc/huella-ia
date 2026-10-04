import { SIGNALS, CATEGORIES, NIVELES, matches } from './signals.mjs';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', middot: '·', rarr: '→', hellip: '…', copy: '©' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

export const stripTags = (s) => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

export function extractText(html) {
  return stripTags(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/\{[^{}<>]*\}/g, ' ') // expresiones JSX/vue
  );
}

// Textos visibles que viven dentro de bundles de React/Vue (páginas SPA).
function jsCopy(js) {
  const out = [];
  matches(js, /children:\s*"((?:[^"\\]|\\.){3,240})"/g, 3000).forEach((m) => out.push(m[1]));
  matches(js, /children:\s*\[\s*"((?:[^"\\]|\\.){3,240})"/g, 2000).forEach((m) => out.push(m[1]));
  matches(js, /(?:title|description|label|placeholder|text|heading|subtitle|quote):\s*"((?:[^"\\]|\\.){8,240})"/g, 2000).forEach((m) => out.push(m[1]));
  return out
    .map((s) => s.replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\n/g, ' ').replace(/\\(.)/g, '$1'))
    .filter((s) => {
      const tokens = s.trim().split(/\s+/);
      if (tokens.length < 2 || !/\p{L}{3,}/u.test(s)) return false;
      const techy = tokens.filter((t) => /[:/[\]_#@=]|^[a-z]+-[a-z0-9-]+$|^(?:flex|grid|block|hidden|relative|absolute|inline|container)$/.test(t)).length;
      return techy / tokens.length < 0.4;
    })
    .join('. ');
}

export function buildContext({ html = '', css = [], js = [] }) {
  const inlineStyles = matches(html, /<style\b[^>]*>([\s\S]*?)<\/style>/gi, 200).map((m) => m[1]).join('\n');
  const styleAttrs = matches(html, /\sstyle=["']([^"']+)["']/gi, 3000).map((m) => m[1]).join(';\n');
  const inlineScripts = matches(html, /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, 200).map((m) => m[1]).join('\n');

  const cssAll = [inlineStyles, styleAttrs, ...css].join('\n');
  const jsAll = [inlineScripts, ...js].join('\n');

  const htmlText = extractText(html);
  const bundleText = jsCopy(jsAll);
  const text = (htmlText + ' ' + bundleText).replace(/\s+/g, ' ').trim();

  const headings = [
    ...matches(html, /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi, 300).map((m) => stripTags(m[1])),
  ].filter(Boolean);
  const ctas = [
    ...matches(html, /<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/gi, 1000).map((m) => stripTags(m[1])),
  ].filter((t) => t && t.length < 60);

  const classes = [
    ...matches(html, /\bclass(?:Name)?=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g, 20000).map((m) => m[1] || m[2] || m[3]),
    ...matches(jsAll, /className:\s*(?:"([^"]{3,600})"|`([^`]{3,600})`)/g, 20000).map((m) => m[1] || m[2]),
    ...matches(jsAll, /\b(?:cn|clsx|cva|twMerge)\(\s*"([^"]{3,600})"/g, 5000).map((m) => m[1]),
  ].join('\n');

  const words = (text.match(/\p{L}+/gu) || []).length;
  return { html, css: cssAll, js: jsAll, text, headings, ctas, classes, words, all: html + '\n' + cssAll + '\n' + jsAll };
}

export function analyze(input) {
  const ctx = buildContext(input);
  const hallazgos = [];
  const porCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));

  for (const s of SIGNALS) {
    let r;
    try { r = s.test(ctx); } catch (e) { r = { points: 0, evidence: [], error: e.message }; }
    const puntos = Math.round(Math.max(0, Math.min(s.weight, r.points || 0)) * 10) / 10;
    porCat[s.cat] += puntos;
    if (puntos > 0) hallazgos.push({ id: s.id, cat: s.cat, titulo: s.titulo, puntos, max: s.weight, evidencia: r.evidence || [], arreglo: s.arreglo });
  }

  const categorias = CATEGORIES.map((c) => ({ ...c, puntos: Math.round(Math.min(c.max, porCat[c.id]) * 10) / 10, bruto: Math.round(porCat[c.id] * 10) / 10 }));
  const score = Math.round(categorias.reduce((a, c) => a + c.puntos, 0));
  hallazgos.sort((a, b) => b.puntos - a.puntos);

  const notas = [];
  const cssBytes = ctx.css.length, jsBytes = ctx.js.length;
  let confianza = 'alta';
  if (ctx.words < 40 && jsBytes < 20000) { confianza = 'baja'; notas.push('Casi no hay texto ni código que analizar; el resultado es poco fiable.'); }
  else if (ctx.words < 120 && jsBytes >= 20000) { confianza = 'media'; notas.push('Poco texto en el HTML: la página se renderiza en el navegador. Se leyeron los textos de los bundles JS descargados.'); }
  else if (ctx.words < 120) { confianza = 'media'; notas.push('Hay poco texto; con más contenido el resultado es más fiable.'); }
  if (!cssBytes) notas.push('No se pudo leer CSS; las señales visuales pueden quedar por debajo de lo real.');

  return {
    score,
    nivel: nivelDe(score),
    categorias,
    hallazgos,
    meta: { palabras: ctx.words, cssBytes, jsBytes, confianza, notas },
  };
}

export function nivelDe(score) {
  return NIVELES.find((n) => score <= n.hasta) || NIVELES[NIVELES.length - 1];
}
