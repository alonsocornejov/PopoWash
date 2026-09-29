# Skills de marketing de PopoWash

Instalación del 28 de septiembre de 2026 solicitada en la conversación MARKETING. Se instalaron las tres colecciones completas en `.agents/skills/`, sin reemplazar las skills previas ni conectar cuentas externas.

## Organización por colección

Las 80 skills se agrupan dentro de `.agents/skills/`:

- [`marketing/`](../../.agents/skills/marketing/README.md): 50 skills de Corey Haines.
- [`benchmark/`](../../.agents/skills/benchmark/README.md): 13 skills de ScrapeCreators.
- [`contenido/`](../../.agents/skills/contenido/README.md): 17 skills de Charlie Hills, incluida `reels-scripting`.

Los nombres de invocación se conservan. Las skills previas del proyecto permanecen en su ubicación original. Se ajustaron las referencias relativas a los recursos compartidos de `.agents/tools/`.

## Colecciones instaladas

| Colección | Skills | Revisión fijada |
|---|---:|---|
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | 50 | `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` |
| [ScrapeCreators/social-media-research-skills](https://github.com/ScrapeCreators/social-media-research-skills) | 13 | `64ba7b4dea71e130d2712ffb6c1c1024b3b7c4b2` |
| [charlie947/social-media-skills](https://github.com/charlie947/social-media-skills) | 17 | `8cefb5b6d03757885faa6918bd8bfaef202a83db` |

El [registro de instalación](skills-installation.json) contiene los nombres, revisiones, adaptaciones y resultados de validación. Cada carpeta conserva una copia de su licencia MIT. Las 80 skills pasan el validador `quick_validate.py` de Codex.

## Cómo utilizarlas

Las skills estarán disponibles en el siguiente turno. Si el catálogo no se actualiza, abrir una conversación nueva dentro de PopoWash. Se pueden invocar por nombre o pedir la tarea en lenguaje natural. Con una colección amplia, conviene mencionar la skill específica.

| Trabajo | Skill y ejemplo |
|---|---|
| Contexto de marketing | `$product-marketing Organiza la información validada del documento completado de PopoWash.` |
| Investigación de clientes | `$customer-research Sintetiza estas entrevistas y distingue hechos de hipótesis.` |
| Comparar competidores en Instagram | `$competitor-social-research Compara estas cuentas en el período indicado y cita la muestra.` |
| Encontrar publicaciones destacadas | `$outlier-post-finder Busca reels que superen el rendimiento habitual de cada cuenta.` |
| Analizar preguntas del público | `$comment-mining Resume las dudas y objeciones presentes en estos comentarios.` |
| Construir la voz | `$voice-builder Usa nuestro manual aprobado y estas muestras para definir la voz de PopoWash.` |
| Preparar guiones de reels | `$reels-scripting Usa esta referencia y la ficha del producto para redactar un guion en la voz aprobada.` |
| Aperturas para contenido | `$hook-generator Propón aperturas basadas en estos hechos confirmados.` |
| Calendario y formatos | `$social Diseña el calendario de Instagram según el brief completado.` |
| Ideas por pilar | `$content-matrix Cruza los pilares aprobados con formatos adecuados para PopoWash.` |

El repositorio de Charlie contiene varias skills orientadas a LinkedIn y marca personal. Para Instagram se priorizan `reels-scripting`, `voice-builder`, `hook-generator` y `content-matrix`, ajustadas al encargo de la marca. `reels-scripting` prepara guiones; la generación del video final es un trabajo adicional.

## Integraciones y límites de la instalación

- ScrapeCreators requiere `SCRAPECREATORS_API_KEY` para obtener datos por su API. La clave no estaba disponible en el entorno de esta sesión. La instalación de las instrucciones quedó completa; no se ejecutaron consultas de extracción.
- La ruta de Charlie que analiza un reel desde su URL utiliza Apify y Gemini. Requiere `APIFY_API_TOKEN`, `GOOGLE_AI_API_KEY` y, cuando se use esa ruta, los paquetes `apify-client` y `@google/generative-ai`. Las claves no estaban disponibles y no se instalaron esos paquetes ni se consumieron servicios. Deben comprobarse el SDK y el modelo vigente antes de activar esa ruta.
- Un video o una transcripción aportados por el equipo permiten omitir etapas de extracción según el alcance de la skill. Un guion basado en una transcripción no equivale a un análisis visual del video.
- Las skills que preparan prompts para Gemini entregan prompts cuando no hay generación conectada. La instalación no incorpora cuentas, presupuestos publicitarios, programación automática ni autorización para publicar.
- Los conectores de marketing de Corey son opcionales. Sus referencias y utilidades se conservaron en `.agents/tools/`. Los ejemplos `node tools/clis/...` de esos documentos deben ejecutarse desde `.agents/` o resolverse desde la raíz como `node .agents/tools/clis/...` usando el runtime disponible. No se ejecutaron esas utilidades al instalar.
- Las credenciales se configuran fuera de Git. No se deben pegar en el documento rellenable ni en archivos compartidos.

## Adaptaciones para Codex

- En 13 skills de ScrapeCreators se movieron `version`, `author`, `homepage` y `repository` al bloque `metadata`, conservando sus valores y las instrucciones originales.
- Se corrigió un enlace relativo de `ad-creative` a una referencia de `ads` que existía en la colección.
- La guía de investigación creativa de `ads` contenía dos enlaces a una skill `positioning` no incluida por el autor. Se adaptan al contexto de posicionamiento de `product-marketing` y se registra el ajuste local.
- Se incluyeron los recursos compartidos `tools/` de Corey para que funcionen los enlaces relativos de las skills instaladas.

El documento rellenable está en [PopoWash cuaderno de marca](PopoWash-cuaderno-de-marca.html). Sus campos vacíos y antecedentes por confirmar no constituyen un manual aprobado. Cuando se complete, se podrá trasladar la información validada al contexto de marketing y voz que leen las skills.

## Compartir y actualizar

Compartir las carpetas instaladas, `.agents/tools/` y esta documentación mediante el flujo de revisión de Git del proyecto. Esta tarea no incluye commit ni push. Las instalaciones son copias fijadas a una revisión: no se actualizan automáticamente. Antes de actualizar, comparar versiones y preservar las adaptaciones locales.
