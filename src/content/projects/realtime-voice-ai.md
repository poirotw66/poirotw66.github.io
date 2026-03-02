---
title: "Realtime Voice AI"
description: "OpenAI Realtime API + Gemini Live + MCP: ChatGPT-like voice assistant with model choice, real-time speech, streaming responses, dark/light mode, and tool-augmented dialogue."
pubDate: 2025-02-26
subtitle: "OpenAI Realtime API · Gemini Live · MCP · Voice-first, low-latency dialogue"
repoUrl: "https://github.com/poirotw66/openai-realtimegpt"
metrics:
  - "Realtime API"
  - "Gemini Live"
  - "MCP · Voice"
---

## Why voice-first matters

Customer support and live assistance work best when users can talk naturally and get immediate, spoken answers—without waiting for typing or reading long replies. This project is a **production-style voice AI stack**: a ChatGPT-like experience over the microphone, powered by **OpenAI Realtime API** or **Google Gemini Live**, and extended with MCP tools for knowledge, search, email, and workflows.

## What it does

- **Model choice** — Select **GPT Realtime** (OpenAI) or **Gemini Live** (Vertex AI) on the model selection screen; API Key / project ID can be set per card.
- **Real-time voice in & out** — Speech-to-text and text-to-speech with minimal latency; supports 繁體中文 and English.
- **GPT-like chat UI** — Message bubbles, streaming text, and clear connection state (listening / paused / ended).
- **Dark / light mode** — Theme toggle with system preference detection and persisted choice.
- **Connection control** — Pause/resume and hang-up for WebRTC sessions; state is visible at a glance.
- **Tools via MCP** — Model Context Protocol for time lookup, RAG (e.g. M365), grounding (Google Search), and **Email MCP** (optional, Streamable HTTP on port 8082); easy to add more tools.

## Interface preview

**Model selection** — Choose GPT Realtime or Gemini Live; API Key / project ID can be set on each card.

![Model selection screen](/projects/realtime-voice-ai/01_selete.png)

**Conversation** — Real-time voice and text streaming, connection status, and control buttons.

![Conversation interface](/projects/realtime-voice-ai/02_chat.png)

## Architecture

Voice input is sent over **WebRTC** (or WebSocket) to the chosen model. For **OpenAI**, a small **MCP proxy server** issues ephemeral tokens so the API key never touches the front end. For **Gemini Live**, a **Python backend** (`gemini_backend.py`) handles Vertex AI and token handling. The model can call **MCP tools** (RAG, grounding, email, custom APIs); responses are streamed back as text and audio for playback.

```
Browser (React) → WebRTC/WS → [OpenAI Realtime API ↔ MCP proxy] or [Gemini Live ↔ gemini_backend.py]
                              ↔ MCP tools (RAG, grounding, email, time) → Streaming text + audio → User
```

Repo structure: `first-agent/` (React, Realtime SDK, `mcp-proxy-server.js`, `gemini_backend.py`), `grounding-mcp/`, `mcp_rag_server/`, `mcp_sent_mail/` (Email MCP). One command **`npm run dev-full`** starts MCP proxy, Gemini backend, optional Email MCP server, and the frontend at `http://localhost:5173`.

## Tech stack

- **Front end** — React 19, TypeScript, Vite; `@openai/agents-realtime` for OpenAI; Gemini Live integration in `geminiLive.ts`.
- **Transport** — WebRTC in the browser; WebSocket fallback where needed.
- **Models** — OpenAI `gpt-realtime-mini-2025-12-15` (configurable); Gemini Live via Vertex AI (`GOOGLE_CLOUD_PROJECT`, `gcloud auth application-default login`).
- **MCP** — Proxy for OpenAI ephemeral tokens; RAG and grounding servers (stdio); Email MCP (Streamable HTTP, optional, disable with `EMAIL_MCP_DISABLED=true`).

## Impact & use cases

Demonstrates a full path from voice input to tool-augmented, low-latency dialogue with **multi-model support** (OpenAI + Gemini). Suitable for customer support, internal assistants, and any scenario where hands-free, real-time conversation matters. The codebase is structured so you can plug in your own MCP servers and reuse the same pattern for production back ends.
