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
const mobileSteps = window.matchMedia('(max-width: 767px)');
const stepButtons = [...document.querySelectorAll('[data-step]')];
const stepPause = document.querySelector('#pause-steps');
const stepDuration = 1500;
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
  const stepCaption = document.querySelector('#step-caption');
  if (stepCaption) stepCaption.textContent = caption;
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
  const running = stepsVisible && !stepsPaused && !document.hidden && !motionPreference.matches && !mobileSteps.matches;
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
  if (mobileSteps.matches) return;
  stepsPaused = true;
  showStep(index);
  syncPlayback();
}));
mobileSteps.addEventListener('change', syncPlayback);
stepPause.addEventListener('click', () => { stepsPaused = !stepsPaused; syncPlayback(); });
new IntersectionObserver(entries => { stepsVisible = entries[0].isIntersecting; syncPlayback(); }, { threshold: 0.15 }).observe(stepsSection);
document.addEventListener('visibilitychange', syncPlayback);
motionPreference.addEventListener('change', () => { if (motionPreference.matches) stepsPaused = true; syncPlayback(); });
syncPlayback();

const quantity = document.querySelector('#product-quantity');
const bagDialog = document.querySelector('#bag-dialog');

document.querySelectorAll('[data-add-to-bag]:not(#comprar-final [data-add-to-bag])').forEach(button => button.addEventListener('click', () => {
  const count = quantity.valueAsNumber;
  const valid = Number.isInteger(count) && count >= 1 && count <= 10;
  quantity.setAttribute('aria-invalid', String(!valid));
  document.querySelector('#quantity-note').textContent = valid ? 'Elige la cantidad y continúa al carrito.' : 'Ingresa una cantidad entera entre 1 y 10.';
  if (!valid) { document.querySelector('#producto').scrollIntoView(); quantity.focus(); return; }
  window.popowashCart.open(count, false);
}));
document.querySelectorAll('a[href="#faq-despacho"]').forEach(link => link.addEventListener('click', () => {
  document.querySelector(link.getAttribute('href')).open = true;
  if (bagDialog.open) bagDialog.close();
}));

const installationVideoDialog = document.querySelector('#installation-video-dialog');
document.querySelectorAll('[data-installation-video]').forEach(button => button.addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube.com/embed/q2sO9ERbWnE?rel=0';
  frame.title = 'Video de instalación de PopoWash';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  installationVideoDialog.querySelector('.video-frame').replaceChildren(frame);
  installationVideoDialog.showModal();
}));
installationVideoDialog.querySelector('.dialog-close').addEventListener('click', () => installationVideoDialog.close());
installationVideoDialog.addEventListener('close', () => installationVideoDialog.querySelector('.video-frame').replaceChildren());

// Selector de cantidad y total del bloque de compra
(() => {
  const input = document.querySelector('#product-quantity');
  const total = document.querySelector('#purchase-total');
  if (!input || !total) return;
  const [minus, plus] = document.querySelectorAll('[data-qty-delta]');
  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  const sync = () => {
    const n = input.valueAsNumber;
    const valid = Number.isInteger(n) && n >= 1 && n <= 10;
    total.textContent = clp.format((valid ? n : 1) * 39990);
    minus.disabled = !valid || n <= 1;
    plus.disabled = !valid || n >= 10;
  };
  document.querySelectorAll('[data-qty-delta]').forEach(btn => btn.addEventListener('click', () => {
    const n = Number.isInteger(input.valueAsNumber) ? input.valueAsNumber : 1;
    input.value = Math.min(10, Math.max(1, n + Number(btn.dataset.qtyDelta)));
    sync();
  }));
  input.addEventListener('input', sync);
  sync();
})();

// CTA de Gabo: IDs separados y bolsa compartida con la compra existente.
(() => {
  const cta = document.querySelector('#comprar-final');
  const input = cta.querySelector('#cta-product-quantity');
  const install = cta.querySelector('#cta-install-add');
  const money = new Intl.NumberFormat('es-CL', {style:'currency',currency:'CLP',maximumFractionDigits:0});
  const valid = () => Number.isInteger(input.valueAsNumber) && input.valueAsNumber >= 1 && input.valueAsNumber <= 10;
  const extra = () => install.checked ? Number(install.value) : 0;
  const sync = () => {
    input.setAttribute('aria-invalid', String(!valid()));
    cta.querySelector('#cta-order-total').textContent = valid() ? money.format(input.valueAsNumber * (39990 + extra())) : '—';
    cta.querySelector('#cta-quantity-note').textContent = valid() ? 'Elige la cantidad y continúa al carrito.' : 'Ingresa una cantidad entera entre 1 y 10.';
  };
  cta.querySelectorAll('[data-qty]').forEach(button => button.addEventListener('click', () => {
    input.value = Math.min(10, Math.max(1, (valid() ? input.valueAsNumber : 1) + Number(button.dataset.qty)));
    sync();
  }));
  input.addEventListener('input', sync);
  install.addEventListener('change', sync);
  cta.querySelector('[data-add-to-bag]').addEventListener('click', () => {
    sync();
    if (!valid()) { input.focus(); return; }
    window.popowashCart.open(input.valueAsNumber, install.checked);
  });
  sync();
})();

