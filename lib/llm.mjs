// Segunda opinión opcional con Claude (solo si hay ANTHROPIC_API_KEY).
// Lee el texto visible y los hallazgos heurísticos y devuelve { score, razones }.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

export const llmEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function llmReview({ text, hallazgos, url }) {
  if (!llmEnabled()) return null;
  const sample = text.slice(0, 7000);
  const resumen = hallazgos.slice(0, 12).map((h) => `- ${h.titulo}: ${h.evidencia.join(' | ')}`).join('\n') || '- (ninguno)';
  const prompt = `Eres director de arte y redactor. Evalúa cuán genérica es esta página web, como si la hubiera producido una IA sin dirección de diseño ni conocimiento del negocio.
Fíjate sobre todo en el texto: ¿podría servir para cualquier empresa del rubro? ¿Hay hechos concretos (nombres, lugares, precios, procesos propios) o solo promesas vagas?

URL: ${url}
Señales técnicas detectadas:
${resumen}

Texto visible (recortado):
"""${sample}"""

Responde SOLO con JSON válido, sin markdown: {"score": <0-100, 100 = totalmente genérico>, "razones": ["<máx 4 razones breves en español, cada una citando algo concreto de la página>"]}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const raw = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').replace(/```json|```/g, '').trim();
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const score = Math.max(0, Math.min(100, Math.round(Number(j.score))));
    if (!Number.isFinite(score)) throw new Error('respuesta sin score');
    return { score, razones: (j.razones || []).slice(0, 4).map(String), modelo: MODEL };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'tiempo agotado' : e.message };
  } finally {
    clearTimeout(t);
  }
}
