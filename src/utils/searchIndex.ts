import { getCollection } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { toLocalizedPath } from '../i18n/utils';
import { sortByPubDate } from './sort';
import { blogSlug, resolveBlogPostsForLang } from './blogLocale';
import { baseSlug, resolveEntriesForLang } from './contentLocale';

export interface SearchItem {
  type: 'blog' | 'paperReading' | 'projects';
  title: string;
  description: string;
  url: string;
  date: string;
  tags: string[];
  category: string;
}

export async function getSearchItems(lang: Lang): Promise<SearchItem[]> {
  const isEn = lang === 'en';
  const [blogEntries, paperEntries, projectEntries] = await Promise.all([
    getCollection('blog'),
    getCollection('paperReading'),
    getCollection('projects'),
  ]);
  const blog = sortByPubDate(resolveBlogPostsForLang(blogEntries, lang)).map((entry): SearchItem => ({
    type: 'blog',
    title: entry.data.title,
    description: entry.data.description,
    url: toLocalizedPath(`/blog/${blogSlug(entry)}/`, lang),
    date: entry.data.pubDate.toISOString(),
    tags: entry.data.tags ?? [],
    category: entry.data.category,
  }));
  const paperReading = sortByPubDate(resolveEntriesForLang(paperEntries, lang)).map((entry): SearchItem => ({
    type: 'paperReading',
    title: entry.data.title,
    description: entry.data.description,
    url: toLocalizedPath(`/paper-reading/${baseSlug(entry)}/`, lang),
    date: entry.data.pubDate.toISOString(),
    tags: entry.data.tags ?? [],
    category: entry.data.field ?? (isEn ? 'Paper Reading' : '論文精讀'),
  }));
  const projects = sortByPubDate(resolveEntriesForLang(projectEntries, lang)).map((entry): SearchItem => ({
    type: 'projects',
    title: entry.data.title,
    description: entry.data.description,
    url: toLocalizedPath(`/projects/${baseSlug(entry)}/`, lang),
    date: entry.data.pubDate.toISOString(),
    tags: entry.data.metrics ?? [],
    category: isEn ? 'Project' : '專案',
  }));

  return [...blog, ...paperReading, ...projects].sort((a, b) => b.date.localeCompare(a.date));
}
