# 2026-10-19｜第二階段：四篇核心技術文章雙語改寫

- Scope: Blog 07、34、63、65；中英文共 8 個文章檔案。
- Branch: `editorial/phase2-rag-mcp-openwiki-20261019`
- Goal: 問題場景 → 設計選擇 → 案例與證據 → 風險及驗收。
- Policy: 本文件不代表文章已經通過修稿後的人工全文精讀。

| 文章 | 本輪重寫 | 主要驗收 |
| --- | --- | --- |
| Blog 07 Agentic RAG | 中英文全文重構，改由帳號混淆案例導入有界路由、檢索分層與驗證，保留原 PDF | 嚴格 96/100、加權 98%、0 不安全與兩條路徑延遲分別表達；第一方數字不得外推 |
| Blog 34 MCP | 增加遷移 contract test、跨 instance、權限及重試案例，補充 MRTR/header routing | 與正式 2026-07-28 MCP 規格一致；建議測試不可誤述為已執行 |
| Blog 63 OpenWiki | 中英全文重寫，核對最新 README CLI、來源 Claims、增量更新、工具責任界線 | 移除未經驗證的 CLI `--auto-pr` 假設；無 token 省額或正確率保證 |
| Blog 65 Enterprise RAG | 新增帳戶政策版本示例、知識編譯審核、索引 Release 邊界及評測口徑 | 不將 98% 加權與 2.6 秒快速路由誤視為同一基準 |

## 來源

- [MCP 2026-07-28 官方發布](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [OpenWiki 官方 README](https://github.com/langchain-ai/openwiki)
- [OpenWiki GitHub Actions 範例](https://github.com/langchain-ai/openwiki/blob/main/examples/openwiki-update.yml)
- Blog 07 與 65 的評測數字保留既有站內第一方案例口徑；**未重新取得原始測試紀錄重算**。
- 其他外部論文來源未在此輪全部重新查證。

## 驗收

- [ ] GitHub Actions Site / Editorial、Schema、雙語連結與 Build
- [ ] 修稿後全文重讀 8 個語言檔案，逐篇保留位置、問題、修改與驗收紀錄
- [ ] PDF 嵌入、表格、內外連結、手機閱讀及導航檢查
- [ ] 數字、時效、CLI、引用及中英版本相互核對
- [ ] 合併後部署確認（CI 通過不代表已部署）
