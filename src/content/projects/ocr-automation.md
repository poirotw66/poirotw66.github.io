---
title: "收據 OCR API"
description: "以 PaddleOCR + YOLOv7 + 自訂正則化流程，自動解析台灣各大醫院住院／門診收據，輸出 API 友善的 JSON 結構。"
pubDate: 2025-01-10
updatedDate: 2026-07-27
tldr:
  - "以 PaddleOCR + YOLOv7 + 自訂正則化流程，自動解析台灣各大醫院住院／門診收據"
  - "兩階段 YOLO 區塊偵測結合 UVDoc 展平校正，將雜亂影像正規化為統一 JSON"
  - "支援台大、長庚、彰基、榮總、奇美等 5 所以上醫院版型，保留低解析度人工覆核邊界"
audience:
  - "想了解真實專案架構、技術取捨與落地成效的工程師、技術主管與產品團隊。"
  - "需要具體成果數據與技術選型參考，而不只是概念 Demo 的讀者。"
tier: flagship
featuredOrder: 3
subtitle: "PaddleOCR · YOLOv7 · 醫院收據結構化 · 端對端正規化"
repoUrl: "https://github.com/poirotw66/ocr_api"
metrics:
  - "PaddleOCR"
  - "YOLOv7"
  - "多醫院管線"
impact: "5+ 家醫院收據版型正規化｜統一輸出 API-ready JSON"
image: "/projects/ocr-automation/title_image.webp"
---


## Context（情境）

醫療收據需與財務、理賠或內部系統串接，但各醫院版型與欄位格式不一，人工鍵入耗時且易錯。情境需要從掃描件或照片產出**統一、機器可讀**的結構化資料，供下游 API 直接使用。

## Challenge（痛點）

- 台灣各大醫院收據版型與欄位位置差異大，單一規則無法涵蓋。
- 掃描品質（歪斜、陰影、低解析度）影響 OCR 辨識率。
- 部分收據含表格（費用明細），需區塊偵測後再解析欄位。

## Solution（架構＋做法）

本專案做**端對端收據正規化**：不論掃描品質或醫院版型差異，都能輸出統一的結構化 JSON。做法是依「是否含表格」自動切換兩階段 YOLO 偵測與醫院專屬欄位解析，並搭配 UVDoc 展平、歪斜／陰影校正與 PaddleOCR，降低影像品質造成的誤差。

- 支援**台大、長庚、彰基、榮總、奇美**等 5 所以上常見醫院，以客製化正則與欄位抽取程式辨識。
- 輸出欄位含 `nhi`、`admissionDate`、`dischargeDate`、`receivedAmount`、`items`（費用明細）等，可對接既有 API。

### 處理管線

1. **影像前處理** — 判斷正反向、UVDoc 展平、陰影與噪聲抑制（`ocr_methods.py`、`correct_skew_eliminate_shadows.py`、`UVDoc/`）。
2. **YOLO Stage 1** — 偵測收據區域（`yolov7_detect.py`）。
3. **切割與再校正** — 必要時以 `crop_image_from_label.py` 再切出區塊。
4. **OCR** — PaddleOCR（det + rec）取得全文，依 `hospital_key.txt` 判斷醫院類別。

## Context（情境）

醫療收據需與財務、理賠或內部系統串接，但各醫院版型與欄位格式不一，人工鍵入耗時且易錯。情境需要從掃描件或照片產出**統一、機器可讀**的結構化資料，供下游 API 直接使用。

## Challenge（痛點）

- 台灣各大醫院收據版型與欄位位置差異大，單一規則無法涵蓋。
- 掃描品質（歪斜、陰影、低解析度）影響 OCR 辨識率。
- 部分收據含表格（費用明細），需區塊偵測後再解析欄位。

## Solution（架構＋做法）

本專案做**端對端收據正規化**：不論掃描品質或醫院版型差異，都能輸出統一的結構化 JSON。做法是依「是否含表格」自動切換兩階段 YOLO 偵測與醫院專屬欄位解析，並搭配 UVDoc 展平、歪斜／陰影校正與 PaddleOCR，降低影像品質造成的誤差。

- 支援**台大、長庚、彰基、榮總、奇美**等 5 所以上常見醫院，以客製化正則與欄位抽取程式辨識。
- 輸出欄位含 `nhi`、`admissionDate`、`dischargeDate`、`receivedAmount`、`items`（費用明細）等，可對接既有 API。

### 處理管線

1. **影像前處理** — 判斷正反向、UVDoc 展平、陰影與噪聲抑制（`ocr_methods.py`、`correct_skew_eliminate_shadows.py`、`UVDoc/`）。
2. **YOLO Stage 1** — 偵測收據區域（`yolov7_detect.py`）。
3. **切割與再校正** — 必要時以 `crop_image_from_label.py` 再切出區塊。
4. **OCR** — PaddleOCR（det + rec）取得全文，依 `hospital_key.txt` 判斷醫院類別。
5. **表格偵測** — 若有表格則啟用 YOLO Stage 2 偵測表格區塊。
6. **醫院管線** — 進入對應 `HospitalPipeline`（`hospital_pipeline.py`），依醫院做欄位正則化與表格補強（`receipt_uni/info/*.py`、`receipt_uni/config/regex_*.txt`）。
7. **輸出** — `convert_df_to_api_format.py` 轉成標準 JSON，由 `generate_json_result` 輸出。

