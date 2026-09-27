import type { CollectionEntry } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from '../i18n/ui';
import { baseSlug } from './contentLocale.ts';
import { paperReadingPathForSlug } from '../data/paperReadingPaths.ts';

export const PAPER_INDEX_PAGE_SIZE = 24;

export interface PaperIndexItem {
  slug: string;
  href: string;
  title: string;
  description: string;
  image?: string;
  year: string;
  field: string;
  difficulty: string;
  difficultyLabel: string;
  formattedDate: string;
  series?: {
    id: string;
    title: string;
    part: number;
  };
  readingPathTitle?: string;
  searchText: string;
}

export function createPaperIndexItem(
  entry: CollectionEntry<'paperReading'>,
  lang: Lang,
): PaperIndexItem {
  const slug = baseSlug(entry);
  const href = lang === 'en' ? `/en/paper-reading/${slug}/` : `/paper-reading/${slug}/`;
  const thumbnail = entry.data.image?.replace(/\.(?:avif|jpe?g|png|webp)$/i, '-thumb.webp');
  const image = thumbnail && existsSync(join(process.cwd(), 'public', thumbnail.slice(1))) ? thumbnail : entry.data.image;
  const readingPath = paperReadingPathForSlug(slug);
  const year = String(entry.data.paper.year);
  const field = entry.data.field ?? '';
  const difficulty = entry.data.difficulty ?? '';
  const difficultyLabel = {
    intro: lang === 'en' ? 'Introductory' : '入門',
    intermediate: lang === 'en' ? 'Intermediate' : '中階',
    advanced: lang === 'en' ? 'Advanced' : '進階',
  }[entry.data.difficulty ?? 'intro'];

  const formattedDate = entry.data.pubDate.toLocaleDateString(
    lang === 'en' ? 'en-US' : 'zh-TW',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  const searchText = [
    entry.data.title,
    entry.data.description,
    field,
    difficulty,
    entry.data.paper.title,
    ...(entry.data.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return {
    slug,
    href,
    title: entry.data.title,
    description: entry.data.description,
    image,
    year,
    field,
    difficulty,
    difficultyLabel,
    formattedDate,
    series: entry.data.series,
    readingPathTitle: readingPath?.title[lang],
    searchText,
  };
}

export function chunkPaperIndexItems<T>(items: T[], pageSize = PAPER_INDEX_PAGE_SIZE): T[][] {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError('Paper index page size must be a positive integer.');
  }
  const chunks: T[][] = [];
  for (let offset = 0; offset < items.length; offset += pageSize) {
    chunks.push(items.slice(offset, offset + pageSize));
  }
  return chunks;
}
