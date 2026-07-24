import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { toLocalizedPath } from '../i18n/utils';
import { getPostLanes } from './blogLanes';
import { blogSlug } from './blogLocale';
import { tagToUrlSlug } from './tag';
import { getBlogCoverMeta, type EditorialCoverVariant } from './editorialCover';

function responsiveCoverPath(image: string | undefined, variant: 'thumb' | 'card' | 'hero') {
  if (!image?.startsWith('/') || !/\.(?:avif|jpe?g|png|webp)$/i.test(image)) return image;
  return image.replace(/\.(?:avif|jpe?g|png|webp)$/i, `-${variant}.webp`);
}

export interface BlogIndexItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: { label: string; href: string }[];
  lanes: string[];
  href: string;
  image?: string;
  date: string;
  dateIso: string;
  coverVariant: EditorialCoverVariant;
  coverLabel: string;
  coverNumber: string;
}

export function createBlogIndexData(
  posts: CollectionEntry<'blog'>[],
  lang: Lang,
): BlogIndexItem[] {
  const locale = lang === 'en' ? 'en-US' : 'zh-TW';
  return posts.map((post) => {
    const cover = getBlogCoverMeta(post, lang);
    return {
      id: blogSlug(post),
      title: post.data.title,
      description: post.data.description,
      category: post.data.category,
      tags: (post.data.tags ?? []).map((tag) => ({
        label: tag,
        href: toLocalizedPath(`/blog/tag/${tagToUrlSlug(tag)}/`, lang),
      })),
      lanes: getPostLanes(post),
      href: toLocalizedPath(`/blog/${blogSlug(post)}/`, lang),
      image: responsiveCoverPath(post.data.image, 'thumb'),
      date: post.data.pubDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: lang === 'en' ? 'short' : '2-digit',
        day: 'numeric',
      }),
      dateIso: post.data.pubDate.toISOString().slice(0, 10),
      coverVariant: cover.variant,
      coverLabel: cover.label,
      coverNumber: cover.number,
    };
  });
}
