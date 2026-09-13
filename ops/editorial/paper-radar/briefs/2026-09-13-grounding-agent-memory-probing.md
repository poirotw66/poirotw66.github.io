---
stableId: "arxiv:2609.11060"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-13
lastVerifiedAt: 2026-09-13
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Grounding Agent Memory：讓背景 curator 先查證環境，再把記憶寫回 Agent

## Identity

- Search window: strict 72-hour scan ending 2026-09-13; arXiv v1 was submitted on 2026-09-10.
- Canonical URL: https://arxiv.org/abs/2609.11060
- Authors: Susheel Suresh, Hazel Mak, Sahil Bhatnagar, Chhaya Methani, and Alejandro Gutierrez Munoz.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-10; Microsoft Corporation is listed in the paper.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.11060
- Code / model / data: The full HTML paper exposes prompts, runtime lifecycle, benchmark construction, and evaluation accounting. No public runnable code repository, model checkpoint, or complete artifact bundle was verified from the primary record.

## Editorial fit

- Reader question: If an agent’s memory was formed from one incomplete or stale trajectory, should a background curator be allowed to read the environment before committing it?
- Why this belongs in the selected track: The paper gives a persistent-memory system a sharply bounded verification role: only the asynchronous curator receives least-privilege read-only world tools, while the task agent, memory schema, retriever, and production write authority remain unchanged.
- Gap it fills: Agent evaluation—how to measure whether memory makes later agents more correct and cheaper under schema drift, changing environments, and a fixed task-time interface.
- Why now: Persistent memory is moving into enterprise agent platforms, but a stored memory can encode an inefficient procedure, an unsupported scope, or a stale field name. The paper turns “memory quality” into a propose–probe–commit lifecycle with explicit cost and authority boundaries.

## Claim map

- Problem: A trajectory is only a partial observation of the world. A curator that sees only completed traces can preserve mistakes, overgeneralize a local relation, or miss that a procedure has become stale.
- Main claim: Giving the post-task curator read-only tools to check claims, scope, procedures, and current state improves downstream agent performance without expanding the task agent’s tool budget or changing the production memory interface.
- Method: After task closure, a distiller creates a compact evidence packet; the curator proposes memory records, probes the live environment using read-only tools, then creates, updates, narrows, deletes, or skips records. Probes run asynchronously and cannot mutate the environment or expose future tasks and labels.
- What is genuinely new: The paper isolates environment verification at write time rather than asking every task agent to re-check every recalled memory. It makes least privilege and evidence boundaries part of the memory architecture, not just an operational afterthought.

## Evidence audit

- Datasets: CLBench supplies a 40-question SQLite schema-drift schedule, a 30-question no-drift schedule, and paired cross-model comparisons. Adapted APEX adds 90 management-consulting tasks across six document worlds, using PDF/XLSX/DOCX/PPTX discovery, quantitative analysis, and MCP-style tools.
- Benchmarks and metrics: Systems compare no memory, full in-context learning, trajectory-only memory, and environment-probed memory. The primary drift experiment reports strict pass rate, pass-discounted reward, task-agent tool calls, tokens, and USD cost; the paper uses five paired seeded runs with 95% Student-t confidence intervals.
- Baselines: GHCP No Memory, GHCP + Full ICL, GHCP + Mem, and GHCP + Mem with Environment Probing use the same task-time memory interface. No-drift runs also compare Sonnet 4.6 and Opus 4.7 to separate memory effects from schema-repair effects.
- Ablations: Drift versus no-drift schedules, two model families, full ICL versus compact memory, and trajectory-only versus probing-based curation are compared. On the 40-question drift schedule, pass rate rises from 39% to 73%, reward from 8.60 to 22.60, task-agent queries fall from 8.8 to 4.7 per question, and task-agent cost falls from $3.38 to $1.68.
- Statistical uncertainty: The paper reports run-level means and 95% intervals, including 73±5% pass rate and $1.68±0.14 task-agent cost for the probed condition. The primary experiment uses the same base model for task agent, distiller, and curator within each setting, so model-family independence is limited.
- Threats to validity: APEX is adapted and CLBench uses controlled schedules, not a broad production fleet. The primary cost accounting excludes the separately tracked distillation and curation phase from task-agent cost, and the probe surface may be safer or cleaner than a real enterprise connector landscape.

## Reproducibility

- Available artifacts and licenses: The paper includes implementation details, lifecycle descriptions, benchmark construction, prompt templates, memory samples, and side-by-side trajectory examples. The primary record did not expose a complete code/data repository, so runnable reproduction remains unverified.
- Environment or compute requirements: Access to the GHCP-style harness, CLBench/APEX data or substitutes, model API access, a persistent memory index, and safe read-only environment tools. The exact provider and model configuration matters because the main protocol uses gpt-5.4 while cross-model checks use Sonnet 4.6 and Opus 4.7.
- Smallest useful reproduction: Create a 30–40 task SQLite schema-drift stream with a persistent memory index and compare no memory, trajectory-only curation, and read-only probe curation over five seeds. Keep task-agent calls and background probe calls separate, and report both pass rate and total cost including curator work.
- Blocking unknowns: The full implementation, exact external harness integration, and reusable benchmark release are not verified. The paper’s prompts and accounting are detailed enough for a faithful miniature, but not yet enough to claim a drop-in enterprise component.

## Critical reading

- Strongest result: Environment probing improves both correctness and operating efficiency under drift while keeping task-time context compact. The reported 73% versus 39% pass rate and $1.68 versus $3.38 task-agent cost make the proposal more concrete than a generic “add memory” result.
- Weakest assumption: Read-only probes can access a trustworthy, representative world surface and that the curator can interpret those observations correctly. If the probe surface is incomplete or itself stale, the propose–probe–commit loop may give a false sense of grounding.
- Stated limitations: The evaluation uses controlled CLBench schedules, adapted APEX tasks, a limited number of models, and a task-agent cost view that excludes background curation. The paper does not yet demonstrate long-running production retention, adversarial tool output, or independent implementation replication.
- Claims not supported by the evidence: The results do not establish that probing is always cheaper in total system cost, that every enterprise connector can safely expose a read-only surface, that the method prevents sensitive-data leakage, or that better memory records guarantee better performance on unseen organizations.

## Bloss0m connection

- Related Traditional Chinese routes: agent memory, agent evaluation, provenance, schema drift, and least-privilege tool design.
- Related English routes: Agent Systems, memory lifecycle, and production reliability.
- Duplication risk: Medium-low; RD-Forget addresses query-conditioned use of retained history, while this paper addresses write-time verification against the live environment.
- Suggested internal links: Pair with RD-Forget for memory-use semantics, AgentAudit for full-lifecycle trust evaluation, and CONTINUITY for security-context contracts.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: unusually direct enterprise-agent relevance, concrete architecture boundaries, five-run confidence intervals, benchmark drift, cost accounting, and a clear operational decision surface. Reproducibility is capped at 3 because no complete runnable artifact was verified and background curation cost needs fuller accounting.
- Open questions requiring human approval: What is the minimum safe probe surface for databases, files, and SaaS connectors? How should probe results be retained as provenance? How should operators budget, monitor, and audit curator calls separately from task-agent calls?
