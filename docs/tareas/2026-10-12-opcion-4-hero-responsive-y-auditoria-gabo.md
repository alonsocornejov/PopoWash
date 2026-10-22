# Opción 4 · hero, problema y recorrido

> Actualización de precio (Gabo, 21-oct-2026): la instalación opcional ahora cuesta $25.000 CLP por unidad. Las menciones a $15.000 de este cierre describen el valor histórico y ya no están vigentes.

- **Responsable humano de las decisiones:** Gabo.
- **Apoyo de ejecución y comprobación:** Codex.
- **Fecha:** 12 de octubre de 2026.
- **Estado:** alcance revisado y aprobado por Gabo para publicación en Git el 12 de octubre de 2026.

## Objetivo

Mejorar el hero, desarrollar el banner del problema y ordenar la narrativa de Opción 4. Conservar la identidad humorística, disruptiva y juvenil. Registrar las debilidades de las auditorías como pendientes.

## Resultado vigente y decisiones

- Hero con superficies refinadas, versiones por dispositivo y descripción «El bidet que lava con agua y se instala bajo el asiento de tu WC». En escritorio ocupa la primera pantalla bajo la navegación; se corrigió el margen lateral del texto. Conserva el producto grande, mango izquierdo y spotlight sin foco visible.
- Segunda sección con montaña de papel y bóxer blanco visto por detrás, apoyado en el suelo y con decoloración beige tenue. Fondo negro, papel iluminado y sin bruma azul. El último ajuste mueve el bóxer aproximadamente 150 px a la izquierda para despejar el texto.
- Copy elegido por Gabo: **«Seamos sinceros / El papel no lava»**. Bajada: **«Una pasada, otra y otra… y aún falta esa sensación de limpieza. PopoWash lava con agua; el papel queda para secar»**.
- Orden final: **hero → problema → solución provisional → tres pasos → reseñas → gasto en papel → FAQ → compra**. Se retiraron la franja verde intermedia y «Míralo en tu WC».
- La primera propuesta de solución con cinco beneficios resultó demasiado grande. Por decisión de Gabo se reemplazó por un marcador compacto, de unos 110 px en escritorio. Solución y paso a paso se resolverán más adelante. El selector de tres pasos conserva su versión provisional.
- Se restauró el carrusel después del paso a paso, con estrellas, imágenes, pausa y ejemplos rotulados. Aún faltan testimonios autorizados. La maqueta no representa clientes reales.
- Las preguntas del FAQ usan DM Sans con mayor legibilidad. El CTA mantiene $39.990 por producto y +$15.000 por instalación opcional en Santiago; la bolsa es una demostración local.
- El comparador se sincronizó con la landing. Los experimentos del 3D y las variantes descartadas de imagen quedan fuera de este cierre.

## Entregables

[Landing](../../opcion-4/index.html), [comparador](../../propuestas.html), [banner final JPG](../../opcion-4/assets/problema-banner-papel-boxer-negro.jpg), [PNG independiente](../../opcion-4/assets/problema-banner-papel-boxer-negro.png), [primera montaña de papel](../../opcion-4/assets/problema-montana-papel-original.jpg), [hero final](../../opcion-4/assets/hero-spotlight-detalle.png), [prompts del problema](../../opcion-4/assets/PROMPT-problema-negro.md), [registro visual](../propuestas/opcion-4-problema/README.md), [auditoría completa](../auditorias/2026-10-11-opcion-4.md), [auditoría narrativa previa a la implementación](../auditorias/2026-10-12-narrativa-opcion-4.md) y [pendientes](../PENDIENTES-WEB4.md).

Las imágenes finales están guardadas en el proyecto. Son recursos generados/refinados con ImageGen, no fotografías de clientes. La montaña de papel es una metáfora publicitaria.

## Comprobaciones y límites

- Hero responsive revisado durante la tarea a 1920 × 1080, 1280 × 720, 820 × 1024, 390 × 844 y 320 × 844. Producto completo y sin desborde horizontal en los tamaños revisados.
- Banner negro y desplazamiento final del bóxer comprobados visualmente a 1280 × 720. Solución compacta comprobada en escritorio y móvil; pausa del carrusel restaurado comprobada por clic.
- Selector de pasos, cálculo y bolsa de demostración comprobados durante la tarea. No se observaron errores de consola en las revisiones realizadas.
- Al cerrar: `node --check` y `git diff --check` pasan; recursos y enlaces de la landing y documentación revisada existen. Orden de secciones correcto y «Míralo en tu WC» ausente. El comparador conserva las otras cuatro propuestas.
- No se midieron Core Web Vitals ni conversiones reales. No se habilitaron pagos ni pedidos.

## Pendientes

1. Diseñar solución y paso a paso desde cero.
2. Mejorar CTA, manteniendo precio e instalación opcional.
3. Mejorar reseñas y sustituir ejemplos por testimonios autorizados.
4. Mejorar gasto por rollo y transparencia del cálculo.
5. Después, revisar todos los textos e imágenes con `copywriting`.
6. Antes de lanzar: confirmar contenido de caja, FAQ con Fabián, demostración real, despacho, pagos, soporte, contacto y redes.

## Archivos propuestos para publicación

Además del resumen actualizado de contexto, el alcance revisable es exactamente este:

1. `docs/tareas/2026-10-12-opcion-4-hero-responsive-y-auditoria-gabo.md`
2. `docs/CONTEXTO.md`
3. `docs/PENDIENTES-WEB4.md`
4. `docs/auditorias/2026-10-11-opcion-4.md`
5. `docs/auditorias/2026-10-12-narrativa-opcion-4.md`
6. `docs/propuestas/opcion-4-problema/README.md`
7. `opcion-4/README.md`
8. `opcion-4/index.html`
9. `opcion-4/styles.css`
10. `opcion-4/assets/PROMPT-hero-detalle.md`
11. `opcion-4/assets/hero-spotlight-detalle.png`
12. `opcion-4/assets/hero-spotlight-detalle.webp`
13. `opcion-4/assets/hero-spotlight-compacto.png`
14. `opcion-4/assets/hero-spotlight-desktop-1536.webp`
15. `opcion-4/assets/hero-spotlight-tablet-1440.webp`
16. `opcion-4/assets/hero-spotlight-tablet-960.webp`
17. `opcion-4/assets/hero-spotlight-mobile-960.webp`
18. `opcion-4/assets/hero-spotlight-mobile-480.webp`
19. `opcion-4/assets/PROMPT-problema-negro.md`
20. `opcion-4/assets/problema-banner-papel-boxer-negro.jpg`
21. `opcion-4/assets/problema-banner-papel-boxer-negro.png`
22. `opcion-4/assets/problema-montana-papel-original.jpg`
23. `propuestas.html`
24. `scripts/update-principal.py`

Los borradores de imagen, las capturas temporales, los experimentos del 3D y otros archivos locales quedan fuera. Gabo aprobó este alcance con «Aprobado, sube a git». La publicación incluye únicamente los 24 archivos enumerados.
