import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { analyze } from '../lib/analyzer.mjs';
import { isPrivateIp, validateUrl } from '../lib/fetcher.mjs';

const load = (f) => readFile(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const gen = analyze({ html: await load('generica.html') });
const art = analyze({ html: await load('artesanal.html') });
assert.ok(gen.score >= 70, `genérica debería puntuar alto (${gen.score})`);
assert.ok(art.score <= 15, `artesanal debería puntuar bajo (${art.score})`);
for (const ip of ['127.0.0.1', '10.0.0.5', '169.254.169.254', '::1', '::ffff:192.168.0.1']) assert.ok(isPrivateIp(ip), ip);
for (const ip of ['8.8.8.8', '1.1.1.1']) assert.ok(!isPrivateIp(ip), ip);
for (const u of ['localhost', 'http://127.0.0.1', 'ftp://x.com', 'http://user:pw@x.com', 'http://x.com:22']) assert.throws(() => validateUrl(u), u);
console.log(`ok · genérica ${gen.score}% · artesanal ${art.score}%`);
