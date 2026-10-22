// Renderiza los 200 cuadros (10 s a 20 fps) de la animación en la carpeta cuadros/.
// Requiere: npm install three@0.169.0 playwright  y  python construir-pagina.py --local
// Uso: node renderizar-cuadros.cjs [desde] [hasta]   (por defecto 0 200; se puede dividir en dos terminales)
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const from = +(process.argv[2] ?? 0), to = +(process.argv[3] ?? 200);
  fs.mkdirSync(path.join(__dirname, 'cuadros'), { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 540 } });
  await page.goto('file://' + path.join(__dirname, 'animacion-local.html').replace(/\\/g, '/'));
  await page.waitForTimeout(1500);
  for (let i = from; i < to; i++) {
    const out = path.join(__dirname, 'cuadros', `f${String(i).padStart(4, '0')}.png`);
    if (fs.existsSync(out)) continue;
    await page.evaluate(t => anim.freeze(t), i / 20);
    await (await page.$('#stage')).screenshot({ path: out });
  }
  console.log('Cuadros listos', from, to);
  await browser.close();
})();
