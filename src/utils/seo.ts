/**
 * Indexability policy for generated hub pages.
 *
 * Search Console reports a large "crawled - currently not indexed" bucket for
 * this site. Thin aggregation pages (a tag or series holding one or two posts)
 * are the cheapest URLs to remove from that bucket: they add no content Google
 * cannot already read on the posts themselves, and they churn — a tag dropped
 * from its last post turns into a 404. Keep them reachable for crawling, keep
 * them out of the index and out of the sitemap.
 */

import { MIN_PAPER_READING_TOPIC_ENTRIES } from '../data/paperReadingTopics.mjs';

/** Minimum posts a blog tag page needs before it is worth indexing. */
export const MIN_INDEXABLE_TAG_POSTS = 3;

/** Minimum entries a paper-reading series page needs before it is worth indexing. */
export const MIN_INDEXABLE_SERIES_ENTRIES = 2;

/** True when a tag page holds enough posts to stand on its own in search. */
export function isTagPageIndexable(postCount: number): boolean {
  return postCount >= MIN_INDEXABLE_TAG_POSTS;
}

/** True when a series page holds enough entries to stand on its own in search. */
export function isSeriesPageIndexable(entryCount: number): boolean {
  return entryCount >= MIN_INDEXABLE_SERIES_ENTRIES;
}

/** True when a research topic page has enough original navigation value for search. */
export function isPaperTopicPageIndexable(entryCount: number): boolean {
  return entryCount >= MIN_PAPER_READING_TOPIC_ENTRIES;
}
