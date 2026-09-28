# Skills de PopoWash

Integradas el 19 de septiembre de 2026 a solicitud de Gabo, con apoyo de Codex. Viven en `.agents/skills/` y acompañan al proyecto cuando se suben a Git y se descargan en otro equipo. Añadir estas herramientas no cambia las páginas web ni selecciona una identidad definitiva.

## Qué usar y cómo pedirlo

| Recurso | Nombre para invocarlo | Ejemplo |
|---|---|---|
| Taste | `design-taste-frontend` | `$design-taste-frontend Propón una mejora visual para la opción 2 conservando sus textos.` |
| Impeccable | `impeccable` | `$impeccable audit opcion-2/index.html` |
| Playwright | `playwright-cli` | `$playwright-cli Comprueba las tres propuestas en escritorio y celular y reporta problemas.` |
| Awesome Design | `awesome-design-md` | `$awesome-design-md Compara tres referencias del catálogo para PopoWash sin modificar la web.` |
| IMG to 3D | `img2threejs` | `$img2threejs Reconstruye el bidet de esta imagen como un modelo Three.js.` Adjuntar una imagen o indicar su ruta. |

La selección también puede hacerse por una petición en lenguaje natural cuando corresponda. Si la interfaz aún no muestra las nuevas skills, abre una nueva tarea dentro del proyecto; se pueden leer directamente por su ruta mientras tanto.

Taste aporta dirección visual para landing pages. Se instaló su variante principal actual, v2 experimental; no todas las variantes del repositorio. Impeccable aporta comandos de diseño, auditoría y refinamiento. El encargo y la identidad de PopoWash prevalecen cuando sus recomendaciones estéticas difieren.

Awesome Design no trae una skill original: se creó un adaptador local con un [catálogo de 74 referencias](../.agents/skills/awesome-design-md/CATALOGO.md). Conserva los `DESIGN.md` de VoltAgent como material de consulta, sin copiar una marca a la raíz del proyecto. Son análisis de terceros, no documentación oficial de esas marcas. Las fuentes y servicios mencionados no se instalan con el catálogo.

IMG to 3D reconstruye objetos mediante código Three.js y comprobaciones por etapas. No garantiza geometría exacta a partir de una foto. Se instaló el núcleo original con sus scripts y referencias; no sus plugins opcionales ni un servicio externo de generación. La dependencia Three.js se incorporará al entregable que realmente la necesite.

## Preparar otro computador

1. Traer estos archivos desde GitHub cuando estén publicados.
2. Contar con Node.js 22.18 o superior, pnpm 11.19.0 y Python 3.10 o superior. `package.json` declara Node y pnpm; `pnpm-lock.yaml` fija las dependencias.
3. Desde la raíz de PopoWash, ejecutar:

   ```powershell
   pnpm install --frozen-lockfile --ignore-scripts
   pnpm exec playwright-cli --help
   pnpm exec impeccable --help
   ```

4. Playwright necesita un navegador compatible. En este equipo detectó Chrome. El comando de preparación oficial es `pnpm exec playwright-cli install --skills=agents`; también reescribe su skill, por lo que se deben revisar esos cambios antes de publicarlos. Sus archivos de navegador y sesiones son locales.
5. El lanzador de la skill Impeccable usa su motor incluido en este equipo. Los binarios no se suben a Git; en otro equipo puede descargar el motor fijado al primer uso. La instalación no incluye hooks automáticos. No es necesario ejecutar `init` hasta que se quiera trabajar en el contexto de diseño.

En PowerShell, sin un comando global, se puede usar `./node_modules/.bin/playwright-cli.cmd` o `./node_modules/.bin/impeccable.cmd`. Para el contexto propio de la skill Impeccable, usar `.agents/skills/impeccable/scripts/impeccable.cmd`. En otros sistemas, usar los lanzadores equivalentes sin `.cmd`.

Los scripts de IMG to 3D se encuentran en `.agents/skills/img2threejs/forge/`. Sus rutas de ejemplo son relativas a la carpeta de la skill; usa rutas explícitas para la imagen, estado y entregables del trabajo. Los scripts del núcleo usan la biblioteca estándar de Python.

## Versiones y procedencia

| Recurso | Fuente | Versión o revisión incorporada |
|---|---|---|
| Taste | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `e79ca9ec7e071eb3a3b623c4fb752e853fc3ed58`, carpeta `skills/taste-skill` |
| Impeccable | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Instalador npm `4.1.0`; skill `4.3.1`; motor fijado en `scripts/VERSION`: `0.1.5` |
| Playwright CLI | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | npm `@playwright/cli` `0.1.21`; skill suministrada por su instalador |
| Awesome Design MD | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | `8147538b4226ae41e2487a9179e3bcc1f68e8554`; adaptador local |
| IMG to 3D | [img2threejs/img2threejs](https://github.com/img2threejs/img2threejs) | `6e60b5e22419464b4853e01ddb6c0e6f6659a733`; skill `2.0.0` |

Playwright CLI fija una dependencia de Playwright con versión alpha; se conserva la combinación publicada por su autor en el lockfile. El instalador, la skill y el motor de Impeccable tienen versiones distintas; no confundirlas. Las actualizaciones son una tarea explícita y requieren revisar los cambios generados, especialmente porque el instalador de Impeccable descarga su payload de skills por separado.

Las licencias originales se conservan como `LICENSE` dentro de cada skill. En IMG to 3D se movió el campo superior `version` a `metadata.version` para que su encabezado pase el validador de Codex; no se modificó su flujo de reconstrucción. Las adaptaciones de uso local están en `AGENTS.md` y en esta guía.

## Comprobaciones de instalación

- Las cinco skills pasan el validador oficial `quick_validate.py`.
- Los 23 tests originales de estado de IMG to 3D (`test_workflow_state.py`) pasan en el Python de este equipo. No se ha generado todavía un modelo 3D de PopoWash.
- Playwright abre la página local en Chrome sin ventana visible y obtiene su título y estructura. La página registra un 404 por `favicon.ico`, anterior a cualquier cambio web de esta instalación.
- El lanzador de Impeccable ejecuta su motor. Esto comprueba la instalación; no equivale a una auditoría visual de las páginas.
- `pnpm install --frozen-lockfile --ignore-scripts` reproduce correctamente las dependencias en este equipo.

`node_modules/`, binarios de Impeccable, sesiones de Playwright, cachés Python y archivos temporales se excluyen de Git. Se comparten las skills, licencias, esta guía, las reglas del proyecto y los archivos de dependencias. Commit y push requieren la revisión y aprobación acordadas en `AGENTS.md`.
