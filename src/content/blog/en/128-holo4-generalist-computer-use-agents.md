---
title: "Holo4: One Agent Across GUIs, Code, and Tools—with Different Licenses"
description: "A closer look at H Company’s cross-interface agent and long-horizon harness, its benchmark claims, public traces, and the licensing split between checkpoints."
pubDate: 2026-09-30
updatedDate: 2026-09-30
tldr:
  - "Holo4 puts screen interaction, code execution, MCP, and API tools in one agent workflow; capability depends on both the model and its execution harness."
  - "H Company reports 61.7% on OSWorld 2.0 for Holo4-27B and 30.9% for 35B-A3B. These are vendor results and must not be conflated with scores from a different OSWorld version."
  - "The 27B weights use CC BY-NC 4.0, while 35B-A3B uses Apache 2.0; performance, deployment conditions, and commercial rights belong in the same evaluation."
  - "The 7,366 published trajectories make behavior easier to inspect, but they are not an independent rerun and do not include a complete training recipe."
audience:
  - "Engineers building computer-use, MCP, or multi-interface agents"
  - "Technical decision-makers comparing open weights, benchmarks, and commercial-use terms"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "Multimodal"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 44
kind: "article"
showToc: true
image: "/blog/128-holo4-generalist-computer-use-agents/title_image.webp"
---

Most computer-use agent demos make it easy to think the problem is simply whether a model can read a screen. A real workflow may begin in a desktop app, run code, call an MCP server or business API, and then keep track of state across dozens of steps. H Company’s Holo4 aims to put those interfaces in one agent workflow. The engineering question is not just its model score: the model, harness, evaluation setup, and license have to be considered together.

