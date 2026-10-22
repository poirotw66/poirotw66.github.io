/**
 * Accessible <dialog> open/close for the homepage Playable Now grid.
 * Native dialog focus trap + Escape; click-outside closes via backdrop.
 */
(function initPlayableNowDialogs() {
  const root = document.getElementById('playable');
  if (!root) return;

  /** @type {HTMLDialogElement | null} */
  let activeDialog = null;

  /**
   * @param {HTMLDialogElement} dialog
   */
  function openDialog(dialog) {
    if (typeof dialog.showModal !== 'function') {
      dialog.setAttribute('open', '');
    } else {
      dialog.showModal();
    }
    activeDialog = dialog;
  }

  /**
   * @param {HTMLDialogElement | null} dialog
   */
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (activeDialog === dialog) activeDialog = null;
  }

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openTrigger = target.closest('[data-playable-open]');
    if (openTrigger instanceof HTMLElement) {
      const id = openTrigger.getAttribute('data-playable-open');
      const dialog = id ? document.getElementById(id) : null;
      if (dialog instanceof HTMLDialogElement) {
        event.preventDefault();
        openDialog(dialog);
      }
      return;
    }

    if (target.closest('[data-playable-close]')) {
      const dialog = target.closest('dialog');
      if (dialog instanceof HTMLDialogElement) {
        event.preventDefault();
        closeDialog(dialog);
      }
      return;
    }

    if (target instanceof HTMLDialogElement && target.classList.contains('home-playable-dialog')) {
      // Backdrop click (event target is the dialog itself).
      closeDialog(target);
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !activeDialog) return;
    // Native dialog already closes on Escape; keep activeDialog in sync for polyfill path.
    if (!activeDialog.open) activeDialog = null;
  });

  root.querySelectorAll('dialog.home-playable-dialog').forEach((node) => {
    if (!(node instanceof HTMLDialogElement)) return;
    node.addEventListener('close', () => {
      if (activeDialog === node) activeDialog = null;
    });
  });
})();
