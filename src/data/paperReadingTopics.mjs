/**
 * Stable taxonomy for Paper Reading. Content frontmatter, hub cards, generated
 * topic pages, and validation all consume these IDs rather than local lists.
 */
export const PAPER_READING_TOPICS = Object.freeze([
  {
    id: 'sequence-modeling-foundations',
    title: { zh: '序列建模基礎', en: 'Sequence Modeling Foundations' },
    description: {
      zh: '從經典 encoder–decoder 與 self-attention 架構出發，建立判讀序列轉換論文的底座。',
      en: 'Build a foundation for reading sequence-transduction papers through classic encoder–decoder and self-attention architectures.',
    },
    readerQuestion: {
      zh: '一個序列模型的控制點改在哪裡，哪些證據仍值得帶進今天的系統？',
      en: 'Where does a sequence model change its control point, and which evidence still transfers to today’s systems?',
    },
  },
  {
    id: 'computer-vision-foundations',
    title: { zh: '電腦視覺基礎', en: 'Computer Vision Foundations' },
    description: {
      zh: '從經典視覺模型的架構、訓練與評測證據，建立判讀方法論文的底座。',
      en: 'Build a foundation for reading methods papers through classic vision architectures, training choices, and evaluation evidence.',
    },
    readerQuestion: {
      zh: '一個經典模型的結果，哪些設計與證據仍值得帶進今天的系統？',
      en: 'Which design choices and evidence from a classic model still transfer to today’s systems?',
    },
  },
  {
    id: 'retrieval-rag',
    title: { zh: '檢索、RAG 與證據基礎', en: 'Retrieval, RAG & Evidence Grounding' },
    description: {
      zh: '探索多模態檢索、GraphRAG、重排、證據發現與可追溯回答的工程取捨。',
      en: 'Explore engineering trade-offs in multimodal retrieval, GraphRAG, ranking, evidence discovery, and traceable answers.',
    },
    readerQuestion: {
      zh: '如何讓系統在更大的資料與更多工具下，仍找得到可驗證的證據？',
      en: 'How can a system keep finding verifiable evidence as its corpus and tool surface grow?',
    },
  },
  {
    id: 'agent-evaluation-observability',
    title: { zh: 'Agent 評測與可觀測性', en: 'Agent Evaluation & Observability' },
    description: {
      zh: '從任務結果、軌跡、runtime 訊號到 benchmark，拆解 Agent 是否真的可靠。',
      en: 'Examine whether agents are actually reliable through task outcomes, trajectories, runtime signals, and benchmarks.',
    },
    readerQuestion: {
      zh: '除了最後答案，我們還要觀察與驗證哪些訊號，才能相信 Agent 完成了工作？',
      en: 'Beyond the final answer, which signals must we observe and verify before trusting that an agent completed its work?',
    },
  },
  {
    id: 'agent-memory-adaptation',
    title: { zh: 'Agent 記憶與適應', en: 'Agent Memory & Adaptation' },
    description: {
      zh: '理解長期任務中的記憶層次、索引更新、持久狀態與安全的系統適應。',
      en: 'Understand memory layers, index updates, durable state, and safe system adaptation for long-horizon tasks.',
    },
    readerQuestion: {
      zh: '系統要記住、更新或遺忘什麼，才能隨時間變好而不累積錯誤？',
      en: 'What should a system remember, update, or forget to improve over time without accumulating errors?',
    },
  },
  {
    id: 'agent-safety-governance',
    title: { zh: 'Agent 安全與治理', en: 'Agent Safety & Governance' },
    description: {
      zh: '從風險注入、稽核、權限與 rollback，檢視 Agent 在真實執行環境的控制邊界。',
      en: 'Examine control boundaries for agents in real execution environments: risk injection, auditing, permissions, and rollback.',
    },
    readerQuestion: {
      zh: '任務完成之外，如何證明 Agent 的過程、記憶與副作用仍在可控範圍？',
      en: 'Beyond task completion, how do we show that an agent’s process, memory, and side effects remain controlled?',
    },
  },
  {
    id: 'tool-use-coding-agents',
    title: { zh: '工具使用與 Coding Agents', en: 'Tool Use & Coding Agents' },
    description: {
      zh: '研究工具發現、schema context、程式任務與可驗證執行如何共同影響 Agent 表現。',
      en: 'Study how tool discovery, schema context, coding tasks, and verifiable execution jointly shape agent performance.',
    },
    readerQuestion: {
      zh: '當 Agent 要選工具、改程式並執行時，如何降低 context 與操作錯誤？',
      en: 'When an agent must choose tools, edit code, and execute actions, how can we reduce context and operational errors?',
    },
  },
]);

export const PAPER_READING_TOPIC_IDS = Object.freeze(PAPER_READING_TOPICS.map((topic) => topic.id));

export const MIN_PAPER_READING_TOPIC_ENTRIES = 2;

export function getPaperReadingTopicById(id) {
  return PAPER_READING_TOPICS.find((topic) => topic.id === id);
}
