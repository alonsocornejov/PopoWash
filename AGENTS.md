# Acuerdo de contexto de PopoWash

- Para el flujo compartido de inicio y cierre, usa la skill `contexto-proyecto` en `.agents/skills/contexto-proyecto/` cuando se invoque o cuando el usuario pida ponerse al día o cerrar trabajo.
- El estado vigente del proyecto está en `docs/CONTEXTO.md`; las decisiones y trabajos cerrados están en `docs/tareas/`. Lee solo lo relevante para la tarea.
- Alonso y Gabo usan cuentas de Git distintas. No deduzcas quién trabajó a partir de la cuenta de Codex: usa la persona indicada por el usuario y distingue trabajo humano de apoyo de Codex.
- No hagas commit ni push de notas o cambios de trabajo al cerrar una tarea hasta que el usuario revise el resumen y diga `APROBADO, SUBE A GIT`.

## Skills de diseño y revisión

- Las skills compartidas viven en `.agents/skills/`. Consulta `docs/SKILLS.md` para sus usos, versiones y preparación en otro equipo.
- Usa `design-taste-frontend` para dirección visual y composición de landing pages; `impeccable` para sus comandos de diseño, auditoría y refinamiento. Si ambas aplican, toma el encargo y la identidad vigente como criterio; no acumules reglas estéticas contradictorias.
- Usa `awesome-design-md` al consultar o comparar referencias de marcas, `playwright-cli` al verificar la web en un navegador, e `img2threejs` cuando se pida reconstruir en 3D un objeto de una imagen.
- PopoWash usa HTML/CSS/JavaScript sin framework. Aplica las skills a esta estructura; una recomendación genérica de React, Tailwind o animaciones no justifica migrar el proyecto.
- Las herramientas Node se instalan localmente con `pnpm install --frozen-lockfile`. Ejecuta `pnpm exec playwright-cli` o `pnpm exec impeccable`; en PowerShell también existen `node_modules/.bin/playwright-cli.cmd` e `impeccable.cmd`. Los ejemplos de las skills que usan comandos globales deben adaptarse a esta instalación.
- IMG to 3D requiere Python 3.10 o superior. Resuelve sus scripts desde `.agents/skills/img2threejs/` y guarda los entregables fuera de esa carpeta. Si los ejecutables no están en PATH, usa los runtimes disponibles del entorno; no asumas rutas de otro computador.
