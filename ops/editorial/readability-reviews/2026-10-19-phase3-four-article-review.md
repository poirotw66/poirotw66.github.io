# 2026-10-19｜第三階段：PixelRAG、OKF、GraphRAG、金融平台工程雙語審查

- Branch: `editorial/phase3-visual-rag-okf-graphrag-finance-20261019`
- Scope: Blog 23、24、35、38（繁中及英文）共 8 篇語言檔。
- Review method: 以站內已發布的文章為基礎，核對關鍵原始來源與跨語言表達，對高風險斷言做局部修正或全文改寫。
- Status: 修稿候選已提交，後續 CI 與修稿後全文重讀、視覺驗收尚未完成；不代表已合併或已部署。

## 逐篇發現與修正

| 文章 | 原文問題與位置 | 修改內容 | 驗收重點 |
| --- | --- | --- | --- |
| Blog 23 PixelRAG | 開場將「最高 18.1%」當成一般文字 QA 的固定增益；Chromium 消融表遺漏 work stealing 和 JPEG 階段；100% 截圖、60x preprocessing、8x token、SPA 讀圖出現不當泛化 | 中英修正數據範圍，補足官方的 20/23/28/33/79/96/98/95/109 t/s 消融表；加入成本與資料保護界線 | 真正的端到端吞吐與 batch size；表格中英九個階段、百分比、引用、結尾一致 |
| Blog 24 OKF | 基於 v0.1、把 `timestamp` 當最新版、引用已遷移的舊 repo；把格式可攜直接擴大為知識可信 | 依官方 v0.2 全文雙語重寫；區分 `type` 唯一必填、`sources` / `generated` / `verified` / `status` / `stale_after` / Attested Computation | v0.2 §4/5/10/13 與新 canonical repo；示例只是虛構，不可誤認正式 WAU 指標 |
| Blog 35 GraphRAG | Cypher 「100% 準確」、「完美消除幻覺」、「一定成標準底座」；把圖資料執行確定性等同事實正確 | 中英全文重寫：Graph traversal vs community summarization、ETL、時間有效性、provenance 及對照基線 | 教學用 Cypher 的前提、source span、有效日期、權限與回歸題 |
| Blog 38 金融 GenAI 平台 | 多通道聲稱都經同一 Gateway；MCP 自動留下 Tool Trace；拒答率未分類；加權分數與消融說明有外推風險 | 中英局部修訂控制面與可觀測性，補充哪些通道、安全與部署尚未被 100 題案例證明 | 來源標為第一方 IT 問答範圍，非跨通道完成、授信或法遵決策成效 |

## 查證範圍與來源

- [PixelRAG 論文（arXiv 2606.28344）](https://arxiv.org/abs/2606.28344) 與 [官方 repo](https://github.com/StarTrail-org/PixelRAG)：benchmark 最多 18.1% 的描述、visual pipeline。
- [PixelRAG Chromium 吞吐量紀錄](https://github.com/StarTrail-org/PixelRAG/blob/main/docs/screenshot-throughput-optimization.md)：測試設備、20 → 109 tiles/s、Work-stealing 與 JPEG 分段。
- [OKF 新 canonical repo](https://github.com/GoogleCloudPlatform/open-knowledge-format) 與 [v0.2 規格](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)：§4、§5、§10、§13。
- [InfoQ QCon AI GraphRAG 演講](https://www.infoq.com/presentations/graph-rag-llm/) 與 [Microsoft GraphRAG](https://github.com/microsoft/graphrag)。
- Blog 38 的量測來自本站已有的第一方 IT／流程案例；**本次未重跑 100 題原始測試，也未查驗外部系統的部署狀態**。

## 修稿後驗收狀態

- [ ] Site CI / Editorial CI 全部通過
- [ ] 逐篇重讀修改後的繁中與英文全文，對照原始位置、段落、連結及圖表
- [ ] 檢查所有程式碼區塊、Markdown 表格、圖片與手機版呈現
- [ ] 驗證有日期的外部規格或模型資訊未在審核時變更
- [ ] 如通過並合併，另行確認正式站點已部署；不要把 PR 等同已上線
