/**
 * Theme switcher: dark (default) and warm.
 * Persists choice in localStorage and sets data-theme on <html>.
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
})();
