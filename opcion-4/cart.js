// Demostración de compra de producto único. No crea pedidos ni procesa pagos.
(() => {
  const dialog = document.querySelector('#bag-dialog');
  const input = dialog.querySelector('#cart-quantity');
  const install = dialog.querySelector('#cart-install');
  const money = new Intl.NumberFormat('es-CL', {style:'currency', currency:'CLP', maximumFractionDigits:0});
  let selected = false;
  const valid = () => Number.isInteger(input.valueAsNumber) && input.valueAsNumber >= 1 && input.valueAsNumber <= 10;
  const sync = () => {
    const n = valid() ? input.valueAsNumber : 1;
    dialog.querySelector('#cart-product-total').textContent = money.format(n * 39990);
    dialog.querySelector('#cart-total').textContent = money.format(n * (39990 + (install.checked ? 15000 : 0)));
    dialog.querySelector('#cart-install-total').textContent = money.format(n * 15000);
    dialog.querySelector('[data-cart-delta="-1"]').disabled = !valid() || n <= 1;
    dialog.querySelector('[data-cart-delta="1"]').disabled = !valid() || n >= 10;
    input.setAttribute('aria-invalid', String(!valid()));
    dialog.querySelector('#cart-error').textContent = valid() ? '' : 'Elige una cantidad entera entre 1 y 10.';
    document.querySelector('#cart-count').textContent = selected ? n : 0;
    document.querySelector('[data-open-cart]').setAttribute('aria-label', selected ? `Abrir carrito, ${n} ${n === 1 ? 'unidad' : 'unidades'}` : 'Abrir carrito');
    dialog.querySelector('#cart-payment-preview').hidden = true;
  };
  window.popowashCart = {
    open(n, withInstall) {
      if (Number.isInteger(n) && n >= 1 && n <= 10) { input.value = n; install.checked = Boolean(withInstall); }
      selected = true;
      sync();
      if (!dialog.open) dialog.showModal();
    }
  };
  document.querySelector('[data-open-cart]').addEventListener('click', () => window.popowashCart.open());
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-cart-back]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-cart-delta]').forEach(button => button.addEventListener('click', () => {
    input.value = Math.min(10, Math.max(1, (valid() ? input.valueAsNumber : 1) + Number(button.dataset.cartDelta)));
    sync();
  }));
  input.addEventListener('input', sync);
  install.addEventListener('change', sync);
  dialog.querySelectorAll('[name="cart-payment"]').forEach(radio => radio.addEventListener('change', () => { dialog.querySelector('#cart-payment-preview').hidden = true; }));
  dialog.querySelector('#cart-pay').addEventListener('click', () => {
    if (!valid()) { input.focus(); return; }
    const method = dialog.querySelector('[name="cart-payment"]:checked').value;
    const preview = dialog.querySelector('#cart-payment-preview');
    preview.hidden = false;
    preview.querySelector('strong').textContent = method;
    preview.querySelector('output').textContent = dialog.querySelector('#cart-total').textContent;
    preview.scrollIntoView({block:'nearest', behavior:'smooth'});
    preview.focus({preventScroll:true});
  });
  sync();
})();
