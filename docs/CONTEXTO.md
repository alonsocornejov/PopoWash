# Contexto actual de PopoWash

PopoWash es un prototipo de identidad, landing page y ecommerce para un bidet mecánico que se instala directamente en el inodoro.

## Estado vigente

- Marketing cuenta con un cuaderno rellenable y 80 skills agrupadas en marketing, benchmark y contenido. Entregables y comprobaciones en el [cierre de preparación de marketing de Gabo](tareas/2026-09-28-marketing-cuaderno-skills-gabo.md), aprobado para publicación en Git.
- Hay cuatro propuestas web enlazadas desde el [README](../README.md). Web 4 es la principal: tipografía de Web 1, fotografías oficiales, instalación y dos funciones integradas, calculadora por hogar y carrusel de reseñas de ejemplo. El cierre de Alonso está en [`tareas/2026-10-09-principal-alonso.md`](tareas/2026-10-09-principal-alonso.md). Existe un visor 3D local independiente aprobado visualmente por Gabo, incluido en el alcance de publicación de este cierre.
- Opción 4 conserva el hero con spotlight sin foco visible, el CTA final compacto y pasos con selección enmarcada del [cierre de Gabo del 10 de octubre](tareas/2026-10-10-opcion-4-hero-cta-pasos-gabo.md). La iteración posterior actualiza su recorrido y recursos según el cierre del 12 de octubre.
- Se desarrollaron cinco propuestas de ecommerce de producto único; la Opción 04 queda recomendada como base transaccional y la Opción 05 conserva una variación de impacto.
- Las decisiones y entregables están documentados en [`tareas/2026-09-20-ecommerce-producto-unico.md`](tareas/2026-09-20-ecommerce-producto-unico.md).
- La identidad visual es provisional: azul eléctrico, lima ácido, negro y blanco cálido.
- Gabo confirmó el 11 de octubre que la personalidad de la landing es humorística, disruptiva y juvenil. Las líneas de familias, personas mayores e instituciones son exploraciones futuras, no la voz que debe adoptar ahora Opción 4. Prioridad: diseño y narrativa antes de habilitar compra; solución y paso a paso se reconstruirán en otra tarea.
- Estado local de Opción 4: hero responsive que ocupa la primera pantalla de escritorio → problema con papel iluminado y bóxer sobre negro, sin bruma → solución provisional compacta → tres pasos → reseñas de ejemplo → gasto en papel → FAQ → compra. Se retiraron la franja verde intermedia, el remate separado y «Míralo en tu WC». Solución y pasos se rediseñarán después; faltan testimonios reales. Auditorías, decisiones, imágenes finales y pruebas en el [cierre de Gabo del 12 de octubre](tareas/2026-10-12-opcion-4-hero-responsive-y-auditoria-gabo.md), aprobado por Gabo para publicación en Git.
- Variante de Problema en `codex/opcion-4-problema`: montaña de papel sola sobre negro, luz neutra y bloques lima; copy a la derecha con «El papel no limpia» y la pregunta de las manos. Gabo autorizó publicar esta rama; el FAQ y el resto de secciones conservan su contenido de base. Debe combinarse con la rama del socio antes de integrar en `main`. Detalle en el [cierre de esta rama](tareas/2026-10-12-opcion-4-problema-rama-gabo.md). Las 86 skills compartidas ya están en GitHub.
- Rama `codex/opcion-4-cta` (desde `codex/opcion-4-problema`), trabajo de Gabo con apoyo de Claude: CTA final nuevo y pie de página nuevo en Opción 4. El CTA, sobre azul oscuro `#14265c`, dice «Tu poto ya esperó suficiente.» / «Regálate un PopoWash.», muestra una animación en bucle del durazno y una ficha compacta con cantidad, total y botón grande. El pie usa el mismo blanco cálido del encabezado, con enlaces legales y de ayuda, una caja para escribir por WhatsApp e Instagram. Alonso debe integrarla. Detalle en el [cierre del CTA y pie de página](tareas/2026-10-13-opcion-4-cta-pie-gabo.md).
- La instalación queda oculta y opcional: el dueño prefiere vender sin instalación. Solo aparece al desplegar «¿Quieres que te lo instalemos?» (+$15.000 en Santiago).
- Existe un personaje de marca original, el durazno PopoWash: un durazno con poto en estilo rubber hose genérico, en 3D animable y con caras 1, 2 y 4. Sus modelos, poses, GIF, visor y el código fuente de la animación del CTA están en `branding/personaje-durazno/`. No debe copiar personajes protegidos.
- Hay propuestas iniciales de logotipo en [`branding/`](../branding/README.md).
- Se incorporaron cinco recursos de diseño, revisión web y 3D como skills del proyecto. El detalle está en [`tareas/2026-09-19-integracion-skills.md`](tareas/2026-09-19-integracion-skills.md). Sus usos y requisitos están en [`SKILLS.md`](SKILLS.md). La instalación no cambia las propuestas web ni confirma la identidad visual.
- El cierre del hero de Opción 4 está documentado en [`tareas/2026-09-21-opcion-4-hero-gabo.md`](tareas/2026-09-21-opcion-4-hero-gabo.md).
- La reunión con el dueño del 2026-09-28 orienta el público hacia personas mayores y familias, con foco comercial en lugares con muchos baños: especialmente residencias de personas mayores, además de hoteles y moteles. Los ejes planteados son higiene y calidad. Las [notas de la reunión en curso](tareas/2026-09-28-reunion-dueno-marca.md) recogen también el cambio de logo solicitado, la propuesta de postventa y problemas reportados del producto.

