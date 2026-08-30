import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../../utils/blogLocale';
import { createBlogIndexData } from '../../utils/blogIndexData';
import { createBlogIndexManifest } from '../../utils/blogIndexPagination';
import { sortByPubDate } from '../../utils/sort';
import { withNonIndexHeaders } from '../../utils/nonIndexHeaders';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = sortByPubDate(resolveBlogPostsForLang(await getCollection('blog'), 'zh'));
  const items = createBlogIndexData(posts, 'zh');
  return new Response(JSON.stringify(createBlogIndexManifest(items, 'zh')), {
    headers: withNonIndexHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }),
  });
};
