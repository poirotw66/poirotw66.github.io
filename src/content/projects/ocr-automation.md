---
title: "OCR Automation"
description: "Medical receipt OCR for financial and healthcare workflows—production deployment with high accuracy."
pubDate: 2025-01-10
subtitle: "Medical receipt OCR for financial and healthcare workflows"
metrics:
  - "95% accuracy"
  - "Production"
  - "Financial / Healthcare"
---

## Business problem

Financial and healthcare workflows require fast, accurate extraction of data from medical receipts and forms. Manual data entry is error-prone and slow. This system automates document intake and structured extraction to improve efficiency and accuracy.

## Architecture

Document upload → preprocessing and layout analysis → PaddleOCR-based recognition (Traditional Chinese optimized) → table and field parsing → structured output for downstream systems. Built for scalability and integration with existing pipelines.

```
Doc In → Preprocess → PaddleOCR (TC) → Table/Field Parser → Structured Output
```

## Technical highlight

- Custom data preprocessing and layout design
- Traditional Chinese PaddleOCR model training and tuning
- Table and structured text parsing algorithms
- Scalable document processing pipeline
- Production deployment in financial/healthcare context

## Metrics & impact

Increased medical receipt recognition accuracy and processing efficiency; established a scalable intelligent document processing architecture at Cathay Financial Holdings.
