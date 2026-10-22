# Acuerdo de contexto de PopoWash

- Para el flujo compartido de inicio y cierre, usa la skill `contexto-proyecto` en `.agents/skills/contexto-proyecto/` cuando se invoque o cuando el usuario pida ponerse al día o cerrar trabajo.
- El estado vigente del proyecto está en `docs/CONTEXTO.md`; las decisiones y trabajos cerrados están en `docs/tareas/`. Al ponerse al día, cubre todos los cambios desde la referencia indicada por el usuario o, por defecto, desde su último cierre publicado; declara el período y no te limites al último día. Revisa también todas las ramas remotas con trabajo pendiente de integrar y lee sus notas desde Git si la copia local está atrasada. Distingue lo integrado, lo publicado en otra rama y lo local. Lee solo lo relevante para la tarea.
- Web 4 usa `main` como base compartida. Para mejorar una sección, crea una rama `codex/` desde `main` actualizada; limita los cambios a esa sección. Al integrar, conserva el trabajo de las otras secciones y regenera `propuestas.html` con `scripts/update-principal.py`.
- Para tareas de marca/marketing y al ponerse al día, consulta la [memoria IA](.agents/product-marketing.md) y los [pendientes de marca P01–P26](docs/marketing/Popo-Wash-pendientes-v1.md); para revisión humana usa la [guía de Gabo y Alonso](docs/marketing/Popo-Wash-guia-equipo-v1.md). Están acordados con Gabo y pendientes de revisión de Alonso y validación final de Fabián.
- Alonso y Gabo usan cuentas de Git distintas. No deduzcas quién trabajó a partir de la cuenta de Codex: usa la persona indicada por el usuario y distingue trabajo humano de apoyo de Codex.
- No hagas commit ni push de notas o cambios de trabajo al cerrar una tarea hasta que el usuario revise el resumen y diga `APROBADO, SUBE A GIT`.

## Skills de diseño y revisión

- Las skills compartidas viven en `.agents/skills/`. Consulta `docs/SKILLS.md` para sus usos, versiones y preparación en otro equipo.
- Usa `design-taste-frontend` para dirección visual y composición de landing pages; `impeccable` para sus comandos de diseño, auditoría y refinamiento. Si ambas aplican, toma el encargo y la identidad vigente como criterio; no acumules reglas estéticas contradictorias.
- Usa `awesome-design-md` al consultar o comparar referencias de marcas, `playwright-cli` al verificar la web en un navegador, e `img2threejs` cuando se pida reconstruir en 3D un objeto de una imagen.
- PopoWash usa HTML/CSS/JavaScript sin framework. Aplica las skills a esta estructura; una recomendación genérica de React, Tailwind o animaciones no justifica migrar el proyecto.
- Las herramientas Node se instalan localmente con `pnpm install --frozen-lockfile`. Ejecuta `pnpm exec playwright-cli` o `pnpm exec impeccable`; en PowerShell también existen `node_modules/.bin/playwright-cli.cmd` e `impeccable.cmd`. Los ejemplos de las skills que usan comandos globales deben adaptarse a esta instalación.
- IMG to 3D requiere Python 3.10 o superior. Resuelve sus scripts desde `.agents/skills/img2threejs/` y guarda los entregables fuera de esa carpeta. Si los ejecutables no están en PATH, usa los runtimes disponibles del entorno; no asumas rutas de otro computador.
