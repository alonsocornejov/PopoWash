# Opción 4 · CTA con durazno animado y pie de página

- **Responsable humano:** Gabo. Decidió el concepto, el personaje, los textos, los colores, las versiones aprobadas y el alcance.
- **Apoyo:** Claude (IA): propuestas visuales, modelado 3D procedural, animación, integración HTML/CSS/JS y comprobaciones.
- **Fecha:** 13 de octubre de 2026.
- **Rama:** `codex/opcion-4-cta`, creada desde `codex/opcion-4-problema`. Alonso la integrará después.
- **Publicación:** autorizada explícitamente por Gabo al cerrar esta tarea.

## Objetivo y resultado

Mejorar el penúltimo apartado de Opción 4, el CTA final, y rehacer el pie de página. El resto de las secciones no cambia.

### CTA final

- Fondo azul oscuro `#14265c`. Título «Tu poto ya / esperó suficiente.» y bajada «Regálate un PopoWash.». Se retiró la lista de tres datos.
- A la izquierda va la animación del durazno PopoWash, de 10 s y en bucle. Se reproduce solo cuando el CTA está en pantalla y hace una pausa de 2,5 s entre vueltas. Plano fijo, sin zoom.
  1. Espera impaciente y oloroso.
  2. Salta al inodoro y gira la perilla.
  3. Recibe el chorro y queda limpio.
  4. Sale corriendo.
- La animación es decorativa (`aria-hidden`), no tiene sonido ni botones y no tapa la ficha de compra. Si el equipo tiene activado «reducir movimiento», se muestra una imagen fija.
- La ficha de compra es más compacta: cantidad, total de $39.990 y un botón «Comprar PopoWash ↗» más grande.
- La instalación queda oculta en el desplegable «¿Quieres que te lo instalemos?», con la casilla de +$15.000 en Santiago, porque el dueño prefiere vender sin instalación. La bolsa muestra si se eligió instalación y el total.
- La nota de compatibilidad es texto discreto, no una caja negra, y enlaza al FAQ.
- Peso: MP4 de unos 300 KB y WebM de unos 470 KB, más una imagen fija de 32 KB. La página no carga Three.js.

### Pie de página

- Fondo de blanco cálido `#f8f7f2`, igual al encabezado. Se eligió la prueba 4 entre las variantes en JPG.
- **Enlaces:**
  1. Política de privacidad
  2. Términos y condiciones
  3. Política de envíos
  4. Cambios y devoluciones
  5. Política de reembolso
  6. Garantías
  7. Información de contacto
  8. Cómo instalar tu PopoWash
  9. Preguntas frecuentes
- **Escríbenos:** «Si te quedan dudas, escribe a nuestro WhatsApp.» y una caja de mensaje. Al enviar, abre `wa.me` solo cuando `data-whatsapp` tenga un número.
- **Síguenos:** Instagram.
- Barra inferior: «© 2026 PopoWash» y «Requiere tapa y asiento desmontables.».

### Personaje de marca

Se creó un durazno con poto en estilo rubber hose genérico. Es un personaje original que no copia a Betty Boop, Cuphead ni otros personajes protegidos. Gabo eligió las caras 1, 2 y 4.

Recursos en `branding/personaje-durazno/`:

- Modelos GLB animables de las tres caras.
- Visor.
- Hojas de poses: sentado, acostado, saltando, saludando, nadando, oloroso y oliendo bien.
- GIF de baile, oloroso y oliendo bien.
- Videos del CTA.
- Código fuente de la animación en `animacion-cta/fuente/`.

## Comprobaciones

- Revisión visual del CTA y del pie en escritorio y móvil. Sin desborde horizontal y con la ficha legible.
- La animación arranca al entrar en pantalla, se pausa al salir y vuelve a empezar tras la pausa. Con «reducir movimiento» se ve la imagen fija.
- Se comprobó el total con cantidad e instalación, tanto en la ficha como en la bolsa.
- El fondo del pie mide `#F8F7F2` en píxeles, igual al encabezado.
- El MP4 es H.264 de 720 × 540 y 10 s. El WebM es VP9 de respaldo, porque algunos navegadores no reproducen H.264.
- Los archivos de la carpeta de Gabo se compararon por md5 con las versiones finales.

## Pendientes

- Definir el destino de los 9 enlaces del pie. Hoy están marcados con `data-link-pendiente` y no navegan.
- Agregar el número de WhatsApp en `data-whatsapp` y la URL real de Instagram.
- Confirmar si el enlace «Garantías» se mantiene, porque contradice la decisión de no mencionar garantías en la principal.
- Al combinar con otras ramas, regenerar `propuestas.html` con `scripts/update-principal.py`.
- Siguen pendientes las reseñas reales, el gasto en papel, solución y pasos, y la revisión final de textos e imágenes, según [PENDIENTES-WEB4.md](../PENDIENTES-WEB4.md).

## Archivos de este commit

1. `opcion-4/index.html`
2. `opcion-4/styles.css`
3. `opcion-4/app.js`
4. `opcion-4/assets/popowash-cta.mp4`
5. `opcion-4/assets/popowash-cta.webm`
6. `opcion-4/assets/popowash-cta-poster.jpg`
7. `propuestas.html`
8. `docs/CONTEXTO.md`
9. `docs/PENDIENTES-WEB4.md`
10. `docs/tareas/2026-10-13-opcion-4-cta-pie-gabo.md`
11. `branding/personaje-durazno/`, con los modelos, GIF, poses, visor, videos del CTA, maqueta y `animacion-cta/fuente/`.

No se incluyen `tmp/`, `node_modules/`, los cuadros PNG del render ni las pruebas descartadas.
