import type { Lang } from '../i18n/ui';

export type EvidenceKind = 'evaluation' | 'capability' | 'operational';

export type SourceStatus = 'public-artifact' | 'author-reported' | 'pending-verification';

export type ProjectEvidenceItem = Readonly<{
  id: string;
  projectSlug: 'agentic-rag' | 'ocr-automation' | 'agentic-ai-platform';
  kind: EvidenceKind;
  value: string;
  unit: string;
  label: Record<Lang, string>;
  version: string | null;
  measuredAt: string | null;
  scope: Record<Lang, string>;
  method: Record<Lang, string>;
  limitations: Record<Lang, string>;
  sourceStatus: SourceStatus;
  publicSourceHref: string | null;
  detailAnchor: string;
}>;

export const PROJECT_EVIDENCES: readonly ProjectEvidenceItem[] = [
  {
    id: 'rag-v22-weighted-accuracy',
    projectSlug: 'agentic-rag',
    kind: 'evaluation',
    value: '98.0%',
    unit: '',
    label: {
      zh: 'RAG 加權準確率',
      en: 'weighted RAG accuracy',
    },
    version: 'v22',
    measuredAt: '2026-05-11',
    scope: {
      zh: '固定 100 題內部 IT / 流程 benchmark，涵蓋口語問法、同義詞、表格與權限邊界',
      en: 'Fixed 100-query internal IT and process benchmark covering colloquial phrasing, synonyms, tables, and permission boundaries',
    },
    method: {
      zh: 'Direct workflow 測試，人工與規則混合評分（96 題完全正確、4 題部分正確、0 題錯誤或不安全）',
      en: 'Direct workflow benchmark with hybrid human and rule grading (96 fully correct, 4 partially correct, 0 errors or unsafe responses)',
    },
    limitations: {
      zh: '作者評測摘要；題庫針對特定企業知識庫領域調優，非獨立第三方盲測，未測未知領域泛化表現；原始評測報告未公開',
      en: 'Author-reported evaluation summary; tuned on specific enterprise FAQ domain, not an independent third-party blind test; raw report is private',
    },
    sourceStatus: 'author-reported',
    publicSourceHref: null,
    detailAnchor: '#case-evaluation',
  },
  {
    id: 'rag-rule-first-latency',
    projectSlug: 'agentic-rag',
    kind: 'evaluation',
    value: '2.606s',
    unit: 's',
    label: {
      zh: '平均查詢延遲',
      en: 'average query latency',
    },
    version: 'rule-first direct workflow',
    measuredAt: '2026-06-25',
    scope: {
      zh: '100 題 direct workflow 逐題量測平均值；相較 v23 baseline（3.63s）減少 1.024s；P95 延遲 5.636s',
      en: 'Direct workflow execution across 100-query benchmark, reducing 1.024s vs v23 baseline (3.63s); P95 latency 5.636s',
    },
    method: {
      zh: 'Rule-first deterministic fast path 避開高信心 FAQ 的 LLM 分析步驟；Direct workflow 逐題量測',
      en: 'Rule-first deterministic fast path bypassing LLM analysis for high-confidence FAQs; direct workflow per-query measurement',
    },
    limitations: {
      zh: '不同階段評測，不應與 v22 品質測試視為同次實測；測試環境為作者開發環境，冷啟動與生產並行負載條件未單獨記載',
      en: 'Measured in a subsequent phase; not the same test run as v22 quality; developer environment run, cold start and production concurrency not isolated',
    },
    sourceStatus: 'author-reported',
    publicSourceHref: null,
    detailAnchor: '#case-evaluation',
  },
  {
    id: 'line-modular-subflows',
    projectSlug: 'agentic-ai-platform',
    kind: 'capability',
    value: '19',
    unit: '',
    label: {
      zh: '個模組化 Agent 子流程',
      en: 'modular agent subflows',
    },
    version: 'n8n workflow export v1.0',
    measuredAt: '2025-01-01',
    scope: {
      zh: '1 個主流程集中接收 LINE Webhook 與 Gemini 意圖路由，分派至 19 個獨立維護子流程（RAG、事實查證、新聞、圖像、爬蟲等）',
      en: '1 main workflow receiving LINE Webhook & Gemini intent routing, dispatching across 19 modular subflows (RAG, fact check, news, image, web)',
    },
    method: {
      zh: 'n8n 工作流拓撲解耦，將意圖分析與能力模組分離，以統一 result adapter 轉換為 LINE 格式',
      en: 'n8n topology decoupling intent routing from capability modules, with unified result adapter for LINE Messaging API',
    },
    limitations: {
      zh: '架構拓撲與模組數量指標，不代表正式環境流量、可用性 SLA 或單一模組品質保證；無維運連線率公開記錄',
      en: 'Architectural topology and modularity metric; does not represent production traffic, uptime SLA, or single-module accuracy',
    },
    sourceStatus: 'public-artifact',
    publicSourceHref: 'https://github.com/poirotw66/n8n_workflow',
    detailAnchor: '#case-design',
  },
  {
    id: 'ocr-normalized-formats',
    projectSlug: 'ocr-automation',
    kind: 'capability',
    value: '5+',
    unit: '+',
    label: {
      zh: '種醫院格式正規化',
      en: 'hospital formats normalized',
    },
    version: 'HospitalPipeline v1.0',
    measuredAt: '2025-01-10',
    scope: {
      zh: '台大、長庚、彰基、榮總、奇美等 5 所以上醫療院所收據版型',
      en: 'Receipt formats from 5+ major hospitals (NTU, Chang Gung, CCH, VGHTPE, Chi Mei)',
    },
    method: {
      zh: 'UVDoc 展平校正 + YOLOv7 區域/表格偵測 + PaddleOCR + HospitalPipeline 專屬欄位正規化',
      en: 'UVDoc rectification + YOLOv7 region/table detection + PaddleOCR + HospitalPipeline normalization',
    },
    limitations: {
      zh: '格式與結構化覆蓋指標，不等同營運準確率或自動化率；低解析度與特殊版型仍保留人工覆核邊界',
      en: 'Format and structural coverage metric; does not imply operational accuracy rate; low-resolution and atypical scans require manual review',
    },
    sourceStatus: 'public-artifact',
    publicSourceHref: 'https://github.com/poirotw66/ocr_api',
    detailAnchor: '#case-context',
  },
] as const;

