/**
 * Sort content collection entries by pubDate descending (newest first).
 */
export function sortByPubDate<T extends { data: { pubDate: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
