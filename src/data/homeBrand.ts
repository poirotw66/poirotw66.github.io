import type { Lang } from '../i18n/ui';

export const HOME_CASE_STUDY_SLUGS = [
  'agentic-rag',
  'ocr-automation',
  'agentic-ai-platform',
] as const;

export type HomeCaseStudySlug = (typeof HOME_CASE_STUDY_SLUGS)[number];

export type HomeCaseStudyDetail = Readonly<{
  problem: string;
  solution: string;
  result: string;
  role: string;
}>;

export const homeCaseStudyDetails: Record<
  Lang,
  Record<HomeCaseStudySlug, HomeCaseStudyDetail>
> = {
  zh: {
    'agentic-rag': {
      problem: '企業文件格式混雜、使用者問法不穩定，傳統 RAG 容易檢索失準或漏掉關鍵步驟。',
      solution: '以 LangGraph 建立受控流程，結合 Rule-first 路由、混合檢索、上下文驗證與重試。',
      result: '加權準確率 98.0%，平均延遲 2.6 秒。',
      role: '系統架構、檢索與評測流程、API 與部署設計。',
    },
    'ocr-automation': {
      problem: '多家醫院收據版型、表格與掃描品質不同，人工鍵入耗時且難以串接下游系統。',
      solution: '整合影像校正、YOLO 區塊偵測、PaddleOCR 與醫院專屬欄位正規化。',
      result: '支援 5 所以上醫院格式，統一輸出 API 可用的 JSON。',
      role: '端對端 OCR 管線、欄位正規化與 API 輸出設計。',
    },
    'agentic-ai-platform': {
      problem: '單一 LINE 入口同時承接 RAG、查證、新聞、圖像與網頁任務，流程容易失控。',
      solution: '使用 Gemini 判斷意圖，透過 n8n 將請求路由至模組化子流程並統一回覆格式。',
      result: '1 個主流程穩定路由至 19 個可獨立維護的子流程。',
      role: '工作流架構、意圖路由、模組整合與 LINE 交付流程。',
    },
  },
  en: {
    'agentic-rag': {
      problem: 'Mixed enterprise documents and unstable user phrasing made conventional RAG miss or mis-rank critical instructions.',
      solution: 'Built a controlled LangGraph workflow with rule-first routing, hybrid retrieval, context validation, and retries.',
      result: '98.0% weighted accuracy with 2.6-second average latency.',
      role: 'System architecture, retrieval and evaluation workflow, API, and deployment design.',
    },
    'ocr-automation': {
      problem: 'Hospital receipts vary by layout, tables, and scan quality, making manual entry slow and downstream integration brittle.',
      solution: 'Combined image correction, YOLO region detection, PaddleOCR, and hospital-specific field normalization.',
      result: 'Normalized formats from 5+ hospitals into API-ready JSON.',
      role: 'End-to-end OCR pipeline, field normalization, and API output design.',
    },
    'agentic-ai-platform': {
      problem: 'One LINE entry point had to handle RAG, fact-checking, news, images, and web tasks without becoming one fragile flow.',
      solution: 'Used Gemini intent routing and n8n to dispatch requests to modular subflows with consistent response formatting.',
      result: '1 main workflow routes reliably across 19 independently maintainable subflows.',
      role: 'Workflow architecture, intent routing, module integration, and LINE delivery.',
    },
  },
};

export const homeJourney = {
  zh: {
    kicker: '歷程 · Journey',
    title: '從文件智能，走到可維運的 Agent Platform',
    lead: '每一階段都建立在前一階段的交付經驗上：先把資料處理可靠，再把檢索、推理與營運能力接起來。',
    stages: [
      {
        phase: 'Foundation',
        title: '文件智能',
        description: '從 OCR、版面偵測與資料正規化開始，建立可靠的企業資料入口。',
      },
      {
        phase: 'Retrieval',
        title: 'Enterprise RAG',
        description: '加入混合檢索、來源追溯與評測，讓企業知識問答可被驗證。',
      },
      {
        phase: 'Orchestration',
        title: 'Agentic Systems',
        description: '以受控工作流、工具調用與重試機制處理跨步驟任務。',
      },
      {
        phase: 'Now',
        title: 'AI Platform',
        description: '把評測、可觀測性、安全邊界與部署交接納入同一套平台思維。',
      },
    ],
  },
  en: {
    kicker: 'Journey',
    title: 'From document intelligence to operable agent platforms',
    lead: 'Each stage builds on delivery lessons from the one before it: make data reliable, then connect retrieval, reasoning, and operations.',
    stages: [
      {
        phase: 'Foundation',
        title: 'Document intelligence',
        description: 'Started with OCR, layout detection, and normalization to create reliable enterprise data inputs.',
      },
      {
        phase: 'Retrieval',
        title: 'Enterprise RAG',
        description: 'Added hybrid retrieval, source traceability, and evaluation so knowledge answers could be verified.',
      },
      {
        phase: 'Orchestration',
        title: 'Agentic systems',
        description: 'Introduced controlled workflows, tool use, and retry loops for multi-step work.',
      },
      {
        phase: 'Now',
        title: 'AI platform',
        description: 'Bringing evaluation, observability, security boundaries, and operational handoff into one platform model.',
      },
    ],
  },
} as const;
