import { getCollection } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { baseSlug, resolveEntriesForLang } from './contentLocale';
import { extractPaperEssence } from './paperEssence';

export async function paperEssencePaths(lang: Lang) {
  return resolveEntriesForLang(await getCollection('paperReading'), lang).map((entry) => ({
    params: { slug: baseSlug(entry) },
    props: { points: extractPaperEssence(entry.body ?? '', entry.data.essence) },
  }));
}

/** Keep aggregate compatibility responses aligned with per-note responses. */
export async function paperEssenceMap(lang: Lang) {
  return Object.fromEntries((await paperEssencePaths(lang)).map(({ params, props }) => [params.slug, props.points]));
}
