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
// Scenario high among researched references (US 2018, not a Chilean average).
// Retail reference: Elite Ultra Suave 12 x 25 m, upper-price sample from Jumbo/Lider checked 2026-10-08.
const paperAssumptions = Object.freeze({ rollsPerPersonPerYear: 141, rollPrice: 850 });
const household = document.querySelector('#household-size');
function updateSpend() {
  const people = household.valueAsNumber;
  const valid = Number.isInteger(people) && people >= 1 && people <= 20;
  household.setAttribute('aria-invalid', String(!valid));
  const perPerson = paperAssumptions.rollsPerPersonPerYear * paperAssumptions.rollPrice;
  const annual = valid ? people * perPerson : 0;
  document.querySelector('#annual-spend').textContent = valid ? clp.format(annual) : 'Por calcular';
  document.querySelector('#annual-saving').textContent = valid ? clp.format(annual * 0.5) : 'Por calcular';
  const message = document.querySelector('#household-message');
  message.hidden = valid;
  message.textContent = valid ? '' : 'Ingresa un número entero de personas entre 1 y 20.';
  const joke = document.querySelector('#household-joke');
  joke.hidden = !valid || people <= 6;
  joke.textContent = joke.hidden ? '' : people > 15
    ? '¿Esto es una casa o una pensión? Ese baño debería cobrar horas extra.'
    : 'Con tantos en casa, ojalá tengan dos baños. Y dos PopoWash.';
}
household.addEventListener('input', updateSpend);
updateSpend();

const stepImages = [
  ['assets/instalacion-logo-popowash.webp', 'Imagen ilustrativa de unas manos colocando PopoWash sobre los anclajes del inodoro', 'Montaje ilustrativo: PopoWash se coloca bajo el asiento y se fija con sus anclajes.'],
  ['assets/11-instalado-chorro-general.webp', 'Demostración del chorro de agua de PopoWash con el asiento levantado', 'Demostración del chorro. Durante el uso, permanece sentado y comienza con poca presión.'],
  ['assets/10-instalado-detalle.webp', 'PopoWash instalado y apagado, listo para el próximo uso', 'Cierra el agua con la perilla y sécate con un poco de papel. Listo para la próxima vez.']
];
const stepsSection = document.querySelector('#instalacion');
const stepButtons = [...document.querySelectorAll('[data-step]')];
const stepPause = document.querySelector('#pause-steps');
const stepDuration = 6000;
let currentStep = 0;
let stepsPaused = motionPreference.matches;
let stepsVisible = false;
let elapsed = 0;
let lastTick = 0;
let animationFrame = null;

