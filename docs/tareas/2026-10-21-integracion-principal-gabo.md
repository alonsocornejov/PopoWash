# Integración pendiente de ramas · Gabo

- Fecha: 21 de octubre de 2026.
- Responsable humano: Gabo. Apoyo de Codex: comparación de ramas, preparación y comprobaciones. Se conserva la autoría original de los trabajos de Alonso, Gabo, Claude y Codex indicada en sus cierres.
- Base: `origin/main`, commit `59924cf`.
- Preparación inicial: `codex/integracion-principal`, en un checkout aislado. Luego Gabo solicitó aplicar la integración local sin publicar.
- Resultado: integración local completada desde `main` actualizado a `59924cf`. Posteriormente se creó `rama-cambios-21.10.2026`; Gabo autorizó el commit y push de esta integración junto a los cambios de la sesión. La integración en el main compartido sigue pendiente.

## Alcance

1. Incorporar los ocho archivos del paquete de marca publicado en `rama/mapa-de-marca` (`97a90a2`): mapa, guía, pendientes, memoria IA, accesos y cierre. Se mantienen pendientes la revisión de Alonso y la validación final de Fabián.
2. Incorporar los 20 archivos originales de `branding/personaje-durazno/` publicados en `codex/opcion-4-cta` (`de1a2a3`) y su [cierre histórico](2026-10-13-opcion-4-cta-pie-gabo.md). Incluye modelos, GIF, poses, visor, videos y fuentes de animación. Ese cierre describe la versión histórica; el diseño vigente es el de main.
3. Documentar esta integración y su estado en CONTEXTO.

## Decisiones

Problema e Instalación ya están incorporados en main. El CTA y footer fueron integrados selectivamente por Alonso; no se reaplica su versión anterior ni se reemplazan HTML, CSS, JavaScript, videos o comparador actuales. Esta integración agrega documentación y recursos de marca.

Antes del cambio se respaldaron 28 archivos en `tmp/respaldo-integracion-20261021-220406/`. La carpeta principal se cambió a main y se actualizó mediante fast-forward, sin nuevo commit. Se conservaron la modificación del README de marketing, los documentos locales más recientes del 17 de octubre, portadas, carruseles, experimentos y entregables. Se restituyeron los 20 archivos del personaje desde la preparación aislada. No se publican tmp, output ni node_modules.

## Comprobaciones

- Preparación del paquete documental sin conflictos.
- Los 20 recursos del personaje y el cierre histórico coinciden con su rama de origen.
- Opción 4 y propuestas.html coinciden con origin/main; el comparador se regenera como comprobación.
- Enlaces locales de los documentos incorporados revisados y git diff --check ejecutado.
- No se requiere prueba visual nueva porque no se modifica la interfaz.

## Publicación propuesta

Gabo autorizó publicar el alcance en `rama-cambios-21.10.2026`, junto con el [cierre de CTA, FAQ y precio](2026-10-21-cta-faq-precio-gabo.md). Se conservan los ajustes de marca del 17 de octubre. No hacer merge a main ni borrar ramas o archivos locales como parte de esta publicación.
