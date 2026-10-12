# Opción 4 · rama de Problema

- **Responsable humano:** Gabo.
- **Apoyo:** Codex, ejecución y comprobación.
- **Fecha:** 12 de octubre de 2026.
- **Rama:** `codex/opcion-4-problema`, creada desde `main` en `874f24e`.
- **Publicación:** autorizada explícitamente por Gabo al cerrar esta tarea.

## Objetivo y resultado

Modificar exclusivamente la sección 2 «Problema» y conservar el resto de Opción 4 para poder combinar este trabajo con la rama del FAQ.

- Se sustituyó el banner con bóxer por una montaña de papel sola. La imagen final tiene luz blanca neutra, fondo negro y dos bloques lima recuperados del concepto inicial.
- La montaña queda a la izquierda, ampliada e integrada mediante bordes difuminados; se desplazó un poco más a la izquierda para separarla del texto manteniendo margen.
- «Seamos sinceros» queda sobre el título, sin cápsula y en blanco. Título: «El papel no limpia», con «NO LIMPIA» en lima.
- Bajada elegida: «PopoWash sí. En vez de frotar, restregar y repetir, limpia con agua justo donde más lo necesitas».
- Pregunta inferior: «Si no te limpias las manos con papel, ¿por qué tu poto sí?». Mantiene el lima y cabe en una línea en escritorio; se adapta al ancho móvil.
- Se aumentó la presencia de la sección, equilibrando imagen, título y textos. El comparador se regeneró.

## Entregables

[Landing](../../opcion-4/index.html), [estilos](../../opcion-4/styles.css), [comparador](../../propuestas.html), [imagen JPG](../../opcion-4/assets/problema-montana-papel-luz-neutra.jpg), [PNG independiente](../../opcion-4/assets/problema-montana-papel-luz-neutra.png) y [prompt](../../opcion-4/assets/PROMPT-problema-montana-luz-neutra.md). Imagen final generada/editada con ImageGen, 1536 × 1024 px. La montaña es un recurso publicitario.

## Comprobaciones

- Revisión en navegador de escritorio a aproximadamente 1101, 1280 y 1920 px, y móvil de 390 px. Sin desborde horizontal. Colores finales comprobados; pregunta completa en una línea en escritorio y con salto normal en móvil.
- Al cerrar, comparación con la base: contenido fuera de Problema idéntico, incluido FAQ; las otras cuatro propuestas del comparador permanecen idénticas. `git diff --check` pasa.
- Auditoría de skills frente a `origin/main`: las 86 skills del proyecto y sus 895 archivos portables ya existen en GitHub, sin diferencias ni archivos faltantes. No se duplican skills ni se incluyen cachés o binarios locales.

## Pendientes e integración

Gabo y su socio deben revisar la versión combinada cuando integren sus ramas. Guardar primero el trabajo del FAQ con un commit, traer esta rama y resolver solo los conflictos que Git indique. El comparador `propuestas.html` debe regenerarse con `scripts/update-principal.py` después de combinar HTML y CSS. No se integra esta variante en `main` en este cierre.

Solución, paso a paso, CTA, testimonios reales, gasto en papel y revisión final de textos/imágenes siguen pendientes según [PENDIENTES-WEB4.md](../PENDIENTES-WEB4.md).

## Archivos de este commit

1. `opcion-4/index.html`
2. `opcion-4/styles.css`
3. `propuestas.html`
4. `opcion-4/assets/problema-montana-papel-luz-neutra.jpg`
5. `opcion-4/assets/problema-montana-papel-luz-neutra.png`
6. `opcion-4/assets/PROMPT-problema-montana-luz-neutra.md`
7. `docs/CONTEXTO.md`
8. `docs/tareas/2026-10-12-opcion-4-problema-rama-gabo.md`

No se incluyen borradores descartados ni experimentos del 3D. La revisión de skills no requiere archivos adicionales porque todas las compartidas ya están publicadas.
