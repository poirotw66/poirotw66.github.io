export type HomeRoadmapItemType = 'article' | 'research' | 'project';

type HomeRoadmapItem = Readonly<{
  key: string;
  type: HomeRoadmapItemType;
  status: string;
  title: string;
  description: string;
}>;

type HomeRoadmapCopy = Readonly<{
  kicker: string;
  title: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  items: readonly HomeRoadmapItem[];
}>;

type HomeRoadmap = Readonly<{
  zh: HomeRoadmapCopy;
  en: HomeRoadmapCopy;
}>;

const ENGINEERING_LANE_HREF = '/blog/?lane=engineering';

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const entry of value) {
      deepFreeze(entry);
    }
    return Object.freeze(value);
  }

  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    return Object.freeze(value);
  }

  return value;
}

export const homeRoadmap: HomeRoadmap = deepFreeze({
  zh: {
    kicker: 'Roadmap · 接下來',
    title: 'AI Engineering 近期路線圖',
    lead: '接下來會把 Agent Harness、記憶檢索研究，以及企業 RAG 交付參考實作，整理成可驗證、可維運的公開筆記。',
    ctaLabel: '先讀 AI Engineering 文章',
    ctaHref: ENGINEERING_LANE_HREF,
    items: [
      {
        key: 'agent-harness-ops',
        type: 'article',
        status: '即將發布',
        title: 'Agent Harness：從 Demo 走到可維運',
        description:
          '拆解 evaluation、可觀測性、權限邊界與失敗復原，說明一套 harness 要怎樣才能在正式環境持續跑。',
      },
      {
        key: 'agent-memory-retrieval',
        type: 'research',
        status: '規劃中',
        title: 'Agent Memory 與 Retrieval 評估筆記',
        description:
          '比較 xMemory、持續演進的 retrieval memory，以及 GraphRAG／RAG 在記憶與檢索評估上的限制。',
      },
      {
        key: 'enterprise-rag-delivery',
        type: 'project',
        status: '規劃中',
        title: 'Enterprise RAG 交付參考實作',
        description:
          '整理 ingestion、hybrid retrieval、context validation、guardrails 與部署前驗證的可重用交付檢查。',
      },
    ],
  },
  en: {
    kicker: 'Roadmap · Next',
    title: 'AI Engineering roadmap',
    lead: 'Next up: public notes on Agent Harness operations, memory and retrieval research, and an enterprise RAG delivery reference build.',
    ctaLabel: 'Browse AI Engineering writing',
    ctaHref: ENGINEERING_LANE_HREF,
    items: [
      {
        key: 'agent-harness-ops',
        type: 'article',
        status: 'Coming next',
        title: 'Agent Harness: from demo to operable systems',
        description:
          'Break down evaluation, observability, permission boundaries, and failure recovery for harnesses that can run in production.',
      },
      {
        key: 'agent-memory-retrieval',
        type: 'research',
        status: 'Planned',
        title: 'Agent memory and retrieval evaluation notes',
        description:
          'Compare xMemory, evolving retrieval memory, and the limits of GraphRAG / RAG evaluation for persistent agent memory.',
      },
      {
        key: 'enterprise-rag-delivery',
        type: 'project',
        status: 'Planned',
        title: 'Enterprise RAG delivery reference build',
        description:
          'Document ingestion, hybrid retrieval, context validation, guardrails, and pre-deploy validation as a reusable delivery checklist.',
      },
    ],
  },
});
