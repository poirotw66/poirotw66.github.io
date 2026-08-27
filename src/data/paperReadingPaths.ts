import type { Lang } from '../i18n/ui';

export interface PaperReadingPath {
  id: 'foundations' | 'retrieval-systems' | 'agent-systems';
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  level: Record<Lang, string>;
  slugs: string[];
}

export const PAPER_READING_PATHS: PaperReadingPath[] = [
  {
    id: 'foundations',
    title: { zh: '先建立方法閱讀底座', en: 'Build the foundations first' },
    description: {
      zh: '從 AlexNet 的架構與訓練證據開始，練習把方法、實驗與年代限制分開。',
      en: 'Start with AlexNet and practice separating architecture, training evidence, and historical constraints.',
    },
    level: { zh: '入門 → 中階', en: 'Intro → Intermediate' },
    slugs: ['01-alexnet-paper-reading-part-1', '02-alexnet-paper-reading-part-2'],
  },
  {
    id: 'retrieval-systems',
    title: { zh: '理解檢索、記憶與 Production RAG', en: 'Retrieval, memory, and production RAG' },
    description: {
      zh: '從 2020 年的 RAG 祖先開始，再讀多模態解析、工具檢索、持續記憶、GraphRAG、規模化與 runtime control。',
      en: 'Start from the 2020 RAG ancestor, then move to multimodal parsing, tool retrieval, memory, GraphRAG, scaling, and runtime controls.',
    },
    level: { zh: '中階 → 進階', en: 'Intermediate → Advanced' },
    slugs: [
      '31-retrieval-augmented-generation',
      '03-rag-anything',
      '04-rag-mcp',
      '05-rag-without-forgetting',
      '06-beyond-rag-for-agent',
      '07-graphrag-vs-rag',
      '11-askchem-claim-centered-synthesis',
      '13-bm25-wins-at-scale',
      '15-before-reasoning-fails',
      '17-rubric-ranker-deep-research',
      '18-finrank-evidence-grounded-rag',
      '21-docmemo-dynamic-evidence-discovery',
    ],
  },
  {
    id: 'agent-systems',
    title: { zh: 'Agent Runtime、安全與評測', en: 'Agent runtime, safety, and evaluation' },
    description: {
      zh: '從 reward model、長期記憶與 runtime，一路讀到安全訊號、即時修復與持久化評測。',
      en: 'Follow reward models, long-horizon memory, runtime control, safety signals, repair, and persistence evaluation.',
    },
    level: { zh: '進階', en: 'Advanced' },
    slugs: [
      '08-osreward-agent-evaluation',
      '09-contextweave-workflow-benchmark',
      '10-argus-agentic-runtime',
      '12-agents4d-runtime-risks',
      '14-agent-trajectory-sentinel',
      '16-past-bench-recursive-self-improvement',
      '18-agentic-configuration-management',
      '19-a2e-agent-auditing-engine',
      '20-adias-issue-centric-agent-optimization',
      '22-swe-bench-promax',
      '23-midtool-agentic-tool-use',
      '29-chain-of-thought-prompting',
      '30-webgpt-browser-assisted-qa',
      '24-react-interleaved-reasoning-acting',
      '25-toolformer-self-supervised-api-calls',
      '26-swe-bench-github-issue-evaluation',
      '27-reflexion-verbal-reinforcement',
      '28-memgpt-context-as-memory-paging',
    ],
  },
];

export function paperReadingPathForSlug(slug: string): PaperReadingPath | undefined {
  return PAPER_READING_PATHS.find((path) => path.slugs.includes(slug));
}
