import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../../utils/blogLocale';
import { renderBlogRss } from '../../utils/rss';

export const prerender = true;

export async function GET({ site }: { site?: URL }) {
  const posts = resolveBlogPostsForLang(await getCollection('blog'), 'en');
  return new Response(renderBlogRss(posts, 'en', site ?? new URL('https://poirotw66.github.io')), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
