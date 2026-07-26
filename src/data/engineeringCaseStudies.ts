import type { Lang } from '../i18n/ui';

export const ENGINEERING_CASE_STUDY_SLUGS = [
  'agentic-rag',
  'ocr-automation',
  'agentic-ai-platform',
] as const;

export type EngineeringCaseStudySlug = (typeof ENGINEERING_CASE_STUDY_SLUGS)[number];

type ArchitectureNode = Readonly<{
  step: string;
  title: string;
  detail: string;
}>;

type Decision = Readonly<{
  technology: string;
  reason: string;
}>;

type Metric = Readonly<{
  value: string;
  label: string;
  note: string;
}>;

type Failure = Readonly<{
  symptom: string;
  correction: string;
  lesson: string;
}>;

type CaseLink = Readonly<{
  label: string;
  href: string;
  kind: 'repository' | 'article' | 'speaking' | 'documentation';
  external?: boolean;
}>;

export type EngineeringCaseStudy = Readonly<{
  eyebrow: string;
  summary: string;
  problem: string;
  constraints: readonly string[];
  architecture: readonly ArchitectureNode[];
  decisions: readonly Decision[];
  responsibilities: readonly string[];
  evaluationMethod: string;
  metrics: readonly Metric[];
  failures: readonly Failure[];
  links: readonly CaseLink[];
  disclosure?: string;
}>;

export const engineeringCaseStudies: Record<
  Lang,
  Record<EngineeringCaseStudySlug, EngineeringCaseStudy>
