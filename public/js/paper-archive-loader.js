export function createPaperArchiveLoader({ totalPages, totalCount, initialSlugs, pageSize, fetchPage, onChange = () => {} }) {
  const pages = new Map();
  const pending = new Map();
  const failed = new Set();
  const initial = new Set(initialSlugs);

  const snapshot = () => {
    const loadedCount = initial.size + [...pages.values()].reduce((sum, items) => sum + items.length, 0);
    return {
      pages: [...pages.entries()].sort(([a], [b]) => a - b),
      loadedCount,
      totalCount,
      loading: pending.size > 0,
      failed: failed.size > 0,
      complete: pages.size === totalPages - 1 && loadedCount === totalCount,
    };
  };
  const notify = () => onChange(snapshot());

  function loadPage(page) {
    if (pages.has(page)) return Promise.resolve(pages.get(page));
    if (pending.has(page)) return pending.get(page);
    const request = Promise.resolve()
      .then(() => fetchPage(page))
      .then((items) => {
        const expected = Math.min(pageSize, totalCount - (page - 1) * pageSize);
        const known = new Set([...initial, ...[...pages.values()].flat().map((item) => item.slug)]);
        if (!Array.isArray(items) || items.length !== expected) throw new Error(`Incomplete paper page ${page}`);
        for (const item of items) {
          if (!item || typeof item.slug !== 'string' || !item.slug || known.has(item.slug)) {
            throw new Error(`Invalid or duplicate paper on page ${page}`);
          }
          known.add(item.slug);
        }
        pages.set(page, items);
        failed.delete(page);
        return items;
      })
      .catch((error) => {
        failed.add(page);
        throw error;
      })
      .finally(() => {
        pending.delete(page);
        notify();
      });
    pending.set(page, request);
    notify();
    return request;
  }

  return {
    snapshot,
    async loadNext() {
      for (let page = 2; page <= totalPages; page += 1) {
        if (!pages.has(page)) return loadPage(page);
      }
    },
    async loadAll() {
      const requests = [];
      for (let page = 2; page <= totalPages; page += 1) requests.push(loadPage(page));
      const results = await Promise.allSettled(requests);
      if (results.some((result) => result.status === 'rejected')) throw new Error('Paper archive is incomplete');
    },
  };
}
