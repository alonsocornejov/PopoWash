# Web 4 · compatibilidad, demostración, kit y carrito

- Fecha: 13 de octubre de 2026.
- Responsable humano: Alonso. Implementación y comprobaciones con apoyo de Codex.
- Base: main, versión publicada anterior 755962b.
- Estado: versión visual revisada por Alonso, quien autorizó publicar en main para revisión de Gabo. El pago real sigue fuera de alcance.

## Resultado aprobado

1. Guía de compatibilidad en un único popup: fotos de WC con estanque visible/oculto y ejemplo real instalado. Sin la foto humorística ni fuentes visibles. CTA, Paso 0, carrito y footer abren la guía. El FAQ «¿Le sirve a mi inodoro?» despliega explicación y debajo su enlace; «¿La instalación es complicada?» conserva su respuesta y abre el video existente.
2. Instagram del footer enlaza a https://www.instagram.com/popowash.cl/. WhatsApp queda pendiente, como pidió Alonso.
3. «PopoWash es la solución» incorpora el video proporcionado por Alonso. Recorte de 4,2 a 14,5 segundos del original, sin pista de audio, loop automático a 1,2×. Posterior corresponde al primer chorro y Frontal al segundo, confirmado por Alonso. Los nombres permiten saltar a cada fragmento; el color sigue el tiempo del video.
4. Foto del primer CTA sustituida por el kit organizado. Versión final v4 aprobada después de usar la referencia frontal para corregir el bidet; accesorios separados y fondo uniforme. Es una recreación asistida por IA, no una nueva fotografía real. Se conserva PNG fuente y WebP servido.
5. Carrito de producto único: icono y contador en header; ambos CTA abren cantidad, total, instalación opcional y selección visual Webpay/Mercado Pago. Seleccionar otra cantidad reemplaza la selección, sin acumular compras separadas. «Continuar al pago» muestra una vista previa explicativa; no crea pedido, solicita tarjeta ni cobra. La selección se conserva durante la navegación de la página.
6. Comparador `propuestas.html` regenerado con Web 4 vigente.

## Verificación

- 1440px y 390px: fotos y logos cargan, sin desbordamiento horizontal; guía cierra con ×/Esc; los accesos abren el popup y cerrar el video retira el iframe.
- Demostración: reproducción automática a 1,2× comprobada; el loop vuelve al comienzo, solo pista de video. Se verificó el resaltado durante reproducción y saltos; la sección a 1440×900 mide 755px, bajo los 819px disponibles.
- Carrito: 3 unidades = $119.970; 2 unidades con instalación = $109.980. Cantidad cero se rechaza, máximo 10, cierre y reapertura conservan selección, compatibilidad sigue accesible. Sin errores de JavaScript en las pruebas del flujo.
- `git diff --check` y referencias locales revisadas antes de publicar.

## Entregables

- [Página](../../opcion-4/index.html), [estilos](../../opcion-4/styles.css), [interacciones](../../opcion-4/app.js), [carrito](../../opcion-4/cart.js).
- [Kit aprobado PNG](../../opcion-4/assets/kit-popowash-estudio-v4.png) y [WebP](../../opcion-4/assets/kit-popowash-estudio-v4.webp).
- [Loop real de lavado](../../opcion-4/assets/modos-lavado-loop.mp4) y [poster](../../opcion-4/assets/modos-lavado-poster.jpg).

## Pendientes para habilitar venta real

- Fabián debe validar medidas, conexiones, adaptadores y alternativas de compatibilidad; la guía no certifica modelos concretos. Las imágenes de WC son referencias de DeerValley e Ijaro Ceramic: autorizar o sustituir antes del lanzamiento comercial. Fuentes: https://www.deervalleybath.com/products/deervalley-dv-2f0078-1-6-gpf-elongated-floor-mounted-two-piece-toilet-seat-included-1 y https://www.ijaroceramic.com/sanitaryware. La foto instalada procede del material disponible del proyecto.
- Definir pasarela y cuenta comercial, servidor para pedidos/cobros, datos de entrega, costos/plazos, disponibilidad y condiciones comerciales. Los logos de pago son ejemplos, no medios habilitados.
- Incorporar reseñas reales autorizadas, políticas, número de WhatsApp y validación final del contenido del kit.
- Revisar con Gabo esta versión visual. No se enviaron mensajes a Gabo desde Codex.

## Ajuste de textos aprobado por Alonso

Posterior: «Agua para limpiar el poto después de ir al baño. Después, un poco de papel para secar.» Se retiran los segundos y la indicación de presión. Frontal: «Un chorro suave para limpiar la zona íntima femenina.» Se mantiene «Solo uso externo». «Una perilla. Dos modos. Cada uno para su zona.» queda centrado directamente encima del bloque de modos. Alonso autorizó publicar el ajuste en main.

## Ajustes de reproducción móvil y banner aprobados

Alonso autorizó publicar el recorte con velocidad incorporada al archivo: chorros a 1,5× y resto a 1,2×; duración final 7,63 segundos. Se actualizan los momentos de resaltado. Ambos videos fijan silencio y reproducción dentro de la página, reintentan al entrar en pantalla/cargar y ofrecen botón si el navegador bloquea autoplay. El CTA tiene poster; se conserva imagen fija con reducción de movimiento. Pruebas a 390px: ambos videos avanzan, respaldo visible y recuperación con toque ante bloqueo simulado, sin errores de JavaScript. No se garantiza autoplay bajo restricciones del dispositivo; falta prueba en teléfono físico.

La franja lima usa dos grupos idénticos con separación final incluida y duración ajustada para conservar velocidad. Verificada a 390, 1440 y 1920px: grupos de igual ancho, sin hueco ni desbordamiento y continuidad en el reinicio. Comparador regenerado. No se incluyen otros cambios locales del proyecto.

## Instalación adaptada a móvil

Alonso aprobó y autorizó publicar la vista móvil de instalación: Paso 0 antes de los pasos, cada explicación con su foto visible debajo y sin rotación automática. A partir de 768px se conserva el selector y foto dinámica actuales. Comprobado a 390px: tres fotos cargadas, Paso 0 anterior, sin rotación ni desbordamiento; a 1440px: rotación y selección manual funcionan, imágenes móviles ocultas. Sin errores de JavaScript.
