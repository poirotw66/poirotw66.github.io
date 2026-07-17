/**
 * Article TOC: scroll to headings with offset for sticky site nav + TOC sidebar.
 */
(function () {
  function anchorOffset() {
    var styles = getComputedStyle(document.documentElement);
    var paddingTop = parseFloat(styles.scrollPaddingTop);
    if (!Number.isNaN(paddingTop) && paddingTop > 0) return paddingTop;

    var custom = styles.getPropertyValue('--article-anchor-offset').trim();
    if (custom.endsWith('rem')) {
      var rootSize = parseFloat(styles.fontSize) || 16;
      return parseFloat(custom) * rootSize;
    }
    if (custom.endsWith('px')) return parseFloat(custom);
    return 108;
  }

  function scrollToTarget(target, updateHash) {
    if (!target) return;
    var top = window.scrollY + target.getBoundingClientRect().top - anchorOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    if (updateHash && target.id) {
      history.replaceState(null, '', '#' + target.id);
    }
  }

  function initToc(root) {
    var disclosure = root.querySelector('.article-toc-disclosure');
    if (disclosure && window.matchMedia('(max-width: 640px)').matches && !window.location.hash) {
      disclosure.removeAttribute('open');
    }
    var links = Array.from(root.querySelectorAll('.article-toc-list a[href^="#"]'));
    var entries = links.map(function (link) {
      var hash = link.getAttribute('href');
      return { link: link, target: hash ? document.querySelector(hash) : null };
    }).filter(function (entry) {
      return Boolean(entry.target);
    });

    links.forEach(function (link) {
      link.addEventListener('click', function (event) {
        var hash = link.getAttribute('href');
        if (!hash || hash.length < 2) return;
        var target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target, true);
      });
    });

    if (entries.length === 0) return;
    var ticking = false;
    function updateCurrent() {
      var offset = anchorOffset() + 24;
      var current = entries[0];
      entries.forEach(function (entry) {
        if (entry.target.getBoundingClientRect().top <= offset) current = entry;
      });
      entries.forEach(function (entry) {
        var active = entry === current;
        entry.link.classList.toggle('is-active', active);
        if (active) entry.link.setAttribute('aria-current', 'location');
        else entry.link.removeAttribute('aria-current');
      });
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateCurrent);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateCurrent();
  }

  function scrollInitialHash() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var target = document.querySelector(hash);
    if (!target) return;
    requestAnimationFrame(function () {
      scrollToTarget(target, false);
    });
  }

  function init() {
    document.querySelectorAll('.article-layout--with-toc').forEach(initToc);
    scrollInitialHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