function showStep(index) {
  currentStep = index;
  stepButtons.forEach((button, i) => { button.closest('.step').classList.toggle('active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  const [src, alt, caption] = stepImages[index];
  Object.assign(document.querySelector('#step-photo'), { src, alt });
  document.querySelector('#step-caption').textContent = caption;
  elapsed = 0;
  updatePlaybackLabel();
}
function updatePlaybackLabel() {
  stepPause.setAttribute('aria-pressed', String(stepsPaused));
  stepPause.textContent = stepsPaused ? 'Reanudar pasos' : 'Pausar pasos';
  document.querySelector('#step-status').textContent = `Paso ${currentStep + 1} de 3`;
}
function tick(timestamp) {
  if (lastTick) elapsed += timestamp - lastTick;
  lastTick = timestamp;
  if (elapsed >= stepDuration) showStep((currentStep + 1) % stepButtons.length);
  animationFrame = requestAnimationFrame(tick);
}
function syncPlayback() {
  const running = stepsVisible && !stepsPaused && !document.hidden && !motionPreference.matches;
  if (!running && animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
    lastTick = 0;
  } else if (running && animationFrame === null) {
    lastTick = 0;
    animationFrame = requestAnimationFrame(tick);
  }
  updatePlaybackLabel();
}
stepButtons.forEach((button, index) => button.closest('.step').addEventListener('click', () => {
  stepsPaused = true;
  showStep(index);
  syncPlayback();
}));
stepPause.addEventListener('click', () => { stepsPaused = !stepsPaused; syncPlayback(); });
new IntersectionObserver(entries => { stepsVisible = entries[0].isIntersecting; syncPlayback(); }, { threshold: 0.15 }).observe(stepsSection);
document.addEventListener('visibilitychange', syncPlayback);
motionPreference.addEventListener('change', () => { if (motionPreference.matches) stepsPaused = true; syncPlayback(); });
syncPlayback();

const quantity = document.querySelector('#product-quantity');
const bagDialog = document.querySelector('#bag-dialog');
const unitPrice = 39990;
const installAdd = document.querySelector('#install-add');
const installChoice = () => installAdd.checked ? Number(installAdd.value) : 0;
function validQuantity() { const n = quantity.valueAsNumber; return Number.isInteger(n) && n >= 1 && n <= 10; }
function updateTotal() {
  const valid = validQuantity();
  quantity.setAttribute('aria-invalid', String(!valid));
  document.querySelector('#order-total').textContent = valid ? clp.format(quantity.valueAsNumber * (unitPrice + installChoice())) : '—';
  document.querySelector('#quantity-note').textContent = valid ? 'Vista previa de compra. Pagos aún no habilitados.' : 'Ingresa una cantidad entera entre 1 y 10.';
}
document.querySelectorAll('[data-qty]').forEach(button => button.addEventListener('click', () => {
  const next = (validQuantity() ? quantity.valueAsNumber : 1) + Number(button.dataset.qty);
  quantity.value = Math.min(10, Math.max(1, next));
  updateTotal();
}));
quantity.addEventListener('input', updateTotal);
installAdd.addEventListener('change', updateTotal);
updateTotal();
document.querySelectorAll('[data-add-to-bag]').forEach(button => button.addEventListener('click', () => {
  if (!validQuantity()) { updateTotal(); document.querySelector('#producto').scrollIntoView(); quantity.focus(); return; }
  const count = quantity.valueAsNumber, install = installChoice();
  document.querySelector('#bag-quantity').textContent = `${count} ${count === 1 ? 'unidad' : 'unidades'}`;
  document.querySelector('#bag-install').textContent = install ? 'Con instalación en Santiago' : 'Sin instalación';
  document.querySelector('#bag-subtotal').textContent = clp.format(count * (unitPrice + install));
  bagDialog.showModal();
}));
bagDialog.querySelectorAll('.dialog-close, .dialog-done').forEach(button => button.addEventListener('click', () => bagDialog.close()));
document.querySelectorAll('a[href="#faq-compatibilidad"], a[href="#faq-condiciones"]').forEach(link => link.addEventListener('click', () => {
  document.querySelector(link.getAttribute('href')).open = true;
  if (bagDialog.open) bagDialog.close();
}));

// Animación del CTA: se reproduce al verse en pantalla y se repite con una pausa; con «reducir movimiento» queda la imagen fija.
const ctaAnim = document.querySelector('#cta-anim');
if (ctaAnim) {
  let ctaVisible = false, ctaTimer = null;
  const ctaSync = () => {
    if (motionPreference.matches || !ctaVisible || document.hidden) { ctaAnim.pause(); clearTimeout(ctaTimer); ctaTimer = null; return; }
    if (ctaAnim.paused && !ctaTimer) ctaAnim.play().catch(() => {});
  };
  ctaAnim.addEventListener('ended', () => {
    ctaTimer = setTimeout(() => { ctaTimer = null; ctaAnim.currentTime = 0; ctaSync(); }, 2500);
  });
  new IntersectionObserver(entries => { ctaVisible = entries[0].isIntersecting; ctaSync(); }, { threshold: 0.35 }).observe(ctaAnim);
  document.addEventListener('visibilitychange', ctaSync);
  motionPreference.addEventListener('change', ctaSync);
}

// Pie de página: enlaces aún sin destino y formulario que abrirá WhatsApp cuando exista el número.
document.querySelectorAll('[data-link-pendiente]').forEach(link => link.addEventListener('click', event => event.preventDefault()));
const waForm = document.querySelector('#wa-form');
if (waForm) waForm.addEventListener('submit', event => {
  event.preventDefault();
  const number = waForm.dataset.whatsapp.replace(/\D/g, '');
  const message = waForm.querySelector('input').value.trim();
  if (number) window.open(`https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank', 'noopener');
});
