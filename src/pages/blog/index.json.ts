import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../../utils/blogLocale';
import { createBlogIndexData } from '../../utils/blogIndexData';
import { sortByPubDate } from '../../utils/sort';
import { withNonIndexHeaders } from '../../utils/nonIndexHeaders';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = sortByPubDate(resolveBlogPostsForLang(await getCollection('blog'), 'zh'));
  return new Response(JSON.stringify(createBlogIndexData(posts, 'zh')), {
    headers: withNonIndexHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }),
  });
};
