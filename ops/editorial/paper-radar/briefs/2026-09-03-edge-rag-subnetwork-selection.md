---
stableId: "arxiv:2609.02760"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
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

# Measurement-Driven Sub-Network Selection：RAG Agent 不一定要最大模型，而要選對每台邊緣裝置的子網路

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.02760
- Authors: Vasileios Rizeakos, Georgios Paisios, Alexandros Machairas, Michael Birbas, and Athanasios Bachoumis; enakronIC AI lab and University of Patras.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-02.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.02760; related resource DOI https://doi.org/10.5281/zenodo.22255631.
- Supplementary artifact: https://enakronic.github.io/llm-assistant-supplement/. A full public implementation repository was not located in the verified sources.

## Editorial fit

- Reader question: How should an on-prem RAG agent choose a model when parameter count predicts generic capability but not retrieval-grounded usefulness on the target hardware?
- Why this belongs in the selected track: The paper turns model selection into a measured quality-throughput-memory problem and evaluates the selected sub-network inside a tool-routed RAG assistant.
- Gap it fills: Production RAG—on-device model selection, power, latency, retrieval grounding, and privacy when data cannot leave the factory.
- Why now: Enterprise RAG discussions often optimize for the largest model or the fastest model; this paper shows why both shortcuts can choose the wrong operating point after adaptation.

## Claim map

- Problem: Structural extraction makes a model smaller, but can damage domain answer quality; generic benchmark capability and adapted RAG quality may rank candidate sub-networks differently.
- Main claim: A weight-shared supernetwork plus retrieval-grounded adaptation can select one sub-network per device using a capability floor, judged RAG quality, and measured throughput rather than size or speed alone.
- Method: Extract sub-networks, adapt with LoRA and a task-plus-distillation objective, export to ONNX W8A16 or GGUF Q4_K_M, route questions through grammar-constrained JSON calls to dense retrieval or vision tools, and select a rank on the quality-throughput plane.
- What is genuinely new: The deployment decision is explicitly post-adaptation and evidence-driven; the same compact assistant is evaluated across heterogeneous edge tiers while documents and images remain on premises.

## Evidence audit

- Data and metrics: A manufacturing-manual case uses 633 held-out questions, one-judge quality metrics, throughput, TTFT, end-to-end latency, memory, energy per inference, and standby power. A separate 291-question campaign evaluates Stage-2 recipe ablations.
- Main result: At deployed rank 6, extraction reduces judged quality by 13.7% relative to the unpruned base, while retrieval-grounded distillation brings the gap to 4.6%, recovering two thirds of the loss. On Jetson Orin Nano the selected 3B rank-6 reports 0.773 faithfulness, 0.845 answer relevancy, 0.811 context utilization, 9.95 TPS, and 20.33 seconds end-to-end.
- Selection evidence: Smallest/fastest, largest, quality-only, and unconstrained blend rules each lose a capability or throughput dimension; the capability-floor blend selects rank 6 on the 3B devices. Tool routing reaches 40/40 for fine-tuned cores after 37 routing demonstrations.
- Ablations and uncertainty: Supernetwork distillation carries mid-grid quality; calibrated sampling changes edge behavior. The paper reports bootstrap intervals for the paired 633-question gap and paired rank tests, but the judge and single factory corpus remain important constraints.
- Threats to validity: One domain, one primary corpus, one judge family, no live production workload, and no independent replication. The vision tool is described as functional rather than benchmarked; energy depends on duty cycle and hardware configuration.

## Reproducibility

- Available artifacts: Full HTML paper, supplementary qualitative answers and vision demo, explicit LoRA/KL/export settings, device formats, tabled data, and related Zenodo resource DOI. No complete public training/deployment repository was located.
- Environment or compute requirements: On-prem GPU partition, ONNX Runtime GenAI, llama.cpp, Jetson/RevPi/UNO Q targets, dense embeddings, vision detector, and supernetwork training of roughly 51 hours for 3B and 22.8 hours for 1B in the reported setup.
- Smallest useful reproduction: Compare an unpruned model, extracted rank, and retrieval-grounded Stage-2 distillation on one held-out manual set; measure judged faithfulness, answer relevance, throughput, memory, TTFT, and energy on one GPU and one ARM target.
- Blocking unknowns: Public training code, exact model checkpoint and manual dataset, judge prompt/reliability, generalization beyond factory documentation, and retrieval behavior under stale or permission-filtered sources.

## Critical reading

- Strongest result: The paper reports a complete deployment trade-off rather than only compression ratio, including quality recovery, tool routing, latency, memory, power, and cross-platform behavior.
- Weakest assumption: A single LLM judge and one manufacturing manual can represent grounded quality well enough to select a model for diverse industrial workflows.
- Unsupported leap: The results do not prove that smaller RAG models are always better, nor that a 20-second edge response is acceptable for every shop-floor task.

## Bloss0m connection

- Related routes: production RAG, indexing and chunking, inference efficiency, on-prem AI, and tool routing.
- Duplication risk: Low; this is a hardware-aware post-adaptation selection problem, not a generic quantization or RAG quality paper.
- Suggested internal links: Pair with PAGE-RAG for retrieval quality versus deployment budget, and with the governance candidates for privacy and stale-data controls.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: strong production-RAG fit, unusually complete edge measurements, explicit selection rules, and practical privacy consequences. Reproducibility is 3/5 because the paper is detailed but a complete implementation artifact was not verified.
- Open questions requiring human approval: Can the same selection plane survive a second factory corpus, a different judge, and permission-filtered retrieval? How should quality floors be set when safety-critical answers have asymmetric cost?

