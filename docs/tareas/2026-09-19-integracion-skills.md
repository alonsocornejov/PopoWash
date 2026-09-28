# Integración de skills e inclusión de la opción 4

- **Responsable humano:** Gabo
- **Fecha:** 2026-09-19
- **Apoyo:** Codex realizó la instalación, adaptación y verificación técnica; no se atribuye autoría humana a Codex.

## Objetivo

Incorporar Taste, Impeccable, Playwright CLI, Awesome Design MD e IMG to 3D, e incluir la opción 4 en la publicación para que Alonso y Gabo puedan revisarla y trabajar con ella desde GitHub.

## Resultado comprobado

Se añadieron cinco skills bajo `.agents/skills/`:

- `design-taste-frontend`: dirección visual anti-plantilla para landing pages.
- `impeccable`: comandos de diseño, auditoría y refinamiento de interfaces.
- `playwright-cli`: automatización y comprobación de páginas en navegador.
- `awesome-design-md`: adaptador local para consultar 74 referencias `DESIGN.md` de VoltAgent.
- `img2threejs`: reconstrucción procedural de objetos desde imágenes con Three.js y un flujo de calidad por etapas.

Awesome Design MD no contiene una skill ejecutable en su repositorio; se creó un adaptador local y se conservaron sus referencias y licencia. IMG to 3D se integró como copia del núcleo original. Su campo `version` del frontmatter se movió a `metadata.version` para cumplir el formato de skills de Codex, sin modificar el flujo de la herramienta.

Se añadieron `package.json`, `pnpm-lock.yaml` y `pnpm-workspace.yaml` para reproducir Playwright e Impeccable. Se actualizaron `.gitignore`, `AGENTS.md` y `docs/CONTEXTO.md`. La guía de uso y preparación está en [`docs/SKILLS.md`](../SKILLS.md).

Las páginas existentes (`index.html`, `opcion-2/index.html`, `opcion-3/index.html`) y `branding/` no fueron modificadas por esta integración.

Por indicación de Gabo, se incluye también [`opcion-4/`](../../opcion-4/index.html) completa: 43 archivos (aproximadamente 15 MB), con HTML, CSS, JavaScript, imágenes PNG/WebP, fuentes Manrope y su licencia, además de especificaciones y evidencias del trabajo 3D en preparación. Se añadió su enlace al [README](../../README.md). El material de `model/` no es un modelo 3D terminado ni está integrado a la página como tal. Se normalizaron las rutas absolutas de dos documentos JSON para que apunten a archivos del repositorio desde su raíz. Esta nota registra su inclusión y preparación para compartir; no atribuye la creación original de la opción 4.

## Decisiones

- Las skills compartidas viven en `.agents/skills/`, junto a `contexto-proyecto`.
- Las dependencias locales, sesiones de navegador, binarios y temporales se excluyen de Git.
- No se instalaron hooks automáticos de Impeccable.
- No se instalaron plugins opcionales de IMG to 3D ni una dependencia Three.js dentro del proyecto; se incorporarán cuando un entregable 3D concreto lo requiera.
- El catálogo de referencias externas se consulta de forma selectiva y no impone automáticamente la identidad de una marca a PopoWash.
- La opción 4 y sus recursos se incluyen en esta misma publicación; no queda excluida como trabajo solo local. Se mantienen las ubicaciones de configuración y herramientas en la raíz para conservar los comandos documentados.

## Pruebas

- Las cinco skills pasaron el validador oficial `quick_validate.py`.
- Los 23 tests de `img2threejs/forge/tests/test_workflow_state.py` pasaron.
- Playwright abrió la página local y obtuvo el título `PopoWash — Tu poto merece estar limpio`. Registró un 404 de `favicon.ico`, preexistente y sin relación con esta instalación.
- El lanzador de Impeccable ejecutó su motor.
- `pnpm install --frozen-lockfile --ignore-scripts` terminó correctamente.
- `git diff --check` no detectó errores de espacios.
- Para incluir la opción 4, se verificaron la sintaxis de `app.js`, los JSON del modelo y la existencia de los recursos locales referenciados. No se realizó una nueva auditoría visual o funcional completa de esta propuesta.

## Entregables aprobados

- Skills y licencias en `.agents/skills/`.
- [`docs/SKILLS.md`](../SKILLS.md).
- `package.json`, `pnpm-lock.yaml` y `pnpm-workspace.yaml`.
- Cambios en `.gitignore`, `AGENTS.md` y `docs/CONTEXTO.md`.
- [`opcion-4/`](../../opcion-4/index.html) completa, incluidos `assets/` y `model/`, y su enlace en [`README.md`](../../README.md).
- Esta nota.

## Pendientes

- Probar una tarea real con cada skill cuando se defina el próximo trabajo de diseño.
- Completar y verificar el trabajo 3D cuando se retome; sus archivos actuales son material preparatorio.
- Confirmar precio, garantía, compatibilidad y contenido de la caja del producto.

## Estado de Git al cierre

Gabo revisó el resumen, pidió incluir la opción 4 completa y aprobó el commit y push con «Aprobado, sube a git». La publicación se realiza en `main`; el commit correspondiente queda registrado en el historial de este archivo. Dependencias, binarios y temporales locales están excluidos.
