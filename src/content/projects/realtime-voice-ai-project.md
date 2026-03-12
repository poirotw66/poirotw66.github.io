---
title: "即時語音 AI"
description: "OpenAI Realtime API + Gemini Live + MCP：可選模型的類 ChatGPT 語音助理，支援即時語音、串流回覆、深色／淺色模式與工具增強對話。"
pubDate: 2025-02-26
tier: aigc
subtitle: "OpenAI Realtime API · Gemini Live · MCP · 語音優先、低延遲對話"
repoUrl: "https://github.com/poirotw66/openai-realtimegpt"
metrics:
  - "Realtime API"
  - "Gemini Live"
  - "MCP · 語音"
impact: "即時語音對話 · 可選 Realtime API / Gemini Live"
---

## Context（情境）

客服、內部助理或免持場景需要**語音進、語音出**的即時對話，而非打字或閱讀長文。情境希望達成類 ChatGPT 的語音體驗，並能依需求選擇不同模型（OpenAI / Gemini）與擴充工具（RAG、搜尋、郵件等）。

## Challenge（痛點）

- 語音輸入與輸出需低延遲，且需與後端模型、MCP 工具串接，架構需支援 WebRTC／WebSocket 與串流。
- 不同團隊可能偏好不同模型（OpenAI Realtime API vs. Gemini Live），需支援多模型與 API Key／專案設定。
- 工具增強（RAG、grounding、email）需透過 MCP 協定與前端／後端整合。

## Solution（架構＋做法）

本專案是一套**類生產環境的語音 AI 架構**：透過麥克風達成類 ChatGPT 的體驗，以 **OpenAI Realtime API** 或 **Google Gemini Live** 驅動，並透過 MCP 工具擴充知識、搜尋、郵件與工作流程。

### 功能重點

- **模型選擇** — 在模型選擇畫面選擇 **GPT Realtime**（OpenAI）或 **Gemini Live**（Vertex AI）；可為每張卡片設定 API Key／專案 ID。
- **即時語音輸入與輸出** — 語音轉文字與文字轉語音低延遲；支援繁體中文與英文。
- **類 GPT 對話介面** — 訊息氣泡、串流文字與清楚的連線狀態（聆聽／暫停／結束）。
- **深色／淺色模式** — 主題切換，可偵測系統偏好並記住選擇。
- **連線控制** — WebRTC 連線可暫停／恢復與掛斷；狀態一目了然。
- **MCP 工具** — Model Context Protocol 支援時間查詢、RAG（如 M365）、 grounding（Google 搜尋）與 **Email MCP**（選用，Streamable HTTP，port 8082）；可輕鬆擴充更多工具。

### 介面預覽

**模型選擇** — 選擇 GPT Realtime 或 Gemini Live；每張卡片可設定 API Key／專案 ID。

![模型選擇畫面](/projects/realtime-voice-ai/01_select.png)

**對話** — 即時語音與文字串流、連線狀態與控制按鈕。

![對話介面](/projects/realtime-voice-ai/02_chat.png)

### 架構

語音輸入經 **WebRTC**（或 WebSocket）送往所選模型。**OpenAI** 端由小型 **MCP proxy server** 發出短期 token，API key 不接觸前端。**Gemini Live** 由 **Python 後端**（`gemini_backend.py`）處理 Vertex AI 與 token。模型可呼叫 **MCP 工具**（RAG、grounding、email、自訂 API）；回傳以文字與音訊串流播放。

```
Browser (React) → WebRTC/WS → [OpenAI Realtime API ↔ MCP proxy] 或 [Gemini Live ↔ gemini_backend.py]
                              ↔ MCP tools (RAG, grounding, email, time) → 串流文字 + 音訊 → 使用者
```

Repo 結構：`first-agent/`（React、Realtime SDK、`mcp-proxy-server.js`、`gemini_backend.py`）、`grounding-mcp/`、`mcp_rag_server/`、`mcp_sent_mail/`（Email MCP）。一鍵 **`npm run dev-full`** 可啟動 MCP proxy、Gemini 後端、選用 Email MCP 與前端（`http://localhost:5173`）。

### 技術棧

- **前端** — React 19、TypeScript、Vite；OpenAI 使用 `@openai/agents-realtime`；Gemini Live 整合於 `geminiLive.ts`。
- **傳輸** — 瀏覽器端 WebRTC；必要時以 WebSocket 作為備援。
- **模型** — OpenAI `gpt-realtime-mini-2025-12-15`（可設定）；Gemini Live 透過 Vertex AI（`GOOGLE_CLOUD_PROJECT`、`gcloud auth application-default login`）。
- **MCP** — OpenAI 短期 token 用 proxy；RAG 與 grounding 伺服器（stdio）；Email MCP（Streamable HTTP，選用，以 `EMAIL_MCP_DISABLED=true` 關閉）。

## Impact（量化成效）

- **模型選擇**：**2 種**（OpenAI Realtime API、Google Gemini Live），可依卡片設定 API Key／專案 ID，前端統一語音介面。
- **工具擴充**：MCP 支援時間查詢、RAG（如 M365）、grounding（Google 搜尋）、Email MCP（選用），可依需求擴充更多工具。
- **體驗**：語音進、語音出，串流文字與連線狀態（聆聽／暫停／結束），適用於客服與免持即時對話。

## Extension（可延伸方向）

- 接上更多 MCP 伺服器（內部知識庫、CRM、工單系統），擴充語音助理能力。
- 將架構複用於生產後端（認證、用量控管、多租戶）。
- 支援更多語言與語音模型，或加入會議摘要、即時翻譯等場景。
