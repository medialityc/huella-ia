// Copia el motor a la skill para que ambos usen exactamente las mismas señales.
import { cp } from 'node:fs/promises';
const dst = new URL('../skill/sin-huella-ia/scripts/', import.meta.url);
for (const f of ['analyzer.mjs', 'signals.mjs', 'fetcher.mjs', 'report.mjs']) await cp(new URL(`../lib/${f}`, import.meta.url), new URL(f, dst));
await cp(new URL('../lib/cli.mjs', import.meta.url), new URL('huella.mjs', dst));
console.log('Skill sincronizada con lib/');
