import type { APIRoute } from 'astro';
import { getSearchItems } from '../../utils/searchIndex';

export const GET: APIRoute = async () => new Response(JSON.stringify(await getSearchItems('zh')), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
