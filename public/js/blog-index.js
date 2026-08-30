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
  const lanePreviews = document.getElementById('blog-lane-previews');
  const moreButton = document.getElementById('blog-list-more');
  const emptyState = document.getElementById('blog-filter-empty');

  if (root && list) {
    const queryInput = root.querySelector('#blog-filter-query');
    const laneSelect = root.querySelector('#blog-filter-lane');
    const categorySelect = root.querySelector('#blog-filter-category');
    const tagSelect = root.querySelector('#blog-filter-tag');
    const resetButton = root.querySelector('#blog-filter-reset');
    const emptyResetButton = document.getElementById('blog-filter-empty-reset');
    const moreFilters = root.querySelector('.blog-filter-more');
    const moreFilterCount = root.querySelector('#blog-filter-more-count');
    const compactFilters = window.matchMedia('(max-width: 639px)');
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

    const remainingPageUrls = () => pageUrls.filter((url) => !loadedPages.has(url));

    const loadNextPage = () => {
      const [nextPageUrl] = remainingPageUrls();
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
      const lane = new URLSearchParams(window.location.search).get('lane');
      if (lane && laneSelect) {
        const hasOption = Array.from(laneSelect.options).some((option) => option.value === lane);
        if (hasOption) laneSelect.value = lane;
      }
    };

    const syncLaneToUrl = (lane) => {
      const url = new URL(window.location.href);
      if (lane) url.searchParams.set('lane', lane);
      else url.searchParams.delete('lane');
      window.history.replaceState({}, '', url);
    };

    const activeFilterCount = () => [
      (queryInput?.value ?? '').trim(),
      laneSelect?.value ?? '',
      categorySelect?.value ?? '',
      tagSelect?.value ?? '',
    ].filter(Boolean).length;

    const activeAdvancedFilterCount = () => [
      laneSelect?.value ?? '',
      categorySelect?.value ?? '',
      tagSelect?.value ?? '',
    ].filter(Boolean).length;

    const filtersActive = () => activeFilterCount() > 0;

    const updateFilterControls = () => {
      const count = activeFilterCount();
      const advancedCount = activeAdvancedFilterCount();
      if (resetButton) resetButton.disabled = count === 0;
      if (moreFilterCount) {
        moreFilterCount.hidden = advancedCount === 0;
        moreFilterCount.textContent = isEn ? `${advancedCount} active` : `已啟用 ${advancedCount} 項`;
      }
    };

    const updateDisclosureForViewport = () => {
      if (moreFilters) moreFilters.open = !compactFilters.matches;
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
      const lane = laneSelect?.value ?? '';
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

    const applyFilters = () => {
      const active = filtersActive();
      updateFilterControls();
      syncLaneToUrl(laneSelect?.value ?? '');
      const matches = matchingItems();
      const rendered = active ? matches : matches.slice(0, visibleLimit);
      renderItems(rendered);
      const showEmpty = active && matches.length === 0;

      if (lanePreviews) lanePreviews.hidden = active;
      if (moreButton) moreButton.hidden = active || rendered.length >= archiveTotal;
      if (list) list.hidden = showEmpty;
      if (emptyState) emptyState.hidden = !showEmpty;
      if (summary) {
        const resultLabel = matches.length === 1 ? 'result' : 'results';
        summary.textContent = isEn
          ? `${active ? matches.length : archiveTotal} ${active ? resultLabel : archiveTotal === 1 ? 'result' : 'results'}${active ? '' : ` · showing ${rendered.length}`}`
          : `共 ${active ? matches.length : archiveTotal} 篇文章${active ? '' : ` · 顯示 ${rendered.length} 篇`}`;
      }
    };

    const showArchiveError = () => {
      if (summary) summary.textContent = isEn
        ? 'Showing the articles loaded so far. The rest of the archive is temporarily unavailable.'
        : '目前顯示已載入的文章，其餘內容暫時無法取得。';
    };

    const applyFiltersWithArchive = () => {
      updateFilterControls();
      syncLaneToUrl(laneSelect?.value ?? '');
      if (!archiveReady) return;
      if (!filtersActive()) {
        applyFilters();
        return;
      }

      if (lanePreviews) lanePreviews.hidden = true;
      if (moreButton) moreButton.hidden = true;
      if (summary) summary.textContent = isEn ? 'Searching the full archive…' : '正在搜尋完整內容庫…';
      list.setAttribute('aria-busy', 'true');
      loadFullArchive()
        .then(applyFilters)
        .catch(showArchiveError)
        .finally(() => list.removeAttribute('aria-busy'));
    };

    readLaneFromUrl();
    updateFilterControls();
    updateDisclosureForViewport();
    compactFilters.addEventListener('change', updateDisclosureForViewport);
    fetch(blogDataUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((manifest) => {
        if (
          !manifest
          || manifest.version !== 1
          || !Array.isArray(manifest.items)
          || !Array.isArray(manifest.pages)
          || !Number.isInteger(manifest.total)
          || !Number.isInteger(manifest.pageSize)
        ) {
          throw new TypeError('Invalid blog index manifest.');
        }

        firstPageItems = manifest.items;
        pageUrls = manifest.pages;
        archiveTotal = manifest.total;
        pageSize = manifest.pageSize;
        visibleLimit = pageSize;
        rebuildAllItems();
        archiveReady = true;
        if (filtersActive()) applyFiltersWithArchive();
        else {
          if (summary) {
            const resultLabel = archiveTotal === 1 ? 'result' : 'results';
            summary.textContent = isEn
              ? `${archiveTotal} ${resultLabel} · showing ${Math.min(pageSize, archiveTotal)}`
              : `共 ${archiveTotal} 篇文章 · 顯示 ${Math.min(pageSize, archiveTotal)} 篇`;
          }
          if (moreButton) moreButton.hidden = archiveTotal <= pageSize;
          updateFilterControls();
        }
      })
      .catch(() => {
        if (summary) summary.textContent = isEn
          ? 'Showing the latest articles. Full filtering is temporarily unavailable.'
          : '目前顯示最新文章，完整篩選暫時無法使用。';
        if (moreButton) moreButton.hidden = true;
      });

    queryInput?.addEventListener('input', applyFiltersWithArchive);
    laneSelect?.addEventListener('change', applyFiltersWithArchive);
    categorySelect?.addEventListener('change', applyFiltersWithArchive);
    tagSelect?.addEventListener('change', applyFiltersWithArchive);
    moreButton?.addEventListener('click', () => {
      if (!archiveReady) return;
      moreButton.disabled = true;
      list.setAttribute('aria-busy', 'true');
      loadNextPage()
        .then(() => {
          visibleLimit += pageSize;
          applyFilters();
        })
        .catch(showArchiveError)
        .finally(() => {
          moreButton.disabled = false;
          list.removeAttribute('aria-busy');
        });
    });
    const resetFilters = () => {
      if (queryInput) queryInput.value = '';
      if (laneSelect) laneSelect.value = '';
      if (categorySelect) categorySelect.value = '';
      if (tagSelect) tagSelect.value = '';
      visibleLimit = pageSize;
      applyFilters();
      updateDisclosureForViewport();
      queryInput?.focus();
    };
    resetButton?.addEventListener('click', resetFilters);
    emptyResetButton?.addEventListener('click', resetFilters);
  }
})();
