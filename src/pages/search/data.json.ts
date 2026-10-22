import type { APIRoute } from 'astro';
import { getSearchItems } from '../../utils/searchIndex';
import { encodeSearchItems } from '../../../public/js/search-index-codec.js';
import { withNonIndexHeaders } from '../../utils/nonIndexHeaders';

export const GET: APIRoute = async () => new Response(JSON.stringify(encodeSearchItems(await getSearchItems('zh'))), {
  headers: withNonIndexHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
});
