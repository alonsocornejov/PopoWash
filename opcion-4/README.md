# Opción 4

Landing estática independiente de las opciones 1, 2 y 3. Abrir `/opcion-4/` desde un servidor estático en la raíz del repositorio. No necesita compilación para la landing.

## Recorrido vigente · 12 de octubre de 2026

Orden: hero → problema concreto → solución provisional compacta → tres pasos → carrusel de reseñas de ejemplo → gasto en papel → FAQ → compra.

Por indicación de Gabo, el problema ahora usa [`assets/problema-banner-papel-boxer-negro.jpg`](assets/problema-banner-papel-boxer-negro.jpg): fondo negro, papel iluminado y sin bruma azul. El [PNG independiente](assets/problema-banner-papel-boxer-negro.png) y la [primera montaña de papel](assets/problema-montana-papel-original.jpg) están guardados. Copy: «Seamos sinceros / El papel no lava». [Prompt de la edición](assets/PROMPT-problema-negro.md).

Solución queda como una franja pequeña de planificación; su diseño y el paso a paso se resolverán después. Se restauró el carrusel original después de los pasos, con estrellas, pausa y rótulos de ejemplo, pendiente de testimonios reales. Se retiró «Míralo en tu WC». La bolsa sigue siendo una demostración local.

Las secciones fechadas a continuación registran iteraciones anteriores; sus descripciones de orden y pendientes no sustituyen este recorrido vigente.

## Ajuste de escritorio y propuestas del problema · 12 de octubre de 2026

El hero ocupa como mínimo el alto visible de escritorio bajo la navegación, incluida su línea de beneficios. Así, la franja lima siguiente no debería asomar en la primera pantalla. La imagen conserva todo el producto mediante `object-fit: contain`; un fondo azul con luz suave llena el espacio que deja el encuadre panorámico en pantallas altas. El cambio está limitado a `min-width: 1101px`; el hero móvil y tablet no se modificó. El comparador se sincronizó con la nueva regla.

Se prepararon [tres banners JPG para el problema](../docs/propuestas/opcion-4-problema/README.md) y una [auditoría de la narrativa](../docs/auditorias/2026-10-12-narrativa-opcion-4.md). En ese momento los nuevos visuales y textos aún no estaban insertados; la integración final está descrita arriba.

## Iteración vigente · 11 de octubre de 2026

Retoque de superficies del hero con ImageGen integrado. El PNG independiente reemplaza el anterior en la misma ruta. Dos composiciones: panorámica de 2048 × 768 y compacta de 1536 × 1024; seis exportaciones WebP entre 13 y 63 KB. No se amplió artificialmente la resolución. [Prompts y archivos](assets/PROMPT-hero-detalle.md).

La descripción identifica el bidet y su instalación bajo el asiento. Titular ajustado a dos líneas en los anchos revisados. “Frenazo de camión” ahora es un remate junto al problema, de unos 163 px de alto a 1265 px útiles, frente a unos 745 px de la auditoría. FAQ con preguntas en DM Sans de 20 px en escritorio y 18 px en móvil, sin mayúsculas forzadas.

Comprobado en navegador: escritorio de 1280 × 720 (1265 px útiles en esta sesión) y marcos de 1920 × 1080, 820 × 1024, 390 × 844 y 320 × 844. Los marcos tienen 1905, 805, 375 y 305 px útiles. Producto completo, fuentes correctas, titular en dos líneas, selección de recursos por dispositivo y ausencia de desborde horizontal. FAQ abierto por clic y cerrado con Enter. Sin errores de consola observados. No se midieron Core Web Vitals ni conversiones.

Comparador actualizado con `srcset` embebidos y MIME WebP explícito; otras cuatro propuestas preservadas. Se comprobó que reseñas, funcionamiento, calculadora, contenido del FAQ y CTA no cambiaron. Pendientes y decisiones en [PENDIENTES-WEB4.md](../docs/PENDIENTES-WEB4.md). Sin commit ni push de esta iteración.

## Composición

