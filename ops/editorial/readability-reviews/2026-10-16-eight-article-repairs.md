# 2026-10-16｜八篇雙語文章修稿追蹤

- Scope: Blog 64、93、96、141、142、143；Paper Reading 55、99，繁中/英文共 16 檔。
- Branch: editorial/revise-eight-bilingual-articles-20261016
- Status: 修稿候選已提交，需 CI 與人工重讀後才算完成修稿，不表示已上線。
- Editorial policy: 原有精讀紀錄保留；正文修改後重新勾選才代表重新全文驗收。

| 文章 | 本輪修稿 | 驗收重點 |
| --- | --- | --- |
| Blog 64 | E·P·J·T 首次定義、96% 嚴格與 98% 加權 | 中英語義及數字一致 |
| Blog 93 | 不可豁免七禁、單頁上線表、IT 案例延遲界線 | 禁制、例外與模板不矛盾 |
| Blog 96 | MCP 遷移測試示例、mode/budget/freeze 區分 | 未執行的測試不被寫成已證實 |
| Blog 141 | 開場、方法、中位數、術語、兩報表與抽樣、例子 | 原 R01–R08 逐項重新精讀 |
| Blog 142 | 八節點 vs 十七節點區分，刪除重複界線 | 評測分母與原始 Anthropic 文章一致 |
| Blog 143 | 提前整理 v1/v2 時間線，PR 範例 | 不混算不同題組，不宣稱已發布 |
| Paper 55 | RSQ/RSG 控制點比較與概念例子 | 保留七問契約、全部公式與圖說 |
| Paper 99 | 首次抓取與整體成功分層、單位及成本界線 | 區分作者主張與 Figure 6 支持的範圍 |

## 外部核對範圍

- [WetRobo arXiv v1](https://arxiv.org/html/2609.18435v1)：摘要、III-B、Figure 6。
- [Anthropic 自我複製能力研究](https://www.anthropic.com/research/self-replicating-ai)：8/8 成功率與另一個 17 節點示例。
- [TealTiger 官方文件](https://docs.ag2.ai/docs/user-guide/extensions/tealtiger/)：mode、budget、freeze 的行為敘述。
- 其餘文章為文字與內部一致性修訂，**不是所有引用來源的重新查證**。

## 驗收項目

- [ ] 逐篇重新精讀 16 個修後語言檔案，按規則更新精讀清單
- [ ] CI：content、i18n、reading quality、paper checks、Astro build
- [ ] 檢查圖說授權、公式渲染、內部連結與手機閱讀
- [ ] 合併並部署後確認更新日期和頁面
