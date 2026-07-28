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
        key: 'enterprise-agent-radar',
        type: 'research',
        stage: '持續追蹤與驗證',
        updatedAt: '2026-07-28',
        title: '企業 Agent 技術雷達',
        description:
          '持續追蹤模型、Agent Harness、MCP、記憶、評測、可觀測性、安全與企業採用，將前沿訊號轉成可落地的工程判斷。',
        weeklyProgress:
          '已建立「訊號、原型、模式、證據」研究循環，下一步會把 Agent 相關文章、論文與實作依企業採用問題持續整理。',
        resources: [
          {
            type: 'article',
            label: 'AI Agent 技術地圖',
            href: '/blog/64-ai-agent-guide/',
          },
          {
            type: 'project',
            label: 'Agentic AI Platform',
            href: '/projects/agentic-ai-platform/',
          },
        ],
      },
      {
        key: 'clubhouse-few-shot-games',
        type: 'project',
        stage: '開發中心擴寫中',
        updatedAt: '2026-07-28',
        title: 'Clubhouse Games：One-shot／Few-shot 遊戲開發中心',
        description:
          '測試 AI 能否透過一次或少量指令完成遊戲規格、程式骨架、互動邏輯、測試與發布，建立可比較的遊戲開發實驗。',
        weeklyProgress:
          '以既有 22 款遊戲規格與多款網頁實作為基礎，正在設計 Prompt、Shot 數、修正次數、耗時與可玩性紀錄格式。',
        resources: [
          {
            type: 'project',
            label: 'Clubhouse Games 專案',
            href: '/projects/clubhouse-games/',
          },
          {
            type: 'repository',
            label: 'GitHub Repository',
            href: 'https://github.com/poirotw66/Clubhouse-Games',
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
        key: 'enterprise-agent-radar',
        type: 'research',
        stage: 'Continuous tracking and validation',
        updatedAt: '2026-07-28',
        title: 'Enterprise Agent Technology Radar',
        description:
          'Track models, agent harnesses, MCP, memory, evaluation, observability, security, and enterprise adoption, translating frontier signals into actionable engineering decisions.',
        weeklyProgress:
          'Established a Signal → Prototype → Pattern → Evidence loop; next is organizing Agent research, papers, and builds around enterprise adoption questions.',
        resources: [
          {
            type: 'article',
            label: 'AI Agent engineering map',
            href: '/blog/64-ai-agent-guide/',
          },
          {
            type: 'project',
            label: 'Agentic AI Platform',
            href: '/projects/agentic-ai-platform/',
          },
        ],
      },
      {
        key: 'clubhouse-few-shot-games',
        type: 'project',
        stage: 'Development center expansion',
        updatedAt: '2026-07-28',
        title: 'Clubhouse Games: One-shot / Few-shot Development Center',
        description:
          'Test whether AI can complete game specifications, scaffolding, interaction logic, testing, and publishing from one or a few instructions.',
        weeklyProgress:
          'Using 22 existing game specifications and multiple web implementations to design a record for prompts, shot count, revisions, elapsed time, and playability.',
        resources: [
          {
            type: 'project',
            label: 'Clubhouse Games project',
            href: '/projects/clubhouse-games/',
          },
          {
            type: 'repository',
            label: 'GitHub Repository',
            href: 'https://github.com/poirotw66/Clubhouse-Games',
          },
        ],
      },
    ],
  },
});
