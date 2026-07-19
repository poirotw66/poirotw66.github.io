import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { blogSlug } from './blogLocale';
import { baseSlug } from './contentLocale';

export type EditorialCoverVariant = 'agent' | 'rag' | 'engineering' | 'pulse' | 'papers';

export interface EditorialCoverMeta {
  variant: EditorialCoverVariant;
  label: string;
  number: string;
}

const LABELS: Record<EditorialCoverVariant, Record<Lang, string>> = {
  agent: { zh: 'AI Agent 實戰', en: 'AI Agent Practice' },
  rag: { zh: 'Enterprise RAG', en: 'Enterprise RAG' },
  engineering: { zh: 'AI Engineering', en: 'AI Engineering' },
  pulse: { zh: 'AI 趨勢拆解', en: 'Industry Pulse' },
  papers: { zh: '論文精讀', en: 'Paper Notes' },
};

function noteNumber(slug: string): string {
  return slug.match(/^\d+/)?.[0].padStart(3, '0') ?? '000';
}

export function getBlogCoverMeta(post: CollectionEntry<'blog'>, lang: Lang): EditorialCoverMeta {
  const slug = blogSlug(post);
  const hints = [slug, post.data.category, ...(post.data.tags ?? [])].join(' ').toLowerCase();
  let variant: EditorialCoverVariant = 'engineering';

  if (post.data.category === 'Industry Pulse') variant = 'pulse';
  else if (/\brag\b|graphrag|retrieval/.test(hints)) variant = 'rag';
  else if (/\bagent|agentic|multi-agent|\bmcp\b/.test(hints)) variant = 'agent';

  return { variant, label: LABELS[variant][lang], number: noteNumber(slug) };
}

export function getPaperCoverMeta(entry: CollectionEntry<'paperReading'>, lang: Lang): EditorialCoverMeta {
  return {
    variant: 'papers',
    label: LABELS.papers[lang],
    number: noteNumber(baseSlug(entry)),
  };
}
