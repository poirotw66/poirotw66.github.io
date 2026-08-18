import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

/** Collections that use the `en/` subdirectory translation convention. */
export type LocalizedCollection = 'blog' | 'stickers' | 'stickerTools' | 'projects' | 'paperReading';

/** Check whether an entry is an English translation (`en/...` id). */
export function isEnglishEntry(entry: { id: string }): boolean {
  return entry.id.startsWith('en/');
}

/** Strip the `en/` prefix so the slug matches the Chinese counterpart. */
export function baseSlug(entry: { id: string }): string {
  const slug = isEnglishEntry(entry) ? entry.id.slice(3) : entry.id;
  return slug.toLowerCase();
}

/**
 * One entry per item for the given UI language.
 * zh → Chinese files only (filters out en/ entries).
 * en → English translation when present, otherwise Chinese body.
 *
 * Missing English counterparts must fail `npm run check:i18n` in CI/build.
 * Runtime fallback remains only as a last-resort safety net.
 */
export function resolveEntriesForLang<C extends LocalizedCollection>(
  entries: CollectionEntry<C>[],
  lang: Lang,
): CollectionEntry<C>[] {
  const chinese = entries.filter((e) => !isEnglishEntry(e));
  if (lang === 'zh') return chinese;

  const englishBySlug = new Map(
    entries.filter(isEnglishEntry).map((e) => [baseSlug(e), e] as const),
  );
  return chinese.map((e) => englishBySlug.get(baseSlug(e)) ?? e);
}
