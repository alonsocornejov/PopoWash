# Web 4 · base compartida en main

- Fecha: 12 de octubre de 2026.
- Responsable humano: Alonso; aprobación de esta base y del orden de secciones. Gabo es responsable del diseño del Problema integrado desde su rama.
- Apoyo: Codex; integración, conservación de cambios locales, documentación y comprobaciones.
- Estado: Alonso autorizó publicar esta versión en `main` y usarla como base de las próximas ramas por sección.

## Resultado y decisiones

- Integrada `codex/opcion-4-problema` (`b55f570`) por avance directo: montaña de papel sola sobre negro y «El papel no limpia».
- Se conserva el hero de estudio azul con logo, compra con reseñas, FAQ, diálogo de video de instalación y distintivos de medios de pago. La bolsa sigue siendo una demostración, sin pedidos ni cobros.
- Orden aprobado: hero → banner móvil → compra con reseñas → «El papel no limpia» → «Evita el frenazo de camión» → instalación y funciones → calculadora → FAQ → CTA final → footer. El bloque del papel se movió íntegro, sin cambiar su contenido.
- `main` es la base compartida. Las próximas mejoras se trabajarán en ramas `codex/` por sección, creadas desde `main` actualizada. Cada integración conserva las otras secciones y regenera el comparador.
- `contexto-proyecto` ahora revisa todas las ramas remotas y todos los commits/cierres desde la referencia indicada o el último cierre publicado de quien pide contexto. Distingue cambios integrados, pendientes de integrar y locales; agrupa las iteraciones por tema.

## Comprobaciones

- Navegador a 1280, 390 y 320 px: sin desbordamiento horizontal ni imágenes rotas; sin errores JavaScript. Diálogo del video abre y limpia su iframe al cerrar; se comprobó la interfaz con respuesta de prueba, no la reproducción externa de YouTube.
- Bolsa: dos unidades suman $79.980. Pausa de reseñas comprobada.
- Después del cambio de orden: verificado en la pestaña del usuario; contenido del bloque y resto del HTML conservados.
- Comparador regenerado; las otras cuatro propuestas permanecen idénticas al respaldo previo a la integración.
- Sintaxis de `app.js`, `git diff --check` y validador oficial de la skill: correctos.
- Recursos locales de la versión aprobada incluidos en el alcance de publicación. Los respaldos y capturas en `tmp/` son locales y no se publican.

## Entregables y pendientes

[Landing](../../opcion-4/index.html), [estilos](../../opcion-4/styles.css), [JavaScript](../../opcion-4/app.js), [comparador](../../propuestas.html), [documentación](../../opcion-4/README.md), [hero WebP](../../opcion-4/assets/hero-estudio-azul-con-logo.webp), [original PNG](../../opcion-4/assets/hero-estudio-azul-con-logo.png), [prompt](../../opcion-4/assets/PROMPT-hero-estudio-azul-con-logo.md), [skill de contexto](../../.agents/skills/contexto-proyecto/SKILL.md) y [acuerdo del proyecto](../../AGENTS.md).

Siguen pendientes testimonios reales, validación de FAQ y caja, video/demostración verificada, despacho, pagos, soporte y canales de contacto. Se conserva la [lista de mejoras de Web 4](../PENDIENTES-WEB4.md); no se habilita la venta en este cierre. Materiales locales ajenos de branding, marketing y experimentos quedan fuera.
