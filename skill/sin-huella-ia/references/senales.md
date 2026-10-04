# Señales que suman huella y qué hacer en su lugar

Fuente de verdad del medidor: `scripts/signals.mjs` (pesos exactos). Puntuación total = Origen (máx 30) + Visual (máx 30) + Estructura (máx 20) + Textos (máx 20).

## Origen y kit (máx 30)

| Señal | Peso | En su lugar |
|---|---|---|
| Rastros de Lovable / GPT Engineer, v0, Bolt, generadores declarados en `<meta name="generator">` | 12–20 | Limpiar scripts, plugins y metadatos del generador. Usar lo generado solo como andamio. |
| Tokens de shadcn presentes | 8 | Se puede usar shadcn; el tema debe ser de la marca. |
| Valores de fábrica (`222.2 84% 4.9%`, `210 40% 98%`, `oklch(0.145 0 0)`…) | 8 | Redefinir cada token con la paleta del plan. |
| `cdn.tailwindcss.com` | 4 | Tailwind compilado con tema propio. |
| Lucide en todo | 4 | Set elegido por estilo o iconos propios; ajustar trazo y tamaño. |

## Lenguaje visual (máx 30)

| Señal | Peso | En su lugar |
|---|---|---|
| Inter, Geist, Space Grotesk, Instrument Serif, Plus Jakarta, DM Sans, Outfit, Manrope, Poppins, Bricolage, Sora, Satoshi, Playfair, Fraunces, mono para etiquetas | 4 c/u (máx 8) | Tipografía del rubro: rotulación de taller, señalética de época, editorial local, caligrafía de menú… Hay cientos en Google Fonts y fundiciones libres. |
| Índigo/violeta de Tailwind (`#6366f1`, `#8b5cf6`, `indigo-500`…) | 6 | Colores sacados del producto, del local, del logo o de la región. |
| Texto con degradado (`bg-clip-text`) | 5 | Color sólido; el énfasis lo da el tamaño y el peso. |
| Degradado morado→rosa/azul | 4 | Fotografía, textura o un plano de color de marca. |
| Crema `#F4F1EA` + terracota `#D97757` | 6 | Es el look "editorial IA"; buscar otra temperatura. |
| Casi-negro `#0B0B0B` + verde ácido | 5 | Negro real o un oscuro con matiz de marca; acento con razón. |
| `backdrop-blur` decorativo | 3 | Solo con contenido real detrás. |
| Mismo `rounded-xl/2xl` en todo | 4 | Jerarquía de radios o esquinas rectas. |
| `shadow-lg` bajo cada tarjeta | 3 | Sombras con dirección de luz, o bordes, o nada. |
| Manchas `blur-3xl`, fondos de cuadrícula/puntos | 3 | Material del cliente. |

## Estructura y plantilla (máx 20)

| Señal | Peso | En su lugar |
|---|---|---|
| Esqueleto Características / Cómo funciona / Precios / Testimonios / FAQ / CTA | 6 | Ordenar por cómo decide el comprador del rubro (ej. restaurante: carta, ubicación, reservar; taller: servicios con precio, horario, llamar). |
| Etiquetas en mayúsculas espaciadas sobre títulos | 4 | Quitar; si informan algo, en minúscula y como texto normal. |
| Fade-up en cada sección (`whileInView`, AOS) | 4 | Un solo momento animado; el resto responde a acciones. |
| `01 / 02 / 03` | 3 | Solo para secuencias reales. |
| `→` en botones e iconos ArrowRight por todas partes | 3 | Verbo concreto en el botón. |
| Tres planes con "Más popular" | 3 | Precios como los vende el negocio (por servicio, por pieza, por zona). |
| Emojis en títulos | 3 | Iconografía o fotografía. |
| Metadatos con ` · ` | 2 | Estructura real (lista, tabla, columnas). |

## Textos (máx 20)

Vocabulario que suma (10 máx): *seamless, elevate, unlock, empower, revolutionize, supercharge, cutting-edge, game-changer, effortless, leverage, harness, streamline, robust, next-level, world-class, state-of-the-art, transform your, unleash, delve, innovative, all-in-one, at your fingertips, reimagine, peace of mind / sin esfuerzo, de vanguardia, siguiente nivel, potencia, revoluciona, transforma tu, impulsa, solución integral, innovador, experiencia única, a otro nivel, todo en uno, eleva, desbloquea, sin complicaciones, al alcance de tu mano, como nunca antes, optimiza, de primer nivel, de clase mundial, tranquilidad, sin límites, a tu medida.*

Frases de LLM (6 máx): "En el mundo actual…", "Lleva tu X al siguiente nivel", "No es solo un X, es…", "¿Listo para transformar…?", "Únete a miles de…", "Con la confianza de cientos…", "Estamos aquí para ayudarte", y sus equivalentes en inglés.

Otros: tríadas "Rápido. Simple. Seguro." (3), nombres de relleno tipo Sarah Chen, John Doe, Acme, María García (5), cifras de adorno 10k+, 99.9 %, 24/7, 10x (2), más de ~4 rayas (—) por cada 1000 palabras (3).

Reescritura tipo:

- "Transforma tu negocio con soluciones de vanguardia" → "Contabilidad para restaurantes de Kansas City: cerramos tu mes en 5 días hábiles."
- "Empieza ahora →" → "Reservar mesa para hoy"
- "Rápido. Simple. Seguro." → "Te entregamos la moto el mismo día si llega antes de las 10."
