/**
 * Homepage only: update location hash while scrolling so URLs reflect the visible section
 * (same idea as audreyt.org — uses replaceState, does not spam browser history).
 */
(function () {
  var SECTION_IDS = ['hero', 'quote', 'focus', 'showcase', 'writing', 'papers', 'lab', 'stickers', 'cta'];

  function isHomePath() {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    return path === '/' || path === '/en' || path === '/index.html' || path === '/en/index.html';
  }

  function init() {
    if (!isHomePath()) return;

    var sections = SECTION_IDS.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    if (sections.length === 0) return;

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries.filter(function (e) {
          return e.isIntersecting && e.intersectionRatio > 0;
        });
        if (visible.length === 0) return;

        visible.sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio;
        });

        var id = visible[0].target.id;
        if (!id) return;

        var next = '#' + id;
        if (window.location.hash !== next) {
          history.replaceState(null, '', next);
        }
      },
      {
        root: null,
        rootMargin: '-42% 0px -42% 0px',
        threshold: [0, 0.05, 0.15, 0.35],
      }
    );

    sections.forEach(function (el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