export function getProjectEvidence(id: string): ProjectEvidenceItem | undefined {
  return PROJECT_EVIDENCES.find((item) => item.id === id);
}

export function getEvidencesByProject(
  projectSlug: ProjectEvidenceItem['projectSlug']
): readonly ProjectEvidenceItem[] {
  return PROJECT_EVIDENCES.filter((item) => item.projectSlug === projectSlug);
}

export function getTrustMetrics(lang: Lang) {
  const isEn = lang === 'en';
  return [
    {
      value: '98.0%',
      label: isEn ? 'weighted RAG accuracy' : 'RAG 加權準確率',
      detail: isEn ? 'Fixed 100-query benchmark' : '固定 100 題 benchmark',
      evidenceId: 'rag-v22-weighted-accuracy',
      projectSlug: 'agentic-rag',
      anchor: '#case-evaluation',
    },
    {
      value: '19',
      label: isEn ? 'modular agent subflows' : '個模組化 Agent 子流程',
      detail: isEn ? 'Inspectable system design' : '可查驗的系統設計',
      evidenceId: 'line-modular-subflows',
      projectSlug: 'agentic-ai-platform',
      anchor: '#case-design',
    },
    {
      value: '5+',
      label: isEn ? 'hospital formats normalized' : '種醫院格式正規化',
      detail: isEn ? 'Built against real documents' : '以真實文件完成實作',
      evidenceId: 'ocr-normalized-formats',
      projectSlug: 'ocr-automation',
      anchor: '#case-context',
    },
  ] as const;
}

export function formatSourceStatusBadge(status: SourceStatus, lang: Lang): string {
  if (lang === 'en') {
    switch (status) {
      case 'public-artifact':
        return 'Public Artifact';
      case 'author-reported':
        return 'Author Reported';
      case 'pending-verification':
        return 'Pending Verification';
    }
  }
  switch (status) {
    case 'public-artifact':
      return '公開程式庫／附件';
    case 'author-reported':
      return '作者評測報告';
    case 'pending-verification':
      return '待驗證項目';
  }
}
