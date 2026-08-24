/**
 * Historical URL → current URL map for GitHub Pages.
 *
 * Astro static redirects emit a 200 HTML page with noindex + canonical + meta
 * refresh. That is the best this host can do (no real HTTP 301). Google then
 * treats the old URL as an alternate of the destination instead of a 404.
 *
 * Keys must use a trailing slash; Astro treats `/path` and `/path/` as one route.
 */

/** Explicit moves, renames, and typos that are not recoverable from filenames. */
export const CONTENT_MOVES = {
  '/blog/11-harness-enginnering/': '/blog/11-harness-engineering/',
  '/blog/37-meta-muse-spark/': '/blog/61-meta-muse-spark/',
  '/blog/38-meta-muse-image/': '/blog/62-meta-muse-image/',
  '/blog/39-langchain-openwiki/': '/blog/63-langchain-openwiki/',
  '/blog/54-eks-multitenant-ai-agent-sandbox-bitocloud/': '/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/',
  '/blog/56-aws-hoyabit-bedrock-agent-core/': '/blog/56-aws-hoyabit-bedrock-agentcore/',
  '/blog/58-ecloudvalley-omifin-maya-governance/': '/blog/58-ecloudvalley-omifin-maiah-governance/',
  '/blog/60-aws-super8-ora-multi-agent/': '/blog/60-aws-super8-orra-multi-agent/',
  '/blog/81-cloudflare-open-agentic-internet/': '/blog/86-cloudflare-open-agentic-internet/',
  '/blog/line-sticker-quick-launch/': '/blog/03-line-sticker-quick-launch/',
  '/blog/03-line-sticker/': '/blog/03-line-sticker-quick-launch/',
  '/blog/09-harness-design/': '/blog/09-harness-design-long-running-apps/',
  '/blog/10-effective-harnesses/': '/blog/10-effective-harnesses-for-long-running-agents/',
  '/blog/07-alexnet-paper-reading-part-1/': '/paper-reading/01-alexnet-paper-reading-part-1/',
  '/paper-reading/05_RAG-without-Forgetting/': '/paper-reading/05-rag-without-forgetting/',
  '/paper-reading/06_Beyond RAG for Agent/': '/paper-reading/06-beyond-rag-for-agent/',
  '/paper-reading/07_GraphRAG vs RAG/': '/paper-reading/07-graphrag-vs-rag/',
  '/paper-reading/07-graph-rag-vs-rag/': '/paper-reading/07-graphrag-vs-rag/',
  '/projects/realtime-voice-ai/': '/projects/realtime-voice-ai-project/',
};

/** Duplicate each Chinese path as `/en/...` → `/en/...`. */
export function withLocalizedPairs(redirects) {
  const out = { ...redirects };
  for (const [from, to] of Object.entries(redirects)) {
    if (from.startsWith('/en/') || to.startsWith('/en/')) continue;
    out[`/en${from}`] = `/en${to}`;
  }
  return out;
}

/** Old Chinese (or otherwise non-canonical) tag archive URLs. */
export function redirectsFromTagMap(tagSlugMap) {
  const redirects = {};
  for (const [label, slug] of Object.entries(tagSlugMap)) {
    const from = `/blog/tag/${label}/`;
    const to = `/blog/tag/${slug}/`;
    if (from !== to) redirects[from] = to;
  }
  return redirects;
}

/**
 * Filenames that Astro slugifies to lowercase still 404 at the original casing
 * on GitHub Pages (Linux, case-sensitive).
 */
export function redirectsFromMixedCaseFilenames(names, prefix) {
  const redirects = {};
  for (const name of names) {
    const slug = name.replace(/\.mdx?$/i, '');
    const lower = slug.toLowerCase();
    if (slug !== lower) {
      redirects[`${prefix}${slug}/`] = `${prefix}${lower}/`;
    }
  }
  return redirects;
}

/** Merge every source and reject identity / colliding rules. */
export function buildLegacyRedirects({ tagSlugMap = {}, paperFilenames = [] } = {}) {
  const merged = withLocalizedPairs({
    ...CONTENT_MOVES,
    ...redirectsFromTagMap(tagSlugMap),
    ...redirectsFromMixedCaseFilenames(paperFilenames, '/paper-reading/'),
  });

  for (const [from, to] of Object.entries(merged)) {
    if (from === to) {
      throw new Error(`Redirect ${from} points at itself`);
    }
    if (merged[to]) {
      throw new Error(`Redirect destination ${to} is itself a redirect source`);
    }
  }

  return merged;
}
