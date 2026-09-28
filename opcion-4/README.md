# Opción 4

Landing estática independiente de las opciones 1, 2 y 3. Abrir `/opcion-4/` desde un servidor estático en la raíz del repositorio. No necesita compilación para la landing.

## Composición

- Conserva azul `#3155ff`, lima `#c8ff36`, negro `#111318` y blanco cálido `#f8f7f2` de la opción 1.
- Manrope 400, 700 y 800, alojada localmente con licencia OFL.
- Siete secciones en el orden solicitado: héroe, reseñas, problema, cinco beneficios, tres pasos, FAQ y CTA.
- Fotografías suministradas en PNG como originales y WebP para la página. Todos los recursos de la landing se sirven localmente.
- Reseñas de ejemplo rotuladas, con pausa y modo estático/desplazable cuando se solicita movimiento reducido. No representan clientes reales.
- Simulador de gasto en papel: gasto mensual × 12; ahorro mensual = gasto × reducción elegida. No incluye agua ni costo del producto y no promete un porcentaje de ahorro.
- Banner del héroe con agua y mango corregido según las fotos originales, título “Mantenerse limpio ya no es una opción”, subtítulo original y logo Branding V1 en cabecera y pie. Imagen generada con ImageGen y optimizada a `assets/hero-agua-marca-v2.webp`; prompt en `assets/hero-propuestas/PROMPT-hero-final.md`.
- Pasos visuales, FAQ nativa y lista local de compatibilidad. “Comprar Ahora” lleva al CTA existente; no hay pedidos, pagos ni envío de información.

## Pendiente de contenido real

Testimonios autorizados; precio, garantía, despacho y contenido de la caja; medidas y conexiones compatibles; manual definitivo. Las imágenes de uso muestran el chorro con el asiento levantado como demostración, y el texto indica usarlo sentado.

## Imagen de instalación

`assets/instalacion.png` se creó con la herramienta integrada ImageGen y se optimizó a `assets/instalacion.webp`. Referencias: `09-instalado-general.png` y `01-estudio-giro-000.png`.

Prompt: “Create one photorealistic installation image for a bidet landing page, square aspect ratio. Reference image 1 is the exact white bathroom and toilet context. Reference 2 is the exact PopoWash mechanical bidet product geometry which must be preserved: white curved flat crossbar, two circular slotted mounting discs, curved left control arm ending in long white rotary knob with chrome ring, center dual-nozzle housing. Show close-up three-quarter top view of a person's two hands gently positioning this attachment on the toilet's rear ceramic mounting shelf, with toilet seat removed and resting partly visible at the far right edge. The product fits across the rear mounting holes behind the bowl, the control arm extends on the viewer's left along the bowl. All product geometry believable and unobstructed, only hands and forearms visible, no whole person, no nudity, no text, no graphics, no labels. Bright soft studio daylight, clean white and pale grey bathroom same as reference, editorial product photography, emphasis on simple physical positioning and attachment, subtle shadows, premium crisp clean detail. This is an illustrative installation concept, not a plumbing diagram. Do not depict extra fittings or water hoses.”

## Revisión

Probados en navegador: cambios de foto, pausa de reseñas, cálculo y validación de gasto, tres pasos visuales, FAQ, lista de compatibilidad y cierre con Escape. Comprobado sin desbordes de página a 1440, 390 y 320 px; sin errores JavaScript ni imágenes rotas; movimiento reducido desactiva el carrusel automático. Las capturas temporales y la rutina de revisión viven en `tmp/`, no forman parte de la publicación.

Lighthouse se intentó con `pnpm dlx lighthouse@12.8.2`, pero no pudo arrancar por `ERR_MODULE_NOT_FOUND: lighthouse-logger` en el entorno de ejecución. No se reportan puntuaciones Lighthouse ni métricas de Core Web Vitals como verificadas.

El trabajo secundario 3D está en `model/`; su estado y limitaciones se documentan allí. El usuario decidió aplazarlo para revisar primero la web con fotografías.
