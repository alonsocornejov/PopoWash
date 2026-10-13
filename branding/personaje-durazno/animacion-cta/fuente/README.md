# Código fuente · animación del durazno en el CTA

Animación de 10 s usada en el CTA de la Opción 4 (`opcion-4/assets/popowash-cta.mp4` y `.webm`). Personaje original PopoWash en estilo rubber hose; plano fijo de 720 × 540 a 20 fps, fondo `#14265c`.

## Archivos

- `personaje-durazno.js`: modelo 3D procedural del durazno (cuerpo con poto, caras, guantes, zapatos, partículas de olor y de limpieza).
- `escena-cta.js`: inodoro con PopoWash, chorro, línea de tiempo de la escena y cámara fija.
- `construir-pagina.py`: une ambos archivos en una página HTML.
- `renderizar-cuadros.cjs`: guarda cada cuadro como PNG.

## Secuencia

| Tiempo | Acción |
|---|---|
| 0–3 s | Cara 1 (impaciente), oloroso: golpea el pie, mira el reloj y hace «¿y?». |
| 3–4,5 s | Camina a la izquierda y salta al asiento (visto de lado). |
| 4,5–5,5 s | Gira la perilla del PopoWash; flecha lima marca el giro. |
| 5,5–7 s | Chorro exagerado, vuelta en el aire, el olor desaparece. |
| 7–8,5 s | Aterriza con rebote, destellos y burbujas, mira a cámara con la cara 4 y guiña. |
| 8,5–10 s | Sale corriendo a la derecha con estela y polvo. |

Los tiempos y posiciones están en la función `frame(t)` de `escena-cta.js`. Para la cara final 2 en vez de la 4, abrir la página con `?final=2`.

## Ver la animación

```
python construir-pagina.py
```
Abrir `animacion.html` desde un servidor local (por ejemplo `python -m http.server`), ya que usa módulos de JavaScript.

## Volver a generar el video

```
npm install three@0.169.0 playwright
npx playwright install chromium
python construir-pagina.py --local
node renderizar-cuadros.cjs
ffmpeg -framerate 20 -i cuadros/f%04d.png -vf format=yuv420p -c:v libx264 -profile:v main -crf 26 -preset slow -movflags +faststart -an popowash-cta.mp4
ffmpeg -framerate 20 -i cuadros/f%04d.png -c:v libvpx-vp9 -b:v 0 -crf 48 -row-mt 1 -an popowash-cta.webm
```

La imagen fija para «reducir movimiento» es el cuadro 159 (`cuadros/f0159.png`, t = 7,95 s), exportado como JPG. Copiar los tres archivos a `opcion-4/assets/` con los nombres `popowash-cta.mp4`, `popowash-cta.webm` y `popowash-cta-poster.jpg`.

`node_modules/`, `cuadros/` y las páginas generadas no se suben a Git.
