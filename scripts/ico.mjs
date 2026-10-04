// Empaqueta scripts/ico-16.png, ico-32.png e ico-48.png en public/favicon.ico (ICO con PNG dentro).
// Los PNG salen de scripts/favicon-pequeno.svg (16, 32) y public/favicon.svg (48).
import { readFile, writeFile } from 'node:fs/promises';

const TAMANOS = [16, 32, 48];
const pngs = await Promise.all(TAMANOS.map((n) => readFile(new URL(`./ico-${n}.png`, import.meta.url))));

const cabecera = Buffer.alloc(6);
cabecera.writeUInt16LE(0, 0); // reservado
cabecera.writeUInt16LE(1, 2); // tipo: icono
cabecera.writeUInt16LE(pngs.length, 4);

let offset = 6 + 16 * pngs.length;
const entradas = pngs.map((png, i) => {
  if (png.readUInt32BE(16) !== TAMANOS[i]) throw new Error(`ico-${TAMANOS[i]}.png no mide ${TAMANOS[i]} px`);
  const e = Buffer.alloc(16);
  e.writeUInt8(TAMANOS[i], 0); // ancho
  e.writeUInt8(TAMANOS[i], 1); // alto
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por píxel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});

await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([cabecera, ...entradas, ...pngs]));
console.log(`public/favicon.ico: ${TAMANOS.join(', ')} px, ${offset} bytes`);
