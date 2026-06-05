/**
 * Sort content collection entries by pubDate descending (newest first).
 */
export function sortByPubDate<T extends { data: { pubDate: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

const TIER_ORDER = { flagship: 0, aigc: 1, main: 2, lab: 3 } as const;

type ProjectEntry = { data: { tier: string; featuredOrder?: number; pubDate: Date } };

/** Homepage featured: featuredOrder first, then main projects; default max 6. */
export function getFeaturedProjects<T extends ProjectEntry & { id: string }>(
  entries: T[],
  limit = 6,
): T[] {
  const featured = [...entries]
    .filter((e) => e.data.featuredOrder != null)
    .sort((a, b) => (a.data.featuredOrder ?? 99) - (b.data.featuredOrder ?? 99));

  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }

  const featuredIds = new Set(featured.map((entry) => entry.id));
  const filler = getMainProjects(entries).filter((entry) => !featuredIds.has(entry.id));
  return [...featured, ...filler].slice(0, limit);
}

/** Main projects (not lab): tier flagship, aigc, main; sort by tier then pubDate desc. */
export function getMainProjects<T extends ProjectEntry>(entries: T[]): T[] {
  return [...entries]
    .filter((e) => e.data.tier !== 'lab')
    .sort((a, b) => {
      const tierA = TIER_ORDER[a.data.tier as keyof typeof TIER_ORDER] ?? 2;
      const tierB = TIER_ORDER[b.data.tier as keyof typeof TIER_ORDER] ?? 2;
      if (tierA !== tierB) return tierA - tierB;
      return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    });
}

/** Lab-only projects; sort by pubDate desc. */
export function getLabProjects<T extends ProjectEntry>(entries: T[]): T[] {
  return [...entries]
    .filter((e) => e.data.tier === 'lab')
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
