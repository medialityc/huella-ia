# Huella IA

Web + CLI que mide de 0 a 100 qué tan genérica es una página: cuánto de lo que tiene es lo que entrega una IA sin dirección de diseño (kit sin personalizar, paleta y tipografías por defecto, esqueleto de landing SaaS, copy de relleno). Cero dependencias, Node ≥ 20.

No prueba autoría: mide patrones. Una web hecha con IA pero bien dirigida puede puntuar bajo, y una hecha a mano con todos los defaults puede puntuar alto. Eso es justo lo que interesa vender.

## Cómo funciona

1. Descarga el HTML, hasta 6 hojas CSS y hasta 6 bundles JS del mismo sitio (para SPAs de Vite/Next, los textos y clases viven en el JS).
2. Pasa 33 señales agrupadas en Origen y kit (30), Lenguaje visual (30), Estructura (20) y Textos (20). Cada señal satura en su peso y cada categoría en su máximo. Pesos en `lib/signals.mjs`.
3. Opcional: con `ANTHROPIC_API_KEY`, Claude lee el texto visible y da una segunda opinión que se mezcla con la heurística (`LLM_WEIGHT`, por defecto 0.3).

## Uso local

```bash
npm start                 # http://localhost:3000
npm test
node bin/huella.mjs https://sitio.com
node bin/huella.mjs ./mi-proyecto/dist --max 25   # código 1 si supera 25
node bin/huella.mjs http://localhost:5173 --json
```

El CLI sí permite `localhost` y redes privadas; el servidor web no.

## Despliegue en CapRover

Usa `captain-definition` + `Dockerfile` (Node 22 Alpine, puerto 3000, healthcheck en `/salud`). El deploy lo hace GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)): en cada push a `main` pasa `npm test` y, si va bien, empaqueta el commit y lo manda a CapRover, que construye la imagen. También se puede lanzar a mano desde la pestaña *Actions* (*Run workflow*).

Primera vez:

1. En el panel: *Apps* → crear la app (p. ej. `huella-ia`). No necesita *Persistent Data*.
2. En la app, pestaña *Deployment* → *Enable App Token* y copia el token.
3. En la app, *HTTP Settings*:
   - **Container HTTP Port: 3000**.
   - *Enable HTTPS* y luego *Force HTTPS by redirecting all HTTP traffic to HTTPS*.
   - Si usas dominio propio: apunta un registro A al servidor, *Connect New Domain*, y activa HTTPS también para ese dominio.
4. En *App Configs* → *Environmental Variables*, pon `SITE_URL` con el dominio definitivo (ver tabla). *Save & Update*.
5. En GitHub, *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

   | Secreto | Valor |
   |---|---|
   | `CAPROVER_SERVER` | URL del panel, p. ej. `https://captain.tudominio.com` |
   | `CAPROVER_APP` | nombre de la app en CapRover, p. ej. `huella-ia` |
   | `CAPROVER_APP_TOKEN` | el token del paso 2 |

6. Push a `main`. El progreso se ve en *Actions* y el build en el panel (*Deployment* → *View build logs*).

Deploy manual sin Actions, si hiciera falta: `caprover deploy` desde la carpeta (sube lo commiteado en git).

Variables:

| Variable | Por defecto | Para qué |
|---|---|---|
| `SITE_URL` | el host de la petición | Dominio público sin barra final (`https://huella.tudominio.com`). Se usa en la canónica, Open Graph, JSON-LD, `robots.txt` y `sitemap.xml`. Ponlo en producción para que no dependa de cabeceras. |
| `ANTHROPIC_API_KEY` | — | Activa la segunda opinión de Claude |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Modelo para esa opinión |
| `LLM_WEIGHT` | `0.3` | Peso de la opinión de Claude (máx 0.6) |
| `RATE_PER_MIN` | `8` | Análisis por IP y minuto |

## SEO

- `<head>` con descripción, canónica, Open Graph, Twitter Card y JSON-LD (`WebApplication`). Las URLs absolutas llevan la marca `{{SITE_URL}}`, que el servidor sustituye al servir la página.
- El servidor sirve `/robots.txt` (bloquea `/api/`), `/sitemap.xml`, `/site.webmanifest`, los iconos (`favicon.ico` 16/32/48, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) y `/og.png`; responde a `HEAD`, comprime el texto con gzip y devuelve un 404 en HTML con `noindex`.
- JSON-LD con `WebSite` (para que Google muestre "Huella IA" como nombre del sitio) y `WebApplication`.
- Iconos: `public/favicon.svg` es el original; `scripts/favicon-pequeno.svg` es la versión simplificada para 16 y 32 px. Tras regenerar los PNG `scripts/ico-*.png`, `node scripts/ico.mjs` vuelve a armar `public/favicon.ico`.
- `npm test` comprueba que la página tenga al menos 400 palabras visibles y que quede en ≤ 25 % en su propio medidor.
- `public/og.png` (1200×630) sale de `scripts/og.html`: si cambias el diseño, abre ese HTML a 1200×630 y vuelve a capturarlo.
- El servidor lee `public/` al arrancar: tras tocar el HTML hay que reiniciarlo.

Tras el primer deploy: dar de alta el dominio en Google Search Console, enviar `/sitemap.xml` y revisar la tarjeta al compartir con el depurador de Open Graph de cada red.

## Seguridad

Es un servicio que hace peticiones a URLs ajenas, así que trae protección SSRF: solo http/https y puertos 80/443/8080/8443, bloquea `localhost`, IPs privadas/link-local/metadata (169.254.169.254) y valida la IP resuelta dentro del propio `lookup` del socket (evita DNS rebinding). También limita redirecciones (5), tamaño de descarga, tiempo de respuesta y tasa por IP. Detrás de CapRover la IP sale de `X-Forwarded-For`.

## Skill `sin-huella-ia`

En `skill/sin-huella-ia/`. Lleva una copia del motor en `scripts/` para medir sin depender de este repo. Si cambias señales en `lib/`, ejecuta `npm run sync-skill` y vuelve a empaquetar la skill.

## Limitaciones

- Sin navegador headless: si una SPA carga sus textos por API después de montar, no se ven. Se podría añadir Playwright como modo opcional.
- Las señales envejecen: lo que hoy es default de IA cambia cada pocos meses. Revisar `lib/signals.mjs` periódicamente.
