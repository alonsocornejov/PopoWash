"""Une el personaje y la escena en una página HTML que dibuja la animación con Three.js.

Uso (desde esta carpeta):
    python construir-pagina.py           -> animacion.html con Three.js desde el CDN (para ver en el navegador)
    python construir-pagina.py --local   -> animacion-local.html con Three.js desde node_modules (para renderizar cuadros)
"""
from pathlib import Path
import sys

AQUI = Path(__file__).resolve().parent
local = '--local' in sys.argv
head = (AQUI / 'personaje-durazno.js').read_text(encoding='utf-8')
tail = (AQUI / 'escena-cta.js').read_text(encoding='utf-8')
if local:
    three = 'node_modules/three/build/three.module.js'
    addons = 'node_modules/three/examples/jsm/'
else:
    three = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'
    addons = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/'
html = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Animación CTA PopoWash</title>
<style>html,body{{margin:0;background:#14265c}}#stage{{position:relative;width:720px;height:540px}}#stage canvas{{position:absolute;inset:0;width:100%;height:100%}}#card,.scratch{{display:none}}</style></head>
<body><div id="stage"><canvas id="c"></canvas><span id="card"></span><div class="scratch"></div></div>
<script type="importmap">{{"imports":{{"three":"{three}","three/addons/":"{addons}"}}}}</script>
<script type="module">{head}{tail}</script></body></html>'''
salida = AQUI / ('animacion-local.html' if local else 'animacion.html')
salida.write_text(html, encoding='utf-8')
print('Listo:', salida.name)
