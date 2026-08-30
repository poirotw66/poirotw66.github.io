import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { resolveBlogPostsForLang } from '../../../utils/blogLocale';
import { createBlogIndexData } from '../../../utils/blogIndexData';
import { BLOG_INDEX_PAGE_SIZE, chunkBlogIndexItems } from '../../../utils/blogIndexPagination';
import { sortByPubDate } from '../../../utils/sort';
import { withNonIndexHeaders } from '../../../utils/nonIndexHeaders';

export const prerender = true;

async function getPages() {
  const posts = sortByPubDate(resolveBlogPostsForLang(await getCollection('blog'), 'zh'));
  return chunkBlogIndexItems(createBlogIndexData(posts, 'zh'), BLOG_INDEX_PAGE_SIZE);
}

export async function getStaticPaths() {
  const pages = await getPages();
  return pages.slice(1).map((_, index) => ({
    params: { page: String(index + 2) },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const page = Number(params.page);
  const pages = await getPages();
  const items = Number.isInteger(page) && page >= 2 ? pages[page - 1] : undefined;
  if (!items) return new Response('Not found', { status: 404 });

  return new Response(JSON.stringify(items), {
    headers: withNonIndexHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }),
  });
};
