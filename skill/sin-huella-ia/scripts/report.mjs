// Formato de terminal para el CLI.
const C = process.stdout.isTTY ? { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' } : { r: '', y: '', g: '', d: '', b: '', x: '' };

export function formatText(rep, { objetivo } = {}) {
  const col = rep.score <= 25 ? C.g : rep.score <= 50 ? C.y : C.r;
  const bar = (p, max, w = 20) => '█'.repeat(Math.round((p / max) * w)).padEnd(w, '·');
  const L = [];
  L.push('');
  L.push(`${C.b}Huella IA: ${col}${rep.score}%${C.x}  ${C.b}${rep.nivel.nombre}${C.x}  ${C.d}${rep.nivel.texto}${C.x}`);
  if (rep.objetivo != null || objetivo != null) {
    const o = objetivo ?? rep.objetivo;
    L.push(rep.score <= o ? `${C.g}Dentro del objetivo (≤ ${o}%)${C.x}` : `${C.r}Por encima del objetivo (≤ ${o}%)${C.x}`);
  }
  L.push('');
  for (const c of rep.categorias) L.push(`  ${c.nombre.padEnd(24)} ${bar(c.puntos, c.max)} ${String(c.puntos).padStart(4)} / ${c.max}`);
  L.push('');
  if (!rep.hallazgos.length) L.push(`${C.g}Sin hallazgos.${C.x}`);
  for (const h of rep.hallazgos) {
    L.push(`${C.b}• ${h.titulo}${C.x} ${C.d}(+${h.puntos}, ${h.cat})${C.x}`);
    if (h.evidencia.length) L.push(`  ${C.d}Evidencia: ${h.evidencia.join(' | ')}${C.x}`);
    L.push(`  Arreglo: ${h.arreglo}`);
  }
  if (rep.meta.notas.length) { L.push(''); rep.meta.notas.forEach((n) => L.push(`${C.y}Nota: ${n}${C.x}`)); }
  L.push(`${C.d}Confianza ${rep.meta.confianza} · ${rep.meta.palabras} palabras · CSS ${kb(rep.meta.cssBytes)} · JS ${kb(rep.meta.jsBytes)}${C.x}`);
  L.push('');
  return L.join('\n');
}
const kb = (n) => `${Math.round(n / 1024)} KB`;