> = {
  zh: {
    'agentic-rag': {
      eyebrow: 'ENGINEERING CASE STUDY · RETRIEVAL SYSTEM',
      summary: '把企業知識問答從一次性 Demo，收斂成可分流、可評測、可觀測、可部署的受控 Agent 工作流。',
      problem: '企業文件格式混雜、使用者問法不穩定，傳統向量檢索容易漏掉 FAQ、操作步驟與安全邊界；如果每一步都交給 LLM，又會增加延遲、成本與不可預測性。',
      constraints: [
        'PDF、表格、掃描頁與 Markdown 等異質來源必須進入同一知識管線。',
        'FAQ、安全拒答與直接回答需要確定性路由，不能完全依賴模型判斷。',
        '回答必須保留來源脈絡，並在檢索不足時主動重寫或停止。',
        '系統需同時支援 REST、MCP 與 n8n，且能部署至 Cloud Run。',
      ],
      architecture: [
        { step: '01', title: '文件輸入', detail: 'PDF · FAQ · 表格 · 掃描頁' },
        { step: '02', title: '攝取與切分', detail: 'PyMuPDF fast path · Vision fallback · semantic chunking' },
        { step: '03', title: '受控檢索', detail: 'Rule-first routing · BM25 + Vector · RRF rerank' },
        { step: '04', title: 'Agent 驗證迴圈', detail: 'LangGraph · context validation · rewrite · answer evaluation' },
        { step: '05', title: '交付與觀測', detail: 'FastAPI · FastMCP · n8n · Prometheus · Cloud Run' },
      ],
      decisions: [
        { technology: 'LangGraph', reason: '以顯式狀態與條件邊控制重試、拒答和結束條件，比隱藏在單一 prompt 中更容易測試與追蹤。' },
        { technology: 'Rule-first + LLM fallback', reason: '常見 FAQ 與安全規則走 deterministic fast path，把模型留給真正模糊的查詢。' },
        { technology: 'BM25 + Vector + RRF', reason: '同時保留關鍵字精確命中與語意召回，再以無量綱融合避免單一分數系統支配排序。' },
        { technology: 'FastAPI + FastMCP', reason: '同一核心能力可被網頁服務、Agent 工具與自動化流程重用。' },
      ],
      responsibilities: [
        '設計 LangGraph 狀態、路由策略、重寫與答案評估迴圈。',
        '實作文件攝取、語意切分、混合檢索、rerank 與 context validation。',
        '建立 100 題 benchmark、錯誤分類與版本凍結準則。',
        '完成 REST／MCP 介面、安全防護、指標觀測與 Cloud Run 部署設計。',
      ],
      evaluationMethod: '以 100 題固定題庫執行 direct workflow benchmark，逐題記錄正確、部分正確、錯誤、例外與延遲；每次路由或檢索調整都回歸同一題庫，避免只以現場 Demo 判斷品質。',
      metrics: [
        { value: '98.0%', label: '加權準確率', note: '固定 100 題 benchmark' },
        { value: '96 / 100', label: '完全正確', note: '其餘為部分正確，無失敗請求' },
        { value: '2.606s', label: '平均延遲', note: 'rule-first 最新比較結果' },
        { value: '0', label: '例外／逾時', note: 'benchmark 執行結果' },
      ],
      failures: [
        { symptom: '所有查詢都先呼叫 LLM，流程正確但平均延遲偏高。', correction: '加入 query normalization 與 rule-first fast path，只在規則無法判斷時呼叫模型。', lesson: 'Agentic 的價值是可控決策，不是讓每個節點都使用 LLM。' },
        { symptom: '檢索有結果卻仍回答錯誤，問題集中在跨主題 context 汙染。', correction: '加入文件評分、focus context、cross-topic trimming 與生成後評估。', lesson: 'RAG 的品質瓶頸經常在送進模型的 context，而不是生成模型本身。' },
        { symptom: '單次 Demo 看似成功，但修改後無法判斷是否真的變好。', correction: '建立固定題庫、版本化結果與 latency benchmark。', lesson: '沒有可重複評測，就沒有可交付的工程收斂。' },
      ],
      links: [
        { label: 'Agentic RAG 技術文章', href: '/blog/07-agentic-rag/', kind: 'article' },
        { label: 'Enterprise RAG 完整指南', href: '/blog/65-enterprise-rag-guide/', kind: 'article' },
        { label: '系統架構與實作細節', href: '#系統總覽', kind: 'documentation' },
      ],
      disclosure: '核心實作目前未公開 Repository；本頁公開架構、評測方法、關鍵檔案與可重現的設計取捨。',
    },
    'ocr-automation': {
      eyebrow: 'ENGINEERING CASE STUDY · DOCUMENT INTELLIGENCE',
      summary: '將不同醫院、不同版型與不同掃描品質的收據，轉換成下游系統可直接使用的統一 JSON。',
      problem: '醫療收據的版面、欄位名稱、表格結構與影像品質差異很大。單純 OCR 雖能讀出文字，卻無法保證欄位語意、金額關係與 API 格式一致。',
      constraints: [
        '輸入可能是掃描檔或手機照片，包含歪斜、陰影、透視與低對比。',
        '不同醫院採用不同欄位名稱、表格位置與費用分類。',
        'OCR 結果必須保留住院日期、健保別、金額與明細的正確關係。',
        '新增醫院時不能重新改寫整條管線，需具備可插拔正規化規則。',
      ],
      architecture: [
        { step: '01', title: '影像輸入', detail: '掃描收據 · 手機照片' },
        { step: '02', title: '影像校正', detail: 'UVDoc · deskew · shadow removal · OpenCV' },
        { step: '03', title: '版面偵測', detail: 'YOLOv7 Stage 1 · 區域裁切' },
        { step: '04', title: '文字與表格辨識', detail: 'PaddleOCR · YOLOv7 Stage 2' },
        { step: '05', title: '醫院正規化', detail: 'HospitalPipeline · regex config · field mapping' },
        { step: '06', title: '結構化輸出', detail: '統一 schema · API-ready JSON' },
      ],
      decisions: [
        { technology: 'YOLOv7 + PaddleOCR', reason: '先找出版面與表格區域再辨識文字，避免整張收據直接 OCR 造成欄位順序混亂。' },
        { technology: 'UVDoc + OpenCV', reason: '把透視、歪斜與陰影視為辨識前的工程問題，降低模型需要承擔的變異。' },
        { technology: 'HospitalPipeline', reason: '將各醫院差異隔離在設定、regex 與 mapping，核心管線維持一致。' },
        { technology: '固定 JSON contract', reason: '以 API 消費者需要的欄位反推辨識流程，而不是把 OCR 原始文字當成完成品。' },
      ],
      responsibilities: [
        '設計從影像校正、區域偵測、OCR 到 JSON 的端對端管線。',
        '實作醫院版型判斷、欄位與表格偵測、正規表示式與欄位 mapping。',
        '建立 HospitalPipeline 擴充介面，讓新醫院規則與核心辨識邏輯分離。',
        '定義下游 API schema，並以真實收據逐欄驗證輸出。',
      ],
      evaluationMethod: '使用多家醫院真實版型進行端對端驗收，不只檢查字元辨識，而是逐一核對健保別、日期、醫院、科別、總額與費用明細是否能穩定映射到統一 schema。',
      metrics: [
        { value: '5+', label: '醫院格式', note: '各自具備版型與欄位規則' },
        { value: '6', label: '處理階段', note: '從影像輸入到 JSON contract' },
        { value: '1', label: '統一輸出格式', note: '供下游 API 直接使用' },
      ],
      failures: [
        { symptom: '直接對整張收據 OCR，文字雖可讀但欄位順序和表格關係不穩定。', correction: '加入兩階段 YOLO 區域偵測，先切出版面區塊與明細表再辨識。', lesson: '文件理解不能只看字元準確率，版面關係同樣是資料。' },
        { symptom: '共用一套 regex 時，新醫院格式常破壞舊有解析。', correction: '把醫院差異拆成獨立設定、mapping 與 HospitalPipeline adapter。', lesson: '變動最快的規則必須被隔離，而不是散落在核心流程。' },
        { symptom: 'OCR 原始輸出無法直接被財務或理賠系統採用。', correction: '先定義穩定 JSON contract，再回頭設計正規化與驗收欄位。', lesson: '工程成果應以系統整合是否可用衡量，而不只是模型能否辨識文字。' },
      ],
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/poirotw66/ocr_api', kind: 'repository', external: true },
        { label: 'OCR 管線與輸出範例', href: '#管線與輸出範例', kind: 'documentation' },
      ],
      disclosure: 'Repository 公開核心辨識與正規化流程；醫療範例僅展示欄位結構，不作為正式醫療用途。',
    },
    'agentic-ai-platform': {
      eyebrow: 'ENGINEERING CASE STUDY · AGENT PLATFORM',
      summary: '用單一 LINE 入口承接多種 AI 任務，再以語意路由與模組化工作流分派到 19 個可獨立維護的子流程。',
      problem: 'RAG、事實查證、新聞、圖像和網頁任務若全部塞在同一 Bot 流程，會快速形成高耦合、難觀測、難測試的巨大工作流。',
      constraints: [
        '使用者只看到一個 LINE 對話入口，系統必須自行判斷任務類型。',
        '19 個子流程使用不同 API、資料源與回傳格式，不能互相拖累。',
        '新能力需要能獨立新增、替換與停用，不改動 LINE 主流程。',
        '所有結果最終都要符合 LINE 訊息限制與一致的回覆格式。',
      ],
      architecture: [
        { step: '01', title: '對話入口', detail: 'LINE Webhook · message context' },
        { step: '02', title: '意圖路由', detail: 'Gemini intent analysis · task contract' },
        { step: '03', title: '主工作流', detail: 'n8n orchestration · error boundary · dispatch' },
        { step: '04', title: '19 個能力模組', detail: 'RAG · FACT · NEWS · IMAGE · WEB · data tools' },
        { step: '05', title: '回覆正規化', detail: 'result adapter · message formatting · LINE Reply API' },
      ],
      decisions: [
        { technology: 'n8n', reason: '讓路由、外部 API、錯誤分支與資料轉換保持可視化，也方便把能力拆成可替換子流程。' },
        { technology: 'Gemini intent routing', reason: '相較關鍵字規則，更能處理自然語言中混合或不完整的任務描述。' },
        { technology: '主流程 + 子流程', reason: '主流程只負責入口、路由與回覆契約，能力模組可獨立開發與維護。' },
        { technology: 'LINE Messaging API', reason: '以真實對話通路驗證 Agent 平台，而不是只停留在後台流程 Demo。' },
      ],
      responsibilities: [
        '設計主流程、意圖分類、子流程 dispatch 與統一回覆 contract。',
        '整合 RAG、事實查證、新聞、圖片、爬蟲與資料查詢等 19 個模組。',
        '處理 LINE Webhook、訊息格式、API token 與各服務錯誤邊界。',
        '整理可公開匯入的 n8n workflow 與分層教學文件。',
      ],
      evaluationMethod: '以能力矩陣逐項驗證路由是否進入正確子流程，並檢查每個模組在成功、空結果與外部 API 失敗時，都能回到統一的 LINE 回覆契約。',
      metrics: [
        { value: '1', label: '主要入口流程', note: '集中處理 webhook、路由與回覆' },
        { value: '19', label: '獨立子流程', note: '可分別維護與替換' },
        { value: '5+', label: '能力類別', note: 'RAG、查證、新聞、圖像與網頁等' },
      ],
      failures: [
        { symptom: '早期能力直接串在同一工作流，新增節點後理解與除錯成本快速上升。', correction: '把入口、意圖路由與能力執行拆成主流程和獨立子流程。', lesson: 'Agent 平台的擴展性來自模組邊界，不是節點數量。' },
        { symptom: '只使用關鍵字分流時，複合問句與模糊描述容易走錯能力。', correction: '使用 Gemini 產生受限意圖結果，再由 n8n 做確定性 dispatch。', lesson: '模型適合處理語意，工作流適合執行受控決策。' },
        { symptom: '不同模組各自回傳文字、圖片或錯誤，LINE 端處理分支持續膨脹。', correction: '加入 result adapter 與統一回覆 contract。', lesson: '工具可以異質，但平台邊界必須一致。' },
      ],
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/poirotw66/n8n_workflow', kind: 'repository', external: true },
        { label: '公開工作流文件', href: 'https://poirotw66.github.io/n8n_workflow/', kind: 'documentation', external: true },
        { label: '金融生成式 AI 平台工程', href: '/blog/38-financial-genai-platform-engineering/', kind: 'article' },
        { label: 'Enterprise Agentic AI 架構', href: '/blog/39-enterprise-agentic-ai-governance/', kind: 'article' },
        { label: 'iThome 臺灣雲端大會 2026', href: 'https://cloudsummit.ithome.com.tw/2026/session/4597', kind: 'speaking', external: true },
        { label: 'iThome AI Enterprise Summit 2026', href: 'https://aienterprise.ithome.com.tw/2026/speaker/2228', kind: 'speaking', external: true },
      ],
      disclosure: 'Repository 公開可匯入的工作流；正式企業環境仍需另外補上權限、機密管理、稽核與 SLO。',
    },
  },
  en: {
    'agentic-rag': {
      eyebrow: 'ENGINEERING CASE STUDY · RETRIEVAL SYSTEM',
      summary: 'Turning enterprise knowledge QA from a one-off demo into a controlled, observable, deployable, and repeatably evaluated agent workflow.',
      problem: 'Mixed document formats and unstable user phrasing made conventional vector retrieval miss FAQs, operating procedures, and safety boundaries. Sending every decision to an LLM added latency, cost, and unpredictability.',
      constraints: [
        'PDFs, tables, scanned pages, and Markdown had to enter one knowledge pipeline.',
        'FAQ, refusal, and direct-answer paths required deterministic routing.',
        'Answers needed source context and a controlled rewrite or stop path when retrieval was weak.',
        'The same core had to support REST, MCP, n8n, and Cloud Run deployment.',
      ],
      architecture: [
        { step: '01', title: 'Document inputs', detail: 'PDF · FAQ · tables · scanned pages' },
        { step: '02', title: 'Ingestion', detail: 'PyMuPDF fast path · Vision fallback · semantic chunking' },
        { step: '03', title: 'Controlled retrieval', detail: 'Rule-first routing · BM25 + Vector · RRF rerank' },
        { step: '04', title: 'Agent validation loop', detail: 'LangGraph · context validation · rewrite · answer evaluation' },
        { step: '05', title: 'Delivery and operations', detail: 'FastAPI · FastMCP · n8n · Prometheus · Cloud Run' },
      ],
      decisions: [
        { technology: 'LangGraph', reason: 'Explicit state and conditional edges make retries, refusals, and termination testable and observable.' },
        { technology: 'Rule-first + LLM fallback', reason: 'Common FAQs and safety rules take a deterministic fast path; the model handles genuinely ambiguous queries.' },
        { technology: 'BM25 + Vector + RRF', reason: 'Combines exact-term precision with semantic recall without letting one scoring scale dominate ranking.' },
        { technology: 'FastAPI + FastMCP', reason: 'The same capability can serve web clients, agent tools, and automation workflows.' },
      ],
      responsibilities: [
        'Designed LangGraph state, routing, rewrite, and answer-evaluation loops.',
        'Implemented ingestion, semantic chunking, hybrid retrieval, reranking, and context validation.',
        'Built a 100-query benchmark, error taxonomy, and version-freezing criteria.',
        'Designed REST/MCP interfaces, safeguards, observability, and Cloud Run deployment.',
      ],
      evaluationMethod: 'A fixed 100-query direct-workflow benchmark records correct, partial, incorrect, exception, and latency outcomes. Every routing or retrieval change is regressed against the same set.',
      metrics: [
        { value: '98.0%', label: 'Weighted accuracy', note: 'Fixed 100-query benchmark' },
        { value: '96 / 100', label: 'Fully correct', note: 'Remaining answers partial; no failed request' },
        { value: '2.606s', label: 'Average latency', note: 'Latest rule-first comparison' },
        { value: '0', label: 'Exceptions / timeouts', note: 'Benchmark result' },
      ],
      failures: [
        { symptom: 'Every query called an LLM before routing, producing correct but slower flows.', correction: 'Added query normalization and a rule-first fast path.', lesson: 'Agentic means controlled decisions, not an LLM at every node.' },
        { symptom: 'Retrieval returned documents but answers still failed because cross-topic context leaked in.', correction: 'Added document scoring, focused context, cross-topic trimming, and post-generation evaluation.', lesson: 'RAG quality often fails in context selection rather than generation.' },
        { symptom: 'A successful demo could not prove that the next change was better.', correction: 'Created a fixed benchmark, versioned results, and latency comparisons.', lesson: 'Without repeatable evaluation, engineering convergence cannot be demonstrated.' },
      ],
      links: [
        { label: 'Agentic RAG technical article', href: '/blog/07-agentic-rag/', kind: 'article' },
        { label: 'Enterprise RAG guide', href: '/blog/65-enterprise-rag-guide/', kind: 'article' },
        { label: 'Architecture and implementation', href: '#system-overview', kind: 'documentation' },
      ],
      disclosure: 'The core repository is currently private. This page publishes the architecture, evaluation method, key files, and reproducible design trade-offs.',
    },
    'ocr-automation': {
      eyebrow: 'ENGINEERING CASE STUDY · DOCUMENT INTELLIGENCE',
      summary: 'Converting receipts across hospitals, layouts, and scan conditions into one JSON contract that downstream systems can consume.',
      problem: 'Medical receipts vary in layout, labels, table structure, and image quality. Raw OCR can read text but cannot preserve field meaning, monetary relationships, or a stable API format.',
      constraints: [
        'Inputs include scans and phone photos with skew, shadows, perspective, and low contrast.',
        'Hospitals use different labels, table positions, and fee categories.',
        'Insurance type, dates, totals, and line items must retain their relationships.',
        'A new hospital must plug in without rewriting the recognition pipeline.',
      ],
      architecture: [
        { step: '01', title: 'Image input', detail: 'Scanned receipts · phone photos' },
        { step: '02', title: 'Image correction', detail: 'UVDoc · deskew · shadow removal · OpenCV' },
        { step: '03', title: 'Layout detection', detail: 'YOLOv7 Stage 1 · region cropping' },
        { step: '04', title: 'Text and table OCR', detail: 'PaddleOCR · YOLOv7 Stage 2' },
        { step: '05', title: 'Hospital normalization', detail: 'HospitalPipeline · regex config · field mapping' },
        { step: '06', title: 'Structured output', detail: 'Unified schema · API-ready JSON' },
      ],
      decisions: [
        { technology: 'YOLOv7 + PaddleOCR', reason: 'Detecting layout regions before OCR preserves field and table order better than reading the full receipt at once.' },
        { technology: 'UVDoc + OpenCV', reason: 'Treats perspective, skew, and shadows as engineering problems before recognition.' },
        { technology: 'HospitalPipeline', reason: 'Isolates hospital variation in configuration, regex, and mappings while keeping the core pipeline stable.' },
        { technology: 'Fixed JSON contract', reason: 'The pipeline is designed backward from what API consumers need, not from raw OCR text.' },
      ],
      responsibilities: [
        'Designed the end-to-end path from image correction and region detection to JSON.',
        'Implemented layout selection, field/table detection, regex, and field mappings.',
        'Built the HospitalPipeline extension boundary for hospital-specific adapters.',
        'Defined the downstream API schema and verified real receipts field by field.',
      ],
      evaluationMethod: 'End-to-end acceptance uses real layouts from multiple hospitals. Verification covers insurance type, dates, hospital, department, totals, and line items mapped into one schema—not just character recognition.',
      metrics: [
        { value: '5+', label: 'Hospital formats', note: 'Each with layout and field rules' },
        { value: '6', label: 'Processing stages', note: 'From image input to JSON contract' },
        { value: '1', label: 'Unified output', note: 'Directly consumable by downstream APIs' },
      ],
      failures: [
        { symptom: 'Full-page OCR produced readable text but unstable field order and table relationships.', correction: 'Added two-stage YOLO detection before OCR.', lesson: 'Document understanding includes layout, not only character accuracy.' },
        { symptom: 'One shared regex set caused new hospital formats to break old parsing.', correction: 'Separated each hospital into configuration, mapping, and a pipeline adapter.', lesson: 'Fast-changing rules belong behind a stable boundary.' },
        { symptom: 'Raw OCR output could not be consumed by finance or claims systems.', correction: 'Defined the JSON contract first, then designed normalization and acceptance fields.', lesson: 'Integration usability matters more than whether the model can read text.' },
      ],
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/poirotw66/ocr_api', kind: 'repository', external: true },
        { label: 'Pipeline and output examples', href: '#pipeline-and-output-examples', kind: 'documentation' },
      ],
      disclosure: 'The repository publishes the core recognition and normalization flow. Medical samples demonstrate field structure and are not intended for clinical use.',
    },
    'agentic-ai-platform': {
      eyebrow: 'ENGINEERING CASE STUDY · AGENT PLATFORM',
      summary: 'One LINE entry point routes varied AI tasks through semantic intent analysis into 19 independently maintainable workflows.',
      problem: 'Putting RAG, fact checking, news, image, and web tasks into one bot flow quickly creates a tightly coupled system that is difficult to observe, test, and extend.',
      constraints: [
        'Users see one LINE conversation and expect the system to infer the task.',
        'Nineteen workflows use different APIs, data sources, and result formats.',
        'Capabilities must be independently added, replaced, or disabled.',
        'Every result must return through a consistent LINE-compatible message contract.',
      ],
      architecture: [
        { step: '01', title: 'Conversation entry', detail: 'LINE Webhook · message context' },
        { step: '02', title: 'Intent routing', detail: 'Gemini intent analysis · task contract' },
        { step: '03', title: 'Main workflow', detail: 'n8n orchestration · error boundary · dispatch' },
        { step: '04', title: '19 capability modules', detail: 'RAG · FACT · NEWS · IMAGE · WEB · data tools' },
        { step: '05', title: 'Response normalization', detail: 'result adapter · message formatting · LINE Reply API' },
      ],
      decisions: [
        { technology: 'n8n', reason: 'Keeps routing, external APIs, error branches, and transformation visible while allowing replaceable subflows.' },
        { technology: 'Gemini intent routing', reason: 'Handles mixed and incomplete natural-language task descriptions better than keyword-only rules.' },
        { technology: 'Main flow + subflows', reason: 'The main flow owns entry, routing, and the response contract; modules evolve independently.' },
        { technology: 'LINE Messaging API', reason: 'Validates the platform through a real conversation channel rather than a back-office demo.' },
      ],
      responsibilities: [
        'Designed the main flow, intent categories, subflow dispatch, and response contract.',
        'Integrated 19 modules across RAG, verification, news, images, crawling, and data queries.',
        'Handled LINE webhooks, message formats, API tokens, and service error boundaries.',
        'Published importable n8n workflows and layered technical documentation.',
      ],
      evaluationMethod: 'A capability matrix checks that prompts route to the correct subflow and that success, empty-result, and external-API failure paths all return through the same LINE response contract.',
      metrics: [
        { value: '1', label: 'Primary entry flow', note: 'Owns webhook, routing, and response' },
        { value: '19', label: 'Independent subflows', note: 'Separately maintainable and replaceable' },
        { value: '5+', label: 'Capability groups', note: 'RAG, verification, news, image, web, and more' },
      ],
      failures: [
        { symptom: 'Early capabilities were chained into one workflow, making additions harder to understand and debug.', correction: 'Separated entry, intent routing, and capability execution into a main flow and subflows.', lesson: 'Agent-platform scalability comes from module boundaries, not node count.' },
        { symptom: 'Keyword-only routing misclassified compound or ambiguous requests.', correction: 'Used Gemini for a constrained intent result followed by deterministic n8n dispatch.', lesson: 'Models handle semantics; workflows execute controlled decisions.' },
        { symptom: 'Modules returned incompatible text, image, and error shapes, growing LINE-side branching.', correction: 'Introduced a result adapter and unified response contract.', lesson: 'Tools can be heterogeneous, but the platform boundary must be consistent.' },
      ],
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/poirotw66/n8n_workflow', kind: 'repository', external: true },
        { label: 'Public workflow documentation', href: 'https://poirotw66.github.io/n8n_workflow/', kind: 'documentation', external: true },
        { label: 'Financial GenAI platform engineering', href: '/blog/38-financial-genai-platform-engineering/', kind: 'article' },
        { label: 'Enterprise Agentic AI architecture', href: '/blog/39-enterprise-agentic-ai-governance/', kind: 'article' },
        { label: 'iThome Cloud Summit Taiwan 2026', href: 'https://cloudsummit.ithome.com.tw/2026/session/4597', kind: 'speaking', external: true },
        { label: 'iThome AI Enterprise Summit 2026', href: 'https://aienterprise.ithome.com.tw/2026/speaker/2228', kind: 'speaking', external: true },
      ],
      disclosure: 'The repository publishes importable workflows. Production enterprise environments still require dedicated authorization, secret management, audit, and SLO controls.',
    },
  },
};