This article uses [H Company’s Holo4 announcement](https://huggingface.co/blog/Hcompany/holo4), the [Holo4-27B model card](https://huggingface.co/Hcompany/Holo4-27B), the [Holo4-35B-A3B model card](https://huggingface.co/Hcompany/Holo4-35B-A3B), and the [public trajectories dataset](https://huggingface.co/datasets/Hcompany/trajectories). Benchmark and cost figures remain H Company’s own reports. The published traces create an audit surface, but they do not replace an independent rerun under a unified setup.

> **Huahua in one sentence**
>
> Holo4 is notable not because “one model knows more tools,” but because one agent loop can switch between screens, code, and tool interfaces based on the task.

## Agent capability does not live in the model alone

Holo4 is a family of vision-language models, with a 27B dense model and a 35B-A3B Mixture-of-Experts variant. According to the model cards, the 27B model is built on a Qwen3.8 dense architecture, while 35B-A3B uses Qwen3.6 MoE. H Company pairs both with its `hai-agents` harness. The harness sends screenshots and tool results to the model, executes the requested clicks, typing, code, or tool calls, and returns the results for the next turn.

This is not a model directly controlling everything. The model proposes actions; the harness is the execution layer that touches the desktop, code sandbox, and tools. That boundary determines how screenshots are returned, how tool results are represented, where code runs, and whether failures can be retried or recovered. It is why an agent evaluation should treat the model, harness, and environment as one tested system. For broader architectural context, see the [AI Agent architecture guide](/en/blog/64-ai-agent-guide/).

H Company says Holo4 can choose among GUI, code, MCP, and API interfaces, and can operate on the web, desktop, Android, code sandboxes, and business APIs. This is practically useful: when legacy software has no API, an agent may use the GUI; when a controlled API or MCP server exists, it need not simulate every operation as a mouse click. But the announcement does not provide the full routing policy, tool permission model, or error-handling details for every environment. “Supports multiple interfaces” should not be read as proof that the agent switches reliably between them.

## Long-horizon work is a state problem, not a tool-count problem

H Company says its Agentic Task Factory has generated about 10,000 tasks across web apps, MCP servers, and desktop environments, including hybrid settings where the GUI and MCP expose the same state. The company also describes supervised and reinforcement learning over a variety of interactive environments. These are the publisher’s descriptions of its data and training process; the announcement does not provide enough detail to reconstruct the full generation, training, or deduplication recipe.

The change most directly tied to long workflows is the harness, not simply a larger model. H Company says it adapted the execution loop using OSWorld 2.0 failure cases, added reliable memory to track hundreds of steps, and gave the agent a shell on the desktop machine. This points to a key architectural fact: long-horizon context is not just a larger conversation window. The system must preserve task progress, recognize state changes caused by prior actions, and decide what to do after each tool response.

However, H Company does not publish the memory data structure, lifecycle, forgetting policy, update validation, or cross-task isolation. If memory influences future actions, those details affect stale state, cross-task contamination, and error propagation. “Remembers hundreds of steps” is a capability claim, not evidence that persistent memory is safe and reliable. Compare this with [RSIAgent’s frozen experience mechanism](/en/blog/114-rsiagent-frozen-experience/): they describe different systems and should not be treated as the same design merely because both mention memory.

## Separate OSWorld from OSWorld 2.0

Holo4’s headline results are interesting because the 27B variant outscored 35B-A3B within this model family. But the benchmark version and setup matter.

| Holo4 variant | Architecture in the announcement | OSWorld 2.0 | Announced estimated cost per task | Weight license |
| --- | --- | ---: | ---: | --- |
| Holo4-27B | Qwen3.8 dense, 27B | 61.7% | US\$1.22 | CC BY-NC 4.0 |
| Holo4-35B-A3B | Qwen3.6 MoE, 35B-A3B | 30.9% | US\$0.61 | Apache 2.0 |

These numbers come from H Company’s announcement and model cards, not an independent evaluation. One easily confused figure is 85.2% for Holo4-27B on another OSWorld setup, at an estimated US\$0.08 per task. That is not its 61.7% OSWorld 2.0 result. Comparing numbers under the same benchmark name while ignoring version and scoring procedure can mix different task sets, harnesses, or conditions.

Cost is not total cost of ownership either. H Company says its charts estimate each run from input/output tokens and H Models API prices; other comparison points may use model cards, public leaderboards, different harnesses, or private subsets. The announcement itself notes that releases, harnesses, and task subsets differ. Treat these numbers as a cost-performance hypothesis to test, not as enterprise TCO or a universal model ranking. MCP workflows also need identity and permission controls; the [AgentCore Gateway multi-account example](/en/blog/120-aws-agentcore-multi-account-mcp/) highlights a separate boundary: a callable tool is not automatically a well-governed tool.

## Open traces make inspection possible, not full reproduction

One concrete strength of this release is H Company’s [7,366 published Holo4 trajectories](https://huggingface.co/datasets/Hcompany/trajectories). The dataset card says they cover Holo4-27B and Holo4-35B-A3B and include each step’s reasoning, action, tool result, and screenshot. `data/index.json` also lists the benchmark, model, task, success, score, duration, and step count. Readers can inspect whether observations, actions, and tool responses in a particular run support the reported behavior instead of relying only on aggregate scores.

The dataset itself is listed under Apache 2.0, but upstream benchmark tasks retain their own licenses. Its README also says credentials, internal hosts, and personal data are masked as `<PII removed>`; screenshots that exposed them are replaced with placeholders, and a few tasks are omitted. Public access and inspection improve transparency. They do not mean the original training data, harness, benchmark environments, or every task artifact are also open. A serious rerun still needs fixed task splits, environments, harness, stop conditions, and success criteria.

The more accurate description is that these are **publisher-provided execution records that can be inspected**, not an independent reproduction. They can help teams find failure modes, understand what happened during a long run, and seed their own regression tests. The trace bundle alone cannot prove that another deployment will get the same score.

## Read “open weights” together with the license

The adoption trade-off is unusually concrete: the higher-scoring 27B weights use CC BY-NC 4.0, while the lower-scoring 35B-A3B weights use Apache 2.0. The license on H Company’s fine-tuned 27B checkpoint is not replaced by the license on its Qwen base model. Likewise, Apache 2.0 for the trajectory dataset does not extend to model weights. If a use case involves commercial service, downloadable weights should not be reduced to “commercially usable.” Legal and model-governance teams should review the exact checkpoint, derivatives, dependencies, and license terms.

That turns “which model is better?” into a multi-objective decision rather than simply picking the top leaderboard entry. The 27B variant has the higher OSWorld 2.0 score, but its non-commercial license excludes some deployment scenarios. The 35B-A3B variant uses Apache 2.0 but reports a lower score. Hardware, latency, API price, tool reliability, and recovery cost also matter. One benchmark score does not summarize those conditions.

## How to run a useful adoption test

For Holo4 or any cross-interface agent, start with a reproducible workflow suite:

1. **Fix representative tasks and environments.** Select real workflows that require GUI, code, or MCP/API. Pin application versions, data, account roles, initial state, and completion criteria.
2. **Fix the harness before comparing models.** Control prompts, screenshot frequency, tool schemas, memory, retries, and stop conditions. Otherwise the difference may come from the harness rather than the checkpoint.
3. **Record failures, not just averages.** Track completion, error types, human handoffs, steps, tokens, latency, and rerun cost; break results down by interface and task difficulty.
4. **Isolate permissions.** Start in a disposable VM or dedicated test tenant. Keep real credentials and irreversible actions out of reach; add least privilege and human approval gradually.
5. **Track licenses in the model inventory.** Record the exact checkpoint revision, model card, license, quantization, and use case. Do not apply a dataset or base-model license to fine-tuned weights.

Holo4’s engineering value is that it makes the pieces of a cross-interface agent easier to see: the model chooses actions, the harness maintains the loop, the environment executes tools, and trajectories make some behavior inspectable. Its scores and costs still need external testing with the same harness and each team’s own workflows. Public traces improve inspectability, but they do not erase evaluation or licensing boundaries.

## Further reading and primary sources

- [AI Agent Architecture: Tools, Evaluation, and Production](/en/blog/64-ai-agent-guide/)
- [RSIAgent: Can an Agent Improve Without Changing Its Weights?](/en/blog/114-rsiagent-frozen-experience/)
- [AWS AgentCore Gateway across accounts: keep data in the LOB, authorization at the gateway](/en/blog/120-aws-agentcore-multi-account-mcp/)
- [Holo4 announcement](https://huggingface.co/blog/Hcompany/holo4), [27B model card](https://huggingface.co/Hcompany/Holo4-27B), [35B-A3B model card](https://huggingface.co/Hcompany/Holo4-35B-A3B), and the [trajectories dataset card](https://huggingface.co/datasets/Hcompany/trajectories)
