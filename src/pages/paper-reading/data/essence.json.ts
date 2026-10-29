import type { APIRoute } from 'astro';
import { paperEssenceMap } from '../../../utils/paperEssenceRoute';
import { withNonIndexHeaders } from '../../../utils/nonIndexHeaders';

export const prerender = true;

export const GET: APIRoute = async () => new Response(JSON.stringify(await paperEssenceMap('zh')), {
  headers: withNonIndexHeaders({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  }),
});
