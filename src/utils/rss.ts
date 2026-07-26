import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { toLocalizedPath } from '../i18n/utils';
import { blogSlug } from './blogLocale';
import { sortByPubDate } from './sort';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function renderBlogRss(
  posts: CollectionEntry<'blog'>[],
  lang: Lang,
  site: URL,
): string {
  const siteUrl = site.toString().replace(/\/$/, '');
  const channelUrl = `${siteUrl}${toLocalizedPath('/blog/', lang)}`;
  const feedUrl = `${siteUrl}${toLocalizedPath('/feed.xml', lang)}`;
  const title = lang === 'en' ? 'Bloss0m — AI Engineering Updates' : 'Bloss0m — AI Engineering 更新';
  const description = lang === 'en'
    ? 'Enterprise AI, agents, RAG, and public engineering updates from Bloss0m.'
    : 'Bloss0m 的企業 AI、Agent、RAG 與公開工程進度。';
  const items = sortByPubDate(posts)
    .slice(0, 50)
    .map((post) => {
      const url = `${siteUrl}${toLocalizedPath(`/blog/${blogSlug(post)}/`, lang)}`;
      return [
        '<item>',
        `<title>${escapeXml(post.data.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<description>${escapeXml(post.data.description)}</description>`,
        `<pubDate>${post.data.pubDate.toUTCString()}</pubDate>`,
        '</item>',
      ].join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(channelUrl)}</link>`,
    `<description>${escapeXml(description)}</description>`,
    `<language>${lang === 'en' ? 'en' : 'zh-Hant'}</language>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '</channel>',
    '</rss>',
  ].join('');
}
