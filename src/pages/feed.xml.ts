import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../utils/blogLocale';
import { renderBlogRss } from '../utils/rss';

export const prerender = true;

export async function GET({ site }: { site?: URL }) {
  const posts = resolveBlogPostsForLang(await getCollection('blog'), 'zh');
  return new Response(renderBlogRss(posts, 'zh', site ?? new URL('https://www.bloss0m.com')), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
