# PopoWash · modelo 3D

Visor independiente: `opcion-4/model/index.html`. Servir la raíz del proyecto por HTTP y abrir `/opcion-4/model/`; los módulos ES requieren HTTP. La landing conserva su banner actual.

Reconstrucción procedural aproximada a partir de las fotografías originales 000, 045 y 180, retomada el 9 de octubre de 2026. Mango recto a la izquierda, discos con ranuras abiertas, carcasa central, dos boquillas, plástico blanco y collar metálico. Las caras ocultas, medidas relativas y marcas impresas son aproximadas. El pequeño logotipo está recreado; los parámetros de material y la iluminación son estimaciones.

El visor permite girar con ratón o gestos, acercarse, seleccionar mediante clic o lista, cambiar entre cuatro vistas y separar/unir nueve piezas. Acepta flechas del teclado. No usa animación automática. Si WebGL no está disponible conserva una fotografía alternativa.

`createBidet.ts` es la fábrica generada; `createBidet.js` su versión sin tipos para navegador. `refineGeometry.js` aplica los refinamientos documentados en `bidet-spec.json`; `refine-source.mjs` los vuelve a conectar después de regenerar. `viewer.js` implementa la interacción. Three.js 0.180.0 y doce módulos auxiliares están bajo `../assets/vendor/`, con licencia MIT: el visor no necesita CDN ni `node_modules` en producción.

Se completaron las ocho pasadas de img2threejs, con comparación visual y vistas de giro. Consultar el flujo con `forge/next.py --state opcion-4/model/state.json opcion-4/model/bidet-spec.json`, resolviendo `forge/` desde `.agents/skills/img2threejs/`. `state.json` es la autoridad; para ejecutar las verificaciones de plugins se usó una copia temporal de lectura del estado bajo `tmp/popowash-3d-gates/.img2threejs/`. No hubo plugins de dominio aplicables ni se seleccionó un formato adicional de exportación.

Validación: 33.966 triángulos, 14 llamadas de dibujo, renderizado bajo demanda, nueve piezas con pivotes y ocho sockets. `interaction-tests.json` registra clic real, separación, selección, reset, vistas, teclado y móvil: sin errores ni solicitudes a `node_modules`. `part-coverage.json` pasa sin errores ni advertencias. `self-intersection.json` no detecta cruces en una muestra de 1.036 de 79.234 vértices; no es una prueba exhaustiva. Colisiones y destrucción son metadatos para acciones futuras, no física activa.

Las capturas completas se conservan localmente; las comparaciones usan escala uniforme y traslación para igualar el encuadre, sin deformar geometría. Los últimos diagnósticos usan copias a 384px, porque sus métricas internas operan a 64px, mientras que la inspección visual usa capturas a 1000px. El comparador de materiales pasó; el cromado conserva diferencias en microestructura bajo iluminación distinta. No se afirma una réplica exacta ni apta para fabricación o validación de instalación.

Gabo aprobó el resultado visual y pidió incluir este modelo en la publicación del cierre del 10 de octubre. Se proponen el visor, fuentes de construcción y refinamiento, especificación, estado y evidencias de cierre, registros de interacción y dependencias locales. Las series exploratorias de ángulos, pedestales y banners se conservan solo localmente. El manifiesto exacto está en `../../docs/tareas/2026-10-10-opcion-4-archivos-gabo.txt`.

En este cierre se comprobaron las 17 dependencias del visor y la sintaxis JavaScript; el registro de pruebas de interacción corresponde al desarrollo anterior, no a una nueva ejecución visual. Gabo autorizó su publicación junto con la Opción 4 mediante «Aprobado, sube a git» el 10 de octubre de 2026.
