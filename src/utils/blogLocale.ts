import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

/** English translations live under `src/content/blog/en/` → collection id `en/...`. */
export function isEnglishBlogPost(post: CollectionEntry<'blog'>): boolean {
  return post.id.startsWith('en/');
}

/** URL slug without the `en/` prefix. */
export function blogSlug(post: CollectionEntry<'blog'>): string {
  const slug = isEnglishBlogPost(post) ? post.id.slice(3) : post.id;
  return slug.toLowerCase();
}

/**
 * One entry per article for the given UI language.
 * zh → Chinese files only.
 * en → English translation when present, otherwise Chinese body (UI still English).
 *
 * Missing English counterparts must fail `npm run check:i18n` in CI/build.
 * Runtime fallback remains only as a last-resort safety net.
 */
export function resolveBlogPostsForLang(
  posts: CollectionEntry<'blog'>[],
  lang: Lang,
): CollectionEntry<'blog'>[] {
  const chinese = posts.filter((post) => !isEnglishBlogPost(post));
  if (lang === 'zh') return chinese;

  const englishBySlug = new Map(
    posts.filter(isEnglishBlogPost).map((post) => [blogSlug(post), post]),
  );
  return chinese.map((post) => englishBySlug.get(blogSlug(post)) ?? post);
}

export function filterBlogByLang(
  posts: CollectionEntry<'blog'>[],
  lang: Lang,
): CollectionEntry<'blog'>[] {
  return resolveBlogPostsForLang(posts, lang);
}
