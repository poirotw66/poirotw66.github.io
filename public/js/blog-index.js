(() => {
  const root = document.querySelector('[data-blog-index]');
  const isEn = root?.dataset.lang === 'en';
  const blogDataUrl = root?.dataset.dataUrl ?? '';
  const initialPostCount = Number(root?.dataset.initialCount ?? 18);
  let categoryDisplayLabels = {};
  try {
    categoryDisplayLabels = JSON.parse(root?.dataset.categoryLabels ?? '{}');
  } catch {
    categoryDisplayLabels = {};
  }
  const list = document.getElementById('blog-list');
  const summary = document.getElementById('blog-filter-summary');
  const laneNav = document.getElementById('blog-filter-lane');
  const laneLinks = Array.from(laneNav?.querySelectorAll('[data-lane]') ?? []);
  const resultsHeading = document.getElementById('blog-results-heading');
  const retryButton = document.getElementById('blog-filter-retry');
  const moreButton = document.getElementById('blog-list-more');
  const emptyState = document.getElementById('blog-filter-empty');

  if (root && list) {
    const queryInput = root.querySelector('#blog-filter-query');
    const categorySelect = root.querySelector('#blog-filter-category');
    const tagSelect = root.querySelector('#blog-filter-tag');
    const resetButton = root.querySelector('#blog-filter-reset');
    const emptyResetButton = document.getElementById('blog-filter-empty-reset');
    const moreFilterCount = root.querySelector('#blog-filter-more-count');
    let selectedLane = '';
    let requestVersion = 0;
    let manifestPromise;
    let manifestFailed = false;
    let retryMode = 'filters';
    let archiveReady = false;
    let archiveTotal = initialPostCount;
    let pageSize = initialPostCount;
    let firstPageItems = [];
    let pageUrls = [];
    let allItems = [];
    let visibleLimit = initialPostCount;
    let fullArchivePromise;
    const loadedPages = new Map();
    const pageRequests = new Map();

    const rebuildAllItems = () => {
      allItems = [
        ...firstPageItems,
        ...pageUrls.flatMap((url) => loadedPages.get(url) ?? []),
      ];
    };

    const loadPage = (url) => {
      if (loadedPages.has(url)) return Promise.resolve(loadedPages.get(url));
      if (!pageRequests.has(url)) {
        const request = fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((items) => {
            if (!Array.isArray(items)) throw new TypeError('Invalid blog index page.');
            loadedPages.set(url, items);
            rebuildAllItems();
            return items;
          })
          .catch((error) => {
            pageRequests.delete(url);
            throw error;
          });
        pageRequests.set(url, request);
      }
      return pageRequests.get(url);
    };

    const loadNextPage = () => {
      const nextPageUrl = pageUrls[Math.floor(visibleLimit / pageSize) - 1];
      return nextPageUrl ? loadPage(nextPageUrl) : Promise.resolve([]);
    };

    const loadFullArchive = () => {
      if (!fullArchivePromise) {
        fullArchivePromise = Promise.all(pageUrls.map(loadPage))
          .then(() => allItems)
          .catch((error) => {
            fullArchivePromise = undefined;
            throw error;
          });
      }
      return fullArchivePromise;
    };

    const readLaneFromUrl = () => {
      const lane = new URLSearchParams(window.location.search).get('lane') ?? '';
      selectedLane = laneLinks.some((link) => link.dataset.lane === lane) ? lane : '';
      updateFilterControls();
    };

    const selectedLaneLabel = () => laneLinks.find((link) => link.dataset.lane === selectedLane)?.dataset.laneLabel ?? '';

    const syncLaneToUrl = (lane) => {
      const url = new URL(window.location.href);
      if (lane) url.searchParams.set('lane', lane);
      else url.searchParams.delete('lane');
      window.history.replaceState({}, '', url);
    };

    const activeFilterCount = () => [
      (queryInput?.value ?? '').trim(),
      selectedLane,
      categorySelect?.value ?? '',
      tagSelect?.value ?? '',
    ].filter(Boolean).length;

    const activeAdvancedFilterCount = () => [
      categorySelect?.value ?? '',
      tagSelect?.value ?? '',
    ].filter(Boolean).length;

    const filtersActive = () => activeFilterCount() > 0;

    const updateFilterControls = () => {
      const count = activeFilterCount();
      const advancedCount = activeAdvancedFilterCount();
      if (resetButton) resetButton.disabled = count === 0;
      laneLinks.forEach((link) => {
        if (link.dataset.lane === selectedLane) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      if (moreFilterCount) {
        moreFilterCount.hidden = advancedCount === 0;
        moreFilterCount.textContent = isEn ? `${advancedCount} active` : `已啟用 ${advancedCount} 項`;
      }
    };

    const createItem = (item) => {
      const row = document.createElement('li');
      row.className = 'blog-list-item';

      const media = document.createElement('a');
      media.href = item.href;
      media.className = 'blog-list-thumb';
      media.setAttribute('aria-hidden', 'true');
      media.tabIndex = -1;
      const cover = document.createElement('div');
      cover.className = `editorial-cover editorial-cover--${item.coverVariant} editorial-cover--thumb${item.image ? '' : ' editorial-cover--generated'}`;
      if (item.image) {
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = '';
        image.className = 'editorial-cover-image';
        image.width = 200;
        image.height = 125;
        image.loading = 'lazy';
        image.fetchPriority = 'low';
        image.decoding = 'async';
        cover.appendChild(image);
      } else {
        const fallbackTitle = document.createElement('span');
        fallbackTitle.className = 'editorial-cover-fallback-title';
        fallbackTitle.textContent = item.title;
        cover.appendChild(fallbackTitle);
      }
      const topic = document.createElement('span');
      topic.className = 'editorial-cover-topic';
      topic.textContent = item.coverLabel;
      cover.appendChild(topic);
      const brand = document.createElement('span');
      brand.className = 'editorial-cover-brand';
      const mark = document.createElement('span');
      mark.className = 'editorial-cover-mark';
      mark.setAttribute('aria-hidden', 'true');
      brand.appendChild(mark);
      const brandName = document.createElement('span');
      brandName.textContent = 'Bloss0m';
      brand.appendChild(brandName);
      const note = document.createElement('span');
      note.className = 'editorial-cover-number';
      note.textContent = `Note ${item.coverNumber}`;
      brand.appendChild(note);
      cover.appendChild(brand);
      media.appendChild(cover);
      row.appendChild(media);

      const body = document.createElement('div');
      body.className = 'blog-list-body';
      const title = document.createElement('a');
      title.href = item.href;
      title.textContent = item.title;
      body.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${categoryDisplayLabels[item.category] ?? item.category} · ${item.date}`;
      body.appendChild(meta);

      if (item.tags.length > 0) {
        const tags = document.createElement('ul');
        tags.className = 'post-tags';
        item.tags.forEach((tag) => {
          const tagItem = document.createElement('li');
          tagItem.className = 'post-tag-item';
          const tagLink = document.createElement('a');
          tagLink.className = 'tag-pill';
          tagLink.href = tag.href;
          tagLink.textContent = tag.label;
          tagItem.appendChild(tagLink);
          tags.appendChild(tagItem);
        });
        if (item.tags.length > 3) {
          const overflow = document.createElement('li');
          overflow.className = 'post-tags-overflow';
          const extraTagCount = item.tags.length - 3;
          overflow.textContent = `+${extraTagCount}`;
          overflow.setAttribute('aria-label', isEn ? `${extraTagCount} additional tags` : `另外 ${extraTagCount} 個標籤`);
          tags.appendChild(overflow);
        }
        body.appendChild(tags);
      }

      if (item.description) {
        const description = document.createElement('p');
        description.className = 'blog-list-desc';
        description.textContent = item.description;
        body.appendChild(description);
      }
      row.appendChild(body);
      return row;
    };

    const renderItems = (items) => {
      const fragment = document.createDocumentFragment();
      items.forEach((item) => fragment.appendChild(createItem(item)));
      list.replaceChildren(fragment);
    };

    const matchingItems = () => {
      const query = (queryInput?.value ?? '').trim().toLowerCase();
      const lane = selectedLane;
      const category = categorySelect?.value ?? '';
      const tag = tagSelect?.value ?? '';
      return allItems.filter((item) => {
        const searchText = [item.title, item.description, item.category, ...item.tags.map((entry) => entry.label)]
          .join(' ')
          .toLowerCase();
        return (!query || searchText.includes(query))
          && (!lane || item.lanes.includes(lane))
          && (!category || item.category === category)
          && (!tag || item.tags.some((entry) => entry.label === tag));
      });
    };

    const setStatus = (message, retry = false) => {
      if (summary) summary.textContent = message;
      if (retryButton) retryButton.hidden = !retry;
    };

    const resultCount = (total, shown) => isEn
      ? `${total} ${total === 1 ? 'article' : 'articles'} · showing ${shown}`
      : `共 ${total} 篇文章 · 顯示 ${shown} 篇`;

    const renderResults = () => {
      const active = filtersActive();
      const matches = matchingItems();
      const rendered = active ? matches : matches.slice(0, visibleLimit);
      renderItems(rendered);
      list.hidden = active && matches.length === 0;
      if (emptyState) emptyState.hidden = !list.hidden;
      if (moreButton) moreButton.hidden = active || rendered.length >= archiveTotal;
      if (resultsHeading) resultsHeading.textContent = active
        ? (isEn ? 'Filtered articles' : '篩選結果')
        : (isEn ? 'Latest articles' : '最新文章');
      const laneText = selectedLane
        ? (isEn ? ` · Reading path: ${selectedLaneLabel()}` : ` · 閱讀路徑：${selectedLaneLabel()}`)
        : '';
      setStatus(`${resultCount(active ? matches.length : archiveTotal, rendered.length)}${laneText}`);
      list.removeAttribute('aria-busy');
    };

    const showArchiveError = (version, mode = 'filters') => {
      if (version !== requestVersion) return;
      retryMode = mode;
      list.removeAttribute('aria-busy');
      setStatus(isEn
        ? 'The archive is not fully loaded. Current results may be incomplete.'
        : '內容庫尚未完整載入，目前結果可能不完整。', true);
    };

    const applyFiltersWithArchive = () => {
      const version = ++requestVersion;
      updateFilterControls();
      syncLaneToUrl(selectedLane);
      if (!archiveReady) {
        setStatus(manifestFailed
          ? (isEn ? 'Full filtering is unavailable. The latest articles remain below.' : '完整篩選暫時無法使用，以下仍為最新文章。')
          : (isEn ? 'Preparing filters. Latest articles remain below.' : '正在準備篩選，以下仍為最新文章。'), manifestFailed);
        return;
      }
      if (!filtersActive()) {
        renderResults();
        return;
      }
      if (moreButton) moreButton.hidden = true;
      list.setAttribute('aria-busy', 'true');
      setStatus(isEn
        ? 'Searching the full archive. Results below have not updated yet.'
        : '正在搜尋完整內容庫，以下結果尚未更新。');
      loadFullArchive()
        .then(() => { if (version === requestVersion) renderResults(); })
        .catch(() => showArchiveError(version));
    };

    const loadManifest = () => {
      if (manifestPromise) return manifestPromise;
      manifestFailed = false;
      manifestPromise = fetch(blogDataUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((manifest) => {
          if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.items)
            || !Array.isArray(manifest.pages) || !Number.isInteger(manifest.total)
            || !Number.isInteger(manifest.pageSize)) {
            throw new TypeError('Invalid blog index manifest.');
          }
          firstPageItems = manifest.items;
          pageUrls = manifest.pages;
          archiveTotal = manifest.total;
          pageSize = manifest.pageSize;
          visibleLimit = pageSize;
          rebuildAllItems();
          archiveReady = true;
          const rawLane = new URLSearchParams(window.location.search).get('lane');
          if (rawLane && rawLane !== selectedLane) syncLaneToUrl(selectedLane);
          if (filtersActive()) applyFiltersWithArchive();
          else {
            updateFilterControls();
            if (moreButton) moreButton.hidden = list.children.length >= archiveTotal;
            setStatus(resultCount(archiveTotal, list.children.length));
          }
        })
        .catch((error) => {
          manifestPromise = undefined;
          manifestFailed = true;
          archiveReady = false;
          if (moreButton) moreButton.hidden = true;
          list.removeAttribute('aria-busy');
          setStatus(isEn
            ? 'Full filtering is unavailable. The latest articles remain below.'
            : '完整篩選暫時無法使用，以下仍為最新文章。', true);
          throw error;
        });
      return manifestPromise;
    };

    readLaneFromUrl();
    if (moreButton) moreButton.hidden = true;
    setStatus(isEn
      ? 'Preparing filters. Latest articles remain below.'
      : '正在準備篩選，以下仍為最新文章。');
    loadManifest().catch(() => {});

    queryInput?.addEventListener('input', applyFiltersWithArchive);
    categorySelect?.addEventListener('change', applyFiltersWithArchive);
    tagSelect?.addEventListener('change', applyFiltersWithArchive);
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href*="lane="]');
      if (!link || (!root.contains(link) && !document.getElementById('blog-lane-previews')?.contains(link))
        || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        || link.target && link.target !== '_self') return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      const lane = url.searchParams.get('lane');
      if (!laneLinks.some((option) => option.dataset.lane === lane)) return;
      event.preventDefault();
      selectedLane = lane;
      applyFiltersWithArchive();
    });
    laneNav?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-lane=""]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectedLane = '';
      applyFiltersWithArchive();
    });
    window.addEventListener('pageshow', () => {
      const oldLane = selectedLane;
      readLaneFromUrl();
      if (oldLane !== selectedLane && archiveReady) applyFiltersWithArchive();
    });
    retryButton?.addEventListener('click', () => {
      retryButton.hidden = true;
      if (!archiveReady) loadManifest().catch(() => {});
      else if (retryMode === 'more') moreButton?.click();
      else applyFiltersWithArchive();
    });
    moreButton?.addEventListener('click', () => {
      if (!archiveReady) return;
      const version = requestVersion;
      moreButton.disabled = true;
      list.setAttribute('aria-busy', 'true');
      loadNextPage()
        .then((newItems) => {
          if (version !== requestVersion) return;
          visibleLimit += pageSize;
          const shown = new Set(Array.from(list.children, (row) => row.querySelector('.blog-list-body > a')?.href));
          const fragment = document.createDocumentFragment();
          let firstTitle;
          newItems.forEach((item) => {
            if (shown.has(new URL(item.href, window.location.href).href)) return;
            const row = createItem(item);
            firstTitle ??= row.querySelector('.blog-list-body > a');
            fragment.appendChild(row);
          });
          list.appendChild(fragment);
          if (moreButton) moreButton.hidden = list.children.length >= archiveTotal;
          setStatus(resultCount(archiveTotal, list.children.length));
          if (firstTitle) { firstTitle.tabIndex = -1; firstTitle.focus(); }
        })
        .catch(() => showArchiveError(version, 'more'))
        .finally(() => {
          moreButton.disabled = false;
          if (version === requestVersion) list.removeAttribute('aria-busy');
        });
    });
    const resetFilters = () => {
      if (queryInput) queryInput.value = '';
      selectedLane = '';
      if (categorySelect) categorySelect.value = '';
      if (tagSelect) tagSelect.value = '';
      visibleLimit = pageSize;
      applyFiltersWithArchive();
      queryInput?.focus();
    };
    resetButton?.addEventListener('click', resetFilters);
    emptyResetButton?.addEventListener('click', resetFilters);
  }
})();
