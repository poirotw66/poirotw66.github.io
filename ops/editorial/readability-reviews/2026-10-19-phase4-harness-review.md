# 2026-10-19｜第四階段：Harness Engineering 四篇雙語審查

- Scope: Blog 09、10、11、13，繁中／英文共 8 個文章檔案。
- Branch: `editorial/phase4-harness-long-running-agents-20261019`
- Source policy: 直接比較 Anthropic 與 OpenAI 工程文章，將原文的實驗結論、作者個人觀察、本站提出的驗收模式分開描述。
- Status: 已完成候選修訂並發起 PR。**修稿後人工全文精讀、版面與最終部署尚未驗收。**

## 逐篇問題與修訂

| 文章 | 關鍵問題 | 本次修訂 | 驗收 |
| --- | --- | --- | --- |
| 09 長時應用 Harness | 原文把 context anxiety 寫成偏 RAG 的「上下文盲視」；不同模型／不同產品任務的比較缺少方法邊界；成本對比容易被誤認為控制變因的性能提升 | 中英文全文重構為 User Journey 問題 → context / evaluator failure → Sprint Contract → Solo vs Harness → Opus 4.6 簡化與成本；引入具體 QA Contract | Opus 4.5 vs Sonnet 4.5、4.6 區別；$9/20min vs $200/6hr、$124.70/3h50min 為不同條件；官方屬案例非普遍 benchmark |
| 10 跨 Context 交接 | 原本進度摘要與測試證據有區分，但缺少可被下輪否決的驗收物件與停止自動化門檻 | 增加建議 YAML handoff schema、回歸與 blocked 區別、越權／無法重現時的人工作業邊界 | YAML 屬本文建議，不是 Anthropic 規格；原文能力限全端 Web app 實驗 |
| 11 OpenAI Harness Engineering | PR 數量與單一實驗的生產實踐容易被讀者理解成正式企業部署的通用治理做法 | 新增文件、API、敏感營運變更的權限／審批階層；強調約 100 萬行、1,500 PR、1/10 時間是第一方 field report | 不將產出量等同品質，強調 1/10 是估算而非控制實驗；治理表為本站建議 |
| 13 Harness 導覽索引 | 「索引本頁 + spec-002～009 = 8 篇」數學矛盾（實際 8 深讀+1 索引 = 9）；口號式年份比較缺證據 | 中英文修正計數與歷史發布範圍，加上依失敗問題選擇學習與最小實驗的對照表 | Spec 001～009 九個項目；原始 Blog 09～11 不算進 PRD-001 九篇 |

## 核對來源

- [Anthropic：Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)，2026-03-24。
- [Anthropic：Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)，2025-11-26。
- [OpenAI：Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)，2026-02-11。
- [LangChain：The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)，用於系列術語背景。
- 各例中的 YAML、矩形填滿 QA Contract、企業審批層級均為**本站提出的示意／建議**，不是宣稱原始文章定義了該介面。

## Gate / 待辦

- [ ] CI: Site / Editorial passed
- [ ] 修稿後 8 檔人工全文精讀，中英文語義與來源分界一致
- [ ] 驗收內外部連結、表格、程式碼區塊、行動版版面
- [ ] 合併後確認正式部署；PR 建立及 CI 綠燈不代表已正式發布
