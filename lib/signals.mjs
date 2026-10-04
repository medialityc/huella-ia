// huella-ia:ignorar (este archivo contiene los patrones; el CLI no lo analiza)
// Señales de "huella IA": patrones que aparecen por defecto en páginas generadas
// con IA sin dirección de diseño. Cada señal devuelve { points, evidence }.
// Fuente de verdad compartida por la web, el CLI y la skill sin-huella-ia.

export const CATEGORIES = [
  { id: 'origen', nombre: 'Origen y kit', max: 30 },
  { id: 'visual', nombre: 'Lenguaje visual', max: 30 },
  { id: 'estructura', nombre: 'Estructura y plantilla', max: 20 },
  { id: 'copy', nombre: 'Textos', max: 20 },
];

// ---------- utilidades ----------
const clip = (s, n = 90) => {
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
export function matches(str, re, limit = 400) {
  const out = [];
  if (!str) return out;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(str)) && out.length < limit) {
    out.push(m);
    if (m[0] === '') g.lastIndex++;
  }
  return out;
}
const count = (str, re) => matches(str, re).length;
const scaled = (hits, full, weight) => (hits <= 0 ? 0 : weight * Math.min(1, hits / full));
const uniq = (arr) => [...new Set(arr)];
const ctxSnippet = (str, index, len = 70) => clip(str.slice(Math.max(0, index - 20), index + len));
// límite de palabra compatible con acentos
const W = (s) => new RegExp(`(?<![\\p{L}\\d])${s}(?![\\p{L}\\d])`, 'giu');

// ---------- listas ----------
const DEFAULT_FONTS = [
  'Inter', 'Geist', 'Space Grotesk', 'Instrument Serif', 'Plus Jakarta Sans', 'DM Sans',
  'Outfit', 'Manrope', 'Poppins', 'Bricolage Grotesque', 'Sora', 'Satoshi', 'Cal Sans',
  'Playfair Display', 'Fraunces', 'JetBrains Mono', 'IBM Plex Mono',
];

const AI_PURPLES = ['#6366f1', '#4f46e5', '#4338ca', '#818cf8', '#8b5cf6', '#7c3aed', '#6d28d9',
  '#a78bfa', '#a855f7', '#9333ea', '#c084fc', '#d946ef', '#ec4899', '#db2777'];
const CREAM = ['#f4f1ea', '#faf9f5', '#f5f0e8', '#f7f4ed', '#fdfbf7', '#f5f1e8'];
const TERRACOTTA = ['#d97757', '#c96442', '#cc785c', '#da7756', '#e07a5f'];
const NEAR_BLACK = ['#0b0b0b', '#0a0a0a', '#111111', '#09090b', '#0c0c0c', '#111'];
const ACID = ['#c6ff00', '#d4ff3a', '#ccff00', '#bef264', '#a3e635', '#d9f99d', '#b4ff39', '#ff4d00', '#ff3b00'];

const BUZZ = [
  // inglés
  'seamless(?:ly)?', 'elevate', 'unlock', 'empower(?:s|ing)?', 'revolutioni[sz]e', 'supercharge',
  'cutting-edge', 'game[- ]chang(?:er|ing)', 'effortless(?:ly)?', 'leverage', 'harness', 'streamline',
  'robust', 'next-level', 'world-class', 'state-of-the-art', 'transform your', 'unleash', 'delve',
  'innovative', 'all-in-one', 'at your fingertips', 'like never before', 'reimagin(?:e|ed|ing)',
  'skyrocket', 'boost your', 'take control', 'peace of mind', 'one-stop',
  // español
  'sin esfuerzo', 'de vanguardia', 'siguiente nivel', 'pr[oó]ximo nivel', 'potencia(?:r|mos)?',
  'revoluciona(?:r|mos)?', 'transforma tu', 'impulsa(?:r|mos)?', 'soluci[oó]n(?:es)? integral(?:es)?',
  'innovador(?:a|as|es)?', 'experiencia[s]? [uú]nica[s]?', 'a otro nivel', 'todo en uno', 'eleva(?:r)?',
  'desbloquea', 'sin complicaciones', 'al alcance de tu mano', 'como nunca antes', 'optimiza(?:r)?',
  'de primer nivel', 'de clase mundial', 'tranquilidad', 'sin l[ií]mites', 'a tu medida',
];