## Pendientes

- Todas las debilidades de la auditoría del 11 de octubre están convertidas en tareas en [PENDIENTES-WEB4.md](PENDIENTES-WEB4.md), con el alcance actual, el trabajo posterior de diseño y la preparación comercial separados. Esta lista incorpora las aclaraciones de Gabo sobre humor, reseñas disponibles, CTA de demostración y FAQ pendiente.
- Completar y validar el cuaderno de marketing antes de definir la identidad, el tono y el plan editorial de Instagram; preparar las integraciones externas cuando se necesiten.
- Próxima revisión de Web 4, en este orden indicado por Gabo:
  1. Revisar solución/cómo usar y analizar cambios de diseño y estructura.
  2. ~~Mejorar el CTA.~~ Hecho en `codex/opcion-4-cta`, pendiente de integrar.
  3. Mejorar reseñas.
  4. Mejorar la sección de gasto por rollo.
  5. Después de lo anterior, revisar textos e imágenes; usar la skill `copywriting` para los textos.
- Web 4 muestra $39.990 por PopoWash. La instalación en Santiago (+$15.000) queda oculta en un desplegable opcional. La compra está unificada en un CTA compacto antes del footer y los pagos aún no están habilitados. Confirmar contenido de la caja; la compatibilidad comunicada requiere tapa y asiento desmontables. No se incluyen menciones a garantía en la principal.
- Desarrollar la propuesta de logo solicitada y revisar el protocolo de postventa que tiene Fabián.
- Validar la propuesta de garantías para ecommerce y revisar los problemas reportados de acumulación de sarro/mugre y goteo al cerrar la perilla.
- Definir pagos, despacho, cambios, devoluciones y soporte.
- Pie de Opción 4: falta definir el destino de los 9 enlaces (hoy marcados como pendientes), el número de WhatsApp (`data-whatsapp` vacío) y la URL de Instagram. Confirmar si el enlace «Garantías» se mantiene, porque contradice la decisión de no mencionar garantías.
- Definir logo definitivo, contacto y redes; validar FAQ con Fabián. Incorporar video real de instalación y reseñas verificadas; el carrusel actual muestra ejemplos.

Este archivo resume solo el estado vigente. Las decisiones y entregables cerrados se documentan en [`tareas/`](tareas/).
