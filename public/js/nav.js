/**
 * Mobile navigation: toggles .nav-is-open on <nav class="nav">.
 */
(function () {
  var mq = window.matchMedia('(max-width: 900px)');

  function queryNav() {
    return document.querySelector('.nav');
  }

  function queryToggle() {
    return document.querySelector('.nav-menu-toggle');
  }

  function queryPanel() {
    return document.getElementById('primary-nav-menu');
  }

  function setOpen(open) {
    var nav = queryNav();
    var btn = queryToggle();
    if (!nav || !btn) return;
    nav.classList.toggle('nav-is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function isMobile() {
    return mq.matches;
  }

  function init() {
    var nav = queryNav();
    var btn = queryToggle();
    var panel = queryPanel();
    if (!nav || !btn || !panel) return;

    btn.addEventListener('click', function () {
      if (!isMobile()) return;
      setOpen(!nav.classList.contains('nav-is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav-is-open')) {
        setOpen(false);
        btn.focus();
      }
    });

    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (isMobile()) setOpen(false);
      });
    });

    function onMqChange() {
      if (!isMobile()) setOpen(false);
    }

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMqChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(onMqChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
