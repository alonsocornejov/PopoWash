# Web 4: versión integrada, identidad y siguientes pasos

- **Responsable humano:** Alonso, quien definió los ajustes y autorizó publicar esta versión el 13 de octubre de 2026.
- **Aporte de Gabo:** CTA final, animación del durazno y diseño del footer, tomados de `codex/opcion-4-cta` en `de1a2a3`. Integración parcial: no se incorporaron sus otras secciones ni los modelos 3D de branding.
- **Apoyo de Codex:** implementación, integración selectiva, exportación de recursos, documentación y comprobaciones.
- **Base publicada anterior:** `eb05ecc`. La instalación en tres pasos ya estaba publicada en esa base y se conservó.
- **Publicación autorizada:** en `main`, con este resumen y los pendientes indicados por Alonso. Sin desplegar un checkout real ni procesar pedidos.

## Resumen de lo realizado

1. Se aplicó el parche de hero, beneficios y compra conservando los cambios locales. Se retiró la franja inferior del hero y se agregó la sección «PopoWash es la solución.» entre campaña e instalación, con modos posterior/frontal y sus reglas de uso.
2. El hero pasó a usar producto transparente sobre un degradado CSS. Se corrigieron los pictogramas tomando fotos reales como referencia y se limpiaron bordes y ranuras. Las fuentes servidas son de 1200 y 1589 px; los trazos son una reconstrucción y no una copia exacta del arte impreso. Se conservaron los originales para futuras mejoras.
3. El primer bloque de compra usa «Compra tu PopoWash.», descripción y viñetas revisadas, selector −/+, total reactivo y «Lo quiero →». Su fotografía independiente se presenta en tarjeta cuadrada crema con borde y sombra cálida. La calidad de esta foto sigue pendiente.
4. El FAQ contiene ocho preguntas en el orden indicado por Alonso: compatibilidad, instalación, caja, electricidad, temperatura, papel, limpieza y despacho. Las preguntas usan DM Sans 400, sin mayúsculas forzadas. Se retiró `faq-condiciones` y se conservó el popup del video.
5. Se añadieron al final de CSS las reglas «Dimensiones: una vista por sección». Las secciones de escritorio caben bajo el header de 81 px, sin estirar las que ya eran menores. Se compactaron espacios en campaña, FAQ y calculadora; se corrigió la altura de verdad y se añadieron límites para pantallas anchas/bajas. Móvil, marquee y reseñas mantienen su altura.
6. Se integraron únicamente el CTA final y footer de Gabo con sus tres recursos multimedia. El CTA incluye título «Tu poto ya esperó suficiente.», animación, cantidad, total e instalación opcional en Santiago. Sus IDs y estilos se aislaron para conservar el bloque de compra inicial; ambos alimentan la bolsa compartida.
7. El footer tiene tres columnas, con enlaces reales a Despacho, Compatibilidad, Instalación y FAQ. Políticas/contacto siguen como texto pendiente; WhatsApp e Instagram están desactivados mientras se configure su destino. Alonso confirmó que la cuenta de Instagram ya está creada.
8. Se instaló el logo nuevo suministrado por Alonso en header y sobre las columnas del footer. Se conservó el PNG original de 1080 × 1080 y se exportaron WebP transparentes de 447 × 88 y 346 × 68, como máximo al doble del tamaño visual. Los iconos de 32 y 180 px usan la W azul. El logo anterior se conserva; los logos impresos en fotos del producto no se editaron.
9. Se regeneró `propuestas.html` con `scripts/update-principal.py`, conservando las otras propuestas del comparador.

## Comprobaciones

- Dimensiones comprobadas en 1920×1080, 1440×900, 1366×768 y 1024×768, más la combinación ancha/baja 1920×768. Exceso final cero en las secciones verificadas. Los acordeones se midieron cerrados y pueden crecer al abrirse.
- CTA integrado: 631,8 px a 1440×900, 626,3 px a 1366×768 y 600,7 px a 1024×768; permanece dentro de la vista disponible.
- A 390×844: sin desbordamiento horizontal, logo sin deformación y navegación de 72 px; escritorio conserva navegación de 80 px, más su borde.
- Cantidad y total del primer bloque funcionan; el selector del CTA final no cambia sus valores. Con dos productos e instalación, el CTA calcula $109.980; sumar una unidad desde el primer bloque conserva el cargo de instalación y totaliza $149.970.
- Acordeones, rotación del +, enlaces de compatibilidad y video verificados. Cerrar el popup elimina el iframe. La animación del CTA se reproduce al verse, se pausa al salir y muestra imagen fija con movimiento reducido.
- Foto de instalación centrada respecto del texto, con diferencia inferior a 0,01 px en las vistas de escritorio comprobadas.
- Sin IDs duplicados, anclas rotas ni errores de consola en las pruebas. Favicon e icono Apple responden correctamente con dimensiones 32×32 y 180×180.
- Se comprobó que las demás secciones, los archivos originales de CSS/dimensiones y las otras propuestas del comparador se conservaron. No se incluyeron cambios ajenos de marketing, branding experimental, documentos o herramientas locales.

## Siguientes tareas, en el orden indicado por Alonso

1. Mejorar la foto del primer CTA/bloque de compra (`#producto`).
2. Pensar cómo mejorar «PopoWash es la solución.» (`#beneficios`).
3. Mejorar las conexiones y transiciones entre las secciones de la página.
4. Hacer que el icono de Instagram lleve a la cuenta ya creada, incorporando su URL real.
5. Crear el documento de chequeo de compatibilidad.
6. Cuando exista el documento, ajustar los enlaces para que lleven al destino adecuado.
7. Agregar el icono de carrito y desarrollar las secciones de compra; definir el siguiente entregable comercial.

Estas prioridades se incorporan al [registro de pendientes](../PENDIENTES-WEB4.md). La bolsa sigue siendo una demostración: faltan el flujo comercial, contacto/WhatsApp, políticas y condiciones definitivas.
