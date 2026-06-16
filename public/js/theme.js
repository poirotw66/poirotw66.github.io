/**
 * Site shell: theme switcher (dark / warm) and mobile nav toggle.
 */
(function () {
  var STORAGE_KEY = 'theme';
  var DEFAULT_THEME = 'warm';

  function getTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'warm' || stored === 'dark' ? stored : DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'warm') theme = DEFAULT_THEME;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButtons();
    document.dispatchEvent(
      new CustomEvent('site-theme-change', { detail: { theme: theme } })
    );
  }

  function updateThemeButtons() {
    var theme = getTheme();
    document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
      var value = btn.getAttribute('data-theme-btn');
      if (value === theme) {
        btn.setAttribute('aria-pressed', 'true');
        btn.classList.add('theme-btn-active');
      } else {
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove('theme-btn-active');
      }
    });
  }

  function initSwitcher() {
    setTheme(getTheme());
    document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = this.getAttribute('data-theme-btn');
        if (theme) setTheme(theme);
      });
    });
  }

  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var ticking = false;
    function updateScrolled() {
      nav.classList.toggle('nav--scrolled', window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateScrolled);
        }
      },
      { passive: true }
    );
    updateScrolled();
  }

  function initNav() {
    var nav = document.querySelector('.nav');
    var btn = document.querySelector('.nav-menu-toggle');
    var panel = document.getElementById('primary-nav-menu');
    if (!nav || !btn || !panel) return;

    var mq = window.matchMedia('(max-width: 900px)');

    function setNavOpen(open) {
      nav.classList.toggle('nav-is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setNavOpen(!nav.classList.contains('nav-is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav-is-open')) {
        setNavOpen(false);
        btn.focus();
      }
    });

    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (mq.matches) setNavOpen(false);
      });
    });

    function onMqChange() {
      if (!mq.matches) setNavOpen(false);
    }

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMqChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(onMqChange);
    }
  }

  function boot() {
    initSwitcher();
    initNavScroll();
    initNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
