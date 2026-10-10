# Cierre · Opción 4: hero, compra, funcionamiento y modelo 3D

- Fecha: 10 de octubre de 2026.
- Responsable humano: Gabo; dirección visual y decisiones de producto.
- Apoyo: Codex; implementación, edición de imágenes y comprobaciones.
- Estado: cierre aprobado por Gabo el 10 de octubre de 2026 para publicación en `main`.

## Objetivo y resultado

Mejorar la presentación de la Opción 4 conservando la identidad azul/lima y el producto a la derecha.

- Hero con la imagen elegida por Gabo, fondo azul de marca, iluminación superior y reflejos, sin el foco blanco visible. Texto vigente conservado.
- Último banner retocado y exportado sin pérdida a 2048 × 768. Es panorámico y cubre el ancho Full HD; no es un archivo de 1920 × 1080 ni 4K. El generador no entregó los 3840 × 1440 solicitados. Gabo autorizó publicar esta versión; la revisión final de textos e imágenes sigue en los pendientes.
- Franja verde movida inmediatamente después de la hero.
- Compra unificada en un CTA compacto antes del footer, inspirado en la estructura de Web 1: $39.990 CLP por producto, instalación opcional en Santiago por $15.000 adicionales y despacho por calcular. Bolsa y FAQ actualizadas; los pagos siguen deshabilitados.
- Funcionamiento distribuido en dos columnas, con fotografía grande y estable. El paso activo se distingue mediante recuadro, fondo translúcido y acento lateral. La secuencia cambia cada seis segundos para facilitar la lectura; elegir un paso la pausa.
- Comparador actualizado conservando las otras cuatro propuestas.
- Modelo 3D aprobado visualmente por Gabo: visor independiente con giro, acercamiento, selección de piezas, cuatro vistas y separación/unión de nueve piezas. Se incorpora a la publicación junto con sus fuentes y dependencias locales.

## Comprobaciones

- Funcionamiento completo en 1280 × 720: sección de aproximadamente 611 px; 637 px en un marco de 1920 × 1080.
- Marcos móviles de 390 y 320 px: sin desbordamiento horizontal.
- Selección manual, foto correspondiente, pausa y avance automático: comprobados. Sin errores de consola en la landing.
- CTA de unos 552 px de alto en la revisión previa a 1280 px de ancho. Bolsa: dos unidades suman $79.980; cantidad cero rechazada.
- Sintaxis JavaScript y revisión de espacios del diff: correctas. Comparación del contenido incrustado: las otras cuatro propuestas permanecen idénticas.

- Modelo 3D: registro previo de interacción con nueve piezas, 33.966 triángulos y 14 llamadas de dibujo; sin errores ni solicitudes a `node_modules`. En este cierre se verificaron la sintaxis de los módulos propios y las 17 dependencias del visor, sin archivos faltantes; no se repitió la prueba visual completa.

## Entregables

- [Landing](../../opcion-4/index.html), [estilos](../../opcion-4/styles.css) y [comportamiento](../../opcion-4/app.js).
- [Banner final](../../opcion-4/assets/hero-spotlight-detalle.webp), [original PNG](../../opcion-4/assets/hero-spotlight-detalle.png) y [prompt](../../opcion-4/assets/PROMPT-hero-detalle.md).
- [Comparador](../../propuestas.html) y [documentación](../../opcion-4/README.md).
- [Visor 3D](../../opcion-4/model/index.html), [modelo](../../opcion-4/model/createBidet.js), [especificación](../../opcion-4/model/bidet-spec.json) y [documentación 3D](../../opcion-4/model/README.md).
- [Lista exacta de archivos propuestos](2026-10-10-opcion-4-archivos-gabo.txt).

## Pendientes y alcance

Orden de trabajo solicitado por Gabo:

1. Revisar el apartado de solución/cómo usar; analizar cambios de diseño y estructura.
2. Mejorar la sección de CTA.
3. Mejorar la sección de reseñas.
4. Mejorar la sección de gasto por rollo.
5. Después de lo anterior, revisar textos e imágenes; utilizar la skill `copywriting` para los textos.

Estos puntos son tareas futuras, no cambios ejecutados en este cierre. Se mantienen los pendientes comerciales de caja, despacho, pagos, FAQ, reseñas reales y video de instalación.

La publicación propuesta incluye la landing, el modelo 3D con su visor, fuentes, dependencias y registros de validación, y únicamente la versión final del banner (PNG original, WebP usado por la web y prompt). Las propuestas anteriores del banner y sus renders exploratorios quedan locales. El modelo sigue siendo una reconstrucción visual aproximada, no un plano de fabricación.

Gabo aprobó este alcance y autorizó el commit y push con «Aprobado, sube a git». Se incluyen únicamente los archivos del manifiesto; las capturas temporales y los archivos ajenos quedan fuera.
