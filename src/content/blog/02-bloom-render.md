---
title: "BloomRender 操作手冊：從文字生圖到證件照、形象照、旅遊照與虛擬試穿"
description: "BloomRender 是以 Google Gemini 驅動的 AI 照片工作室。本篇詳述文字生圖、AI 證件照、編輯器微調、形象照、旅遊照與虛擬試穿的完整操作流程與建議學習路徑。"
pubDate: 2025-03-10
category: "Generative AI"
tags: ["BloomRender", "Gemini", "AI 修圖", "證件照", "形象照", "旅遊照", "虛擬試穿"]
image: "/blog/02-bloom-render/title_image.webp"
---
BloomRender 是 AI 驅動的專業照片編輯與生成工作室，以 **Google Gemini API** 提供修圖、濾鏡、證件照、形象照、旅遊照、主題寫真、雙人／團體照與 AI 虛擬試穿。以下依功能模組說明操作流程，並以站內專案截圖輔助說明；圖片皆來自 [BloomRender 專案](/projects/bloom-render/)。

---

## 1. 文字生圖：從文字描述到示意圖

### 1.1 輸入提示詞（Prompt）

![在 Generate 分頁輸入提示詞](/projects/bloom-render/generate_1_prompt.webp)

- 進入首頁上方的 **「Generate Image」** 分頁。
- 在「Describe the image you want to create」文字框中輸入你想要的畫面，例如：
  - 「乾淨白底半身人像，適合履歷使用」
  - 「辦公室背景、自然光、微笑表情」
- 下方可調整：
  - **Aspect Ratio**：1:1、4:3、3:4、16:9、9:16
  - **Image Count**：一次生成 1～4 張圖。

若需要精細控制人物特徵、服裝與場景，可參考專案內操作手冊的 **JSON 結構化 prompt 範例**（性別、年齡、髮型、服裝、光線、構圖等），在此不贅述完整 JSON。

**建議**：先用較寬鬆的描述生成一組示意圖，確認風格後再搭配證件照或編輯器做精緻化處理。

### 1.2 瀏覽生成結果

![文字生圖生成結果](/blog/02-bloom-render/title_image.webp)

- 生成完成後，介面會顯示一組縮圖卡片：
  - 每張圖可 **Download**（下載單張 PNG）或 **Edit This**（將此圖送入主編輯器做細部修圖）。
  - 若同時生成多張，上方會出現 **Download All as ZIP**，可將所有結果打包下載。
- 若想重試不同風格：點選 **「Generate New Images」** 清除目前結果，重新輸入提示詞並生成。

---

## 2. AI 證件照：從雜亂自拍到正式證件照

本段示範如何把「背景雜亂、構圖不佳的自拍」轉成**乾淨、合規格的證件照**。

### 2.1 準備一張日常的照片

- 單人日常照（可為自拍或生活照）：

![單人日常照提示](/projects/bloom-render/idphoto_0_messy_prompt.webp)

- 單人私下較隨意的照片也可作為輸入：

![單人私下照片](/projects/bloom-render/idphoto_1_messy_image.webp)

### 2.2 填寫規範清楚的表單

![修正後的證件照設定與描述](/projects/bloom-render/idphoto_3_gidp_messy_prompt.webp)

在 **IdPhotoForm** 中設定：

1. **證件類型**：選擇實際要使用的證件規格（例如台灣身分證、美國簽證、履歷照）。
2. **修圖等級**：選擇「自然」或「適度美化」，避免過度修飾。
3. **輸出規格**：選擇官方建議尺寸（例如 2×2 inch、35×45 mm）。
4. **服裝**：可選擇自動套用西裝／襯衫，或上傳自備服裝參考照。

表單旁會有提示文字，說明哪些欄位與官方規範最相關。

### 2.3 證件照欄位選單

![證件照欄位選單](/projects/bloom-render/idphoto_2_messy_idp.webp)

使用欄位選單指定：證件類型、修圖等級、背景顏色（白、藍、紅等標準色）、服裝選項（自動西裝、自備照片等）。

### 2.4 單人日常照生成結果

![單人日常照生成為合規人像](/projects/bloom-render/idphoto_4_gidp_image.webp)

