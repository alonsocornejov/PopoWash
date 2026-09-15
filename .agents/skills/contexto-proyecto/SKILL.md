---
name: contexto-proyecto
description: Ponerse al día con PopoWash desde Git y sus notas, o cerrar una tarea con un resumen Markdown revisable. Usar al pedir «PONME AL DÍA», «CERREMOS LA TAREA» o al invocar $contexto-proyecto.
---

# Contexto compartido de PopoWash

Esta skill tiene dos modos. La persona debe indicar Alonso, Gabo o ambos; si no está clara, pregunta antes de atribuir el trabajo.

## Inicio: `PONME AL DÍA — Alonso/Gabo`

1. Desde la raíz del repositorio, comprueba rama, estado local y remoto. Haz `git fetch` para conocer los cambios publicados.
2. Si la rama puede actualizarse sin sobrescribir cambios locales, haz `git pull --ff-only`. Si hay modificaciones locales, divergencia, conflicto o falla la conexión, explica el estado y no fuerces la actualización. No uses stash automático.
3. Lee `docs/CONTEXTO.md` y solo las notas de `docs/tareas/` pertinentes. Revisa los archivos del proyecto necesarios para la tarea indicada; no cargues todo el historial.
4. Da un resumen breve del estado, las decisiones pertinentes, los pendientes y cualquier limitación de sincronización. Si el usuario ya indicó una tarea, comienza a trabajar tras el resumen.

## Cierre: `CERREMOS LA TAREA — Alonso/Gabo`

1. Comprueba los cambios reales y las pruebas realizadas. Redacta o actualiza una nota en `docs/tareas/AAAA-MM-DD-tema.md` si el trabajo deja decisiones, entregables o contexto útil. No crees una nota nueva para cambios triviales que una nota existente puede cubrir.
2. La nota debe identificar responsable humano (Alonso, Gabo o ambos), fecha, objetivo, resultado, justificación de decisiones importantes, pruebas con su resultado, entregables y pendientes. Señala el apoyo de Codex sin atribuirle autoría humana. Distingue hechos comprobados de ideas pendientes.
3. Enlaza los entregables finales con rutas relativas si están dentro del repositorio. Para archivos externos usa solo enlaces estables e indica dónde se guardan. No enlaces temporales ni prometas disponibilidad en otro equipo si el archivo no se sincronizó. Si un audiovisual es demasiado grande para Git, deja el enlace externo y no lo añadas al repositorio por defecto.
4. Actualiza `docs/CONTEXTO.md` solo cuando cambie el estado vigente. Mantenlo corto, con enlaces a las notas relevantes, sin copiar el diario de tareas.
5. Muestra al usuario el texto completo de la nota, los cambios de `CONTEXTO.md` y los archivos que se propone incluir en el commit. Espera su revisión. No hagas commit ni push en esta etapa.

## Publicación: `APROBADO, SUBE A GIT`

Incorpora las correcciones aprobadas. Verifica estado de Git, enlaces y archivos incluidos. Añade al commit solo los cambios revisados; no incluyas archivos ajenos o secretos. Haz commit con un mensaje descriptivo y push a la rama acordada. Si Git rechaza el push, explica qué quedó local y no fuerces la operación. Reporta rama y commit al terminar.
