# Propuesta web: contenidos y Popin · 23 de octubre de 2026

- Responsable humano de esta propuesta: Alonso; contenidos y paquete de marca publicados por Gabo el 21 de octubre. Apoyo de Codex: integración, preparación de animaciones, ajustes, comprobaciones y publicación.
- Base compartida: `59924cf`; incorpora el commit publicado por Gabo `9f6942e` y los ajustes de esta sesión.
- Rama de propuesta: `codex/propuesta-popin-y-contenidos`.
- El usuario revisó los cambios y aprobó la publicación el 23 de octubre con «aprobado sube a git». Se publica la rama de propuesta para revisión. No se incluyen archivos ajenos a la propuesta.

## Qué cambió, dónde y por qué

1. **CTA final:** se conserva «Tu poto ya esperó suficiente» y se incorpora debajo «Siéntete limpio, siéntete cómodo. Siéntate en un Popowash». Recoge la frase de la marca sin romper el remate del personaje. Contenido incorporado del trabajo de Gabo.
2. **Preguntas frecuentes:** nueva pregunta «¿Sirve para niños?», con ayuda durante el aprendizaje de higiene, enseñanza de presión y cierre de perilla por un adulto. Resuelve la duda planteada por el equipo; texto incorporado de Gabo.
3. **Instalación opcional:** $25.000 CLP por unidad en CTA y carrito, con cálculos consistentes; el producto conserva $39.990. Cambio incorporado de Gabo.
4. **Header:** Popin pequeño, sentado sobre el borde blanco y separado de Comprar Ahora. Usa el movimiento del video generado en Gemini aportado por el usuario, con fondo y asiento recortados. Se muestra una sola vez durante aproximadamente 5,5 segundos (movimiento un 19% más rápido, desvanecimiento desde el segundo 4,7 mientras baja el brazo) y desaparece antes si se abandona el hero. No reaparece al volver. Se oculta en móvil, donde tampoco aparece ese botón del header. Evita competir continuamente con el resto del contenido.
5. **Lo quiero:** Popin empieza escondiéndose parcialmente visible; al pasar el mouse sale y señala en 1,44 segundos. Al agregar el producto, celebra brevemente dentro del carrito, que abre sin espera. La celebración se trasladó al diálogo para que no quede tapada. Se usa el video de Gemini aportado por el usuario, recortado y dividido por estados. En móvil funciona la reacción al tocar; con movimiento reducido se usan poses estáticas.
6. **Demostración de lavado:** se conserva la modificación local previa del loop y su poster; el HTML apunta a ese recurso en vez del antiguo 720p.
7. **Comparador:** regenerado mediante `scripts/update-principal.py`, conservando las otras propuestas.

Los últimos ajustes limpian el contorno del CTA y conservan los guantes durante toda la celebración, con margen de salto ampliado. Header, regreso a reposo y carrito tienen transiciones suaves de entrada/salida. Se conserva la salida de 1,44 s.

## Comprobaciones

- Sintaxis JavaScript de app.js y cart.js, y git diff --check.
- Header sin superposición con el botón en 1600, 1280, 1024 y 768 px; sin desbordamiento horizontal.
- Header se oculta al abandonar el hero y al completar su saludo y desvanecimiento; no reaparece al volver.
- CTA: reposo, salida al hover, señal, apertura inmediata de carrito y celebración; revisión a 390 px y movimiento reducido.
- Contenidos integrados de Gabo y cálculos: una unidad con instalación $64.990; dos con instalación $129.980; dos sin instalación $79.980.

## Publicación y alcance

Publicación prevista: GitHub Pages desde la rama de propuesta para revisión, en https://alonsocornejov.github.io/PopoWash/opcion-4/ . La fuente de Pages se cambia de main a esta rama de propuesta; main remoto se conserva intacto. Cuando se apruebe e integre la propuesta, se debe volver a decidir la rama de publicación.

No se incorpora el camión (aplazado por el usuario), ni la frase «queremos cambiar la cultura del baño», ni experimentos o prompts descartados. El carrito sigue siendo demostración sin cobros. Los modelos originales y documentos de marca se conservan según la integración de Gabo.

## Entregables

- [Web 4](../../opcion-4/index.html), [comportamiento](../../opcion-4/app.js), [estilos](../../opcion-4/styles.css) y [comparador](../../propuestas.html).
- Animaciones finales en `opcion-4/assets/popin-*.webp` (se publica únicamente la salida rápida del CTA).
- [Mensaje de WhatsApp preparado, no enviado](../marketing/propuesta-web-2026-10-23-whatsapp.md).

## Ajuste aprobado de calculadora

El 23 de octubre se adelantan las frases de humor: la primera aparece desde 5 personas (antes 7) y la segunda desde 12 (antes 16). Los cálculos de gasto y ahorro no cambian. Verificados los límites 4, 5, 11, 12 y 20, además de entrada inválida; comparador regenerado. El usuario aprueba subir este ajuste a la misma rama de propuesta.
