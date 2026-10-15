# Contexto actual de PopoWash

PopoWash es un prototipo de identidad, landing page y ecommerce para un bidet mecánico que se instala directamente en el inodoro.

## Estado vigente

- Gabo consolidó el mapa de marca el 15 de octubre: [guía breve para Gabo y Alonso](marketing/Popo-Wash-guia-equipo-v1.md), [memoria IA](../.agents/product-marketing.md) y [mapa completo de 83 puntos](marketing/Popo-Wash-mapa-de-marca-v1.md). Son acuerdos con Gabo, pendientes de revisión de Alonso y validación final de Fabián. La entrega se publica en `rama/mapa-de-marca`; su [cierre](tareas/2026-10-15-mapa-de-marca-gabo.md) distingue el paquete de marca de los cambios web ya publicados.

- Alonso aprobó el 13 de octubre la guía de compatibilidad integrada, Instagram, demostración real de modos en loop sin audio a 1,2×, kit organizado v4 y carrito de producto único con métodos de pago ilustrativos. Los CTA, FAQ, Paso 0, carrito y footer comparten guía; el video queda en la pregunta de instalación. Las siete prioridades visuales están implementadas; cobros, entrega y validación técnica siguen pendientes. Detalle en [el cierre de guía, kit y carrito](tareas/2026-10-13-web4-guia-kit-y-carrito-alonso.md).

- Web 4 integra el trabajo de Alonso hasta el 13 de octubre: hero con fondo CSS y producto transparente, compra con cantidad/total y tarjeta crema, beneficios, FAQ revisado y secciones compactadas a una vista en escritorio. Se integraron selectivamente el CTA animado y footer de Gabo (`codex/opcion-4-cta`, `de1a2a3`), se instaló el logo v2 y se regeneró el comparador. Resultado, autoría, pruebas y continuación en [el cierre de esta versión](tareas/2026-10-13-web4-integracion-y-logo-alonso.md).

- Marketing cuenta con un cuaderno rellenable y 80 skills agrupadas en marketing, benchmark y contenido. Entregables y comprobaciones en el [cierre de preparación de marketing de Gabo](tareas/2026-09-28-marketing-cuaderno-skills-gabo.md), aprobado para publicación en Git.
- Hay cuatro propuestas web enlazadas desde el [README](../README.md). Web 4 es la principal y `main` es la base aprobada por Alonso el 12 de octubre para trabajar por secciones. Decisiones, integración y pruebas en [el cierre de esta base](tareas/2026-10-12-base-main-alonso.md). Existe un visor 3D independiente aprobado visualmente por Gabo; no se modifica en este cierre.
- Se desarrollaron cinco propuestas de ecommerce de producto único; la Opción 04 queda recomendada como base transaccional y la Opción 05 conserva una variación de impacto.
- Las decisiones y entregables están documentados en [`tareas/2026-09-20-ecommerce-producto-unico.md`](tareas/2026-09-20-ecommerce-producto-unico.md).
- La identidad visual es provisional: azul eléctrico, lima ácido, negro y blanco cálido.
- Gabo confirmó el 11 de octubre que la personalidad de la landing es humorística, disruptiva y juvenil. Las líneas de familias, personas mayores e instituciones son exploraciones futuras, no la voz que debe adoptar ahora Opción 4. Prioridad: diseño y narrativa antes de habilitar compra. Instalación ya se refinó; la solución y la fotografía de compra siguen en revisión.
- Orden vigente de Web 4: hero → franja lima → compra con reseñas de ejemplo → «El papel no limpia» → «Evita el frenazo de camión» → «PopoWash es la solución.» → instalación → calculadora → FAQ → CTA final animado → footer. La bolsa es una demostración; faltan testimonios reales y el flujo comercial. Se conservan el popup de instalación y los medios de pago ilustrativos.
- Instalación actualizada por Alonso: título y pasos en la columna izquierda, Paso 0 con video en popup debajo del paso 3 y foto centrada a la derecha. La sección cabe en una vista de escritorio; modos de lavado retirados. El [cierre de instalación](tareas/2026-10-12-instalacion-alonso.md) documenta pruebas y continuación desde `main`.
- Integrada la rama de Gabo `codex/opcion-4-problema` (`b55f570`) en `main`, conservando el trabajo de Alonso fuera de esa sección. La [nota de origen](tareas/2026-10-12-opcion-4-problema-rama-gabo.md) documenta la variante antes de esta integración.
- Hay propuestas iniciales de logotipo en [`branding/`](../branding/README.md).
- Se incorporaron cinco recursos de diseño, revisión web y 3D como skills del proyecto. El detalle está en [`tareas/2026-09-19-integracion-skills.md`](tareas/2026-09-19-integracion-skills.md). Sus usos y requisitos están en [`SKILLS.md`](SKILLS.md). La instalación no cambia las propuestas web ni confirma la identidad visual.
- El cierre del hero de Opción 4 está documentado en [`tareas/2026-09-21-opcion-4-hero-gabo.md`](tareas/2026-09-21-opcion-4-hero-gabo.md).
- La reunión con el dueño del 2026-09-28 orienta el público hacia personas mayores y familias, con foco comercial en lugares con muchos baños: especialmente residencias de personas mayores, además de hoteles y moteles. Los ejes planteados son higiene y calidad. Las [notas de la reunión en curso](tareas/2026-09-28-reunion-dueno-marca.md) recogen también el cambio de logo solicitado, la propuesta de postventa y problemas reportados del producto.