const AI_PHRASES = [
  /in today'?s (?:fast-paced|digital|ever-changing|modern) (?:world|landscape|age)/gi,
  /whether you'?re an? [^.]{3,40}(?:or|,)/gi,
  /look no further/gi,
  /(?:take|elevate) your [\w ]{2,25} to the next level/gi,
  /lleva(?:r)? tu [\p{L} ]{2,25} al (?:siguiente|pr[oó]ximo) nivel/giu,
  /en (?:el mundo|la era) (?:actual|digital|de hoy)/gi,
  /it'?s not just (?:a|an) [^.]{3,40}[,—–-] it'?s/gi,
  /no es solo (?:un|una) [^.]{3,40}[,—–-] es /giu,
  /ready to (?:get started|transform|take|elevate|join)/gi,
  /¿?(?:list[oa]s?|preparad[oa]s?) para (?:empezar|transformar|llevar|dar el salto|comenzar)/giu,
  /join (?:thousands|millions|hundreds) of/gi,
  /[uú]nete a (?:miles|millones|cientos) de/giu,
  /trusted by (?:thousands|millions|leading|top|teams)/gi,
  /(?:con la confianza|la elecci[oó]n) de (?:miles|cientos|millones)/giu,
  /we'?re here to help/gi,
  /estamos aqu[ií] para ayudarte/giu,
];

const PLACEHOLDER = /john doe|jane doe|lorem ipsum|acme(?: inc| corp)?\b|your company|tu empresa\b|example\.com|via\.placeholder|placehold\.co|sarah (?:johnson|chen|mitchell|williams)|michael (?:chen|rodriguez)|emily (?:rodriguez|davis|chen|watson)|alex (?:johnson|rivera|chen)|david (?:kim|park)|jessica (?:lee|park)|marcus (?:johnson|chen|thompson)|priya (?:patel|sharma)|james (?:wilson|carter)|mar[ií]a garc[ií]a|carlos (?:mendoza|rodr[ií]guez)|ana mart[ií]nez|laura g[oó]mez/gi;

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2728}\u{26A1}\u{2705}\u{2B50}\u{1F680}]/gu;

