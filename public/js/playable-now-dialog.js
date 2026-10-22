/**
 * Shared <dialog> for the homepage Playable Now grid.
 * Title/pitch/media come from the card; canDo bullets hydrate from JSON.
 */
(function initPlayableNowDialogs() {
  const root = document.getElementById('playable');
  const dialog = document.getElementById('playable-dialog');
  const dataNode = document.getElementById('playable-dialog-data');
  if (!root || !(dialog instanceof HTMLDialogElement) || !dataNode) return;

  /** @type {{
   *  ui?: { openLabel?: string, dialogTitlePrefix?: string, dialogTitleSuffix?: string },
   *  items?: Record<string, { canDo: string[], buildNote: string | null }>
   * }} */
  let payload = {};
  try {
    payload = JSON.parse(dataNode.textContent || '{}');
  } catch (_) {
    return;
  }

  const catalog = payload.items || {};
  const ui = {
    openLabel: 'Open',
    dialogTitlePrefix: '',
    dialogTitleSuffix: '',
    ...(payload.ui || {}),
  };

  const titleEl = document.getElementById('playable-dialog-title');
  const pitchEl = document.getElementById('playable-dialog-pitch');
  const categoryEl = document.getElementById('playable-dialog-category');
  const imageEl = document.getElementById('playable-dialog-image');
  const canDoEl = document.getElementById('playable-dialog-can-do');
  const buildNoteEl = document.getElementById('playable-dialog-build-note');
  const openEl = document.getElementById('playable-dialog-open');

  /**
   * @param {string} id
   */
  function fillDialog(id) {
    const detail = catalog[id];
    const card = root.querySelector(`[data-playable-id="${id}"]`);
    if (!detail || !(card instanceof HTMLElement)) return false;

    const title = card.querySelector('.home-playable-title')?.textContent?.trim() || '';
    const pitch = card.querySelector('.home-playable-pitch')?.textContent?.trim() || '';
    const category = card.querySelector('.home-playable-category')?.textContent?.trim() || '';
    const image = card.querySelector('.home-playable-media img');
    const openLink = card.querySelector('a.home-playable-open');

    if (titleEl) {
      titleEl.textContent = `${ui.dialogTitlePrefix || ''}${title}${ui.dialogTitleSuffix || ''}`;
    }
    if (pitchEl) pitchEl.textContent = pitch;
    if (categoryEl) categoryEl.textContent = category;
    if (imageEl instanceof HTMLImageElement && image instanceof HTMLImageElement) {
      imageEl.src = image.currentSrc || image.src;
      imageEl.alt = '';
    }
    if (canDoEl) {
      canDoEl.replaceChildren();
      detail.canDo.forEach((point) => {
        const li = document.createElement('li');
        li.textContent = point;
        canDoEl.appendChild(li);
      });
    }
    if (buildNoteEl) {
      if (detail.buildNote) {
        buildNoteEl.hidden = false;
        buildNoteEl.textContent = detail.buildNote;
      } else {
        buildNoteEl.hidden = true;
        buildNoteEl.textContent = '';
      }
    }
    if (openEl instanceof HTMLAnchorElement && openLink instanceof HTMLAnchorElement) {
      openEl.href = openLink.href;
      openEl.textContent = ui.openLabel;
      openEl.setAttribute('aria-label', `${ui.openLabel} ${title}`);
    }
    return true;
  }

  /**
   * @param {string} id
   */
  function openDialog(id) {
    if (!fillDialog(id)) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialog() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openTrigger = target.closest('[data-playable-open]');
    if (openTrigger instanceof HTMLElement) {
      const id = openTrigger.getAttribute('data-playable-open');
      if (id) {
        event.preventDefault();
        openDialog(id);
      }
      return;
    }

    if (target.closest('[data-playable-close]')) {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (target === dialog) {
      closeDialog();
    }
  });
})();
