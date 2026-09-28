const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reviewTrack = document.querySelector('#review-track');
const reviewCopy = reviewTrack.firstElementChild.cloneNode(true);
reviewCopy.setAttribute('aria-hidden', 'true');
reviewTrack.append(reviewCopy);
const pauseButton = document.querySelector('#pause-reviews');
pauseButton.addEventListener('click', () => {
  const paused = reviewTrack.classList.toggle('paused');
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.innerHTML = paused ? 'Reanudar reseñas <span aria-hidden="true">▷</span>' : 'Pausar reseñas <span aria-hidden="true">Ⅱ</span>';
});

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const spend = document.querySelector('#monthly-spend');
const reduction = document.querySelector('#paper-reduction');
function updateSavings() {
  const rawValue = spend.valueAsNumber;
  const valid = Number.isFinite(rawValue) && rawValue >= 0 && rawValue <= 1000000;
  spend.setAttribute('aria-invalid', String(!valid));
  document.querySelector('#spend-note').textContent = valid ? 'Ejemplo editable. Ingresa el gasto de tu hogar en papel higiénico.' : 'Ingresa un gasto entre $0 y $1.000.000 CLP.';
  const monthly = valid ? rawValue : 0;
  const fraction = Number(reduction.value) / 100;
  document.querySelector('#annual-spend').textContent = valid ? clp.format(monthly * 12) : 'Por calcular';
  document.querySelector('#monthly-label').textContent = valid ? clp.format(monthly) : 'por calcular';
  document.querySelector('#reduction-label').textContent = reduction.value + '%';
  reduction.setAttribute('aria-valuetext', reduction.value + '% menos papel');
  document.querySelector('#monthly-saving').textContent = valid ? clp.format(monthly * fraction) : 'Por calcular';
  document.querySelector('#annual-saving').textContent = valid ? clp.format(monthly * fraction * 12) : 'Por calcular';
}
spend.addEventListener('input', updateSavings);
reduction.addEventListener('input', updateSavings);
updateSavings();

const stepImages = [
  ['assets/instalacion.webp', 'Imagen ilustrativa de unas manos colocando PopoWash sobre los anclajes del inodoro', 'Instalación ilustrativa. Confirma las conexiones y el montaje en el manual de tu modelo.'],
  ['assets/11-instalado-chorro-general.webp', 'Demostración del chorro de agua de PopoWash con el asiento levantado', 'Demostración del chorro. Durante el uso, permanece sentado y comienza con poca presión.'],
  ['assets/10-instalado-detalle.webp', 'PopoWash instalado y apagado, listo para el próximo uso', 'Cierra el agua con la perilla y sécate con un poco de papel. Listo para la próxima vez.']
];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-step]').forEach(other => { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); });
  const [src, alt, caption] = stepImages[Number(button.dataset.step)];
  Object.assign(document.querySelector('#step-photo'), { src, alt });
  document.querySelector('#step-caption').textContent = caption;
}));

const dialog = document.querySelector('#compatibility-dialog');
document.querySelector('#open-checklist').addEventListener('click', () => dialog.showModal());
dialog.querySelectorAll('.dialog-close, .dialog-done').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
  const ready = dialog.querySelectorAll('input:checked').length;
  document.querySelector('#checklist-status').textContent = ready === 3 ? 'Ya tienes los tres datos para consultar la compatibilidad.' : `${ready} de 3 datos preparados.`;
}));
