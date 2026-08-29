---
title: "16 Parallel Claudes Building a C Compiler: Anthropic's Agent Teams and Long-Running Harness Experiments"
description: "A deep dive into Nicholas Carlini's experiment: nearly 2,000 sessions, about $20,000 in API costs, and a 100,000-line Rust compiler capable of compiling Linux 6.9—exploring task locking, test harnesses, GCC oracle, multi-role specialization, and capability boundaries."
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "A deep dive into Nicholas Carlini's experiment: nearly 2,000 sessions, about $20,000 in API costs, and a 100,000-line Rust compiler capable of compiling Linux 6"
  - "9—exploring task locking, test harnesses, GCC oracle, multi-role specialization, and capability boundaries"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Anthropic","Multi-Agent","Claude"]

image: "/blog/17-anthropic-parallel-c-compiler-agents/title_image.webp"
showToc: true
---
Anthropic Safeguards researcher **Nicholas Carlini** published an experiment log in February 2026: he let **16 Claude instances running in parallel** (as agent teams) build a **C compiler implemented in Rust from scratch**, with almost no real-time human intervention. The output was about **100,000 lines** of code capable of compiling **Linux 6.9** on **x86, ARM, and RISC-V**, passing most compiler tests (including GCC torture), and capable of compiling and running **Doom**—the development process was a **clean-room (offline)** effort, relying solely on the Rust standard library.

This is not a product announcement for "the next generation of GCC," but a **stress test**: as the Claude 4 series evolves, using the same extremely difficult target to probe the upper limits of **autonomous software development**, focusing heavily on **how to design a harness** that allows a long-running, multi-session, multi-agent system to make directional progress. If you have already read about the initializer/coding division in [Long-Running Task Harness (blog 10)](/en/blog/10-effective-harnesses-for-long-running-agents/), this article adds the dimension of **multi-instance parallelism, task locking, and test oracles**; it is recommended to pair this with [Reading Map 13](/en/blog/13-harness-engineering-reading-map/).