新增醫院時沿用同一邏輯：判斷是否含表格 → 撰寫欄位 regex 與自訂抽取程式即可。

## 管線與輸出範例

**處理管線** — 從影像輸入到 JSON 輸出的流程。

![OCR 處理管線](/projects/ocr-automation/ocr_pipeline.webp)

以下為各院收據辨識後的統一 JSON 輸出結構範例（示範資料經去識別化處理，格式符合 RFC 8259 標準；欄位包含健保註記、住院／出院日、科別、收據總額與 `items` 費用明細）。

**台大醫院**

![台大收據辨識範例](/projects/ocr-automation/ntu1_image.webp)

```json
{
  "file": "ntu_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/19",
    "dischargeDate": "2023/07/23",
    "hospitalName": "國立臺灣大學醫學院附設醫院",
    "dept": "骨科部",
    "receivedAmount": 84327,
    "items": {
      "藥費": 251,
      "治療處置費": 520,
      "材料費": 69006,
      "證明書費": 150,
      "病房費": 14400
    }
  }
}
```

**長庚醫院**

![長庚收據辨識範例](/projects/ocr-automation/cg1_image.webp)

```json
{
  "file": "cg_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/28",
    "dischargeDate": "2023/07/28",
    "hospitalName": "林口長庚紀念醫院",
    "dept": "一般外科系",
    "receivedAmount": 20610,
    "items": {
      "住院部分負擔": 4651,
      "藥品費": 553,
      "材料費": 5520,
      "處置費": 9886
    }
  }
}
```

**彰基醫院**

![彰基收據辨識範例](/projects/ocr-automation/ck1_image.webp)

```json
{
  "file": "ck_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/21",
    "dischargeDate": "2023/07/27",
    "hospitalName": "彰化基督教醫療財團法人彰化基督教醫院",
    "dept": "耳鼻喉暨頭頸部",
    "receivedAmount": 49430,
    "items": {
      "藥費": 1349,
      "材料費": 41919,
      "治療處置費": 650,
      "部分負擔": 5512
    }
  }
}
```

### 欄位對應與人工覆核邊界

- **欄位來源對應**：`hospitalName` 透過關鍵字偵測判定所屬醫院；`nhi`、`admissionDate`、`dischargeDate` 對應收據表頭；`dept` 與 `receivedAmount` 經 Stage 1 區域裁切抽取；`items` 明細由 Stage 2 表格偵測後配合正則表達式映射為數值。
- **人工覆核條件**：
  1. 影像解析度低於 150 DPI 或存在嚴重透視變形時，文字模糊區域標記為需要人工確認。
  2. 收據明細金額加總與 `receivedAmount`（實收總額）不符時，觸發檢核旗標。
  3. 未登記之新醫院版型或非標準手寫收據，系統拒絕猜測並退回人工處理。

## 技術棧

- **OCR** — PaddleOCR（det / rec），繁體中文權重（如 `ch_PP-OCRv4_det`、`tw_PP-OCRv3_rec`）。
- **偵測** — YOLOv7（Stage 1 收據區域、Stage 2 表格區塊）。
- **影像前處理** — UVDoc 展平、deskew、陰影消除；OpenCV、scikit-image。
- **環境** — Python 3.9+；可選 CUDA GPU 加速。

依賴：`paddleocr`、`paddlepaddle-gpu`、`torch`、`torchvision`、`opencv-python-headless`、`numpy`、`pandas`、`Pillow`、`scikit-image`、`PyYAML` 等。

## 擴充新醫院

- `hospital_pipeline.py` 定義 `HospitalPipeline` 抽象類別與各院實作（NTU、長庚、彰基、榮總、奇美等）。
- `receipt_uni/info/*.py` 為醫院專屬欄位邏輯；`receipt_uni/config/regex_*.txt` 為欄位與 regex 對照。

**建議步驟**：  
1. 在 `hospital_key.txt` 加入醫院關鍵字與 key。  
2. 於 `info/` 新增解析程式與 `regex_<HOSP>.txt`（必要時 `regex_<HOSP>_table.txt`）。  
3. 在 `hospital_pipeline.py` 實作新 class（`get_ocr_result`、`crop_from_label`、`text_info`、`table_info` 等）。  
4. 視需要調整 `hospital_api_map.txt`。

## Impact（成果與驗證邊界）

- **格式涵蓋度**：支援 5 所以上醫療院所收據（台大、長庚、彰基、榮總、奇美等），以單一管線輸出統一 JSON。
- **統一輸出契約**：以統一 schema 提供下游 API 直接介接，下游系統無需個別為不同醫院開發客製解析器。
- **數據邊界說明**：本指標為實作能力與版型正規化覆蓋，不代表線上無人化運營的百分之百辨識準確率；低解析度與例外版型始終保留人工覆核邊界。

## Extension（可延伸方向）

- 擴充至更多醫院與收據類型（門診、診所、長照單據）。
- 串接理賠或請款流程，從掃描到審核一鍵完成。
- 加入準確率監控與人工抽檢介面，持續優化辨識與欄位對應。
