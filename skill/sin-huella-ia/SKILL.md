---
name: sin-huella-ia
description: Garantiza que las páginas web, landings, interfaces y textos que se construyen para clientes no tengan "huella IA" (kit sin personalizar, paleta y tipografías por defecto, esqueleto de landing SaaS, copy de relleno) y lo verifica con un medidor que da un porcentaje. Actívala SIEMPRE que se vaya a diseñar, maquetar, generar o reescribir una página web, landing, sitio, componente visual, sección o texto de marketing para un cliente o proyecto propio, aunque el usuario no mencione la IA; también cuando pida revisar si algo "se ve hecho con IA", "genérico", "de plantilla", o quiera auditar/medir la huella de una URL o carpeta. Úsala junto a frontend-design o identidad-marca si están disponibles.
---

# Sin huella IA

Objetivo: que lo que entregamos a un cliente parezca hecho para ese cliente y no salido de un generador. Se mide con el medidor incluido (`scripts/huella.mjs`), que puntúa de 0 a 100.

- **Meta de entrega: ≤ 25 %.** Entre 26 y 35 solo con una razón explícita del brief. Nunca entregar por encima de 35.
- El número es un termómetro, no el fin. Bajar la cifra escondiendo señales (renombrar clases, ofuscar, mover textos a imágenes) no cuenta y es engañar al cliente. Lo que baja la cifra de verdad es tomar decisiones propias.

## Por qué existe

Una IA sin dirección converge siempre a lo mismo: shadcn con tokens de fábrica, Inter o Geist, índigo/violeta, texto con degradado, tarjetas redondeadas con la misma sombra, "Características / Cómo funciona / Precios / Testimonios / FAQ", y frases como "lleva tu negocio al siguiente nivel". Los clientes ya lo reconocen y lo asocian con trabajo barato. Cada default que dejamos pasar es una decisión que no tomamos.

## Flujo

### 1. Anclar al negocio antes de tocar código

Saca del brief (o pregunta, una sola cosa a la vez si falta algo esencial):

- Qué vende exactamente, a quién, dónde y a qué precio.
- El mundo material del rubro: oficio, herramientas, materiales, lugares, época, jerga local. De ahí salen color, tipografía e imágenes.
- Hechos concretos que se pueden mostrar: años, dirección, horarios, precios, nombres reales, procesos propios, fotos.
- Qué tiene que lograr la página (llamar, reservar, comprar, pedir presupuesto).

Si no hay contenido real, usa marcadores honestos (`[precio del servicio]`, `[foto del local]`) en vez de inventar testimonios o cifras.

### 2. Plan de diseño corto y revisión contra defaults

Escribe un plan compacto antes de construir:

- **Color**: 4–6 hex con nombre, derivados del negocio (logo, producto, lugar), no de Tailwind.
- **Tipografía**: 1–2 familias elegidas por el rubro, con su rol.
- **Layout**: una frase y un esquema ASCII; el orden de secciones sigue cómo decide el cliente de ese rubro, no la plantilla SaaS.
- **Un elemento memorable**: un solo lugar donde se arriesga; el resto, sobrio.

Luego repasa el plan con `references/senales.md`: cualquier parte que coincida con un default sin que el brief lo pida, cámbiala y di en una línea qué cambiaste.

### 3. Construir con las reglas de la casa

Visual:
- Si se usa shadcn/Tailwind, redefinir **todos** los tokens (colores, `--radius`, fuentes) en el tema. Nada de valores de fábrica ni `cdn.tailwindcss.com` en producción.
- Prohibido por defecto: texto con degradado, degradados morado→rosa, manchas `blur-3xl`, glassmorphism decorativo, el mismo `rounded-2xl` + `shadow-lg` en todas las cajas, emojis en títulos.
- Iconos: un set elegido con criterio o propios; no Lucide por inercia en cada línea.
- Movimiento: un único momento orquestado; nada de fade-up en cada sección.
- Estructura: sin eyebrows en mayúsculas espaciadas, sin `01/02/03` salvo secuencias reales, sin `→` pegada a cada botón, sin metadatos encadenados con `·`.

Textos (`references/senales.md` tiene la lista completa de vocabulario):
- Cada frase debe ser falsa para la competencia. Si serviría para cualquier negocio, se reescribe con un hecho del cliente.
- Botones que dicen qué pasa ("Pedir presupuesto", "Llamar al taller"), no "Empieza ahora".
- Nada de tríadas de adjetivos, cifras de adorno (10k+, 99.9 %, 24/7) ni rayas (—) en cada párrafo.
- Testimonios y logos solo si son reales.

### 4. Medir y corregir

Ejecuta el medidor sobre lo construido. Funciona con una URL (incluido `localhost`), una carpeta de proyecto o un archivo:

```bash
node <ruta-skill>/scripts/huella.mjs http://localhost:3000 --max 25
node <ruta-skill>/scripts/huella.mjs ./src --max 25
node <ruta-skill>/scripts/huella.mjs ./dist/index.html --json
```

Sin dependencias, Node ≥ 20. Sale con código 1 si supera `--max` (sirve en CI). Mejor medir la versión servida o el build (`dist/`, `.next` exportado) que solo el código fuente, porque ahí están el CSS y los textos finales.

Lee los hallazgos de mayor a menor peso, corrige la causa (no el síntoma) y vuelve a medir hasta quedar en la meta. Si con confianza "baja" o "media" el resultado parece raro, mide otra fuente (el build en vez de `src`, o la URL servida).

### 5. Entregar

En la entrega al usuario incluye, breve:
- La cifra final y el nivel (p. ej. "Huella 14 %, Artesanal").
- Dos o tres decisiones de diseño explicadas en una línea cada una, ligadas al negocio. Esto es lo que el cliente valora y lo que distingue el trabajo.
- Cualquier marcador de contenido pendiente (`[foto del local]`) que el cliente deba aportar.

## Cuándo se permite un default

Si el brief o el cliente lo pide explícitamente (p. ej. "quiero el look de Linear", "usamos shadcn tal cual en el panel interno"), se respeta: el brief manda. Para herramientas internas que nadie externo verá, la meta puede relajarse a ≤ 40; dilo al entregar.
