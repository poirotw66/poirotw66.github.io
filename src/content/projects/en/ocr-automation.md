---
title: "Receipt OCR API"
description: "Automatically parses inpatient/outpatient receipts from major hospitals in Taiwan using PaddleOCR + YOLOv7 + custom regularization pipeline, outputting API-friendly JSON structures."
pubDate: 2025-01-10
updatedDate: 2026-07-27
tldr:
  - "Automated inpatient and outpatient medical receipt parsing across major hospitals in Taiwan"
  - "Two-stage YOLO region detection with UVDoc rectification normalizes complex scans into JSON"
  - "Covers 5+ hospital formats (NTU, Chang Gung, CCH, etc.) while retaining manual review boundaries"
audience:
  - "Engineers, technical leads, and product teams evaluating real project architecture, trade-offs, and delivery results."
  - "Readers who want concrete outcomes and stack choices, not just a concept demo."
tier: flagship
featuredOrder: 3
subtitle: "PaddleOCR · YOLOv7 · Hospital Receipt Structuring · End-to-end Normalization"
repoUrl: "https://github.com/poirotw66/ocr_api"
metrics:
  - "PaddleOCR"
  - "YOLOv7"
  - "Multi-hospital Pipeline"
impact: "Normalized 5+ hospital receipt formats | Unified API-ready JSON"
image: "/projects/ocr-automation/title_image.webp"
---

## Context

Medical receipts need to be integrated with financial, claims, or internal systems, but the layout and field formats vary across hospitals, making manual entry time-consuming and prone to errors. The context requires generating **unified, machine-readable** structured data from scanned documents or photos for direct use by downstream APIs.

## Challenge

- The receipt layouts and field positions of major hospitals in Taiwan vary greatly; a single rule cannot cover them all.
- Scan quality (skew, shadows, low resolution) affects OCR recognition rates.
- Some receipts contain tables (fee details), which require block detection before field parsing.

## Solution

This project implements **end-to-end receipt normalization**: regardless of differences in scan quality or hospital layouts, it can output a unified structured JSON. The approach automatically switches between a two-stage YOLO detection and hospital-specific field parsing based on "whether a table is included," paired with UVDoc flattening, skew/shadow correction, and PaddleOCR to reduce errors caused by image quality.

- Supports over 5 common hospitals including **NTU Hospital, Chang Gung, CCH, Veterans General Hospital, and Chi Mei**, using customized regex and field extraction scripts for recognition.
- Output fields include `nhi`, `admissionDate`, `dischargeDate`, `receivedAmount`, `items` (fee details), etc., which can be integrated with existing APIs.

### Processing Pipeline

1. **Image Preprocessing** — Orientation detection, UVDoc flattening, shadow and noise suppression (`ocr_methods.py`, `correct_skew_eliminate_shadows.py`, `UVDoc/`).
2. **YOLO Stage 1** — Detect receipt regions (`yolov7_detect.py`).
3. **Cropping and Re-correction** — If necessary, use `crop_image_from_label.py` to crop out blocks.
4. **OCR** — Use PaddleOCR (det + rec) to get the full text, and determine the hospital category based on `hospital_key.txt`.
5. **Table Detection** — If a table is present, enable YOLO Stage 2 to detect table blocks.
6. **Hospital Pipeline** — Enter the corresponding `HospitalPipeline` (`hospital_pipeline.py`), perform field regularization and table enhancement according to the hospital (`receipt_uni/info/*.py`, `receipt_uni/config/regex_*.txt`).
7. **Output** — Convert to standard JSON with `convert_df_to_api_format.py`, and output via `generate_json_result`.

When adding a new hospital, the same logic is applied: determine if a table is included → write field regex and a custom extraction script.

## Pipeline and Output Examples

**Processing Pipeline** — The flow from image input to JSON output.

![OCR Processing Pipeline](/projects/ocr-automation/ocr_pipeline.webp)

Below are RFC 8259-compliant JSON samples demonstrating unified output across hospitals (samples use de-identified test data; fields cover NHI status, admission/discharge dates, department, total amount, and fee breakdown).

**NTU Hospital**

![NTU Hospital Receipt Recognition Example](/projects/ocr-automation/ntu1_image.webp)

