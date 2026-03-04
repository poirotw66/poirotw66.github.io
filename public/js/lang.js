/**
 * Language switcher: default English, option for Traditional Chinese.
 * Persists choice in localStorage and toggles .block-en / .block-zh visibility.
 */
(function () {
  var STORAGE_KEY = 'lang';
  var DEFAULT_LANG = 'zh';

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'zh') lang = DEFAULT_LANG;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.documentElement.classList.remove('lang-en', 'lang-zh');
    document.documentElement.classList.add('lang-' + lang);
    updateDataLangNodes();
  }

  function updateDataLangNodes() {
    var lang = getLang();
    var attr = lang === 'zh' ? 'data-zh' : 'data-en';
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      var value = el.getAttribute(attr);
      if (value != null) el.textContent = value;
    });
  }

  function initSwitcher() {
    setLang(getLang());
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        if (lang) setLang(lang);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
})();
