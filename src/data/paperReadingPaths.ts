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
      zh: '從 AlexNet 的架構與訓練證據出發，接著讀 ResNet 如何用殘差捷徑讓更深網路可訓，並練習把方法、實驗與年代限制分開。',
      en: 'Start with AlexNet architecture and training evidence, then ResNet residual shortcuts for trainable depth, while separating methods, experiments, and historical constraints.',
    },
    level: { zh: '入門 → 中階', en: 'Intro → Intermediate' },
    slugs: [
      '01-alexnet-paper-reading-part-1',
      '02-alexnet-paper-reading-part-2',
      '37-resnet-deep-residual-learning',
    ],
  },
  {
    id: 'retrieval-systems',
    title: { zh: '理解檢索、記憶與 Production RAG', en: 'Retrieval, memory, and production RAG' },
    description: {
      zh: '從 2020 昂貴的檢索增強預訓練（REALM）到較便宜的 dense retriever（DPR）、RAG 祖先與 Self-RAG 的何時檢索，然後讀多模態解析、工具檢索、持續記憶、GraphRAG、規模化與 runtime control。',
      en: 'Start from 2020 retrieval-augmented pre-training (REALM), then the cheaper dense retriever (DPR), the RAG ancestor and Self-RAG when-to-retrieve, then multimodal parsing, tool retrieval, memory, GraphRAG, scaling, and runtime controls.',
    },
    level: { zh: '中階 → 進階', en: 'Intermediate → Advanced' },
    slugs: [
      '34-realm-retrieval-augmented-pretraining',
      '32-dense-passage-retrieval',
      '31-retrieval-augmented-generation',
      '33-self-rag-retrieve-generate-critique',
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
      '35-gorilla-llm-connected-with-massive-apis',
      '26-swe-bench-github-issue-evaluation',
      '27-reflexion-verbal-reinforcement',
      '28-memgpt-context-as-memory-paging',
      '36-generative-agents-interactive-simulacra',
    ],
  },
];

export function paperReadingPathForSlug(slug: string): PaperReadingPath | undefined {
  return PAPER_READING_PATHS.find((path) => path.slugs.includes(slug));
}
