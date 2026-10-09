# Cierre: actualización de Web 4 · Principal

- Fecha: 9 de octubre de 2026.
- Responsable humano: Alonso. Codex apoyó la edición, generación de imágenes y verificación; las decisiones de contenido y diseño corresponden a Alonso.
- Objetivo: integrar la pauta del PDF y las correcciones del chat en la opción principal, conservando la identidad de Web 1.

## Resultado

- Aplicada la tipografía de Web 1 y el hero azul sin agua. Fotografías oficiales nuevas: tres cuartos en el inicio y frontal sobre fondo blanco en la compra.
- Copy unificado: «papel» y «El papel no limpia». Rollo más realista, con la tira saliendo por debajo. Sin asterisco en el hero ni menciones a garantía; compatibilidad explicada mediante tapa y asiento desmontables.
- Orden aprobado: hero → verdad incómoda → banner móvil → producto/compra → carrusel de reseñas → instalación y dos funciones → frenazo de camión → calculadora → FAQ → CTA final → pie.
- Instalación y funciones fusionadas: texto a la izquierda, foto a la derecha; limpieza posterior y frontal con copy inclusivo. Todo el bloque de cada paso es seleccionable. Fotos en loop cada 1,5 segundos; seleccionar pausa, «Reanudar» continúa. Sin contador de segundos ni barra de progreso. Imagen de instalación con logo, aún ilustrativa.
- Calculadora conserva la boleta: gasto y ahorro anual según integrantes, sin supuestos visibles. Humor: dos baños y dos PopoWash para 7–15 personas; «¿Esto es una casa o una pensión? Ese baño debería cobrar horas extra» desde 16.
- Retirado el bloque de compra informada/pago/despacho/soporte. Carrusel recuperado debajo del producto, con pausa y etiquetas claras de reseñas de ejemplo.
- Editor visual descartado para este flujo. Se continúa mediante prompts y se actualiza la misma pestaña del navegador.

## Entregables y verificación

[Web 4](../../opcion-4/index.html), [CSS](../../opcion-4/styles.css), [JavaScript](../../opcion-4/app.js), [documentación](../../opcion-4/README.md), [comparador actualizado](../../propuestas.html) y [actualizador del comparador](../../scripts/update-principal.py). Recursos finales y fuentes están en `opcion-4/assets/`. Las opciones 1 y 3 también incluyen las correcciones de «papel/no limpia».

Verificados en navegador: selección de pasos desde texto, número y espacio del bloque; pausa y reanudación; carrusel; límites del humor (6/7 y 15/16), entradas vacías e inválidas. Capturas en escritorio y móvil sin desbordes horizontales. Esto no equivale a completar la optimización móvil.

## Próximas tareas

- Ajustar el recorrido por secciones en computador: hero sin mostrar media sección siguiente y ficha de compra más compacta. Medición a 1366 × 768: ficha de 1094 px, con 687 px disponibles bajo la cabecera. Solo se midió; estos ajustes no se implementaron.
- Optimizar la composición móvil de toda la página, especialmente producto e instalación.
- Definir logo, contacto y redes; validar FAQ con Fabián; incorporar video real de instalación y testimonios reales.
- Confirmar precio, contenido de caja, despacho y medios de pago. La bolsa sigue siendo una vista previa, sin pedidos ni cobros.
- Decidir comparación por vida útil y servicio/tiempo de instalación cuando existan datos confirmados.
