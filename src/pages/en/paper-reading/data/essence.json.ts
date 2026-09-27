import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { baseSlug, resolveEntriesForLang } from '../../../../utils/contentLocale';
import { extractPaperEssence, type PaperEssencePoint } from '../../../../utils/paperEssence';
import { withNonIndexHeaders } from '../../../../utils/nonIndexHeaders';

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = resolveEntriesForLang(await getCollection('paperReading'), 'en');
  const essenceMap: Record<string, PaperEssencePoint[]> = {};

  for (const entry of entries) {
    const slug = baseSlug(entry);
    essenceMap[slug] = extractPaperEssence(entry.body ?? '');
  }

  return new Response(JSON.stringify(essenceMap), {
    headers: withNonIndexHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }),
  });
};