// Inicio silencioso en móviles; mantiene imagen y acción si el navegador bloquea autoplay.
function setupInlineVideo(video, { reducedMotion = false, repeatDelay = 0 } = {}) {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-start';
  button.textContent = 'Reproducir animación';
  button.setAttribute('aria-label', video.id === 'wash-demo' ? 'Reproducir demostración de lavado' : 'Reproducir animación de PopoWash');
  button.hidden = true;
  video.insertAdjacentElement('afterend', button);
  let visible = false, pending = false, timer = null, userPaused = false;
  const start = () => {
    if (!visible || document.hidden || pending || timer || userPaused || (reducedMotion && motionPreference.matches)) return;
    if (!video.paused) return;
    video.muted = true;
    pending = true;
    video.play().then(() => { button.hidden = true; }).catch(error => {
      if (error.name !== 'AbortError' && visible) button.hidden = false;
    }).finally(() => { pending = false; });
  };
  button.addEventListener('click', () => { userPaused = false; start(); });
  video.addEventListener('playing', () => { button.hidden = true; });
  video.addEventListener('error', () => { button.hidden = false; button.textContent = 'Reintentar reproducción'; });
  video.addEventListener('pointerdown', () => { userPaused = !video.paused; });
  ['loadeddata', 'canplay'].forEach(event => video.addEventListener(event, start));
  if (repeatDelay) video.addEventListener('ended', () => {
    timer = setTimeout(() => { timer = null; video.currentTime = 0; start(); }, repeatDelay);
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else { clearTimeout(timer); timer = null; video.pause(); }
  }, { threshold: 0.05 }).observe(video);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else start(); });
  window.addEventListener('pageshow', start);
  document.addEventListener('pointerup', () => { if (!button.hidden) start(); });
  if (reducedMotion) motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) { video.pause(); button.hidden = true; }
    else start();
  });
}
setupInlineVideo(document.querySelector('#cta-anim'), { reducedMotion: true, repeatDelay: 2500 });

