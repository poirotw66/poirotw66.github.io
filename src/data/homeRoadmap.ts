export type HomeRoadmapItemType = 'article' | 'research' | 'project';
export type HomeRoadmapResourceType = 'article' | 'paper' | 'project' | 'repository';

type HomeRoadmapResource = Readonly<{
  type: HomeRoadmapResourceType;
  label: string;
  href: string;
}>;

type HomeRoadmapItem = Readonly<{
  key: string;
  type: HomeRoadmapItemType;
  stage: string;
  updatedAt: string;
  title: string;
  description: string;
  weeklyProgress: string;
  resources: readonly HomeRoadmapResource[];
}>;

type HomeRoadmapCopy = Readonly<{
  kicker: string;
  title: string;
  lead: string;
  updatedLabel: string;
  stageLabel: string;
  progressLabel: string;
  resourcesLabel: string;
  ctaLabel: string;
  ctaHref: string;
  items: readonly HomeRoadmapItem[];
}>;

type HomeRoadmap = Readonly<{
  zh: HomeRoadmapCopy;
  en: HomeRoadmapCopy;
}>;

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const entry of value) deepFreeze(entry);
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
    kicker: 'Now · 正在建造',
    title: '目前正在推進的工作',
    lead: 'Bloss0m 不只整理既有成果，也公開下一步正在研究、驗證與建造的主題。',
    updatedLabel: '最近更新',
    stageLabel: '目前階段',
    progressLabel: '本週進展',
    resourcesLabel: '延伸閱讀',
    ctaLabel: '查看完整工程進度',
    ctaHref: '/now/',
    items: [
      {
        key: 'agent-harness-ops',
        type: 'article',
        stage: '內容整理中',
        updatedAt: '2026-07-26',
        title: 'Agent Harness：從 Demo 走到可維運',
        description:
          '拆解 evaluation、可觀測性、權限邊界與失敗復原，說明一套 harness 要怎樣才能在正式環境持續跑。',
        weeklyProgress:
          '已盤點 Harness 系列文章與閱讀順序，正在把評測、控制迴路與交接條件收斂成一份維運框架。',
        resources: [
          {
            type: 'article',
            label: 'Harness Engineering 導覽',
            href: '/blog/13-harness-engineering-reading-map/',
          },
        ],
      },
      {
        key: 'agent-memory-retrieval',
        type: 'research',
        stage: '研究驗證中',
        updatedAt: '2026-07-26',
        title: 'Agent Memory 與 Retrieval 評估筆記',
        description:
          '比較 xMemory、持續演進的 retrieval memory，以及 GraphRAG／RAG 在記憶與檢索評估上的限制。',
        weeklyProgress:
          '已整理長期記憶與檢索的核心差異，下一步會把評測維度對齊可追溯性、更新能力與遺忘風險。',
        resources: [
          {
            type: 'paper',
            label: 'Beyond RAG for Agent Memory',
            href: '/paper-reading/06-beyond-rag-for-agent/',
          },
        ],
      },
      {
        key: 'enterprise-rag-delivery',
        type: 'project',
        stage: '參考實作設計中',
        updatedAt: '2026-07-26',
        title: 'Enterprise RAG 交付參考實作',
        description:
          '整理 ingestion、hybrid retrieval、context validation、guardrails 與部署前驗證的可重用交付檢查。',
        weeklyProgress:
          '已把既有 Agentic RAG 案例拆成 ingestion、retrieval、validation 與 deployment 四段交付檢查。',
        resources: [
          {
            type: 'article',
            label: 'Enterprise RAG 指南',
            href: '/blog/65-enterprise-rag-guide/',
          },
          {
            type: 'project',
            label: 'Agentic RAG 案例',
            href: '/projects/agentic-rag/',
          },
        ],
      },
    ],
  },
  en: {
    kicker: 'Now · Currently building',
    title: 'Work currently in progress',
    lead: 'Bloss0m documents not only finished outcomes, but also the research, validation, and builds moving forward now.',
    updatedLabel: 'Last updated',
    stageLabel: 'Current stage',
    progressLabel: 'This week',
    resourcesLabel: 'Related',
    ctaLabel: 'Open the public engineering log',
    ctaHref: '/now/',
    items: [
      {
        key: 'agent-harness-ops',
        type: 'article',
        stage: 'Editorial synthesis',
        updatedAt: '2026-07-26',
        title: 'Agent Harness: from demo to operable systems',
        description:
          'Break down evaluation, observability, permission boundaries, and failure recovery for harnesses that can run in production.',
        weeklyProgress:
          'Mapped the Harness series; now consolidating evaluation, control loops, and handoff into one operations framework.',
        resources: [
          {
            type: 'article',
            label: 'Harness Engineering reading map',
            href: '/blog/13-harness-engineering-reading-map/',
          },
        ],
      },
      {
        key: 'agent-memory-retrieval',
        type: 'research',
        stage: 'Research validation',
        updatedAt: '2026-07-26',
        title: 'Agent memory and retrieval evaluation notes',
        description:
          'Compare xMemory, evolving retrieval memory, and the limits of GraphRAG / RAG evaluation for persistent agent memory.',
        weeklyProgress:
          'Mapped memory versus retrieval; next is evaluating traceability, updates, and forgetting risk.',
        resources: [
          {
            type: 'paper',
            label: 'Beyond RAG for Agent Memory',
            href: '/paper-reading/06-beyond-rag-for-agent/',
          },
        ],
      },
      {
        key: 'enterprise-rag-delivery',
        type: 'project',
        stage: 'Reference design',
        updatedAt: '2026-07-26',
        title: 'Enterprise RAG delivery reference build',
        description:
          'Document ingestion, hybrid retrieval, context validation, guardrails, and pre-deploy validation as a reusable delivery checklist.',
        weeklyProgress:
          'Split the Agentic RAG case into ingestion, retrieval, validation, and deployment gates.',
        resources: [
          {
            type: 'article',
            label: 'Enterprise RAG guide',
            href: '/blog/65-enterprise-rag-guide/',
          },
          {
            type: 'project',
            label: 'Agentic RAG case study',
            href: '/projects/agentic-rag/',
          },
        ],
      },
    ],
  },
});
