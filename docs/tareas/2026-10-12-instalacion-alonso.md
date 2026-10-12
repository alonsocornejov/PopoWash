# Instalación · tres pasos y cierre de rama

- Fecha: 12 de octubre de 2026.
- Responsable humano: Alonso; textos, dirección visual y aprobación de publicación e integración en main. Codex apoyó implementación y verificación.
- Rama: `codex/asi-funciona-popowash`, desde `116a7ac`.

## Resultado aprobado

Solo se modifica la sección `#instalacion`: título «Tres pasos. Cero misterio.» en la columna izquierda, tres tarjetas seleccionables y Paso 0 como nota debajo del paso 3. Se retiraron subtítulo, modos de lavado y textos bajo la foto. Paso 0 abre el diálogo de video existente; × y Esc eliminan el iframe. La foto mantiene proporción fija y se centra frente a todo el bloque de texto.

Paso 0 queda en una línea dentro de la columna en escritorio; en móvil puede envolver para conservar legibilidad. Se mantienen textos exactos indicados por Alonso, fotos y lógica del selector; la única modificación de JavaScript protege la referencia al pie de foto eliminado. La rotación continúa cada 1,5 segundos; la selección manual pausa. El control de pausa/reanudación está oculto por petición de Alonso, conservado internamente para compatibilidad con la lógica actual.

## Verificación

- 1920×1080: sección 999 px, disponibles 999; 1440×900: 819/819; 1366×768 y 1024×768: 687/687. Sin exceso.
- Foto centrada frente a la columna: diferencia inferior a 0,01 px. A 390 px no hay desbordamiento horizontal.
- Paso 0: altura 23,39 px y ancho limitado a la columna en los cuatro tamaños de escritorio.
- Selector, tres fotos, rotación y pausa manual comprobados. Popup real cargado; cierre con × y Esc elimina el iframe. Sin errores de consola.
- Contraste AA: mínimo 4,60:1. Se mantiene el blanco aprobado para evitar el incumplimiento del color heredado.
- Sintaxis JavaScript, diff y comparador revisados. Las otras cuatro propuestas se conservan.

## Entregables y continuación

[HTML](../../opcion-4/index.html), [CSS](../../opcion-4/styles.css), [JavaScript](../../opcion-4/app.js), [comparador](../../propuestas.html), [documentación](../../opcion-4/README.md).

Alonso autorizó subir la rama e integrarla en `main` como nueva base. El siguiente agente debe traer `main` actualizada y crear su rama por sección. Los materiales locales ajenos de branding y marketing no forman parte de esta publicación. Siguen pendientes testimonios reales, caja, FAQ comercial, pagos, despacho y soporte.
