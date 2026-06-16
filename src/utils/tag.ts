/** Canonical mapping for non-ASCII tags to ASCII-only slugs. */
export const TAG_SLUG_MAP: Record<string, string> = {
  "AI 修圖": "ai-photo-editing",
  "AI 安全": "ai-safety",
  "CoT 監控": "cot-monitoring",
  "LINE 貼圖": "line-stickers",
  "LLM 函式呼叫": "llm-function-calling",
  "Prompt 膨脹": "prompt-bloat",
  "勞動市場": "labor-market",
  "卷積神經網路": "convolutional-neural-network",
  "可解釋 AI": "explainable-ai",
  "向量資料庫": "vector-database",
  "中繼資料": "metadata",
  "圖譜": "graph",
  "多模態": "multimodal",
  "多跳推理": "multi-hop-reasoning",
  "學術寫作": "academic-writing",
  "就業": "employment",
  "工具選擇": "tool-selection",
  "形象照": "portrait-photo",
  "思維鏈": "chain-of-thought",
  "持續學習": "continual-learning",
  "推理模型": "reasoning-model",
  "文獻整理": "literature-review",
  "旅遊照": "travel-photo",
  "時間管理": "time-management",
  "架構模式": "architecture-patterns",
  "檢索": "retrieval",
  "檢索增強生成": "retrieval-augmented-generation",
  "檢索系統": "retrieval-system",
  "深度學習": "deep-learning",
  "混合檢索": "hybrid-retrieval",
  "知識圖譜": "knowledge-graph",
  "研究方法": "research-methods",
  "研究生": "graduate-student",
  "經濟研究": "economics-research",
  "自動化風險": "automation-risk",
  "虛擬試穿": "virtual-try-on",
  "論文精讀": "paper-deep-dive",
  "論文閱讀": "paper-reading",
  "證件照": "id-photo",
  "長期記憶": "long-term-memory",
  "創業": "startup",
  "創業者手冊": "founders-playbook",
};

const ASCII_ONLY_REGEX = /^[\x00-\x7F]+$/;

function normalizeAsciiTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveCanonicalTagSlug(tag: string): string {
  const trimmed = tag.trim();
  const mapped = TAG_SLUG_MAP[trimmed];
  if (mapped) {
    return mapped;
  }

  if (ASCII_ONLY_REGEX.test(trimmed)) {
    const normalized = normalizeAsciiTag(trimmed);
    if (!normalized) {
      throw new Error(`Invalid ASCII tag normalization: ${tag}`);
    }
    return normalized;
  }

  throw new Error(`Unknown non-ASCII tag: ${tag}. Add mapping in TAG_SLUG_MAP.`);
}

export function tagToSlug(tag: string): string {
  return resolveCanonicalTagSlug(tag);
}

export function tagToUrlSlug(tag: string): string {
  return resolveCanonicalTagSlug(tag);
}

export function getPostsByTag<T extends { data: { tags?: string[] } }>(
  posts: T[],
  tagSlug: string
): T[] {
  const canonicalSlug = resolveCanonicalTagSlug(tagSlug);

  const matchTag = (t: string): boolean => {
    return resolveCanonicalTagSlug(t) === canonicalSlug;
  };
  return posts.filter((p) => (p.data.tags ?? []).some(matchTag));
}

/** Returns canonical URL slugs for static paths. */
export function getAllTagSlugs<T extends { data: { tags?: string[] } }>(posts: T[]): string[] {
  const slugs = new Set<string>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      slugs.add(resolveCanonicalTagSlug(t));
    }
  }
  return Array.from(slugs);
}

/**
 * Get display name for a tag slug from a list of posts that have that tag.
 */
export function getDisplayNameForTagSlug<T extends { data: { tags?: string[] } }>(
  posts: T[],
  tagSlug: string
): string {
  const canonicalSlug = resolveCanonicalTagSlug(tagSlug);

  for (const p of posts) {
    const found = (p.data.tags ?? []).find((t) => resolveCanonicalTagSlug(t) === canonicalSlug);
    if (found) return found;
  }
  return canonicalSlug.replace(/-/g, ' ');
}

/**
 * Get unique tags with slug and display name for listing (e.g. blog index).
 */
export function getAllTagsWithDisplay<T extends { data: { tags?: string[] } }>(
  posts: T[]
): { slug: string; name: string }[] {
  const bySlug = new Map<string, string>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      const slug = tagToUrlSlug(t);
      if (slug && !bySlug.has(slug)) bySlug.set(slug, t);
    }
  }
  return Array.from(bySlug.entries(), ([slug, name]) => ({ slug, name })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
}
