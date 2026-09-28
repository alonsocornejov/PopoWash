# Cierre de tarea: hero de Opción 4

- Responsable humano: Gabo
- Fecha: 2026-09-21
- Apoyo: Codex realizó la edición de archivos, generación de imágenes y verificación local. La autoría de las decisiones de producto y marca corresponde a Gabo.

## Objetivo

Reemplazar el hero de la Opción 4 por un banner de estudio dinámico basado en las fotografías reales de PopoWash, aplicar el logo Branding V1 y actualizar el copy principal solicitado.

## Resultado

- Se integró `opcion-4/assets/hero-agua-marca-v2.webp` como banner panorámico del hero.
- El banner conserva la onda de agua y el fondo azul de marca, con el producto en el lado derecho y espacio para el copy en el lado izquierdo.
- Se corrigió la geometría visual del mango para que quede recto y alineado con el cuerpo del producto, tomando como referencia `01-estudio-giro-000.png` y `02-estudio-giro-045.png`.
- El título quedó como “Mantenerse limpio ya no es una opción.” y se conservó el subtítulo existente.
- Los botones del hero y la navegación usan “Comprar Ahora” y “¿Cómo funciona?”.
- Se eliminó el selector de vistas del hero; el banner es ahora la única imagen principal.
- Se reemplazó el logotipo tipográfico por `branding/popowash-logo-concept-v1.png`, con un recorte responsive para cabecera y pie.
- Se dejaron las iteraciones generadas en `opcion-4/assets/hero-propuestas/` para revisión y trazabilidad. El prompt de la versión integrada está en [`PROMPT-hero-final.md`](../../opcion-4/assets/hero-propuestas/PROMPT-hero-final.md).

## Decisiones y justificación

- Se mantuvo la estructura de Opción 4 y su paleta azul eléctrico, lima, negro y blanco cálido.
- La imagen se dejó sin texto incrustado para que el título, subtítulo y llamadas a la acción sigan siendo HTML accesible y responsive.
- La opción 3D continúa aplazada, de acuerdo con la decisión previa de revisar primero la web con fotografías.

## Pruebas

- Verificación Playwright local en 1440, 768, 390 y 320 px: sin desbordamiento horizontal, imágenes cargadas y sin errores JavaScript.
- Se comprobó que ya no existen los controles de vista del hero.
- Se comprobó el ancla “¿Cómo funciona?”, el cambio del paso visual, el ancla “Comprar Ahora” y la apertura/cierre del diálogo de compatibilidad.
- Se revisaron capturas de escritorio y móvil. Las capturas temporales están en `tmp/` y no son entregables de publicación.
- Lighthouse no se considera validado: el entorno no pudo resolver `lighthouse-logger`.

## Entregables

- [`opcion-4/index.html`](../../opcion-4/index.html)
- [`opcion-4/styles.css`](../../opcion-4/styles.css)
- [`opcion-4/app.js`](../../opcion-4/app.js)
- [`opcion-4/README.md`](../../opcion-4/README.md)
- [`opcion-4/assets/hero-agua-marca-v2.webp`](../../opcion-4/assets/hero-agua-marca-v2.webp)
- [`opcion-4/assets/hero-propuestas/`](../../opcion-4/assets/hero-propuestas/)
- [`branding/popowash-logo-concept-v1.png`](../../branding/popowash-logo-concept-v1.png)

## Pendientes

- Conectar “Comprar Ahora” con precio, checkout o canal de ventas cuando esos datos estén confirmados.
- Confirmar precio, garantía, despacho, contenido de la caja, medidas y compatibilidad.
- Sustituir las reseñas de ejemplo por testimonios autorizados.
- Retomar la reconstrucción 3D solo cuando la revisión fotográfica esté aprobada.

