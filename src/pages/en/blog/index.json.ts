import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../../../utils/blogLocale';
import { createBlogIndexData } from '../../../utils/blogIndexData';
import { sortByPubDate } from '../../../utils/sort';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = sortByPubDate(resolveBlogPostsForLang(await getCollection('blog'), 'en'));
  return new Response(JSON.stringify(createBlogIndexData(posts, 'en')), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