- Conserva azul `#3155ff`, lima `#c8ff36`, negro `#111318` y blanco cálido `#f8f7f2` de la opción 1.
- Archivo Black en titulares de impacto; DM Sans en texto y preguntas del FAQ, estas últimas en mayúsculas normales. Fuentes alojadas localmente con licencia OFL.
- Orden vigente: hero; problema; solución provisional compacta; tres pasos; reseñas de ejemplo; calculadora; FAQ; CTA final; footer.
- Fotografías suministradas en PNG como originales y WebP para la página. Todos los recursos de la landing se sirven localmente.
- El carrusel de reseñas conserva ejemplos rotulados como maqueta; se reemplazarán por testimonios autorizados. No son clientes reales.
- Calculadora por hogar con el diseño original de boleta y dos columnas: personas (1–20, enteras) × 141 rollos/año × $850/rollo. Muestra gasto y ahorro anual estimados. Por petición del usuario se retiraron los supuestos visibles y el control de reducción; el cálculo interno conserva un 50% ilustrativo, no un rendimiento medido. No incluye agua ni costo del bidet. No se usa una vida útil sin confirmar.
- Hero con producto grande, mango a la izquierda y spotlight azul sin foco visible. Original independiente `assets/hero-spotlight-detalle.png`; variante compacta `assets/hero-spotlight-compacto.png`. La página usa WebP con `picture`, `srcset` y precargas por breakpoint. Título «Tu poto merece más que papel» y descripción «El bidet que lava con agua y se instala bajo el asiento de tu WC». Logo Branding V1 provisional.
- Los tres pasos de uso tienen selección enmarcada y avance automático cada seis segundos. Seleccionar un paso detiene el avance hasta pulsar «Reanudar pasos». Se suspende fuera de pantalla y con pestaña oculta; movimiento reducido usa avance manual.
- Humor de la calculadora debajo del resultado: mensaje de dos baños y dos PopoWash para 7–15 personas, y mensaje de pensión/horas extra desde 16. Se oculta con seis personas o menos y ante entradas inválidas.
- FAQ con la estructura de Web 1, una columna y texto más grande. Footer con navegación y ayuda; canales de contacto y redes por confirmar.
- “Comprar Ahora” lleva al CTA final. Cantidad y “Comprar PopoWash” abren una bolsa de demostración local; no generan pedidos ni pagos. Producto a $39.990 CLP e instalación opcional en Santiago por $15.000 adicionales. Despacho, pagos, soporte y caja pendientes. La usabilidad comercial se implementará después del diseño, según Gabo.
- Voz confirmada: humorística, disruptiva y juvenil. Público geriátrico, familias e instituciones son líneas futuras, no una indicación de suavizar la personalidad de esta landing. Ver [pendientes completos](../docs/PENDIENTES-WEB4.md).

## Pendiente de contenido real

Definir logo definitivo; incorporar testimonios autorizados de clientes existentes; confirmar despacho y contenido de la caja, manual definitivo, vida útil, reducción real de papel, contacto y redes. Validar FAQ con Fabián. Las imágenes de uso muestran el chorro con asiento levantado como demostración; el texto indica usarlo sentado. El CTA continúa como demostración por decisión de Gabo mientras se trabaja el diseño. Revisar los pendientes restantes en [el registro de tareas](../docs/PENDIENTES-WEB4.md).

## Imagen de instalación

`assets/instalacion.png` se creó con la herramienta integrada ImageGen y se optimizó a `assets/instalacion.webp`. Referencias: `09-instalado-general.png` y `01-estudio-giro-000.png`.

Prompt: “Create one photorealistic installation image for a bidet landing page, square aspect ratio. Reference image 1 is the exact white bathroom and toilet context. Reference 2 is the exact PopoWash mechanical bidet product geometry which must be preserved: white curved flat crossbar, two circular slotted mounting discs, curved left control arm ending in long white rotary knob with chrome ring, center dual-nozzle housing. Show close-up three-quarter top view of a person's two hands gently positioning this attachment on the toilet's rear ceramic mounting shelf, with toilet seat removed and resting partly visible at the far right edge. The product fits across the rear mounting holes behind the bowl, the control arm extends on the viewer's left along the bowl. All product geometry believable and unobstructed, only hands and forearms visible, no whole person, no nudity, no text, no graphics, no labels. Bright soft studio daylight, clean white and pale grey bathroom same as reference, editorial product photography, emphasis on simple physical positioning and attachment, subtle shadows, premium crisp clean detail. This is an illustrative installation concept, not a plumbing diagram. Do not depict extra fittings or water hoses.”

