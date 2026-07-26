(() => {
  const section = document.querySelector('[data-motion-passage]');
  if (!section || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stages = [...section.querySelectorAll('[data-motion-stage]')];
  const markers = [...section.querySelectorAll('[data-motion-marker]')];
  const readout = section.querySelector('[data-motion-readout]');
  let ticking = false;

  const update = () => {
    const rect = section.getBoundingClientRect();
    const range = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / range));
    const active = Math.min(stages.length - 1, Math.floor(progress * stages.length));

    section.style.setProperty('--motion-progress', progress.toFixed(4));
    stages.forEach((stage, index) => stage.classList.toggle('is-active', index === active));
    markers.forEach((marker, index) => marker.classList.toggle('is-active', index === active));
    if (readout) readout.textContent = String(active + 1).padStart(2, '0');
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  update();
})();