- Las próximas mejoras se desarrollan en ramas `codex/` por sección desde `main` actualizada y se integran conservando el resto y regenerando el comparador. La skill `contexto-proyecto` revisa todo el período desde la referencia indicada o el último cierre publicado de quien pide contexto, incluyendo cambios directos en `main` y ramas pendientes de integrar.

## Pendientes

- Todas las debilidades de la auditoría del 11 de octubre están convertidas en tareas en [PENDIENTES-WEB4.md](PENDIENTES-WEB4.md), con el alcance actual, el trabajo posterior de diseño y la preparación comercial separados. Esta lista incorpora las aclaraciones de Gabo sobre humor, reseñas disponibles, CTA de demostración y FAQ pendiente.
- **Marketing — revisar con Alonso y Fabián los [26 pendientes P01–P26](marketing/Popo-Wash-pendientes-v1.md).** Priorizar información/manual del producto, compatibilidad, despacho, condiciones legales/postventa y aprobación de web/ecommerce antes de vender; después benchmark, inspiración, eslogan, plantillas y organización. Responsables y fechas por definir en el registro. No confundir definiciones acordadas con Gabo con aprobación final de Fabián.
- Conciliar las versiones de la web y sus recursos con el mapa de marca: nombre separado, público retail prioritario, testimonios reales y afirmaciones respaldadas. El contexto de las secciones web conservado debajo describe su implementación; no sustituye las validaciones comerciales/técnicas pendientes. Preparar integraciones externas cuando se necesiten.
- Las siete prioridades visuales de Alonso del 13 de octubre están implementadas en [PENDIENTES-WEB4.md](PENDIENTES-WEB4.md). La siguiente etapa es revisar con Gabo y preparar venta real: validar compatibilidad/contenido del kit, elegir pasarela y definir entrega y condiciones comerciales.
- Web 4 muestra $39.990 por PopoWash. La instalación opcional en Santiago por $15.000 adicionales fue indicada por Gabo el 10 de octubre; su presentación se revisará en la rama de compra. Confirmar contenido de la caja; la compatibilidad comunicada requiere tapa y asiento desmontables. No se incluyen menciones a garantía en la principal.
- Desarrollar la propuesta de logo solicitada y revisar el protocolo de postventa que tiene Fabián.
- Validar la propuesta de garantías para ecommerce y revisar los problemas reportados de acumulación de sarro/mugre y goteo al cerrar la perilla.
- Definir pagos, despacho, cambios, devoluciones y soporte.
- Definir logo definitivo, contacto y redes; validar FAQ con Fabián. Incorporar video real de instalación y reseñas verificadas; el carrusel actual muestra ejemplos.

Este archivo resume solo el estado vigente. Las decisiones y entregables cerrados se documentan en [`tareas/`](tareas/).
