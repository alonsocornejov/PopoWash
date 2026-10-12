# Contexto actual de PopoWash

PopoWash es un prototipo de identidad, landing page y ecommerce para un bidet mecánico que se instala directamente en el inodoro.

## Estado vigente

- Marketing cuenta con un cuaderno rellenable y 80 skills agrupadas en marketing, benchmark y contenido. Entregables y comprobaciones en el [cierre de preparación de marketing de Gabo](tareas/2026-09-28-marketing-cuaderno-skills-gabo.md), aprobado para publicación en Git.
- Hay cuatro propuestas web enlazadas desde el [README](../README.md). Web 4 es la principal y `main` es la base aprobada por Alonso el 12 de octubre para trabajar por secciones. Decisiones, integración y pruebas en [el cierre de esta base](tareas/2026-10-12-base-main-alonso.md). Existe un visor 3D independiente aprobado visualmente por Gabo; no se modifica en este cierre.
- Se desarrollaron cinco propuestas de ecommerce de producto único; la Opción 04 queda recomendada como base transaccional y la Opción 05 conserva una variación de impacto.
- Las decisiones y entregables están documentados en [`tareas/2026-09-20-ecommerce-producto-unico.md`](tareas/2026-09-20-ecommerce-producto-unico.md).
- La identidad visual es provisional: azul eléctrico, lima ácido, negro y blanco cálido.
- Gabo confirmó el 11 de octubre que la personalidad de la landing es humorística, disruptiva y juvenil. Las líneas de familias, personas mayores e instituciones son exploraciones futuras, no la voz que debe adoptar ahora Opción 4. Prioridad: diseño y narrativa antes de habilitar compra; solución y paso a paso se reconstruirán en otra tarea.
- Orden vigente de Web 4: hero de estudio azul con logo → banner móvil → compra con reseñas de ejemplo → «El papel no limpia», con montaña de papel sola sobre negro → «Evita el frenazo de camión» → instalación en tres pasos → calculadora → FAQ → CTA final → footer. Se conservan el diálogo de video y los distintivos de medios de pago. La bolsa sigue siendo una demostración; faltan testimonios reales.
- Instalación actualizada por Alonso: título y pasos en la columna izquierda, Paso 0 con video en popup debajo del paso 3 y foto centrada a la derecha. La sección cabe en una vista de escritorio; modos de lavado retirados. El [cierre de instalación](tareas/2026-10-12-instalacion-alonso.md) documenta pruebas y continuación desde `main`.
- Integrada la rama de Gabo `codex/opcion-4-problema` (`b55f570`) en `main`, conservando el trabajo de Alonso fuera de esa sección. La [nota de origen](tareas/2026-10-12-opcion-4-problema-rama-gabo.md) documenta la variante antes de esta integración.
- Hay propuestas iniciales de logotipo en [`branding/`](../branding/README.md).
- Se incorporaron cinco recursos de diseño, revisión web y 3D como skills del proyecto. El detalle está en [`tareas/2026-09-19-integracion-skills.md`](tareas/2026-09-19-integracion-skills.md). Sus usos y requisitos están en [`SKILLS.md`](SKILLS.md). La instalación no cambia las propuestas web ni confirma la identidad visual.
- El cierre del hero de Opción 4 está documentado en [`tareas/2026-09-21-opcion-4-hero-gabo.md`](tareas/2026-09-21-opcion-4-hero-gabo.md).
- La reunión con el dueño del 2026-09-28 orienta el público hacia personas mayores y familias, con foco comercial en lugares con muchos baños: especialmente residencias de personas mayores, además de hoteles y moteles. Los ejes planteados son higiene y calidad. Las [notas de la reunión en curso](tareas/2026-09-28-reunion-dueno-marca.md) recogen también el cambio de logo solicitado, la propuesta de postventa y problemas reportados del producto.

- Las próximas mejoras se desarrollan en ramas `codex/` por sección desde `main` actualizada y se integran conservando el resto y regenerando el comparador. La skill `contexto-proyecto` revisa todo el período desde la referencia indicada o el último cierre publicado de quien pide contexto, incluyendo cambios directos en `main` y ramas pendientes de integrar.

## Pendientes

- Todas las debilidades de la auditoría del 11 de octubre están convertidas en tareas en [PENDIENTES-WEB4.md](PENDIENTES-WEB4.md), con el alcance actual, el trabajo posterior de diseño y la preparación comercial separados. Esta lista incorpora las aclaraciones de Gabo sobre humor, reseñas disponibles, CTA de demostración y FAQ pendiente.
- Completar y validar el cuaderno de marketing antes de definir la identidad, el tono y el plan editorial de Instagram; preparar las integraciones externas cuando se necesiten.
- Próxima revisión de Web 4, en este orden indicado por Gabo:
  1. Revisar solución/cómo usar y analizar cambios de diseño y estructura.
  2. Mejorar el CTA.
  3. Mejorar reseñas.
  4. Mejorar la sección de gasto por rollo.
  5. Después de lo anterior, revisar textos e imágenes; usar la skill `copywriting` para los textos.
- Web 4 muestra $39.990 por PopoWash. La instalación opcional en Santiago por $15.000 adicionales fue indicada por Gabo el 10 de octubre; su presentación se revisará en la rama de compra. Confirmar contenido de la caja; la compatibilidad comunicada requiere tapa y asiento desmontables. No se incluyen menciones a garantía en la principal.
- Desarrollar la propuesta de logo solicitada y revisar el protocolo de postventa que tiene Fabián.
- Validar la propuesta de garantías para ecommerce y revisar los problemas reportados de acumulación de sarro/mugre y goteo al cerrar la perilla.
- Definir pagos, despacho, cambios, devoluciones y soporte.
- Definir logo definitivo, contacto y redes; validar FAQ con Fabián. Incorporar video real de instalación y reseñas verificadas; el carrusel actual muestra ejemplos.

Este archivo resume solo el estado vigente. Las decisiones y entregables cerrados se documentan en [`tareas/`](tareas/).
