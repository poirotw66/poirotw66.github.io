import { createPaperArchiveLoader } from './paper-archive-loader.js';

const root = document;
const list = document.getElementById('paper-reading-list');
const summary = document.getElementById('paper-reading-summary');
const moreBtn = document.getElementById('paper-list-more');
const statusEl = document.getElementById('paper-list-status');
if (list) {
  const queryEl = root.querySelector('#filter-query');
  const fieldEl = root.querySelector('#filter-field');
  const difficultyEl = root.querySelector('#filter-difficulty');
  const yearEl = root.querySelector('#filter-year');
  const resetEl = document.getElementById('filter-reset');
  const isEn = document.documentElement.lang === 'en';

  const initialItems = [...list.querySelectorAll('[data-paper-reading-item="1"]')];
  initialItems.forEach((item) => { item.dataset.archivePage = '1'; });
  const totalPages = Number(moreBtn?.getAttribute('data-total-pages') ?? '1');
  const totalCount = Number(moreBtn?.getAttribute('data-total-count') ?? initialItems.length);
  const errorEl = document.getElementById('paper-list-error');
  const retryBtn = document.getElementById('paper-list-retry');
  let archive;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const createPaperCard = (raw) => {
    const item = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]));
    if (raw.series) item.series = Object.fromEntries(Object.entries(raw.series).map(([key, value]) => [key, escapeHtml(value)]));
    const li = document.createElement('li');
    li.className = 'blog-list-item';
    li.setAttribute('data-paper-reading-item', '1');
    li.setAttribute('data-year', raw.year);
    li.setAttribute('data-field', raw.field);
    li.setAttribute('data-difficulty', raw.difficulty);
    li.setAttribute('data-search-text', raw.searchText);

    let thumbHtml = '';
    if (item.image) {
      thumbHtml = `<a href="${item.href}" class="blog-list-thumb" aria-hidden="true" tabindex="-1"><img src="${item.image}" alt="" class="blog-list-thumb-img" width="200" height="125" loading="lazy" decoding="async" /></a>`;
    }

    let seriesHtml = '';
    if (item.series) {
      const seriesHref = isEn ? `/en/paper-reading/series/${item.series.id}/` : `/paper-reading/series/${item.series.id}/`;
      seriesHtml = `<a class="series-chip" href="${seriesHref}">${item.series.title}: Part ${item.series.part}</a><span class="meta-sep">,</span>`;
    }

    let diffHtml = '';
    if (item.difficulty) {
      diffHtml = `<span class="difficulty difficulty-${item.difficulty}">${item.difficultyLabel}</span>`;
    }

    let pathHtml = '';
    if (item.readingPathTitle) {
      pathHtml = `<span class="reading-path-chip">${item.readingPathTitle}</span>`;
    }

    let fieldHtml = '';
    if (item.field) {
      fieldHtml = `<span class="meta-sep">,</span><span>${item.field}</span>`;
    }

    const noteLabel = isEn ? 'Note' : '筆記';
    const paperLabel = isEn ? 'Paper' : '論文';
    const essenceSummary = isEn ? 'Understand it in 90 seconds' : '90 秒掌握這篇論文';
    const readFull = isEn ? 'Read the full deep dive' : '進入完整精讀';

    li.innerHTML = `
      ${thumbHtml}
      <div class="blog-list-body">
        <h3 class="blog-list-title"><a href="${item.href}">${item.title}</a></h3>
        <div class="paper-list-labels">
          ${diffHtml}
          ${pathHtml}
        </div>
        <div class="meta">
          ${seriesHtml}
          <span>${noteLabel}: ${item.formattedDate}</span>
          <span class="meta-sep">,</span>
          <span>${paperLabel}: ${item.year}</span>
          ${fieldHtml}
        </div>
        <p class="blog-list-desc">${item.description}</p>
        <details class="paper-essence" data-paper-essence="${item.slug}">
          <summary>${essenceSummary}</summary>
          <div class="paper-essence-content" data-essence-content>
            <a href="${item.href}" class="paper-essence-read" data-paper-next="essence">
              ${readFull} <span aria-hidden="true">→</span>
            </a>
          </div>
        </details>
      </div>
    `;
    return li;
  };

  const apply = () => {
    const query = (queryEl?.value ?? '').trim().toLowerCase();
    const field = fieldEl?.value ?? '';
    const difficulty = difficultyEl?.value ?? '';
    const year = yearEl?.value ?? '';
    let visibleCount = 0;

    const items = list.querySelectorAll('[data-paper-reading-item="1"]');
    items.forEach((el) => {
      const searchText = (el.getAttribute('data-search-text') ?? '').toLowerCase();
      const okQuery = !query || searchText.includes(query);
      const okField = !field || el.getAttribute('data-field') === field;
      const okDifficulty = !difficulty || el.getAttribute('data-difficulty') === difficulty;
      const okYear = !year || el.getAttribute('data-year') === year;
      const visible = okQuery && okField && okDifficulty && okYear;
      el.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });

    const state = archive.snapshot();
    const filtering = Boolean(query || field || difficulty || year);
    if (summary) {
      summary.textContent = state.loading && filtering
        ? (isEn ? `Searching… ${state.loadedCount} of ${totalCount} notes loaded.` : `搜尋中…已載入 ${state.loadedCount} / ${totalCount} 篇。`)
        : filtering
          ? (state.complete
            ? (isEn ? `${visibleCount} result(s) across ${totalCount} notes` : `共 ${visibleCount} 筆結果，已搜尋 ${totalCount} 篇精讀`)
            : (isEn ? `Partial results: ${visibleCount} match(es); ${state.loadedCount} of ${totalCount} notes loaded.` : `部分結果：${visibleCount} 篇符合，已載入 ${state.loadedCount} / ${totalCount} 篇。`))
          : (isEn ? `${totalCount} notes; ${state.loadedCount} loaded` : `${totalCount} 篇精讀，已載入 ${state.loadedCount} 篇`);
    }
    if (statusEl) statusEl.textContent = isEn ? `Showing ${state.loadedCount} of ${totalCount} notes` : `已顯示 ${state.loadedCount} / ${totalCount} 篇精讀`;
    if (moreBtn) {
      moreBtn.disabled = state.loading;
      moreBtn.style.display = state.complete ? 'none' : '';
    }
    if (errorEl) errorEl.hidden = !state.failed;
    if (retryBtn) retryBtn.disabled = state.loading;
    list.setAttribute('aria-busy', String(state.loading));
  };

  archive = createPaperArchiveLoader({
    totalPages,
    totalCount,
    initialSlugs: initialItems.map((item) => item.querySelector('[data-paper-essence]')?.dataset.paperEssence),
    pageSize: initialItems.length,
    fetchPage: async (page) => {
      const url = `${isEn ? '/en' : ''}/paper-reading/data/${page}.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Paper page ${page}: HTTP ${response.status}`);
      const items = await response.json();
      const localUrl = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\x00-\x20]/.test(value);
      if (!Array.isArray(items) || items.some((item) => !item || typeof item.slug !== 'string' || !localUrl(item.href) || (item.image && !localUrl(item.image)) || !['title', 'description', 'searchText', 'formattedDate', 'year', 'field', 'difficulty'].every((key) => typeof item[key] === 'string') || (item.series && (typeof item.series.id !== 'string' || !/^[a-z0-9-]+$/.test(item.series.id))))) throw new Error('Invalid paper page');
      return items;
    },
    onChange: (state) => {
      for (const [page, items] of state.pages) {
        if (list.querySelector(`[data-archive-page="${page}"]`)) continue;
        const fragment = document.createDocumentFragment();
        for (const item of items) {
          const card = createPaperCard(item);
          card.dataset.archivePage = String(page);
          fragment.appendChild(card);
        }
        const next = [...list.children].find((item) => Number(item.dataset.archivePage) > page);
        list.insertBefore(fragment, next ?? null);
      }
      apply();
    },
  });

  const hasFilters = () => Boolean(queryEl?.value.trim() || fieldEl?.value || difficultyEl?.value || yearEl?.value);
  const load = () => (hasFilters() ? archive.loadAll() : archive.loadNext()).catch(() => apply());
  const onFilterInput = () => {
    if (hasFilters() && !archive.snapshot().complete && !archive.snapshot().failed) load();
    apply();
  };
  moreBtn?.addEventListener('click', load);
  retryBtn?.addEventListener('click', load);
  queryEl?.addEventListener('input', onFilterInput);
  fieldEl?.addEventListener('change', onFilterInput);
  difficultyEl?.addEventListener('change', onFilterInput);
  yearEl?.addEventListener('change', onFilterInput);
  resetEl?.addEventListener('click', () => {
    if (queryEl) queryEl.value = '';
    if (fieldEl) fieldEl.value = '';
    if (difficultyEl) difficultyEl.value = '';
    if (yearEl) yearEl.value = '';
    apply();
  });

  const essenceRequests = new Map();
  const loadEssence = (slug) => {
    if (!essenceRequests.has(slug)) {
      const request = fetch(`${isEn ? '/en' : ''}/paper-reading/data/essence/${encodeURIComponent(slug)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error('Failed to load paper summary');
          return response.json();
        })
        .then((points) => {
          if (!Array.isArray(points) || points.some((point) => !Array.isArray(point) || point.length !== 2 || point.some((value) => typeof value !== 'string'))) throw new Error('Invalid paper summary');
          return points;
        })
        .catch((error) => { essenceRequests.delete(slug); throw error; });
      essenceRequests.set(slug, request);
    }
    return essenceRequests.get(slug);
  };

  list.addEventListener('toggle', (event) => {
    const details = event.target;
    if (!details || !details.matches || !details.matches('details.paper-essence') || !details.open) return;
    const content = details.querySelector('[data-essence-content]');
    if (!content || content.querySelector('dl')) return;

    const slug = details.getAttribute('data-paper-essence');
    if (!slug) return;

    loadEssence(slug)
      .then((points) => {
        if (content.querySelector('dl')) return;
        content.querySelector('[data-essence-error]')?.remove();
        if (points && points.length > 0) {
          const dl = document.createElement('dl');
          points.forEach(([label, text]) => {
            const div = document.createElement('div');
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            dd.textContent = text;
            div.appendChild(dt);
            div.appendChild(dd);
            dl.appendChild(div);
          });
          const readLink = content.querySelector('.paper-essence-read');
          if (readLink) {
            content.insertBefore(dl, readLink);
          } else {
            content.appendChild(dl);
          }
        }
      })
      .catch(() => {
        let message = content.querySelector('[data-essence-error]');
        if (!message) {
          message = document.createElement('p');
          message.dataset.essenceError = '';
          message.setAttribute('role', 'status');
          content.prepend(message);
        }
        message.textContent = isEn ? 'Summary unavailable. Close and reopen to retry, or read the full note.' : '摘要暫時無法載入。可收合後重新展開重試，或進入完整精讀。';
      });
  }, true);

  apply();
}
