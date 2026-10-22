/**
 * Lightweight hero pipeline sequencer: lights steps in order while on-screen.
 * Decorative only — copy remains fully readable without motion.
 */
(function initHeroPipeline() {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const board = document.querySelector('.hero-diagram-desktop[data-hero-pipeline]');
  if (!(board instanceof HTMLElement)) return;

  const steps = [...board.querySelectorAll('.hero-diagram-step[data-step-index]')];
  const nodes = [...board.querySelectorAll('.hero-pipeline-node[data-track-index]')];
  const links = [...board.querySelectorAll('.hero-pipeline-link')];
  const guide = board.querySelector('[data-hero-guide]');
  if (steps.length === 0) return;

  const INTERVAL_MS = 1700;
  let index = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let visible = false;

  /**
   * @param {number} active
   */
  function paint(active) {
    board.dataset.activeStep = String(active + 1);
    steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === active);
      step.classList.toggle('is-complete', i < active);
    });
    nodes.forEach((node, i) => {
      node.classList.toggle('is-active', i === active);
      node.classList.toggle('is-complete', i < active);
    });
    links.forEach((link, i) => {
      link.classList.toggle('is-active', i === active - 1);
      link.classList.toggle('is-complete', i < active - 1);
    });
    if (guide instanceof HTMLElement) {
      guide.classList.toggle('is-guiding', active === steps.length - 1);
    }
  }

  function tick() {
    paint(index);
    index = (index + 1) % steps.length;
  }

  function start() {
    if (timer != null || !visible || document.hidden) return;
    tick();
    timer = setInterval(tick, INTERVAL_MS);
  }

  function stop() {
    if (timer == null) return;
    clearInterval(timer);
    timer = null;
  }

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.35 },
    );
    observer.observe(board);
  } else {
    visible = true;
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
})();
