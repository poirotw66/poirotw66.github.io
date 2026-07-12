/**
 * Homepage only: update location hash while scrolling; highlight active section and jump nav.
 */
(function () {
  var SECTION_IDS = ['hero', 'quote', 'focus', 'showcase', 'writing', 'papers', 'explore', 'cta'];

  function isHomePath() {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    return path === '/' || path === '/en' || path === '/index.html' || path === '/en/index.html';
  }

  function setActiveSection(id) {
    document.body.classList.add('page-home');
    document.body.setAttribute('data-active-section', id);

    document.querySelectorAll('.home-scroll-anchor').forEach(function (el) {
      el.classList.toggle('home-section-active', el.id === id);
    });

    document.querySelectorAll('[data-home-jump]').forEach(function (link) {
      var jumpId = link.getAttribute('data-home-jump');
      var isActive = jumpId === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function sectionIdFromHash(hash) {
    if (!hash) return null;
    if (hash.indexOf('writing-') === 0) return 'writing';
    if (SECTION_IDS.indexOf(hash) !== -1) return hash;
    return null;
  }

  function init() {
    if (!isHomePath()) return;

    var sections = SECTION_IDS.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    if (sections.length === 0) return;

    document.body.classList.add('page-home');

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

        setActiveSection(id);

        var next = '#' + id;
        if (window.location.hash !== next) {
          history.replaceState(null, '', next);
        }
      },
      {
        root: null,
        rootMargin: '-38% 0px -38% 0px',
        threshold: [0, 0.05, 0.15, 0.35],
      }
    );

    sections.forEach(function (el) {
      observer.observe(el);
    });

    var initial = window.location.hash.replace('#', '');
    var initialSection = sectionIdFromHash(initial);
    if (initialSection) {
      setActiveSection(initialSection);
    } else {
      setActiveSection('hero');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
