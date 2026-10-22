# CTA, FAQ e instalación · Gabo

- Fecha: 21 de octubre de 2026, America/Santiago.
- Responsable humano: Gabo. Apoyo de Codex: implementación, actualización documental, integración local y comprobaciones. La autoría previa de Alonso y del personaje creado con apoyo de Claude se conserva en sus cierres.
- Rama: `rama-cambios-21.10.2026`, creada desde main actualizado a `59924cf`.
- Publicación: commit y push autorizados expresamente por Gabo al terminar la sesión; sin merge a main.

## Cambios aprobados

1. Conservar «Tu poto ya esperó suficiente.» en el CTA y sustituir «Regálate un PopoWash» por «Siéntete limpio, siéntete cómodo. Siéntate en un Popowash.».
2. Agregar «¿Sirve para niños?» al FAQ con esta respuesta: «Sí. PopoWash puede ayudar en esa etapa en que todavía están aprendiendo a limpiarse después de ir al baño. Recomendamos que un adulto les enseñe a regular la presión y a dejar la perilla en OFF al terminar.» Es el texto aprobado por Gabo; no se añadió el remate humorístico ni supervisión permanente.
3. Actualizar la instalación opcional en Santiago a $25.000 CLP por unidad en CTA, carrito, comparador, memoria IA, mapa, guía, pendientes y cuaderno editable. El bidet conserva $39.990; despacho separado. El costo interno histórico del producto de $15.000 es un concepto distinto y no se cambia. Agenda, cobertura y responsable siguen pendientes.
4. Incorporar el paquete documental de marca y sus ajustes locales del 17 de octubre, los 20 recursos originales del personaje y el cierre histórico del CTA. Ver [detalle de integración](2026-10-21-integracion-principal-gabo.md). Las notas históricas de precios conservan el registro original con aclaración del nuevo valor.

## Comprobaciones

- Comparador regenerado con `scripts/update-principal.py`.
- Sintaxis de app.js y cart.js comprobada.
- Navegador: una unidad con instalación suma $64.990; dos suman $129.980; dos sin instalación suman $79.980.
- FAQ visible en escritorio y a 390 px, sin desbordamiento horizontal; el texto termina exactamente en «OFF al terminar.».
- Los 20 recursos del personaje coinciden con la rama original; enlaces del paquete documental revisados y git diff --check ejecutado.

## Exclusiones y continuación

- No se incluyen respaldos, capturas temporales, propuestas de diseño descartadas, auditorías antiguas, carruseles, portadas, videos fuente ajenos, experimentos 3D, entregables, node_modules ni output.
- Las nuevas animaciones de Popin las prepara Alonso; no se incluyen ni se reemplaza ese trabajo.
- «Queremos cambiar la cultura del baño» se discutió en el chat, pero no se implementó.
- Alonso debe revisar e integrar esta rama conservando sus avances. El ecommerce sigue siendo una demostración sin cobros. Marca/producto mantienen las validaciones pendientes descritas en sus documentos.

## Entregables

- [Opción 4](../../opcion-4/index.html), [carrito](../../opcion-4/cart.js) y [comparador](../../propuestas.html).
- [Guía del equipo](../marketing/Popo-Wash-guia-equipo-v1.md), [mapa](../marketing/Popo-Wash-mapa-de-marca-v1.md), [pendientes](../marketing/Popo-Wash-pendientes-v1.md), [cuaderno completado](../marketing/Popo-Wash-cuaderno-completado-v1.html) y [memoria IA](../../.agents/product-marketing.md).
- [Visor del personaje](../../branding/personaje-durazno/visor-durazno.html) y sus recursos originales.
