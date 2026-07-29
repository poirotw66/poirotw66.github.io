import type { Lang } from '../i18n/ui';

type LocalizedText = Record<Lang, string>;

export type TopicClusterId =
  | 'ai-agent'
  | 'enterprise-rag'
  | 'ai-platform-governance';

export interface TopicCluster {
  id: TopicClusterId;
  coreSlug: string;
  title: LocalizedText;
  description: LocalizedText;
  childSlugs: readonly string[];
  caseStudy: {
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
  };
}

export const TOPIC_CLUSTERS: readonly TopicCluster[] = [
  {
    id: 'ai-agent',
    coreSlug: '64-ai-agent-guide',
    title: { zh: 'AI Agent 實戰', en: 'AI Agent in Practice' },
    description: {
      zh: '從架構、工具與記憶，到評測、治理與正式環境。',
      en: 'From architecture, tools, and memory to evaluation, governance, and production.',
    },
    childSlugs: [
      '04-building-effective-ai-agents',
      '34-model-context-protocol-mcp',
      '42-agent-development-kit-2-0',
      '43-enterprise-ai-agent-security',
      '51-doordash-ask-assistant-architecture',
      '56-aws-hoyabit-bedrock-agent-core',
      '60-aws-super8-ora-multi-agent',
    ],
    caseStudy: {
      slug: 'agentic-ai-platform',
      title: { zh: 'Agentic AI Platform 實戰案例', en: 'Agentic AI Platform Case Study' },
      description: {
        zh: 'LINE Chatbot 與 n8n 工作流平台：主流程智能路由至 19 個子流程。',
        en: 'A LINE chatbot and n8n workflow platform routing one main flow across 19 subflows.',
      },
    },
  },
  {
    id: 'enterprise-rag',
    coreSlug: '65-enterprise-rag-guide',
    title: { zh: 'Enterprise RAG', en: 'Enterprise RAG' },
    description: {
      zh: '從檢索、重排與上下文組裝，到評估、權限治理與營運。',
      en: 'From retrieval, reranking, and context assembly to evaluation, access control, and operations.',
    },
    childSlugs: [
      '07-agentic-rag',
      '23-pixelrag',
      '24-open-knowledge-format',
      '35-graph-rag-llm',
      '63-langchain-openwiki',
    ],
    caseStudy: {
      slug: 'agentic-rag',
      title: { zh: 'Agentic RAG 企業知識助理案例', en: 'Agentic RAG Enterprise Knowledge Assistant' },
      description: {
        zh: '以加權準確率 98%、平均延遲 2.6 秒驗證檢索與代理協作。',
        en: 'A retrieval and agent collaboration case validated at 98% weighted accuracy and 2.6s average latency.',
      },
    },
  },
  {
    id: 'ai-platform-governance',
    coreSlug: '39-enterprise-agentic-ai-governance',
    title: {
      zh: 'AI Platform 與治理',
      en: 'AI Platform & Governance',
    },
    description: {
      zh: '從平台邊界、多租戶隔離與治理控制，到能持續營運的企業級 Agent 基礎設施。',
      en: 'From platform boundaries, multitenancy, and governance controls to operable enterprise agent infrastructure.',
    },
    childSlugs: [
      '38-financial-genai-platform-engineering',
      '53-decompose-with-care-banking-modernization',
      '54-eks-multitenant-ai-agent-sandbox-bitocloud',
      '58-ecloudvalley-omifin-maya-governance',
      '68-gemini-enterprise-agent-platform',
      '73-openai-presence-enterprise-agent-platform',
    ],
    caseStudy: {
      slug: 'agentic-ai-platform',
      title: {
        zh: 'Agentic AI Platform 實作案例',
        en: 'Agentic AI Platform Case Study',
      },
      description: {
        zh: '以一條主流程協調 19 條子流程，串接知識、工具與營運治理。',
        en: 'One main flow coordinating 19 subflows across knowledge, tools, and operational governance.',
      },
    },
  },
] as const;

export function getTopicClusterForSlug(slug: string): TopicCluster | undefined {
  return TOPIC_CLUSTERS.find(
    (cluster) => cluster.coreSlug === slug || cluster.childSlugs.includes(slug),
  );
}

export function getTopicClusterById(id: string | undefined): TopicCluster | undefined {
  return TOPIC_CLUSTERS.find((cluster) => cluster.id === id);
}