> **Agent Teams (Carlini's term)**: Multiple Claude instances working in parallel on a shared codebase, without requiring operators to be continuously online for co-editing—he believes this drastically expands the scope of what LLM agents can accomplish.

> **Huahua in one sentence**
>
> Meow~ 16 Claudes teamed up to write a 100,000-line C compiler from scratch. This is not magic, but the ultimate display of powerful Harness design! Locking the Agent in a no-network environment and writing code like crazy is really hardcore~🐾
>
> **Huahua's engineering note**
>
> When designing long-range multi-agent tasks, make sure your test harness (such as GCC oracle) and task locking mechanisms are strong enough, otherwise parallel processing will only create more conflicts and chaos.

Original source:
**Nicholas Carlini (2026). Building a C compiler with a team of parallel Claudes.**
Source: [Anthropic, “Building a C compiler with a team of parallel Claudes”](https://www.anthropic.com/engineering/building-c-compiler)

### Background: Why Choose "C Compiler + Linux kernel"

Carlini has long used **extremely difficult but verifiable** projects as benchmarks (he has taken similar approaches previously). For this target, he drafted the direction in advance but did **not** hardcode the implementation details:

- A ground-up, optimization-oriented C compiler with **minimal external dependencies**
- **GCC compatibility** to the point of compiling real software
- Capable of compiling the **Linux kernel**
- Support for multiple backends; he specified the need for **SSA IR**, etc. (to facilitate multi-pass optimization), leaving the rest to the Agents.

**Model Generations (Original Description):**

| Phase | Capability (Compiler Dimension) |
|------|-------------------|
| Early Opus 4 | Barely able to produce a usable compiler |
| Opus 4.5 | First time producing a compiler that could pass **large test suites**, but still struggled with compiling real large projects |
| Opus 4.6 | The main workhorse for this experiment; close to but **not fully** resolving all limitations |

Therefore, the article serves as both a **model capability report** and a **harness design report**: as generations transition, he will use the same benchmark for comparison.

### Data and Cost: A Sense of Scale

| Metric | Value (Original) |
|------|-------------|
| Claude Code sessions | Nearly **2,000** |
| Duration | About **two weeks** |
| Input tokens | About **2 billion** |
| Output tokens | About **140 million** |
| API Cost | Just under **\$20,000** |
| Output Size | ~**100,000** lines (Rust compiler) |

For average developers, twenty thousand dollars is a staggering expense; but compared to the estimate for a human team to "build a compiler capable of compiling the kernel from scratch," it might still be a **small fraction**. The article also cautions: compared to the most expensive Claude Max subscription, this is an **extreme experiment**, not a daily development budget.

**Verifiable Results (Excerpts):**

- Bootable **Linux 6.9** (x86 / ARM / RISC-V)
- Also capable of compiling QEMU, FFmpeg, SQLite, Postgres, Redis, etc.
- Most test suites **~99%** pass (including GCC torture)
- **The ultimate developer punchline test**: Can compile and run Doom

### Core Concept 1: The Long-Running Loop—Don't Let the Agent "Wait for People" Halfway

Existing agent scaffolds (like Claude Code) assume: **Humans must be online**; after completing a part of a complex task, they pause to wait for clarification or next steps.

Carlini's harness is a minimalist **infinite loop** (similar in spirit to the community's so-called Ralph Loop; he recommends running it in a **container** rather than bare metal):

```bash
while true; do
    COMMIT=$(git rev-parse --short=6 HEAD)
    LOGFILE="agent_logs/agent_${COMMIT}.log"
    claude --dangerously-skip-permissions \
           -p "$(cat AGENT_PROMPT.md)" \
           --model claude-opus-X-Y &> "$LOGFILE"
done
```

The `AGENT_PROMPT.md` asks the Agent to: **break things down, track what is being done, decide the next step, and keep working until it's perfect**. The loop itself **never ends**—unless the Agent messes it up itself (he once saw an Agent mistakenly execute `pkill -9 bash`, killing the loop).

#### Differences from Blog 10

| [Blog 10](/en/blog/10-effective-harnesses-for-long-running-agents/) | This Article |
|----------------------------------|------|
| Humans design initializer + coding **roles** | The same prompt repeatedly launches sessions |
| Handover via feature lists and progress files | Relies on repo + tests + task locking |
| Productized long-task applications | Research-oriented "pushing it to near perfection" |

The two are complementary: **role division** and **never-ending loops** can be stacked.

### Core Concept 2: Parallel Agents—Solving Two Types of Single-Session Bottlenecks

Limitations of a single Claude Code session (original text):

1. **Can only do one thing at a time**—multiple bugs cannot truly be fixed in parallel.
2. **Difficult to specialize**—some might want to open separate sessions specifically for documentation, quality, or subtasks.

His parallel implementation deliberately remains **bare-bones**:

#### Infrastructure

- Created a **bare git** repository
- Each Agent: **independent Docker container**
- Inside the container, the repo is mounted at `/upstream`; the Agent **clones** it to `/workspace`
- Upon completion, it **pushes** back to upstream from its own container

#### Task Locking (Avoiding Contention on the Same Issue)

Synchronization algorithm (no central orchestrator):

1. The Agent creates a lock file in `current_tasks/`, such as `parse_if_statement.txt` or `codegen_function_definition.txt`.
2. If two Agents vie for the same filename, **git synchronization** will cause the latecomer to fail, prompting it to choose another task.
3. The Agent completes its work → **pulls** → merges others' changes → **pushes** → deletes the lock.
4. Merge conflicts are **frequent**; they are expected to be resolved by Claude **itself**.
5. The outer layer then spawns a **new container + new session**, and the cycle repeats.

**What is absent**: dedicated inter-agent communication, a master orchestrator, or high-level goal forced assignment—most of the time, each Claude picks the "next most obvious problem"; when stuck, it writes a document on **failed approaches** and remaining tasks. Reading the git log feels like watching a team documentary.

### Core Concept 3: Test Harness—Agents Will Optimize "What You Measure"

Carlini noted: **Most of the effort was not in the loop itself**, but in the **environment**: tests, scripts, and feedback, enabling the Agent to **judge right from wrong without human supervision**.

#### Why the Verifier Must Be Near-Perfect

The Agent will fully dedicate itself to solving the target you provide. If tests measure the wrong thing, it will **perfectly execute the wrong actions**. Therefore, he:

- Found high-quality **compiler test suites**
- Wrote **build / verify** scripts for open-source projects
- **Observed** the mistakes the Agent repeatedly made → **added tests for those patterns**

#### The Late-Stage Regression Crisis

Common in the late stages of projects: **Every added feature breaks an old one**. Countermeasures:

- Implemented **CI**
- Stricter requirements for the Agent to self-test before committing; new commits **must not** break the main branch.

This shares the same language as the **computational sensors** in [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/) and the mechanized boundaries in [OpenAI 11](/en/blog/11-harness-engineering/): **mechanically verifiable invariants**.

### Core Concept 4: Design Test Outputs for Claude (Not for Human Dashboards)

He constantly reminded himself: **the test harness is for Claude to use**.

#### Cold Starts and Orientation

Every Agent enters a **new container with zero conversation history**, taking a long time to **orient** itself in a large repo. Thus, the requirements were:

- **README and progress files** updated frequently
- Test outputs: **sparse but precise** entries into context; details go into **files**
- Error formatting: `ERROR` and the reason on the **same line**, making it easy to `grep`
- **Pre-aggregated statistics**, preventing the Agent from recalculating massive logs itself

#### Context Pollution

The harness **should not** spew thousands of lines of useless output into the context—this is consistent with the tool output offloading in [LangChain 15](/en/blog/15-langchain-agent-harness-anatomy/) and the "silent on success, noisy on failure" principle in [HumanLayer 21](/en/blog/21-humanlayer-skill-issue-harness/).

#### Time Blindness

Agents **have no sense of time** and might spend hours running tests without advancing the main branch. Countermeasures:

- **Sparse** progress messages (to avoid context pollution)
- Default to **`--fast`**: run a **1% or 10% random subsample**
  - Subsamples per VM are **deterministic** (to reproduce regressions)
  - Subsamples across VMs are **random** (to ensure overall file space coverage)

### Core Concept 5: When Parallelism is Useful—From "Independent Failing Tests" to the Linux Kernel

#### Phase A: Lots of Independent Failures

The test suite has many **mutually independent** fails → each Agent takes a different fail, making parallelism **trivial**.

#### Phase B: After ~99% Pass Rate

Assigned different Agents to successfully compile various **small open-source projects** (SQLite, Redis, libjpeg, MQuickJS, Lua...).

#### Phase C: Linux Kernel—16 Agents Fixing the Same Hole

Compiling the kernel isn't like "hundreds of independent tests," but rather **one giant integration task**. The 16 Agents often:

- Hit the **same bug**
- Fixed it independently, **overwriting each other**
- **Adding more agents didn't increase speed**

#### Solution: GCC as an Online Oracle

New test harness approach:

- **Randomly** use GCC to compile the **majority** of the kernel files
- Only a **subset** is compiled by the Claude compiler
- If the overall build still passes → the bug is in the Claude subset
- Otherwise, further **bisect** the subset to determine which should revert to GCC compilation

As a result, different Agents could work in parallel to fix different issues across **different files**. Later, **delta debugging** was also required: some files pass **individually** but fail when **merged**, needing to be identified in pairs.

> **Takeaway**: The value of multi-agents depends on whether the harness can slice tasks into **independently verifiable units**; otherwise, it is just duplicated effort.

### Core Concept 6: Multi-Role Sessions (Soft Specialization)

Besides "fixing bugs," he also ran parallel **specialized** sessions (because LLMs love reinventing the wheel):

| Direction | Purpose |
|------|------|
| Coalescing | Merging duplicated code |
| Compiler perf | Making the compiler itself faster |
| Output quality | Generating more efficient machine code |
| Rust Architecture | Refactoring structures from a Rust expert's perspective |
| Documentation | Maintaining documentation |

There was still no human assignment like "you are the doc agent"—it naturally diverged based on prompts/conventions and task types.

### Data / Observations: Capability Boundaries (An Honest List from the Original Text)

**Reasons why it hasn't replaced production-grade GCC yet include:**

1. **16-bit x86 real mode**
   Linux boot requires 16-bit programs, and the image is often restricted to **32KB**. The Claude compiler can use a prefix to generate 16-bit code, but the size bloats to **60KB+**, failing to fit the limit → **for this stage, they reverted to calling GCC** (an x86 exception; ARM/RISC-V could use the custom toolchain throughout). Carlini **tried hard to fix it but didn't completely succeed**.

2. **Assembler / linker**
   Not yet custom-built; automation is just beginning and still has bugs; some parts of the demo video used **GCC's asm/link**.

3. **Code Quality**
   The generated code, even with optimization enabled, is still inferior to **GCC with optimizations disabled**; the Rust source code is reasonable but not expert-level.

4. **Stability**
   New features still frequently break old ones—reaching the **ceiling** of Opus 4.6 on this task.

The source code has been published; he will let Agents **continue to push** boundaries—readers are encouraged to clone it, read the code, try it on their own projects, and **observe where the model starts to break down**.

### Security and Governance: Passing Tests ≠ Ready for Production

The conclusion brings an uneasy perspective from **penetration testing**:

- When humans are around, they can catch errors in real time; when **fully autonomous**, it's easy to assume "a green test means the job is done."
- Programmers might deploy software they have **never personally verified**.

This fills the **behaviour harness** gap in [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/) and completes the **E2E observation** triangle in [OpenAI 11](/en/blog/11-harness-engineering/): **the larger the scale, the less verification philosophy can rely solely on unit tests**.

### Outlook: From "Humans Assigning Tasks" to "Humans Defining Goals"

Carlini believes every model generation opens up a new way of working: autocomplete → function bodies → Claude Code → **Agent teams implementing entire complex projects**.

Product assumptions are often: a human defines a task → the model runs for a few minutes → the human gives the next instruction. Agent teams point towards: **humans can be much more ambitious**, with systems autonomously advancing large projects—but it's still early days, and **fully autonomous development carries real risks**.

### Comparison with This Series (At a Glance)

| Dimension | OpenAI 11 | Anthropic 10 | **This Article 17** |
|------|-----------|--------------|-------------|
| Scale Narrative | Million-line product, AGENTS.md | claude.ai clone, feature list | Compiler, kernel |
| Parallelism | High PR throughput | Single-sequence, multi-session | **16 containers + locks** |
| Verification | E2E UI, metrics | Browser automation | Compiler tests, GCC oracle |
| Human's Role | Setting up environments, reviewing direction | Designing the harness | **Reading logs post-mortem** |

### Takeaways and Recommendations: Four Actionable Items

1. **Ask first, "What does the verifier measure?"**: Agents will optimize for the metric; bad tests are more dangerous than no tests at all.
2. **Logs and progress are for the next session**: Formatting should be `grep`-friendly; don't overwhelm the context on successful paths.
3. **Decompose before going multi-agent**: Can it be sliced using oracles, subsamples, or at the file granularity? The kernel counter-example demonstrates this.
4. **Treat git history as a textbook**: It teaches how a harness evolves better than a single chat.

### Summary

Carlini used a **\$20k-level experiment** to illustrate: Opus 4.6 + a **simple but rigorous harness** (infinite loops, locks, tests, GCC bisection) can approach the boundary of "autonomously writing a compiler"; simultaneously, he **honestly highlighted** gaps in 16-bit support, linkers, efficiency, and security governance. For typical teams, there is no need to replicate 16 containers, but the obsession with **"designing verifiers for Agents"** should be emulated.

### Series Reading Guide

- [Harness Reading Map 13](/en/blog/13-harness-engineering-reading-map/) (List **#6**)
- Next article: [18 Phil Schmid — 2026 and durability](/en/blog/18-phil-schmid-agent-harness-2026/)

Original source:
**Nicholas Carlini (2026). Building a C compiler with a team of parallel Claudes.**
Source: [Anthropic, “Building a C compiler with a team of parallel Claudes”](https://www.anthropic.com/engineering/building-c-compiler)
