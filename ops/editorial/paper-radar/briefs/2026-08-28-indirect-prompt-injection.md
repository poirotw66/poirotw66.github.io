---
stableId: "arxiv:2302.12173"
sourceVersion: "v2"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "published"
---

# Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection

## Identity

- Stable ID: `arxiv:2302.12173`.
- Canonical URL: https://arxiv.org/abs/2302.12173
- Authors (v2 PDF): Kai Greshake, Sahar Abdelnabi, Shailesh Mishra, Christoph Endres, Thorsten Holz, Mario Fritz (Greshake and Abdelnabi equal contribution per HTML).
- Venue or review status: arXiv cs.CR preprint v2 (2023-05-05); not peer reviewed as of 2026-08-28.
- Code: https://github.com/greshake/llm-security (public synthetic demos).

## Editorial fit

- Reader question: After tool-use and retrieval ancestors on agent-systems, how does indirect prompt injection show that retrieved or tool-returned content enters the instruction channel—and what do 2023 Bing Chat / Copilot demos contract for versus later Guard products?
- Why this belongs in the selected track: Fills agent-security gap on agent-systems after ReAct, Toolformer, WebGPT, and Gorilla open the retrieval/tool channel.
- Gap it fills: agent-security; bounded to 2023 PDF-era taxonomy and qualitative demos.
- Why now: Foundations spine complete; next durable node is LLM-integrated application security ancestor, not alignment or inference-efficiency leaves.

## Claim map

- Problem: Direct prompt injection assumes the attacker types into chat; LLM-integrated apps ingest untrusted retrieved data that can carry instructions.
- Core idea: Indirect Prompt Injection poisons likely-to-be-retrieved sources; processing retrieved prompts is analogous to arbitrary code execution; data/instruction boundary blurs.
- Evidence: Figure 2 taxonomy; Figure 3 flow; Section 4 Bing Chat (GPT-4), GitHub Copilot, synthetic GPT-4/davinci-003 apps at temperature=0; GitHub llm-security demos. No headline ASR table (Section 5.2).
- Boundary: 2023 UI; black-box Bing repro hard; no M365/plugins access; not Llama-Guard, OWASP, or jailbreak-leaderboard contract; do not import InstructGPT, Speculative Decoding, or YOLO numbers.

## Publication

- Content entries: `42-indirect-prompt-injection` (ZH + EN).
- Path wiring: `agent-systems` after Gorilla, before SWE-bench GitHub issue evaluation in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointers from AgentS4D, Argus, Trajectory Sentinel further-reading sections.
