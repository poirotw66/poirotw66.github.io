/** Article reader: progress indicator and code-block copy controls. */
(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function languageLabel(pre, code) {
    var explicit = pre.dataset.language || code.dataset.language;
    if (explicit) return explicit;
    var className = (pre.className || '') + ' ' + (code.className || '');
    var match = className.match(/(?:language-|lang-)([\w-]+)/i);
    return match ? match[1] : 'code';
  }

  function enhanceCodeBlocks(root) {
    var copyLabel = root.dataset.copyLabel || 'Copy';
    var copiedLabel = root.dataset.copiedLabel || 'Copied';

    root.querySelectorAll('.article-content pre').forEach(function (pre) {
      if (pre.closest('.code-block-shell')) return;
      var code = pre.querySelector('code');
      if (!code) return;

      var shell = document.createElement('div');
      shell.className = 'code-block-shell';
      var toolbar = document.createElement('div');
      toolbar.className = 'code-block-toolbar';

      var language = document.createElement('span');
      language.className = 'code-block-language';
      language.textContent = languageLabel(pre, code);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = copyLabel;
      button.setAttribute('aria-label', copyLabel);

      button.addEventListener('click', function () {
        copyText(code.textContent || '').then(function () {
          button.textContent = copiedLabel;
          button.classList.add('is-copied');
          window.setTimeout(function () {
            button.textContent = copyLabel;
            button.classList.remove('is-copied');
          }, 1800);
        });
      });

      toolbar.append(language, button);
      pre.parentNode.insertBefore(shell, pre);
      shell.append(toolbar, pre);
    });
  }

  function initProgress(root) {
    var content = root.querySelector('.article-content');
    var progress = root.querySelector('[data-reading-progress]');
    var fill = root.querySelector('[data-reading-progress-fill]');
    if (!content || !progress || !fill) return;

    var ticking = false;
    function update() {
      var rect = content.getBoundingClientRect();
      var start = window.scrollY + rect.top - window.innerHeight * 0.2;
      var readableDistance = Math.max(content.scrollHeight - window.innerHeight * 0.55, 1);
      var value = Math.min(1, Math.max(0, (window.scrollY - start) / readableDistance));
      var percent = Math.round(value * 100);
      fill.style.transform = 'scaleX(' + value + ')';
      progress.setAttribute('aria-valuenow', String(percent));
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  function init() {
    document.querySelectorAll('[data-article-reader]').forEach(function (root) {
      enhanceCodeBlocks(root);
      initProgress(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