## Revisión

Probados en navegador: cambios de foto, pausa de reseñas, cálculo y validación de gasto, tres pasos visuales, FAQ y bolsa con cierre mediante Escape. Comprobado sin desbordes de página a 1440, 390 y 320 px; sin errores JavaScript ni imágenes rotas; movimiento reducido desactiva el carrusel automático. Las capturas temporales y la rutina de revisión viven en `tmp/`, no forman parte de la publicación.

Lighthouse se intentó con `pnpm dlx lighthouse@12.8.2`, pero no pudo arrancar por `ERR_MODULE_NOT_FOUND: lighthouse-logger` en el entorno de ejecución. No se reportan puntuaciones Lighthouse ni métricas de Core Web Vitals como verificadas.

El modelo 3D está en `model/`, con visor independiente y documentación de sus límites. Gabo aprobó su resultado visual y pidió incluirlo en la publicación del cierre del 10 de octubre de 2026.

## Supuestos del 8 de octubre de 2026

- Consumo alto: 141 rollos/persona/año, referencia de EE. UU. de 2018 de [Statista](https://www.statista.com/chart/15676/cmo-toilet-paper-consumption/). [Cottonelle](https://www.cottonelle.com/en-us/tips-and-advice/toilet-paper-101/how-much-toilet-paper-should-a-person-use) publica otra referencia de 85 rollos regulares. Se elige el extremo superior de estas referencias, no un promedio chileno ni un máximo estadístico.
- Precio del tramo alto: Elite Ultra Suave doble hoja de 25 m, pack de 12 a $9.990 en [Lider](https://www.lider.cl/ip/papeles/papel-higienico-ultra-suave-doble-hoja-25-m/00780650050839) y precio regular $10.380 en [Jumbo](https://www.jumbo.cl/ph-elite-ultra-suave-dh-12-roll-25m-c-u-1957547/p). Promedio por rollo $848,75, redondeado a $850. Muestra de un producto en dos tiendas, no promedio nacional. Los formatos internacionales y chilenos no son idénticos: estimación aproximada.
- Gasto anual: $119.850/persona; hogar de cuatro $479.400. Con reducción ilustrativa del 50%, el ahorro anual simulado en papel es $239.700 para cuatro personas. El antiguo bloque verde fue retirado; la calculadora integrada está justo antes del FAQ.

## Actualizar el comparador

Después de editar esta opción, ejecutar `python scripts/update-principal.py` desde la raíz. Actualiza únicamente Web 4 en `propuestas.html`, incrustando CSS, JS, fuentes e imágenes; conserva sin cambios las otras cuatro propuestas.

Verificación de esta reorganización: 1440, 768, 390 y 320 px sin desbordamiento horizontal, con las dos fuentes cargadas y sin errores JavaScript ni imágenes rotas. Comprobados entradas vacías/fuera de rango/fraccionarias, bolsa local, pasos, FAQ y movimiento reducido. El comparador calcula $119.850 para una persona y $479.400 para cuatro, y sus otras cuatro propuestas permanecen idénticas al contenido anterior.

El detector de diseño señala rasgos heredados o expresamente solicitados (banner animado, paleta, etiqueta de verdad incómoda, borde de la pregunta y estilos del hero). Se conservan según el encargo de cambiar orden y tipografía sin rediseñar esos bloques.

## Integración del PDF · 9 de octubre de 2026

Aplicada la pauta visual y de composición de “Cambiaremos el logo.pdf” con autorización del usuario. Se mantienen pendientes las prestaciones y cifras sin validar. Revisión en 1440, 1366, 768, 390 y 320 px: sin desbordes horizontales, títulos en Archivo Black, imágenes cargadas y sin errores JavaScript en la landing. Instalación ocupa 555 px en notebook de 1366 × 768, más 81 px de cabecera. Confirmados avance automático, pausa, selección manual y movimiento reducido; gasto y ahorro simulado con validación; bolsa desde el CTA final y apertura de preguntas desde el footer. El comparador muestra los cambios y conserva idénticas las otras cuatro propuestas. El detector de layout no interpreta los márgenes de los contenedores `.wrap` y marca los bloques de color como sin espacio interior; se verificaron visualmente sus márgenes en escritorio y móvil.

El bloque «El papel no limpia» usa un rollo realista con tubo de cartón, textura y hojas desenrolladas. Generado con ImageGen integrado; original `assets/papel-higienico-realista-v3.png`, WebP con transparencia para la página y prompt en `assets/PROMPT-papel-higienico-v3.md`.

Rollo corregido: proporciones compactas, acostado y tira saliendo de la capa exterior por debajo.

Foto de compra reemplazada por la vista frontal transparente enviada por el usuario: `assets/producto-frontal-sin-fondo.png` y WebP. Fondo blanco, como en la foto anterior, y margen interior para mantener el producto completo.

Se retiró el asterisco del hero. Según la condición de montaje confirmada por el usuario, la ficha y FAQ explican que la tapa y el asiento deben ser desmontables para colocar PopoWash en sus anclajes y volver a fijarlos. No se excluyen por defecto todos los inodoros suspendidos: existen modelos con tapa/asiento desmontables.

Se retiraron las menciones a garantía de la ficha comercial, el FAQ y el pie de página, sin sustituirlas por un aviso.

Imagen de «Instala una vez» corregida con ImageGen integrado: impresión del logo y marcas de control a partir de la foto frontal oficial, conservando la escena. Archivo `assets/instalacion-logo-popowash.png`, versión WebP y prompt `assets/PROMPT-instalacion-logo.md`. La imagen sigue siendo ilustrativa.

## Hero con spotlight · 10 de octubre de 2026

Se integró la foto adjunta elegida por Gabo como banner completo, con el producto grande a la derecha y el texto vigente a la izquierda. Fondo adaptado al azul de marca `#3155ff` con ImageGen integrado. En la revisión posterior se retiró el foco blanco del borde superior conservando la iluminación y los reflejos. La versión final publicada es `assets/hero-spotlight-detalle.png`, su WebP para la landing y `assets/PROMPT-hero-detalle.md`. En móvil, el producto aparece bajo el texto, completo y sin superposición. Se actualizó también Web 4 en el comparador, conservando las otras propuestas.

La compra se unificó en un único CTA justo antes del footer: mensaje a la izquierda y tarjeta de precio a la derecha, tomando como referencia la estructura de Web 1. Producto a $39.990 CLP, instalación opcional en Santiago por $15.000 adicionales y despacho por calcular, según lo solicitado por Gabo. La sección anterior de compra y el CTA duplicado fueron sustituidos por este bloque. Los enlaces `#producto` llevan al CTA final y se conserva `#comprar-final`. La bolsa sigue siendo una vista previa sin pagos; muestra el subtotal de productos y mantiene la instalación separada. FAQ sincronizada con estos precios. Comprobados subtotal para dos unidades ($79.980) y rechazo de cantidad cero. El CTA ocupa unos 552 px a 1280 px de ancho.

## Nitidez y recorrido · 10 de octubre de 2026

Hero retocado con ImageGen conservando encuadre, orientación y luz; archivo `assets/hero-spotlight-detalle.webp` exportado sin pérdida desde el PNG. Resolución nativa 2048 × 768 (panorámica), no 3840 × 1440: el generador no entregó el tamaño solicitado. Cubre el ancho de una pantalla Full HD sin ampliar la imagen en escritorio. Las versiones anteriores se conservan solo localmente, fuera de esta publicación.

La franja verde se movió inmediatamente después del hero. Instalación y uso conserva toda su explicación, con título horizontal, dos columnas y foto de altura estable. El paso activo lleva fondo translúcido, borde claro y acento lateral; selección manual pausa la secuencia. Avance automático cada seis segundos, con pausa y respeto por movimiento reducido.

Revisión en navegador: sección de 611 px a 1280 × 720, completamente visible desde su enlace; 637 px en un marco de 1920 × 1080. Marcos móviles de 390 y 320 px sin desborde horizontal (375 y 305 px útiles con scrollbar). Selección manual, fotografía correspondiente y pausa comprobadas. Sin errores de consola en la landing.