// ---------- señales ----------
export const SIGNALS = [
  // ===== ORIGEN =====
  {
    id: 'builder-lovable', cat: 'origen', weight: 20, titulo: 'Rastro de Lovable / GPT Engineer',
    arreglo: 'Quitar dependencias y scripts del generador (lovable-tagger, gptengineer.js) y rehacer la capa visual con dirección propia.',
    test: (c) => {
      const m = matches(c.all, /lovable(?:-tagger|\.dev|\.app)?|gpt-?engineer|gptengineer\.js/gi, 5);
      return { points: m.length ? 20 : 0, evidence: uniq(m.map((x) => x[0])) };
    },
  },
  {
    id: 'builder-v0', cat: 'origen', weight: 20, titulo: 'Rastro de v0',
    arreglo: 'Eliminar metadatos y componentes de v0 sin adaptar; usar sus piezas solo como andamio.',
    test: (c) => {
      const m = matches(c.all, /v0\.dev|v0\.app|generated (?:by|with) v0|vercel\.com\/v0/gi, 5);
      return { points: m.length ? 20 : 0, evidence: uniq(m.map((x) => x[0])) };
    },
  },
  {
    id: 'builder-bolt', cat: 'origen', weight: 15, titulo: 'Rastro de Bolt / StackBlitz',
    arreglo: 'Limpiar artefactos del entorno de generación antes de publicar.',
    test: (c) => {
      const m = matches(c.all, /bolt\.new|stackblitz\.io|webcontainer/gi, 5);
      return { points: m.length ? 15 : 0, evidence: uniq(m.map((x) => x[0])) };
    },
  },
  {
    id: 'builder-otros', cat: 'origen', weight: 12, titulo: 'Generador web con IA declarado',
    arreglo: 'Si se usó un constructor con IA, reemplazar su plantilla base por un sistema visual propio.',
    test: (c) => {
      const ev = [];
      const gen = matches(c.html, /<meta[^>]+name=["']generator["'][^>]*content=["']([^"']+)["']/gi, 3);
      gen.forEach((g) => { if (/lovable|v0|bolt|framer|durable|10web|relume|hostinger|wix|mixo|create|replit|dora|uizard|webflow/i.test(g[1])) ev.push(`generator: ${g[1]}`); });
      matches(c.all, /durable\.co|10web\.io|mixo\.io|relume\.io|create\.xyz|replit\.(?:app|dev)|dora\.run|framerusercontent\.com\/[^"' ]*ai/gi, 3).forEach((m) => ev.push(m[0]));
      return { points: ev.length ? 12 : 0, evidence: uniq(ev) };
    },
  },
  {
    id: 'tailwind-cdn', cat: 'origen', weight: 4, titulo: 'Tailwind cargado por CDN',
    arreglo: 'Compilar Tailwind en build con un tema propio en lugar del script CDN.',
    test: (c) => {
      const m = matches(c.html, /cdn\.tailwindcss\.com/gi, 1);
      return { points: m.length ? 4 : 0, evidence: m.map((x) => x[0]) };
    },
  },
  {
    id: 'shadcn-tokens', cat: 'origen', weight: 8, titulo: 'Kit shadcn/ui',
    arreglo: 'Mantener shadcn si sirve, pero redefinir tokens (color, radio, tipografía) para la marca.',
    test: (c) => {
      const vars = ['--background', '--foreground', '--card-foreground', '--popover', '--primary-foreground',
        '--secondary-foreground', '--muted-foreground', '--accent-foreground', '--destructive', '--ring', '--radius', '--input'];
      const found = vars.filter((v) => c.css.includes(v + ':') || c.css.includes(v + ' :'));
      return { points: scaled(found.length, 8, 8), evidence: found.length >= 4 ? [found.join(', ')] : [] };
    },
  },
  {
    id: 'shadcn-defaults', cat: 'origen', weight: 8, titulo: 'Tokens por defecto sin personalizar',
    arreglo: 'Cambiar los valores HSL/OKLCH de fábrica por la paleta del cliente.',
    test: (c) => {
      const m = matches(c.css, /222\.2 84% 4\.9%|210 40% 98%|222\.2 47\.4% 11\.2%|0 0% 3\.9%|240 10% 3\.9%|240 5\.9% 10%|oklch\(0\.145 0 0\)|oklch\(0\.985 0 0\)|oklch\(0\.205 0 0\)|oklch\(0\.922 0 0\)/g, 20);
      return { points: scaled(m.length, 3, 8), evidence: uniq(m.map((x) => x[0])).slice(0, 4) };
    },
  },
  {
    id: 'lucide', cat: 'origen', weight: 4, titulo: 'Iconos Lucide por defecto',
    arreglo: 'Usar iconografía propia o ajustar trazo/tamaño/estilo; evitar el set genérico en todo.',
    test: (c) => {
      const n = count(c.all, /class=["']lucide|lucide-react|lucide lucide-/gi);
      return { points: n ? scaled(n, 3, 4) : 0, evidence: n ? [`${n} referencias a lucide`] : [] };
    },
  },
  {
    id: 'radix', cat: 'origen', weight: 2, titulo: 'Primitivas Radix sin capa propia',
    arreglo: 'No es un problema por sí solo; cuida que el estilo encima sea propio.',
    test: (c) => {
      const n = count(c.html, /data-radix-|data-state=["'](?:open|closed)["']/gi);
      return { points: n >= 3 ? 2 : 0, evidence: n >= 3 ? [`${n} atributos Radix`] : [] };
    },
  },

  // ===== VISUAL =====
  {
    id: 'fuentes', cat: 'visual', weight: 8, titulo: 'Tipografías de cajón',
    arreglo: 'Elegir tipografía por el rubro del cliente (oficio, época, región), no la que sale por defecto.',
    test: (c) => {
      const src = c.css + '\n' + c.html + '\n' + c.js.slice(0, 600000);
      const found = DEFAULT_FONTS.filter((f) => {
        const plus = f.replace(/ /g, '\\+');
        const flex = f.replace(/ /g, '[ _-]?');
        const slug = f.toLowerCase().replace(/ /g, '-');
        const re = new RegExp(`family=${plus}\\b|font-family:[^;}]*["' ,]${flex}\\b|["']${flex}["']|__${f.replace(/ /g, '_')}_|font-${slug}\\b`, 'i');
        return re.test(src);
      });
      return { points: Math.min(8, found.length * 4), evidence: found };
    },
  },
  {
    id: 'morados', cat: 'visual', weight: 6, titulo: 'Índigo / violeta de Tailwind',
    arreglo: 'Derivar el color de la marca (logo, producto, lugar), no de la paleta por defecto de Tailwind.',
    test: (c) => {
      const low = (c.css + c.html + c.classes).toLowerCase();
      const hex = AI_PURPLES.filter((h) => low.includes(h));
      const cls = count(c.classes, /(?:bg|text|from|via|to|border|ring|shadow)-(?:indigo|violet|purple|fuchsia)-(?:300|400|500|600|700)/g);
      const ev = [...hex]; if (cls) ev.push(`${cls} clases indigo/violet/purple`);
      return { points: scaled(hex.length + Math.min(cls, 6), 4, 6), evidence: ev };
    },
  },
  {
    id: 'texto-degradado', cat: 'visual', weight: 5, titulo: 'Texto con degradado',
    arreglo: 'Usar color sólido de marca en titulares; el degradado en texto es un sello de plantilla.',
    test: (c) => {
      const n = count(c.css, /background-clip:\s*text/gi) + count(c.classes, /bg-clip-text/g);
      return { points: n ? 5 : 0, evidence: n ? [`${n} usos de background-clip:text`] : [] };
    },
  },
  {
    id: 'degradado-morado', cat: 'visual', weight: 4, titulo: 'Degradados morado→rosa/azul',
    arreglo: 'Si hace falta profundidad, usar textura, fotografía o un tono de marca.',
    test: (c) => {
      const n = count(c.classes, /from-(?:purple|violet|indigo|fuchsia|blue)-\d{3}[^"'`]{0,60}to-(?:pink|blue|cyan|purple|fuchsia|indigo)-\d{3}/g)
        + count(c.css, /linear-gradient\([^)]*(?:#6366f1|#8b5cf6|#a855f7|#7c3aed|#ec4899)/gi);
      return { points: scaled(n, 2, 4), evidence: n ? [`${n} degradados de cajón`] : [] };
    },
  },
  {
    id: 'vidrio', cat: 'visual', weight: 3, titulo: 'Glassmorphism (backdrop-blur)',
    arreglo: 'Reservar el desenfoque para cuando hay contenido real detrás que lo justifique.',
    test: (c) => {
      const n = count(c.classes, /backdrop-blur/g) + count(c.css, /backdrop-filter:\s*blur/gi);
      return { points: n >= 2 ? 3 : n ? 1.5 : 0, evidence: n ? [`${n} desenfoques`] : [] };
    },
  },
  {
    id: 'crema-terracota', cat: 'visual', weight: 6, titulo: 'Crema + terracota',
    arreglo: 'Es el look editorial que hoy sale por defecto; buscar otra temperatura de color.',
    test: (c) => {
      const low = (c.css + c.html).toLowerCase();
      const a = CREAM.filter((h) => low.includes(h)); const b = TERRACOTTA.filter((h) => low.includes(h));
      return { points: a.length && b.length ? 6 : (a.length || b.length) ? 2 : 0, evidence: [...a, ...b] };
    },
  },
  {
    id: 'negro-acido', cat: 'visual', weight: 5, titulo: 'Casi-negro + acento ácido',
    arreglo: 'Evitar el negro tintado con un único verde lima/bermellón: es el modo oscuro de plantilla.',
    test: (c) => {
      const low = (c.css + c.html).toLowerCase();
      const a = NEAR_BLACK.filter((h) => new RegExp(h + '(?![0-9a-f])').test(low));
      const b = ACID.filter((h) => low.includes(h));
      return { points: a.length && b.length ? 5 : 0, evidence: a.length && b.length ? [...a, ...b] : [] };
    },
  },
  {
    id: 'radios', cat: 'visual', weight: 4, titulo: 'El mismo radio redondeado en todo',
    arreglo: 'Dar jerarquía con el radio (o no usarlo); no repetir rounded-2xl en cada caja.',
    test: (c) => {
      const n = count(c.classes, /rounded-(?:xl|2xl|3xl)\b/g) + count(c.css, /border-radius:\s*(?:12|16|20|24)px/gi);
      return { points: n >= 6 ? scaled(n, 15, 4) : 0, evidence: n >= 6 ? [`${n} radios grandes repetidos`] : [] };
    },
  },
  {
    id: 'sombras', cat: 'visual', weight: 3, titulo: 'Sombra gris suave bajo cada tarjeta',
    arreglo: 'Sombras con intención (luz y dirección) o ninguna.',
    test: (c) => {
      const n = count(c.classes, /shadow-(?:sm|md|lg|xl|2xl)\b/g) + count(c.css, /rgba\(0,\s*0,\s*0,\s*0?\.1\)/g);
      return { points: n >= 6 ? scaled(n, 12, 3) : 0, evidence: n >= 6 ? [`${n} sombras genéricas`] : [] };
    },
  },
  {
    id: 'manchas', cat: 'visual', weight: 3, titulo: 'Manchas difusas y fondos de cuadrícula',
    arreglo: 'Sustituir decoración abstracta por material del cliente (fotos, producto, lugar).',
    test: (c) => {
      const n = count(c.classes, /blur-3xl|blur-\[\d{3}px\]|bg-grid|bg-dot|animate-blob/g);
      return { points: n >= 2 ? 3 : n ? 1.5 : 0, evidence: n ? [`${n} decoraciones abstractas`] : [] };
    },
  },

  // ===== ESTRUCTURA =====
  {
    id: 'eyebrows', cat: 'estructura', weight: 4, titulo: 'Etiquetas en mayúsculas espaciadas sobre títulos',
    arreglo: 'Quitar la etiqueta "eyebrow" salvo que aporte información real.',
    test: (c) => {
      const n = count(c.classes, /uppercase[^"'`]{0,80}tracking-(?:wide|wider|widest|\[)|tracking-(?:wide|wider|widest|\[)[^"'`]{0,80}uppercase/g)
        + count(c.css, /\{[^}]*text-transform:\s*uppercase[^}]*letter-spacing:\s*0?\.[1-9]\d*em|\{[^}]*letter-spacing:\s*0?\.[1-9]\d*em[^}]*text-transform:\s*uppercase/gi);
      return { points: scaled(n, 3, 4), evidence: n ? [`${n} etiquetas tipo eyebrow`] : [] };
    },
  },
  {
    id: 'numerados', cat: 'estructura', weight: 3, titulo: 'Marcadores 01 / 02 / 03',
    arreglo: 'Numerar solo si el contenido es realmente una secuencia.',
    test: (c) => {
      const has = ['01', '02', '03'].every((n) => W(n).test(c.text));
      return { points: has ? 3 : 0, evidence: has ? ['01, 02, 03 en el texto'] : [] };
    },
  },
  {
    id: 'flechas', cat: 'estructura', weight: 3, titulo: 'Flecha → pegada a botones y enlaces',
    arreglo: 'Que el botón diga qué pasa; la flecha decorativa no informa.',
    test: (c) => {
      const t = c.ctas.filter((x) => /[→↗➜]\s*$/.test(x));
      const icons = count(c.all, /ArrowRight|arrow-right|lucide-arrow-up-right/g);
      const n = t.length + Math.min(icons, 6);
      return { points: scaled(n, 3, 3), evidence: [...t.slice(0, 3).map((x) => clip(x, 40)), ...(icons ? [`${icons} iconos ArrowRight`] : [])] };
    },
  },
  {
    id: 'punto-medio', cat: 'estructura', weight: 2, titulo: 'Metadatos unidos con " · "',
    arreglo: 'Estructurar la información en vez de encadenarla con puntos medios.',
    test: (c) => {
      const n = count(c.text, / · /g);
      return { points: n >= 3 ? 2 : 0, evidence: n >= 3 ? [`${n} separadores ·`] : [] };
    },
  },
  {
    id: 'plantilla-landing', cat: 'estructura', weight: 6, titulo: 'Esqueleto de landing SaaS',
    arreglo: 'Ordenar las secciones según cómo decide comprar el cliente del rubro, no según la plantilla.',
    test: (c) => {
      const groups = {
        'features': /\bfeatures\b|caracter[ií]sticas|funcionalidades|beneficios/i,
        'pricing': /\bpricing\b|precios|\bplanes\b/i,
        'testimonios': /testimonials|testimonios|lo que dicen|what (?:our )?(?:customers|clients|users) (?:say|are saying)/i,
        'faq': /\bfaq\b|preguntas frecuentes|frequently asked/i,
        'cómo funciona': /how it works|c[oó]mo funciona/i,
        'cta final': /get started|start (?:your )?free|empieza (?:ahora|hoy|gratis)|comienza (?:ahora|hoy|gratis)|prueba gratis/i,
      };
      const hay = Object.entries(groups).filter(([, re]) => re.test(c.text)).map(([k]) => k);
      return { points: hay.length >= 4 ? scaled(hay.length, 6, 6) : hay.length === 3 ? 2 : 0, evidence: hay.length >= 3 ? [hay.join(', ')] : [] };
    },
  },
  {
    id: 'precios-3', cat: 'estructura', weight: 3, titulo: 'Tres planes con "Más popular"',
    arreglo: 'Presentar precios como los vende el negocio real (por servicio, por pieza, por zona…).',
    test: (c) => {
      const pop = /most popular|m[aá]s popular|recomendado|best value/i.test(c.text);
      const tiers = count(c.text, /\b(?:starter|basic|pro|enterprise|business|b[aá]sico|empresa|premium)\b/gi);
      return { points: pop && tiers >= 3 ? 3 : 0, evidence: pop && tiers >= 3 ? ['plan destacado + niveles genéricos'] : [] };
    },
  },
  {
    id: 'animaciones', cat: 'estructura', weight: 4, titulo: 'Fade-up en cada sección',
    arreglo: 'Un solo momento de movimiento orquestado; el resto, respuesta a acciones del usuario.',
    test: (c) => {
      const n = count(c.all, /whileInView|data-aos=|animate-fade|fade-in-up|fadeInUp|initial:\{opacity:0,y:|initial=\{\{\s*opacity:\s*0,\s*y:/g);
      return { points: scaled(n, 4, 4), evidence: n ? [`${n} animaciones de entrada`] : [] };
    },
  },
  {
    id: 'emoji-titulos', cat: 'estructura', weight: 3, titulo: 'Emojis decorando títulos',
    arreglo: 'Sustituir emojis por iconografía o fotografía coherente con la marca.',
    test: (c) => {
      const n = c.headings.filter((h) => new RegExp(EMOJI.source, 'u').test(h)).length;
      const t = count(c.text, EMOJI);
      return { points: n ? scaled(n, 2, 3) : t >= 6 ? 1.5 : 0, evidence: c.headings.filter((h) => new RegExp(EMOJI.source, 'u').test(h)).slice(0, 3).map((h) => clip(h, 50)) };
    },
  },

  // ===== COPY =====
  {
    id: 'buzzwords', cat: 'copy', weight: 10, titulo: 'Vocabulario de relleno',
    arreglo: 'Cambiar adjetivos vacíos por hechos del cliente: qué hace, para quién, dónde, a qué precio.',
    test: (c) => {
      const hits = [];
      BUZZ.forEach((b) => matches(c.text, W(b), 10).forEach((m) => hits.push(m[0].toLowerCase())));
      const rate = c.words ? (hits.length / c.words) * 1000 : 0;
      const pts = Math.min(10, hits.length * 1.2 + (rate > 8 ? 2 : 0));
      return { points: pts, evidence: uniq(hits).slice(0, 8) };
    },
  },
  {
    id: 'frases-ia', cat: 'copy', weight: 6, titulo: 'Frases típicas de LLM',
    arreglo: 'Reescribir con la voz del cliente; si la frase serviría para cualquier negocio, sobra.',
    test: (c) => {
      const hits = [];
      AI_PHRASES.forEach((re) => matches(c.text, re, 3).forEach((m) => hits.push(clip(m[0], 60))));
      return { points: Math.min(6, hits.length * 2), evidence: uniq(hits).slice(0, 5) };
    },
  },
  {
    id: 'triadas', cat: 'copy', weight: 3, titulo: 'Eslóganes en tríada ("Rápido. Simple. Seguro.")',
    arreglo: 'Un titular con una promesa concreta vale más que tres adjetivos sueltos.',
    test: (c) => {
      const m = matches(c.text, /(?:^|[\s"“])(\p{Lu}\p{Ll}{2,12})\.\s+(\p{Lu}\p{Ll}{2,12})\.\s+(\p{Lu}\p{Ll}{2,12})\./gu, 5);
      return { points: m.length ? 3 : 0, evidence: m.map((x) => clip(x[0], 50)) };
    },
  },
  {
    id: 'placeholders', cat: 'copy', weight: 5, titulo: 'Nombres y datos de relleno',
    arreglo: 'Testimonios, nombres y logos reales del cliente o nada.',
    test: (c) => {
      const m = matches(c.text + ' ' + c.html.slice(0, 400000) + ' ' + c.js.slice(0, 2000000), PLACEHOLDER, 10);
      return { points: m.length ? Math.min(5, 2 + m.length) : 0, evidence: uniq(m.map((x) => x[0])).slice(0, 5) };
    },
  },
  {
    id: 'cifras-vagas', cat: 'copy', weight: 2, titulo: 'Cifras de adorno (10k+, 99.9%, 24/7)',
    arreglo: 'Usar métricas verificables del negocio, con contexto.',
    test: (c) => {
      const m = matches(c.text, /\b(?:10|50|100)[,.]?000\+|\b99[.,]9\s?%|\b24\/7\b|\b10x\b|\b\d{1,3}k\+/gi, 10);
      return { points: m.length >= 3 ? 2 : m.length ? 1 : 0, evidence: uniq(m.map((x) => x[0])) };
    },
  },
  {
    id: 'rayas', cat: 'copy', weight: 3, titulo: 'Exceso de raya (—)',
    arreglo: 'Puntuación normal; la raya repetida es un tic de texto generado.',
    test: (c) => {
      const n = count(c.text, /—/g);
      const rate = c.words ? (n / c.words) * 1000 : 0;
      return { points: n >= 4 && rate > 4 ? 3 : n >= 3 && rate > 2 ? 1.5 : 0, evidence: n >= 3 ? [`${n} rayas (${rate.toFixed(1)} por cada 1000 palabras)`] : [] };
    },
  },
];

export const NIVELES = [
  { hasta: 20, nombre: 'Artesanal', texto: 'Apenas hay patrones de plantilla. Se nota dirección propia.' },
  { hasta: 40, nombre: 'Con criterio', texto: 'Algún default suelto, pero la identidad se sostiene.' },
  { hasta: 60, nombre: 'Genérico', texto: 'Se parece a muchas otras páginas. Varias decisiones salieron por defecto.' },
  { hasta: 80, nombre: 'Plantilla IA', texto: 'La mayoría de decisiones visuales y de texto son las que da una IA sin guía.' },
  { hasta: 100, nombre: 'Huella fuerte', texto: 'Generada casi sin intervención: kit, paleta, estructura y textos de fábrica.' },
];

export { clip, ctxSnippet };
