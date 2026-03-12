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

## 為何語音優先很重要

客服與即時協助最能發揮價值的情境，是使用者能自然說話並立刻得到語音回覆，而不必等待打字或閱讀長文。本專案是一套**類生產環境的語音 AI 架構**：透過麥克風達成類 ChatGPT 的體驗，以 **OpenAI Realtime API** 或 **Google Gemini Live** 驅動，並透過 MCP 工具擴充知識、搜尋、郵件與工作流程。

## 功能重點

- **模型選擇** — 在模型選擇畫面選擇 **GPT Realtime**（OpenAI）或 **Gemini Live**（Vertex AI）；可為每張卡片設定 API Key／專案 ID。
- **即時語音輸入與輸出** — 語音轉文字與文字轉語音低延遲；支援繁體中文與英文。
- **類 GPT 對話介面** — 訊息氣泡、串流文字與清楚的連線狀態（聆聽／暫停／結束）。
- **深色／淺色模式** — 主題切換，可偵測系統偏好並記住選擇。
- **連線控制** — WebRTC 連線可暫停／恢復與掛斷；狀態一目了然。
- **MCP 工具** — Model Context Protocol 支援時間查詢、RAG（如 M365）、 grounding（Google 搜尋）與 **Email MCP**（選用，Streamable HTTP，port 8082）；可輕鬆擴充更多工具。

## 介面預覽

**模型選擇** — 選擇 GPT Realtime 或 Gemini Live；每張卡片可設定 API Key／專案 ID。

![模型選擇畫面](/projects/realtime-voice-ai/01_select.png)

**對話** — 即時語音與文字串流、連線狀態與控制按鈕。

![對話介面](/projects/realtime-voice-ai/02_chat.png)

## 架構

語音輸入經 **WebRTC**（或 WebSocket）送往所選模型。**OpenAI** 端由小型 **MCP proxy server** 發出短期 token，API key 不接觸前端。**Gemini Live** 由 **Python 後端**（`gemini_backend.py`）處理 Vertex AI 與 token。模型可呼叫 **MCP 工具**（RAG、grounding、email、自訂 API）；回傳以文字與音訊串流播放。

```
Browser (React) → WebRTC/WS → [OpenAI Realtime API ↔ MCP proxy] 或 [Gemini Live ↔ gemini_backend.py]
                              ↔ MCP tools (RAG, grounding, email, time) → 串流文字 + 音訊 → 使用者
```

Repo 結構：`first-agent/`（React、Realtime SDK、`mcp-proxy-server.js`、`gemini_backend.py`）、`grounding-mcp/`、`mcp_rag_server/`、`mcp_sent_mail/`（Email MCP）。一鍵 **`npm run dev-full`** 可啟動 MCP proxy、Gemini 後端、選用 Email MCP 與前端（`http://localhost:5173`）。

## 技術棧

- **前端** — React 19、TypeScript、Vite；OpenAI 使用 `@openai/agents-realtime`；Gemini Live 整合於 `geminiLive.ts`。
- **傳輸** — 瀏覽器端 WebRTC；必要時以 WebSocket 作為備援。
- **模型** — OpenAI `gpt-realtime-mini-2025-12-15`（可設定）；Gemini Live 透過 Vertex AI（`GOOGLE_CLOUD_PROJECT`、`gcloud auth application-default login`）。
- **MCP** — OpenAI 短期 token 用 proxy；RAG 與 grounding 伺服器（stdio）；Email MCP（Streamable HTTP，選用，以 `EMAIL_MCP_DISABLED=true` 關閉）。

## 應用與情境

展示從語音輸入到工具增強、低延遲對話的完整路徑，並具**多模型支援**（OpenAI + Gemini）。適用於客服、內部助理與任何需要免持即時對話的場景。程式結構便於接上自訂 MCP 伺服器，並可沿用同一模式於生產後端。