送出設定後，系統會產生**構圖正確、背景乾淨**的人像：背景符合所選顏色（多為白底或單色），人物居中，臉部大小與位置接近官方規範。此圖可作為後續裁切與排版的基底。

### 2.5 完整 ID Photo 排版輸出

![單人日常照的證件照排版](/projects/bloom-render/idphoto_5_idp.webp)

在 ID Photo 的最終結果頁可看到：多張依規格排版好的證件照（可直接印出），以及本次使用的設定（類型、尺寸、修圖等級、服裝等）。下載方式：單張下載（各張下方的下載按鈕），或使用「Download All」／ZIP 批次下載。

輸出格式也可透過編輯器進行微調或裁切，見下方 [編輯器步驟](#3-編輯器微調最後的修飾)。

---

## 3. 編輯器微調：最後的修飾

當你已經有一張滿意的 ID Photo 或一般照片，仍可進入主編輯器做最後微調。

### 3.1 在編輯器輸入微調指令

![在編輯器中輸入修圖指令](/projects/bloom-render/edit_1_prompt.webp)

在主編輯器中可：

- **Retouch（修圖）**：選中圖片上某個位置，讓模型重點關注該區域進行修改，例如輸入「This person's solo photo」。
- **Adjust（調整）**：在調整面板輸入更精細的指令，例如：
  - 「柔和膚色，保留臉部細節」
  - 「稍微提亮眼睛與笑容，不要過度美肌」
- 或使用畫筆／熱區（hotspot），只對特定區域進行處理。

### 3.2 查看微調後的成品

![修圖後的結果](/projects/bloom-render/edit_2_image.webp)

編輯器會顯示修圖前後的差異（可使用「比較原圖」功能）。建議檢查：臉部細節是否自然、不過度磨皮；背景邊緣是否乾淨，沒有殘影或鋸齒。

### 3.3 將證件照送入編輯器做細節調整 {#photo-editor}

![正式證件照在編輯器中的微調](/projects/bloom-render/idphoto_6_edit.webp)

將前一節完成的 ID Photo 匯入編輯器後，可以：略為調整亮度與對比使列印時更清晰、修掉衣領皺褶或小瑕疵、保持五官與臉型不變以免違反審核規範。

**小提醒**：證件照的編修應以「清晰自然」為主，避免大幅改變輪廓或膚色。

---

## 4. AI 形象照（Portrait）：履歷與個人品牌照片

### 4.1 填寫形象照需求

![形象照需求與提示](/projects/bloom-render/portrait_1_prompt.webp)

在 **Portrait** 分頁中可：指定用途（履歷、個人品牌、社群頭像等）、選擇輸出規格（尺寸與比例）、視需要輸入簡短補充說明（例如「自然光、微笑、不過度美肌」）。建議用「用途 + 氛圍 + 光線」三要素描述即可，避免過長的故事性文字。

### 4.2 檢查半身預覽

![半身構圖與光線預覽](/projects/bloom-render/portrait_2_half.webp)

上傳照後，系統會顯示半身或近半身預覽。確認臉部是否居中、比例是否適合履歷或 LinkedIn；若構圖不理想，可重新上傳或改用編輯器進行裁切。

### 4.3 完整形象照成果

![完整形象照結果](/projects/bloom-render/portrait_3_full.webp)

完成後可看到完整形象照：光線自然、背景乾淨，適合直接放入履歷或個人網站。下方會提供**下載**（存成 PNG）、**再次生成**（在相似設定下換一組表情或姿勢）、**送入編輯器**（進一步微調膚色、對比或背景）。

---

## 5. AI 旅遊照（Travel）：世界與台灣場景

### 5.1 選擇旅遊主角與風格

可先決定主角風格（例如背包客、城市旅人、情侶旅遊）與整體氛圍（寫實／明信片感／膠片風）。專案手冊中提供男女主角的結構化 prompt 範例（人物特徵、髮型、服裝、場景與光線），可依需求改寫。

- 男主角範例（自拍或日常照作為輸入）：

![旅遊照主角與基本風格男主角](/projects/bloom-render/idphoto_0_messy_prompt.webp)

- 女主角範例（可依「為男主角生成女性伴侶」等描述搭配表單）：

![旅遊照主角與基本風格女主角](/projects/bloom-render/travel_0_girl.webp)

### 5.2 使用地圖與表單設定場景

![世界／台灣地圖與場景選擇](/projects/bloom-render/travel_1_map.webp)

在 Travel 分頁中：在世界地圖或台灣地圖上點選具體地點（城市、景點）；右側 **TravelForm** 可設定天氣（晴天、陰天、黃昏、夜景）、時間（白天／黃昏／夜晚）、服裝、姿勢、構圖（例如半身、遠景、人景比例）。

![更細節的旅遊條件設定](/projects/bloom-render/travel_2_setting.webp)

表單可進一步微調氛圍（放鬆、浪漫、冒險）與構圖偏好（人物大比例、多人合照、廣角景觀等）。

![團體／情侶場景設定](/projects/bloom-render/travel_4_group_set.webp)

若是多人或情侶旅遊照，可指定人數與彼此關係（情侶、朋友、家庭），以及是否需要並肩合照、自拍視角、他拍視角等。

### 5.3 產出單人、情侶與團體旅遊照

![單人旅遊照結果](/projects/bloom-render/travel_3_man.webp)

單人旅遊照會著重人物與背景比例、景點辨識度，以及整體顏色與光線與所選天氣／時間一致。

![情侶或小團體旅遊照結果](/projects/bloom-render/travel_5_cuple_img.webp)

情侶或小團體旅遊照則強調人與人之間的互動感（牽手、對視、一起看風景），並依設定呈現浪漫或活潑的氛圍。同樣支援單張下載、批次下載、再次生成與送入編輯器。

---

## 6. AI 虛擬試穿（Try On）：人物 + 服裝組合

### 6.1 上傳人物與多套服裝

![上傳人物照與多件服裝](/projects/bloom-render/tryon_1_set.webp)

在 Try On 分頁中：左側上傳一張清晰的全身或半身人物照；右側可上傳多張服裝圖片（上衣、外套、洋裝等）。介面會提示可上傳的最少／最多件數與推薦尺寸比例。建議：人物照背景保持簡單、光線均勻；服裝照盡量為正面、拉平拍攝，方便模型辨識。

### 6.2 瀏覽試穿結果與導出

![試穿結果卡片列表](/projects/bloom-render/tryon_2_img.webp)

生成完成後，Try On 頁面會以卡片列表顯示不同服裝搭配。每張卡片代表一套試穿結果，可能包含服裝名稱或風格標籤、下載按鈕、導入編輯器按鈕。建議先快速瀏覽所有卡片，挑出最符合實際穿搭感的幾張，再對有細部需求的結果送入編輯器做背景或光線微調。

### 6.3 女性示範：從單人照到多套造型

#### 上傳人物與服裝

![女性人物與服裝範例](/projects/bloom-render/tryon_3_girl.webp)

範例中：**YOUR PHOTO** 為一張單人照（如躺在地毯上），作為試穿基礎；**CLOTHING PHOTOS** 可上傳多件服裝（介面顯示如 `1/5`）。下方 **OUTPUT QUANTITY** 可選擇一次輸出的試穿結果張數（1～4 張）。

#### 產出多套試穿結果

![女性試穿結果（多種風格）](/projects/bloom-render/tryon_4_girl_img.webp)

生成後畫面會顯示 **AI Try-On** 標題與多個風格卡片。頂部有 **Download All** 與 **Try Again**；每張卡片標示 **STYLE 1、STYLE 2…** 並搭配對應服裝與場景，卡片下方可單獨下載。建議流程：先用少量服裝測試，確認人物與服裝融合自然後，再批量上傳更多服裝並增加輸出張數。

---

## 7. 建議的學習路徑

1. **先從 Generate 練習提示詞** — 學會用簡短描述控制風格與構圖。
2. **再進入 ID Photo / Portrait / Travel / Try On 等結構化表單** — 熟悉各欄位對結果的影響。
3. **最後使用編輯器微調細節** — 利用修圖、濾鏡與裁切，打造最終成品。

---

更多功能說明與專案技術細節請見 [BloomRender 專案頁](/projects/bloom-render/)；完整圖文手冊與 JSON prompt 範例可參考 [GitHub 上的 BloomRender 操作手冊](https://github.com/poirotw66/bloom-render/blob/main/docs/BLOOMRENDER_MANUAL.md)。
