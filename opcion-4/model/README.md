# Modelo 3D en preparación

El usuario pidió el 19 de septiembre de 2026 revisar primero la landing y dejar el 3D para después. **No está integrado a la landing y no está aprobado como modelo terminado.**

Se conservan el análisis de las referencias, inventario de detalles, especificación, evidencias estimadas de materiales y primera fábrica procedural generada con img2threejs. La especificación pasó `validate_sculpt_spec.py --strict-quality` antes de generar código.

La primera revisión de geometría (`blockout.png`) falló el diagnóstico de silueta: el render estaba sobreexpuesto y la máscara de fondo no medía bien el objeto. `blockout-v2.png` ajusta exposición y cámara, pero **no ha pasado una nueva validación**. Los bordes, ranuras, unión del brazo y boquillas requieren refinamiento; no se completaron las pasadas estructural, material, interacción ni optimización.

`review.html` es un visor técnico provisional, no una sección comercial. `createBidet.ts` es la fuente generada y refinada; `createBidet.js` es la versión sin tipos para navegador. Usa Three.js 0.180.0 y las copias locales bajo `../assets/vendor/`.

Para retomar, ejecutar primero `forge/next.py --state opcion-4/model/state.json` desde la raíz del repositorio, resolviendo `forge/` desde `.agents/skills/img2threejs/`. El estado y las revisiones de `bidet-spec.json` conservan lo validado y lo pendiente. Las coordenadas son relativas: no usar el modelo para fabricación, instrucciones de instalación ni comprobación de compatibilidad.

No cambiar la landing para mostrar esta primera malla sin completar la revisión y el visor accesible con alternativa fotográfica.
