import type { CollectionEntry } from 'astro:content';
import { blogSlug } from './blogLocale';
import { sortByPubDate } from './sort';

export type BlogLaneId = 'engineering' | 'pulse' | 'starter';

export const STARTER_PICKS = [
  '64-ai-agent-guide',
  '65-enterprise-rag-guide',
  '13-harness-engineering-reading-map',
] as const;

const ENGINEERING_CATEGORIES = new Set([
  'Enterprise AI',
  'AI Engineering',
  'Cloud & Platform',
]);

const PULSE_CATEGORIES = new Set(['Industry Pulse']);

const ENGINEERING_TAG_HINTS = ['harness', 'rag', 'agent', 'multi-agent'];

export const BLOG_LANE_COPY = {
  engineering: {
    kicker: { zh: 'ENGINEERING', en: 'ENGINEERING' },
    title: { zh: '深度工程', en: 'Deep Engineering' },
    lead: {
      zh: 'Agent、RAG、Harness 與平台架構；看實作、評測與工程取捨。',
      en: 'Agents, RAG, harnesses, and platforms — implementations, evaluation, and trade-offs.',
    },
    cta: { zh: '進入深度工程 →', en: 'Explore deep engineering →' },
  },
  pulse: {
    kicker: { zh: 'FRONTIER SIGNALS', en: 'FRONTIER SIGNALS' },
    title: { zh: '前沿觀測', en: 'Frontier Signals' },
    lead: {
      zh: '新模型、框架與產業訊號；快速掌握變化，也保留技術判讀。',
      en: 'New models, frameworks, and industry shifts — fast context with technical judgment.',
    },
    cta: { zh: '查看前沿觀測 →', en: 'Explore frontier signals →' },
  },
  starter: {
    kicker: { zh: 'GUIDED MAPS', en: 'GUIDED MAPS' },
    title: { zh: '技術地圖', en: 'Guided Maps' },
    lead: {
      zh: '用精選導讀建立 Agent、RAG 與 Harness 的完整概念路徑。',
      en: 'Curated paths for building a coherent model of agents, RAG, and harness engineering.',
    },
    cta: { zh: '從技術地圖開始 →', en: 'Start with guided maps →' },
  },
} as const;

export const BLOG_HUB_COPY = {
  kicker: { zh: 'RESEARCH · BUILD · EXPLAIN', en: 'RESEARCH · BUILD · EXPLAIN' },
  title: { zh: 'AI 前沿研究與工程實作', en: 'AI Frontier Research & Engineering' },
  lead: {
    zh: '追蹤新技術、拆解系統架構，也公開真正動手做過的評測與實作。',
    en: 'Tracking emerging technology, dissecting system architecture, and publishing what I actually build and evaluate.',
  },
  cta: { zh: '從技術地圖開始 →', en: 'Start with guided maps →' },
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
  if ((STARTER_PICKS as readonly string[]).includes(blogSlug(post))) {
    lanes.add('starter');
  }
  return [...lanes];
}

export function getPostsForLane(
  posts: CollectionEntry<'blog'>[],
  laneId: BlogLaneId,
): CollectionEntry<'blog'>[] {
  if (laneId === 'starter') {
    const bySlug = new Map(posts.map((post) => [blogSlug(post), post]));
    return STARTER_PICKS.map((id) => bySlug.get(id)).filter(
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
