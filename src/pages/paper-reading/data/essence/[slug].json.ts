import type { APIRoute } from 'astro';
import { paperEssencePaths } from '../../../../utils/paperEssenceRoute';
import { withNonIndexHeaders } from '../../../../utils/nonIndexHeaders';

export const prerender = true;
export const getStaticPaths = () => paperEssencePaths('zh');
export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(props.points), {
  headers: withNonIndexHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
});
