# 2026-10-29：GravityOCR、持續音樂編輯與 Hy-Nomas

## 編輯範圍

- GravityOCR（arXiv:2609.26638v1）：Blog，研究評分23/25，依既有Blog門檻通過。
- 持續符號音樂編輯／ABC-LLM（arXiv:2609.34994v1）：Paper Reading，研究評分23/30。
- Hy-Nomas（arXiv:2610.36729v1）：Paper Reading，研究評分25/30。

站點所有者在2026-10-29明確批准後兩篇作為具名人工編輯選題發布。這是僅限這兩篇的編輯例外：不調整評分、不將其偽列為達28分的正式Radar候選、不修改自動推薦或日後寫作門檻。所有一手來源、主張強度、雙語、圖像權利、語義teach-back、metadata、路由及發布檢查仍適用。兩篇對照／消融／使用研究與完整重現的既有限制必須留在正文。

## 圖像與證據

三張封面均為本次原創向量插畫，以本機SVG渲染成WebP；不含付費圖像生成、模型實驗或複製論文圖。GravityOCR封面沿用站點Huahua的暖色三花貓語彙；兩篇精讀封面使用無吉祥物的Evidence Atlas語彙。封面為概念插畫，不是實驗資料。

音樂正文保留六張CC BY4.0原圖，逐張標原始版本、圖號、章節與來源；Figure9明示mock，不當作真實模型整合或使用者研究證據。Hy-Nomas論文圖像未定位到可確認涵蓋它們的再利用授權；不把code/weights的Apache條款擴張到論文圖，也不宣稱其法律上禁止再利用。其正文如採原創機制解說，須明示非原論文圖、非實測，且不可冒充原始圖像證據；任何圖像例外另記實際檢查依據。

## 分類

兩篇精讀使用單一最小擴充 `generative-media-interaction`（生成媒體與互動系統），以生成作品的狀態、控制範圍與持續互動為共同問題，不強塞Agent分類。只有完成編輯核可與出版檢查的實際文章才計入topic數量；不以私有草稿湊數，不調低topic最低篇數。同時新增「生成作品的狀態與控制」閱讀路徑，依 ABC 明確作品狀態 → Hy-Nomas 隱式影片歷史的順序安排兩篇；保留每篇精讀恰屬一條閱讀路徑的既有檢查。

閱讀庫快速預覽使用雙語四點 `essence` metadata（問題、核心想法、證據、邊界），不要求正文加入固定90秒章節；舊文仍相容原本的章節抽取。摘要不取代正文、來源或語義審查。

## 發布界線

文章中的數值是作者報告，本次未執行模型、demo或獨立效能重現。網站以外的研究草稿、工作紀錄與候選inbox不隨文章公開；未修改每日排程、其他候選、既有未提交文章或外部宣傳內容。

## Hy-Nomas 原圖例外盤點

依既有 Paper skill 的「when that many are reusable」及「no material reusable figures」條款，本次採未確認可重用原圖的保守例外。查核範圍為 [arXiv v1 全文與 Figures 1–21](https://arxiv.org/html/2610.36729v1)、[arXiv 授權狀態](https://arxiv.org/abs/2610.36729v1)及 [官方 LICENSE](https://github.com/Tencent-Hunyuan/Hy-Nomas/blob/main/LICENSE)。arXiv 標示 perpetual non-exclusive distribution；官方程式庫條款的授權範圍明指 code、parameters、weights。本次未定位到涵蓋這些 material 論文原圖的明確重用授權；不據此主張法律禁止重用。

因此本文不嵌入原論文圖片，保留 Figure 6（機制）、13（文字比較）、17–18（記憶限制）等原始圖連結，以原創 Mermaid 解說控制流程。原創圖不列入論文原圖數量，不當作量測或獨立實驗證據。兩語保存相同原圖例外 marker，scoped audit 使用既有 `--allow-no-body-figures` 與相同理由；archive audit 讀取相同 marker。這不是修改 validator 或虛稱已取得圖權。

來源、雙語七問及封面／音樂原圖目視均經獨立審查；這項例外不豁免論文主張、限制、metadata、分類、build、CI 或公開頁驗證。保留本次盤點的適用日期為2026-10-29；若後續有明確圖像授權或版本更新，應重新盤點。
