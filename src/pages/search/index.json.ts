import type { APIRoute } from 'astro';
import { getSearchItems } from '../../utils/searchIndex';
import { withNonIndexHeaders } from '../../utils/nonIndexHeaders';

export const GET: APIRoute = async () => new Response(JSON.stringify(await getSearchItems('zh')), {
  headers: withNonIndexHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
});
