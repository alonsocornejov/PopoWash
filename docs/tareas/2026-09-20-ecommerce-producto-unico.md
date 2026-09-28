# Ecommerce de producto único para PopoWash

- Fecha: 2026-09-20
- Responsable humano: Alonso
- Apoyo: Codex colaboró en estrategia, diseño, implementación y verificación.
- Estado: listo para revisión antes de subir a Git.

## Objetivo

Explorar cómo estructurar un ecommerce de un solo producto para PopoWash y construir propuestas navegables que permitan comparar distintas estrategias comerciales.

## Resultado

Se desarrollaron cuatro propuestas responsive:

1. Marca y deseo.
2. Confianza y compatibilidad.
3. Impacto y conversión.
4. Compra y arquitectura transaccional.

Todas las propuestas incluyen un selector interno para compararlas. Las primeras tres muestran su esqueleto estructural y la Opción 04 incorpora un modo **Ver lógica** que explica por qué aparece cada bloque en esa posición.

La Opción 04 queda como arquitectura recomendada para avanzar hacia el ecommerce definitivo.

## Decisiones

### Producto y compra primero

La primera pantalla de la Opción 04 reúne:

- Visual del producto.
- Nombre y beneficio.
- Precio.
- Cantidad.
- Botón para agregar a la bolsa.
- Acceso a compatibilidad.
- Despacho.
- Garantía.
- Medios de pago.

Esta estructura sirve tanto a visitantes que llegan preparados para comprar como a quienes necesitan investigar antes de decidir.

### Información transaccional cerca del botón

Despacho, garantía y métodos de pago aparecen junto a la compra porque pueden detener la conversión si quedan ocultos o aparecen demasiado tarde.

### Reseñas después de la compra inicial

Se preparó una sección temprana para reseñas verificadas. No se incorporaron estrellas, testimonios ni cifras ficticias porque PopoWash todavía no cuenta con esa evidencia.

### Compatibilidad como requisito de compra

El ecommerce incluye un comprobador conceptual para responder si PopoWash sirve en el inodoro del comprador. La versión definitiva debe incorporar medidas, conexiones y modelos realmente compatibles.

### Educación después de resolver la compra

Las secciones **Conoce tu PopoWash**, instalación, contenido de la caja y preguntas frecuentes aparecen después de la información transaccional. Su función es profundizar y resolver las objeciones restantes.

### Información pendiente claramente identificada

Precio, pagos, despacho, garantía, compatibilidad, contenido de la caja y reseñas aparecen marcados como referenciales o pendientes. El prototipo no procesa pagos ni presenta condiciones comerciales como definitivas.

## Verificación

Se comprobaron en el navegador:

- Navegación mediante el selector de propuestas.
- Adaptación a vista móvil.
- Selector de cantidad.
- Bolsa demostrativa.
- Cálculo conceptual de despacho.
- Comprobador conceptual de compatibilidad.
- Preguntas desplegables.
- Esqueletos estructurales.
- Modo **Ver lógica** de la Opción 04.
- Enlaces relativos entre las propuestas y la guía estratégica.
- `git diff --check`, sin errores de formato; solo la advertencia esperada de conversión LF/CRLF en Windows.

## Entregables

- [Propuesta 1: marca y deseo](../../mockup-ecommerce/index.html)
- [Propuesta 2: confianza y compatibilidad](../../mockup-ecommerce/opcion-2.html)
- [Propuesta 3: impacto y conversión](../../mockup-ecommerce/opcion-3.html)
- [Propuesta 4: compra y arquitectura transaccional](../../mockup-ecommerce/opcion-4.html)
- [Guía estratégica](../../mockup-ecommerce/estrategia.html)
- [Instrucciones del template](../../mockup-ecommerce/README.md)
- [Estilos compartidos del selector](../../mockup-ecommerce/review.css)

## Pendientes

Antes de convertir la propuesta en una tienda real se debe confirmar:

- Precio definitivo.
- Fotografías y video del producto.
- Compatibilidad y medidas.
- Tipo de conexión.
- Contenido exacto de la caja.
- Pasarela y medios de pago.
- Costos y tiempos de despacho.
- Garantía, cambios y devoluciones.
- Canal de soporte.
- Reseñas reales o pruebas piloto verificadas.

## Recomendación

Utilizar la Opción 04 como arquitectura principal del ecommerce, incorporar la personalidad verbal de la Opción 01 y reservar el lenguaje visual de la Opción 03 para campañas y anuncios.

## Ampliación posterior

El 2026-09-27, por indicación de Alonso, se añadió [Opción 05](../../mockup-ecommerce/opcion-5.html) como variación adicional de la propuesta de impacto. Conserva la composición de la Opción 03 y está enlazada desde el selector interno de las cinco páginas. Esta ampliación no cambia la recomendación de usar la Opción 04 como base transaccional.