```json
{
  "file": "ntu_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/19",
    "dischargeDate": "2023/07/23",
    "hospitalName": "National Taiwan University Hospital",
    "dept": "Orthopedics",
    "receivedAmount": 84327,
    "items": {
      "medicationFee": 251,
      "treatmentFee": 520,
      "materialFee": 69006,
      "certificateFee": 150,
      "wardFee": 14400
    }
  }
}
```

**Chang Gung Memorial Hospital**

![Chang Gung Receipt Recognition Example](/projects/ocr-automation/cg1_image.webp)

```json
{
  "file": "cg_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/28",
    "dischargeDate": "2023/07/28",
    "hospitalName": "Linkou Chang Gung Memorial Hospital",
    "dept": "General Surgery",
    "receivedAmount": 20610,
    "items": {
      "inpatientCopay": 4651,
      "medicationFee": 553,
      "materialFee": 5520,
      "procedureFee": 9886
    }
  }
}
```

**Changhua Christian Hospital (CCH)**

![CCH Receipt Recognition Example](/projects/ocr-automation/ck1_image.webp)

```json
{
  "file": "ck_sample_1.jpg",
  "result": {
    "nhi": "Y",
    "admissionDate": "2023/07/21",
    "dischargeDate": "2023/07/27",
    "hospitalName": "Changhua Christian Hospital",
    "dept": "Otolaryngology — Head and Neck",
    "receivedAmount": 49430,
    "items": {
      "medicationFee": 1349,
      "materialFee": 41919,
      "treatmentFee": 650,
      "copay": 5512
    }
  }
}
```

### Field Mapping and Manual Review Boundaries

- **Field Extraction Sources**: `hospitalName` is inferred from key detection; `nhi`, `admissionDate`, and `dischargeDate` map to header text; `dept` and `receivedAmount` are extracted via Stage 1 bounding boxes; `items` fee entries are extracted via Stage 2 table detection and normalized through regex mapping.
- **Manual Review Triggers**:
  1. Low-resolution scans (< 150 DPI) or severe perspective distortion trigger human review flags instead of forced extrapolation.
  2. Arithmetic mismatch between fee items sum and `receivedAmount` triggers a validation alert.
  3. Unregistered hospital templates or handwritten receipts are routed directly to manual review.

## Tech Stack

- **OCR** — PaddleOCR (det / rec), Traditional Chinese weights (e.g., `ch_PP-OCRv4_det`, `tw_PP-OCRv3_rec`).
- **Detection** — YOLOv7 (Stage 1 for receipt regions, Stage 2 for table blocks).
- **Image Preprocessing** — UVDoc flattening, deskew, shadow elimination; OpenCV, scikit-image.
- **Environment** — Python 3.9+; Optional CUDA GPU acceleration.

Dependencies: `paddleocr`, `paddlepaddle-gpu`, `torch`, `torchvision`, `opencv-python-headless`, `numpy`, `pandas`, `Pillow`, `scikit-image`, `PyYAML`, etc.

## Expanding to New Hospitals

- `hospital_pipeline.py` defines the abstract class `HospitalPipeline` and its implementations for various hospitals (NTU, Chang Gung, CCH, Veterans General Hospital, Chi Mei, etc.).
- `receipt_uni/info/*.py` contains hospital-specific field logic; `receipt_uni/config/regex_*.txt` holds mappings between fields and regex.

**Suggested Steps**:  
1. Add the hospital keyword and key to `hospital_key.txt`.  
2. Create a new parsing script in `info/` and `regex_<HOSP>.txt` (and `regex_<HOSP>_table.txt` if necessary).  
3. Implement a new class in `hospital_pipeline.py` (`get_ocr_result`, `crop_from_label`, `text_info`, `table_info`, etc.).  
4. Adjust `hospital_api_map.txt` as needed.

## Impact and Boundary Notes

- **Format Coverage**: Over 5 hospitals supported (NTU, Chang Gung, CCH, Veterans General Hospital, Chi Mei, etc.) with a single unified pipeline.
- **Unified Contract**: Delivers a stable schema directly consumable by downstream financial/claims APIs without layout-specific code.
- **Boundary Clarification**: This is a format coverage and structural normalization metric; it does not claim 100% unsupervised accuracy in production. Degraded or atypical scans retain human verification boundaries.

## Extension

- Expand to more hospitals and receipt types (outpatient, clinics, long-term care receipts).
- Integrate with claims or billing workflows for one-click completion from scanning to review.
- Add accuracy monitoring and manual sampling interfaces to continuously optimize recognition and field mapping.
