---
title: "Gemini Antigravity Agent 09-2026: An Agent Runtime Protocol Migration"
description: "A practical breakdown of Antigravity Agent 09-2026's remote/local compatibility boundary, built-in tool contract changes, adapter design, contract tests, and the migration risk before 05-2026 shuts down on October 5, 2026."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "`antigravity-preview-09-2026` is not only a new model string: remote-sandbox clients that read only `output_text` or `model_output` mainly change the agent ID, while local execution or `function_call` parsing faces a full tool-contract migration."
  - "The 05-2026 to 09-2026 built-in changes include PascalCase arguments, line-range file edits, and mappings for `list_files`, `read_file`, and `write_file`; shell execution and web search remain unchanged."
  - "The most durable design is to isolate the vendor protocol behind an adapter, keep a canonical internal operation model, and verify both runtime paths with fixtures, golden traces, and negative cases."
  - "Google says 05-2026 shuts down on October 5, 2026; the preview schema may still change, so migration completion is not a reason to stop monitoring."
audience:
  - "Engineers maintaining an AI agent runtime, tool broker, or coding-agent harness"
  - "Platform teams assessing compatibility, testing, and operational risk before a preview API retires"
category: "AI Engineering"
tags: ["AI Agent", "Gemini", "Platform Engineering", "Evaluation", "MCP"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 37
kind: "article"
showToc: true
wideHeader: true
image: "/blog/gemini-antigravity-agent-09-2026/title_image.webp"
---

On September 17, 2026, Google's [Gemini API release notes](https://ai.google.dev/gemini-api/docs/changelog) announced `antigravity-preview-09-2026` as the replacement for, and deprecation path from, `antigravity-preview-05-2026`. At first glance this looks like a preview model-ID update. The same note, however, splits integrators into two very different paths: a client running in an `environment: "remote"` sandbox and reading only `output_text` or `model_output` steps mainly needs a new agent string; a client using `local_environment` or parsing `function_call` steps must migrate the names, arguments, and file-edit semantics of built-in tools.

That difference is best understood as a **protocol migration**. It is not a claim that 09-2026 is universally better at model tasks, and it is not finished when a repository-wide search-and-replace turns green. The real question is whether your runtime depends on final text or on an executable, replayable, auditable tool contract inside the agent loop. That answer determines the migration surface, test strategy, and failure modes after October 5.

> **Huahua in one sentence**
>
> Agent-preview compatibility is determined less by the agent ID than by which layer of the protocol your program reads.

## Split compatibility into two paths first

The first important signal in the release note is that impact should not be estimated by asking whether a system “uses Antigravity.” Route it by the data type the runtime observes:

| Integration path | Required 09-2026 change | Main risk |
| --- | --- | --- |
| Remote sandbox, consuming only `output_text` / `model_output` | Change the agent to `antigravity-preview-09-2026` | Underestimating the integration surface; reading steps later suddenly enters the other contract |
| `local_environment`, or parsing `function_call` steps | Update built-in tool names, PascalCase arguments, and file-edit semantics | An old dispatcher receives unknown tools, invalid arguments, or non-replayable edits |
| Remote sandbox with full steps / trace parsing | At minimum, verify the step parser and built-in function-call fixtures | Treating remote as migration-free even though observability or replay depends on the old schema |
| Custom function calling | Preserve stateful continuation and check call/result pairing and environment IDs | Mixing built-in filesystem calls with application-owned functions and applying the wrong handling rule |

So “we only run remote” is not a complete risk assessment. The official guide explains that filesystem tools are enabled automatically when `environment` is specified. They still appear as function calls in the steps, even though the environment executes them automatically. If a trace collector, policy engine, replay runner, or review UI reads those steps, it already depends on the tool-level protocol.

[The AI Agent Guide](/en/blog/64-ai-agent-guide/) treats tools, state, the control loop, and evaluation as one production contract. This release is a concrete reminder to observe “what the model returned” and “what the runtime did” separately.

## 09-2026 changes the tool contract, not a quality leaderboard

The Antigravity guide describes a managed agent on the Gemini API: one interaction can reason, execute code, manage files, and browse the web inside a Google-hosted Linux sandbox. It also says that 09-2026 defaults to Gemini 3.8 Flash and that the underlying model can be configured through `agent_config`. Those are product and execution details. They do not justify the conclusion that every agent task becomes more accurate or that migration eliminates the need for re-evaluation.

For an engineering team, the more useful observation is that the same high-level task now has two compatibility questions:

1. **Semantic output compatibility:** if a remote client depends on `output_text` or `model_output`, does the presentation and upstream business schema still behave as expected?
2. **Execution protocol compatibility:** can the runtime recognize the new function-call names, argument keys, file-edit ranges, and subsequent results?

The first may need a smoke test. The second needs API-version-migration discipline: contract tests, fixture replay, error taxonomy, and a canary. A model benchmark cannot substitute for a tool-contract test, and a vendor description of agent capabilities is not evidence for your own task-success rate.

## Verify the 05-2026 → 09-2026 mapping line by line

The release notes list the following built-in changes. This table should become the adapter's migration checklist rather than remain a reading note:

| Capability | 05-2026 | 09-2026 | Migration meaning |
| --- | --- | --- | --- |
| File creation | `write_file(path, content)` | `write_to_file(TargetFile, CodeContent, Overwrite, Description)` | Not only a rename: the payload now has multiple PascalCase fields and explicit overwrite / description semantics |
| File editing | `write_file(path, content)`, full rewrite | `replace_file_content(TargetFile, StartLine, EndLine, TargetContent, ReplacementContent)` | Full rewrite becomes line-range replacement; line bases and content drift now matter |
| File reading | `read_file(path, offset, limit)`, byte offsets | `view_file(AbsolutePath, StartLine, EndLine, ContentOffset)` | Positioning moves from byte offsets to line ranges plus content offset |
| Directory listing | `list_files(path)` | `list_dir(DirectoryPath)` | Both the tool and argument names change |
| File / code search | None built in; agents used shell commands | `find_by_name(SearchDirectory, Pattern, MaxDepth)` and `grep_search(SearchPath, Query, IsRegex)` | Two built-in search contracts are added; they are not aliases for shell output |
| Shell execution | `code_execution(command, timeout_seconds)` | Unchanged | Keep tests for command, timeout, and exit-status behavior |
| Web search | `google_search(queries)` | Unchanged | Unchanged does not mean unmonitored; verify response parsing and quota / failure handling |

File editing is the easiest row to underestimate. In 05-2026, `write_file` rewrote a file. In 09-2026, `replace_file_content` requires `TargetFile`, `StartLine`, `EndLine`, `TargetContent`, and `ReplacementContent`. Renaming `path` to `TargetFile` is not enough: the adapter must know which file version the agent saw, whether line numbers are one-based, whether the target range still matches, and whether a retry would apply the same edit twice.

Likewise, byte offsets in `read_file` and line ranges in `view_file` are not interchangeable coordinates. If a trace stores only “the byte range that was read” without a file snapshot or hash, replay after migration may look successful while reading different text.

## Adapter boundary: canonical inside, versioned outside

Do not make every planner, policy engine, trace viewer, and test helper know about `write_to_file` and PascalCase fields. A more durable design is a vendor-neutral canonical operation layer, for example:

```text
read_file   { absolutePath, startLine?, endLine?, contentOffset? }
write_file  { targetFile, content, overwrite, description }
replace     { targetFile, startLine, endLine, targetContent, replacementContent }
list_dir    { directoryPath }
find_name   { searchDirectory, pattern, maxDepth? }
grep        { searchPath, query, isRegex? }
```

This canonical layer should not flatten every version into a lowest common denominator. It should preserve semantics that affect safety and replay: line ranges, overwrite intent, description, regex search, and the raw `call_id` plus interaction / environment IDs. A versioned serializer can then emit the 05-2026 or 09-2026 wire contract.

A maintainable adapter needs at least four stages:

1. **Detect:** choose the serializer from explicit configuration or a verified agent version; do not infer the version from a tool name.
2. **Normalize:** convert the provider payload into an internal operation and reject missing fields, unknown fields, or invalid ranges.
3. **Authorize:** have the tool broker re-check workspace, tenant, path, permissions, accepted side effects, and timeout. Selecting a tool is not permission to execute it.
4. **Trace:** store both the normalized operation and the raw call so an incident can answer “what did the vendor return?” and “what did we execute?”

If 05-2026 still needs support, the lifetime of the dual serializer should be driven by the shutdown date and test coverage, not by how similar the two sets of names look. The adapter isolates change; it is not a promise to maintain an old preview forever.

## Contract tests should probe boundaries, not only happy paths

A useful test suite can be divided into four layers. These are engineering recommendations from this article, not an official Google test package.

### 1. Remote output-only smoke fixtures

Keep a fixture for an `antigravity-preview-09-2026` interaction and verify that:

- the agent string is updated and the remote environment is created correctly;
- `output_text` and `model_output` selection does not rely on an unguaranteed step index;
- a client that reads only final output does not accidentally enter the built-in tool dispatcher.

The point is not to prove content quality. It is to ensure that the smallest migration path is not broken by a shared parser.

### 2. Built-in tool contract fixtures

Create a success fixture for each mapping and retain the raw function-call name and arguments. At minimum cover `write_to_file`, `replace_file_content`, `view_file`, `list_dir`, `find_by_name`, `grep_search`, unchanged `code_execution`, and unchanged `google_search`.

Add negative cases as well:

- an old `write_file` reaches the 09-2026 serializer;
- a PascalCase field is missing, misspelled, or mixed with snake_case;
- `StartLine` is greater than `EndLine`, or the target content no longer matches the snapshot;
- `AbsolutePath` escapes the allowed workspace;
- `IsRegex`, `MaxDepth`, or timeout has the wrong type for the canonical schema.

Negative cases separate “unknown tool” from “tool execution failed.” The former is usually an adapter or version-selection problem; the latter may be an external-environment or permission problem. If both become a generic 400, recovery becomes slow.

### 3. Stateful continuation and replay

The official function-calling guide uses `previous_interaction_id` to continue an interaction and `environment_id` to reconnect the next turn to the original sandbox. Tests should freeze the complete sequence: agent requests a function call → broker executes or rejects it → client returns a function result → agent completes. Verify `call_id`, function name, result schema, and environment reference together.

Do not use manually reconstructed stateless history as a substitute for continuation testing. The guide explicitly says function calling is supported only in stateful mode. This contract error may not appear in the first request; it often surfaces on the second turn.

### 4. Operational invariants

Finally test the conditions that do not appear in a tool-name table: whether retries are idempotent, whether a line-range edit fails safely after an external file change, whether the trace can reconstruct the tool decision, and whether timeout, cancellation, and budget-incomplete states remain actionable.

The Antigravity guide also notes that this is still a preview and schemas may change; background execution requires `store=True`; remote MCP uses Streamable HTTP rather than SSE; and server names must match a strict lowercase alphanumeric, underscore, or hyphen constraint. These are not direct rename rows in this migration, but they are part of the same runtime contract and should be marked separately in the compatibility matrix.

## A runbook before October 5

Google has stated that `antigravity-preview-05-2026` shuts down on October 5, 2026. During the countdown, the important thing is not merely to make one edit. It is to make every step answer which class of client still depends on the old contract:

1. **Inventory:** list every agent ID, environment mode, step parser, built-in filesystem interceptor, custom function, and MCP integration.
2. **Classify:** split clients into remote output-only, remote trace-aware, and local / tool-dispatch groups with separate acceptance criteria.
3. **Dual-run:** on controlled traffic or offline fixtures, run both 05 and 09 serializers. Compare tool selection, argument normalization, side-effect count, trace completeness, and cost; identical-looking text is not sufficient evidence.
4. **Canary:** let 09-2026 handle read-only, replayable, low-side-effect work first. Watch unknown-tool, schema-validation, line-drift, timeout, continuation-failure, and human-escalation rates.
5. **Cut over:** make 09-2026 the only path for new requests while retaining your adapter feature flag and full trace. The flag switches your handling strategy; it does not guarantee that the old preview remains callable after shutdown.
6. **Post-cutover:** treat 05-2026 calls and old tool names as alertable legacy traffic. When they appear, return to client inventory rather than silently falling back to another tool.

This sequence also exposes the real limit of rollback. Before October 5, rollback may mean switching back to the old endpoint. After shutdown, a reliable rollback means returning to your own previous adapter, disabling high-side-effect paths, or routing to a human. It cannot mean treating a retired preview as a disaster-recovery service.

## What this means for engineering and enterprise teams

This release makes the portability boundary of an agent system unusually visible:

- If the client needs only final text from a remote sandbox, the migration surface is small, but still pin the agent ID, update smoke tests, and verify how output is actually consumed.
- If the runtime parses `function_call`, intercepts filesystem execution, replays traces, or gates policy, treat this as a breaking protocol migration and build a versioned adapter with contract-test fixtures.
- If the system uses custom functions, the built-in mapping does not automatically validate stateful continuation, call/result pairing, or human rejection paths.
- If the system uses remote MCP, put Streamable HTTP, the server-name regex, `allowed_tools`, and header / credential handling into the deployment checklist. “It connects” is not the same as “it is safe to delegate.”

The most durable abstraction is not a particular set of Google tool names. It is three observable boundaries: what the model proposed, what the adapter normalized, and what the broker allowed. That is also the point of [the Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/): state, permissions, evaluation, and traces must be connected or compatibility failures will be discovered only after a side effect.

## Conclusion: treat preview upgrades as interface lifecycle

The important lesson of Antigravity 09-2026 is not whether we can attach a larger “supports the new model” label. It is that every agent-runtime team should expect the provider's agent ID, step schema, tool names, argument casing, file-edit semantics, and environment state to evolve.

Migration is complete only when each compatibility path has an owner; every built-in tool has success and rejection fixtures; every side effect can be traced from raw call to authorized operation; and, after the old preview retires, the system still has verifiable human, disable, and in-house adapter rollback paths.

For the architecture background, read [The AI Agent Guide](/en/blog/64-ai-agent-guide/). If your runtime also depends on MCP servers, continue with [MCP specifications and tool boundaries](/en/blog/34-model-context-protocol-mcp/). Finally, evaluate any claim that “quality improved” against your own task set, tool-contract pass rate, side-effect safety, and operational metrics rather than deriving it from this preview release note.

## Sources and further reading

- [Gemini API release notes: Antigravity Agent 09-2026 on September 17, 2026](https://ai.google.dev/gemini-api/docs/changelog) — agent ID, remote / local distinction, tool mapping, and the 05-2026 shutdown date.
- [Antigravity agent guide](https://ai.google.dev/gemini-api/docs/antigravity-agent) — execution environment, function calling, MCP, model configuration, budget controls, and preview limitations.
- [The Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/) — connecting state, permissions, evaluation, and traces into a production control plane.
- [MCP specifications and tool boundaries](/en/blog/34-model-context-protocol-mcp/) — how external tool servers enter an agent runtime.
