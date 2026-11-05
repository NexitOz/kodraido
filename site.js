(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    navigation.classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const effects = document.querySelector('.effects-toggle');
  let storedEffects = null;
  try { storedEffects = localStorage.getItem('raido-effects'); } catch {}
  let effectsDisabled = reducedMotion.matches || storedEffects === 'off';
  function applyEffects() {
    document.documentElement.classList.toggle('effects-off', effectsDisabled);
    effects.setAttribute('aria-pressed', String(effectsDisabled));
    effects.setAttribute('aria-label', effectsDisabled ? 'Включить анимацию' : 'Отключить анимацию');
    effects.title = effectsDisabled ? 'Включить анимацию' : 'Отключить анимацию';
  }
  applyEffects();
  effects.addEventListener('click', () => {
    effectsDisabled = !effectsDisabled;
    storedEffects = effectsDisabled ? 'off' : 'on';
    try { localStorage.setItem('raido-effects', storedEffects); } catch {}
    applyEffects();
  });
  reducedMotion.addEventListener('change', event => { effectsDisabled = event.matches || storedEffects === 'off'; applyEffects(); });
  const videoDialog = document.querySelector('#video-dialog');
  const contactDialog = document.querySelector('#contact-dialog');
  const video = videoDialog.querySelector('video');
  const videoError = videoDialog.querySelector('.media-error');
  let videoLoaded = false;
  document.querySelector('[data-open-video]').addEventListener('click', () => {
    videoDialog.showModal();
    if (!videoLoaded) { const source = video.querySelector('source'); source.src = source.dataset.src; video.load(); videoLoaded = true; }
    video.play().catch(() => {});
  });
  video.addEventListener('error', () => { videoError.hidden = false; });
  video.querySelector('source').addEventListener('error', () => { videoError.hidden = false; });
  videoDialog.addEventListener('close', () => { video.pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  document.querySelector('[data-open-contact]').addEventListener('click', () => contactDialog.showModal());
  [videoDialog, contactDialog].forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
  });
})();