// Pie de página: enlaces aún sin destino y formulario que abrirá WhatsApp cuando exista el número.
document.querySelectorAll('[data-link-pendiente]').forEach(link => link.addEventListener('click', event => event.preventDefault()));
const waForm = document.querySelector('#wa-form');
if (waForm) waForm.addEventListener('submit', event => {
  event.preventDefault();
  const number = waForm.dataset.whatsapp.replace(/\D/g, '');
  const message = waForm.querySelector('input').value.trim();
  if (number) window.open(`https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank', 'noopener');
});

// Todos los accesos de compatibilidad comparten la misma guía.
const compatibilityDialog = document.querySelector('#compatibility-dialog');
document.querySelectorAll('[data-compatibility]').forEach(control => control.addEventListener('click', event => {
  event.preventDefault();
  if (bagDialog.open) bagDialog.close();
  if (!compatibilityDialog.open) compatibilityDialog.showModal();
}));
compatibilityDialog.querySelector('.close').addEventListener('click', () => compatibilityDialog.close());

// El modo activo sigue el tiempo real del video, también al buscar o repetir.
const washDemo = document.querySelector('#wash-demo');
if (washDemo) {
  setupInlineVideo(washDemo);
  washDemo.defaultPlaybackRate = 1;
  washDemo.playbackRate = 1;
  const washModes = [...document.querySelectorAll('#beneficios [data-wash-mode]')];
  const syncWashMode = () => {
    const t = washDemo.currentTime;
    const active = t >= 2.08 && t < 3.82 ? 'posterior' : t >= 4.65 && t < 6.65 ? 'frontal' : null;
    washModes.forEach(mode => {
      const selected = mode.dataset.washMode === active;
      mode.classList.toggle('is-active', selected);
      mode.querySelector('button').setAttribute('aria-pressed', String(selected));
    });
  };
  ['timeupdate', 'seeking', 'seeked', 'loadedmetadata', 'ended'].forEach(event => washDemo.addEventListener(event, syncWashMode));
  document.querySelectorAll('#beneficios [data-wash-seek]').forEach(button => button.addEventListener('click', () => {
    washDemo.currentTime = Number(button.dataset.washSeek);
    syncWashMode();
    washDemo.play().catch(() => {});
  }));
  syncWashMode();
}


// A single brief header appearance, confined to the hero during this page visit.
(() => {
  const popin = document.querySelector('.header-popin');
  const hero = document.querySelector('#hero');
  if (!popin || !hero) return;
  let dismissed = false;
  let greetingTimer;
  const dismiss = () => {
    dismissed = true;
    clearTimeout(greetingTimer);
    popin.classList.remove('is-visible');
    observer.disconnect();
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (dismissed) return;
    if (!entry.isIntersecting) { dismiss(); return; }
    popin.classList.add('is-visible');
    // Start fading as the pointing arm returns to rest in the accelerated footage.
    greetingTimer = setTimeout(dismiss, 4700);
  }, {rootMargin: '-80px 0px 0px 0px', threshold: .15});
  observer.observe(hero);
})();

// The supplied CTA footage is split into resting, hover and purchase feedback states.
(() => {
  const wrap = document.querySelector('.purchase-popin-cta');
  if (!wrap) return;
  const button = wrap.querySelector('button');
  const popin = wrap.querySelector('.purchase-popin');
  const celebration = document.querySelector('.cart-popin-celebration');
  const assets = {peek: 'assets/popin-cta-peek.webp?v=clean2', point: 'assets/popin-cta-point.webp?v=clean2', enter: 'assets/popin-cta-enter-fast.webp?v=clean2', celebrate: 'assets/popin-cta-celebrate-hands.webp'};
  let timer, cartTimer, active = false, returnMotion, cartMotion;
  let cartRun = 0;
  ['enter', 'celebrate', 'point'].forEach(state => { const image = new Image(); image.src = assets[state]; });
  const stopReturn = () => { if (returnMotion) returnMotion.cancel(); returnMotion = null; };
  const rest = () => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    stopReturn();
    if (motionPreference.matches) { popin.src = assets.peek; return; }
    const outgoing = popin.animate([{opacity: 1, transform: 'translateX(0)'}, {opacity: 0, transform: 'translateX(-9px)'}], {duration: 160, easing: 'ease-in', fill: 'forwards'});
    returnMotion = outgoing;
    outgoing.finished.then(() => {
      if (active || returnMotion !== outgoing) return;
      popin.src = assets.peek;
      outgoing.cancel();
      returnMotion = popin.animate([{opacity: 0, transform: 'translateX(-4px)'}, {opacity: 1, transform: 'translateX(0)'}], {duration: 200, easing: 'cubic-bezier(.23,1,.32,1)'});
    }).catch(() => {});
  };
  const enter = () => {
    if (active) return;
    active = true;
    clearTimeout(timer);
    stopReturn();
    if (motionPreference.matches) { popin.src = assets.point; return; }
    popin.src = assets.enter;
    timer = setTimeout(() => { if (active) popin.src = assets.point; }, 1440);
  };
  const hideCelebration = () => {
    clearTimeout(cartTimer);
    const run = cartRun;
    if (cartMotion) cartMotion.cancel();
    if (celebration.hidden) return;
    cartMotion = celebration.animate([{opacity: 1, transform: 'translateY(0) scale(1)'}, {opacity: 0, transform: motionPreference.matches ? 'none' : 'translateY(-5px) scale(.98)'}], {duration: motionPreference.matches ? 0 : 260, easing: 'ease-in', fill: 'forwards'});
    cartMotion.finished.then(() => { if (run === cartRun) celebration.hidden = true; }).catch(() => {});
  };
  button.addEventListener('pointerenter', enter);
  button.addEventListener('pointerleave', rest);
  button.addEventListener('focus', enter);
  button.addEventListener('blur', rest);
  button.addEventListener('click', async () => {
    if (!bagDialog.open) return;
    const run = ++cartRun;
    clearTimeout(cartTimer);
    if (cartMotion) cartMotion.cancel();
    rest();
    celebration.hidden = true;
    celebration.src = assets[motionPreference.matches ? 'point' : 'celebrate'];
    try { await celebration.decode(); } catch (_) {}
    if (run !== cartRun || !bagDialog.open) return;
    celebration.hidden = false;
    cartMotion = celebration.animate([{opacity: 0, transform: motionPreference.matches ? 'none' : 'translateY(9px) scale(.96)'}, {opacity: 1, transform: 'translateY(0) scale(1)'}], {duration: motionPreference.matches ? 0 : 260, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards'});
    cartTimer = setTimeout(hideCelebration, 3000);
  });
  bagDialog.addEventListener('close', () => {
    ++cartRun;
    clearTimeout(cartTimer);
    if (cartMotion) cartMotion.cancel();
    celebration.hidden = true;
    rest();
  });
})();
