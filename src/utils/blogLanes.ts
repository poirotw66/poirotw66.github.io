import type { CollectionEntry } from 'astro:content';
import { sortByPubDate } from './sort';

export type BlogLaneId = 'engineering' | 'pulse' | 'starter';

export const STARTER_PICKS = [
  '13-harness-engineering-reading-map',
  '04-building-effective-ai-agents',
  '07-agentic-rag',
] as const;

const ENGINEERING_CATEGORIES = new Set([
  'Enterprise AI',
  'AI & Development',
  'AI & Data Engineering',
  'AI & Data Science',
]);

const PULSE_CATEGORIES = new Set(['AI & Tech', 'Product Updates', 'AI & Innovation']);

const ENGINEERING_TAG_HINTS = ['harness', 'rag', 'agent', 'multi-agent'];

export const BLOG_LANE_COPY = {
  engineering: {
    kicker: { zh: 'ENGINEERING', en: 'ENGINEERING' },
    title: { zh: '工程實作', en: 'Engineering' },
    lead: {
      zh: 'Harness、RAG、多 Agent 協作——把 PoC 推成可維運的企業系統。',
      en: 'Harness, RAG, and multi-agent systems — from PoC to production-ready operations.',
    },
    cta: { zh: '看工程實作 →', en: 'View engineering →' },
  },
  pulse: {
    kicker: { zh: 'INDUSTRY PULSE', en: 'INDUSTRY PULSE' },
    title: { zh: '產業脈動', en: 'Industry Pulse' },
    lead: {
      zh: '模型發布、產品更新與產業訊號，整理成能快速掃過、需要時再深入的筆記。',
      en: 'Model releases, product updates, and industry signals — skimmable notes with depth when you need it.',
    },
    cta: { zh: '看產業脈動 →', en: 'View industry pulse →' },
  },
  starter: {
    kicker: { zh: 'START HERE', en: 'START HERE' },
    title: { zh: '精選入門', en: 'Start Here' },
    lead: {
      zh: '第一次接觸 Agent 或 Harness？從這幾篇建立共同語言。',
      en: 'New to agents or harness engineering? Start with these picks to build a shared vocabulary.',
    },
    cta: { zh: '從精選入門開始 →', en: 'Start here →' },
  },
} as const;

export const BLOG_HUB_COPY = {
  kicker: { zh: 'WRITING', en: 'WRITING' },
  title: { zh: '工程觀點與實作筆記', en: 'Engineering Insights & Practice Notes' },
  lead: {
    zh: '分享 Generative AI、企業 AI 的設計、評估與工程落地。',
    en: 'Notes on generative AI and enterprise AI — design, evaluation, and engineering delivery.',
  },
  cta: { zh: '從精選入門開始 →', en: 'Start with curated picks →' },
} as const;

export const BLOG_WRITING_SECTION_COPY = {
  kicker: { zh: '觀點 · Writing', en: 'Writing · Insights' },
  title: { zh: '工程觀點與實作筆記', en: 'Engineering Insights & Practice Notes' },
  lead: {
    zh: '從 Harness、RAG、Agent 到上線維運——把 demo 推成團隊真能用的系統。',
    en: 'From harness, RAG, and agents to production ops — shipping systems teams can actually run.',
  },
  topCta: { zh: '進部落格 →', en: 'Browse blog →' },
} as const;

export const BLOG_LANE_IDS: BlogLaneId[] = ['engineering', 'pulse', 'starter'];

function hasEngineeringTag(tags: string[]): boolean {
  const haystack = tags.join(' ').toLowerCase();
  return ENGINEERING_TAG_HINTS.some((hint) => haystack.includes(hint));
}

/** Primary lane from category/tags; null if not mapped. */
export function getPostLane(post: CollectionEntry<'blog'>): BlogLaneId | null {
  const { category, tags = [] } = post.data;

  if (ENGINEERING_CATEGORIES.has(category) || hasEngineeringTag(tags)) {
    return 'engineering';
  }
  if (PULSE_CATEGORIES.has(category)) {
    return 'pulse';
  }
  return null;
}

/** All lanes a post belongs to (primary lane + starter curation). */
export function getPostLanes(post: CollectionEntry<'blog'>): BlogLaneId[] {
  const lanes = new Set<BlogLaneId>();
  const primary = getPostLane(post);
  if (primary) lanes.add(primary);
  if ((STARTER_PICKS as readonly string[]).includes(post.id)) {
    lanes.add('starter');
  }
  return [...lanes];
}

export function getPostsForLane(
  posts: CollectionEntry<'blog'>[],
  laneId: BlogLaneId,
): CollectionEntry<'blog'>[] {
  if (laneId === 'starter') {
    const byId = new Map(posts.map((post) => [post.id, post]));
    return STARTER_PICKS.map((id) => byId.get(id)).filter(
      (post): post is CollectionEntry<'blog'> => post != null,
    );
  }

  return sortByPubDate(posts).filter((post) => getPostLane(post) === laneId);
}

export function getLanePreviewPosts(
  posts: CollectionEntry<'blog'>[],
  laneId: BlogLaneId,
  { featured = 1, compact = 2 } = {},
): { featured: CollectionEntry<'blog'>[]; compact: CollectionEntry<'blog'>[] } {
  const lanePosts = getPostsForLane(posts, laneId);

  if (laneId === 'starter') {
    return {
      featured: [],
      compact: lanePosts.slice(0, compact),
    };
  }

  return {
    featured: lanePosts.slice(0, featured),
    compact: lanePosts.slice(featured, featured + compact),
  };
}

export function isValidBlogLane(value: string | null | undefined): value is BlogLaneId {
  return value === 'engineering' || value === 'pulse' || value === 'starter';
}
