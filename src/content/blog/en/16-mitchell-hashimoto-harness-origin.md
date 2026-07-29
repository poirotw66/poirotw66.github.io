---
title: "Mitchell Hashimoto's Six Stages of AI Adoption: From Dropping Chatbots to Harness Engineering"
description: "A deep dive into Hashimoto's firsthand journey: three stages of tool adoption, redoing commits for practice, off-peak and slam dunk delegation, AGENTS.md and verifiable tools, plus the current state and limitations of 'always having an Agent running'."
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "A deep dive into Hashimoto's firsthand journey: three stages of tool adoption, redoing commits for practice, off-peak and slam dunk delegation, AGENTS"
  - "md and verifiable tools, plus the current state and limitations of 'always having an Agent running'"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Codex","Agentic Coding"]

image: "/blog/16-mitchell-hashimoto-harness-origin/title_image.webp"
showToc: true
---
Mitchell Hashimoto (Founder of Ghostty and HashiCorp) wrote a **completely hand-written** article in February 2026, describing how he went from an AI skeptic to adopting **Harness Engineering**—and deliberately stated: in the context of AI topics, he must emphasize that "this piece is not written by AI."

If you are tired of the hype, the value of this piece lies in its **pacing**: he borrows the three stages any tool adoption goes through—(1) inefficient, (2) good enough, (3) workflow-changing—and outlines six reproducible steps clearly. This article concludes Phase 1 of [Reading Map 13](/en/blog/13-harness-engineering-reading-map/), meant to be read alongside [OpenAI 11](/en/blog/11-harness-engineering/), [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/), and [LangChain 15](/en/blog/15-langchain-agent-harness-anatomy/): **Personal Workflow + Accumulable Harness Discipline**.

> His definition of Harness Engineering: **The more an Agent can get it right the first time, or needs only minimal patching, the more you need fast, high-quality tools to automatically tell it when it's wrong.** If the industry already has a better term, he is willing to switch—the focus is on the behavior, not coining terms.

> **Huahua in one sentence**
>
> Meow ~ There is no need to blindly follow the AI ​​hype, start by throwing away old habits, slowly build tools and verification mechanisms, and let the Agent run steadily in the background!
>
> **Huahua's engineering note**
>
> Adoption of Agentic Coding should be gradual and focused on establishing verifiable Harness discipline. As agents take on more and more tasks, the system must have fast, high-quality automation tools to provide feedback and ensure seamless collaboration and debugging.

### Posture of Writing: Measured, Non-preachy, Unaligned

Hashimoto explicitly stated:

- He doesn't invest in or advise any AI companies (**no skin in the game**).
- He respects the choice not to use AI; this article is **not a persuasion piece**, just sharing how he navigates it.
- The landscape changes too fast, so he expects to feel naive soon—but he is willing to grow.

This tone is rare in Harness discussions: most articles are either selling products or declaring a revolution. He positions himself as a **software craftsman who wants to build stuff**.

### Step 1: Drop the Chatbot to Do Real Work

**Assertion**: Stop using ChatGPT / Web Gemini for **meaningful programming work** immediately.

Chatbots still have value (he still uses them daily), but for programming, you are betting on the model "guessing right" based on its training, and if it's wrong, it requires **you** to repeatedly correct it—highly inefficient in brownfield projects.

#### The First "Wow" and Disillusionment

When he was still an AI skeptic, he pasted a **screenshot of Zed's command palette** into Gemini, asking for a SwiftUI replica—the result was absurdly good; **the Ghostty macOS command palette is pretty much that output with minor tweaks**.

But when trying to replicate this trick on other tasks, he **repeatedly failed**. In existing projects, chat often produced low-quality results, and copying and pasting code and terminal outputs drove him crazy—it was **obviously slower than doing it himself**.

#### The Turning Point: It Must Be an Agent

**Agent** = An LLM that can chat and call external actions in a loop.
He believes the bare minimum is: **reading files, executing programs, HTTP requests**.

This step aligns with [LangChain 15](/en/blog/15-langchain-agent-harness-anatomy/) "a bare model is not an Agent": without a Harness loop, it's just chatting.

### Step 2: Redo Your Own Commits (The Most Painful and Worthwhile)

He started using **Claude Code**, and initially was **not impressed**: almost every output needed fixing, and the patching time > doing it himself.

He didn't give up, but adopted **extreme practice**:

> **For every manual commit, force the Agent to produce a functionally and qualitatively equivalent result (without it seeing your manual solution).**

This meant doing **everything twice**—extremely torturous, because it blocks "getting things done." But he also has experience with non-AI tools: **friction is normal during the learning phase**, and you can't draw conclusions without exhausting effort.

#### Self-Derived Principles (Consistent with Later Community Narratives)

1. **Break sessions into clear, actionable small tasks**—don't have one mega session trying to "draw the whole owl."
2. **Vague requirements** should be split into a **planning session** and an **execution session**.
3. **Provide verification means**—Agents can often fix their own mistakes and prevent regressions.

#### Negative Space: Knowing When Not to Use Agents

Launching an Agent on a task where it's **very likely to fail** is pure waste. Building awareness of this "negative space" saves time on its own—models iterate quickly, and he notes he **must constantly revisit** this boundary.

#### Stage Sentiment

At this point, he felt AI was **good enough** and was willing to incorporate it into his workflow, but **still didn't feel it was faster**—mostly he was babysitting. This resonates with many readers: **it has to be good enough first, before you talk about changing the workflow**.

### Step 3: Off-Peak Agents (End-of-Day)

Hypothesis: Can you "earn back" time by letting Agents make progress during hours when you **couldn't do deep work anyway**?
Strategy: Start one or more Agents in the last **30 minutes** of each day—not "squeezing more into working hours," but **utilizing otherwise inefficient time**.

Initially, this was also **annoying and ineffective**, but he found a few types of work that were **genuinely useful**:

| Type | Approach | Output |
|------|------|------|
| Deep Research | E.g., finding all libraries in a specific language with a specific license, writing multi-page pros/cons, maintenance status, community sentiment for each | Read the report the next day |
| Parallel Spiking | Launch Agents for several vague ideas, **not aiming for shippable code**, just exposing unknown unknowns | Choose a direction the next day |
| Issue/PR Triage | Spin up Agents in parallel using `gh` scripts to categorize; **Agents are not allowed to reply on your behalf** | Read reports in the morning, decide to tackle high-value/low-effort first |

He **did not** let Agents **loop overnight** like some people do; most tasks ended within half an hour. The point is: when you're fatigued in the evening, rather than inefficiently scrolling through issues, it's better to **spin up an Agent** and have a **warm start** to get into the flow faster the next day.

Sentiment: He started feeling **slightly more productive** than pre-AI.

### Step 4: Outsourcing Slam Dunks

Once his **confidence was high** in "what Agents are good at," the next step was: **let Agents handle those completely, while doing other deep work concurrently**.

**Morning Routine**:

1. Review the results of last night's triage Agents.
2. **Manually filter** out issues that "the Agent is almost certain to do well."
3. Run the Agent in the background, **one at a time** (no concurrent multiple runs).
4. Enter a pre-AI mode of deep thought—not scrolling social media or videos.

#### Critical Discipline: Turn Off Agent Desktop Notifications

**Context switching is very expensive.**
It must be **the human who decides when** to check the Agent, not the Agent poking you. Just switch over and take a look at a natural resting point.

#### Pragmatic Response to Skill Formation (Anthropic Paper)

You **practice less skill** on outsourced tasks, while manually done tasks **still naturally hone your skills**. He considers this a **trade-off**: it's not about stopping learning entirely, but choosing to invest proficiency in the tasks you still want to do manually.
He also points out: **if junior engineers have weak fundamentals, the skill formation problem is particularly concerning**—this is a societal discussion, not a simplified conclusion of "therefore, don't use AI."

#### Stage Sentiment

Entering the **"can't go back"** zone: even if the efficiency metrics are unclear, being able to separate **coding you love** from **chores you have to do** is incredibly appealing to senior maintainers.

### Step 5: Engineer the Harness (Origin of the Term)

**Definition (in his words)**:
Whenever an Agent does something wrong, spend the time engineering it so it **never** does it again—he calls this **harness engineering**; if the industry adopts a better term, he'll follow.

Two forms (aligned with [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/)'s guides/sensors):

#### A. Better Implicit Prompting — `AGENTS.md`

Simple recurring issues: running the wrong command, querying the wrong API → add to AGENTS.md.
**Ghostty Example**: [AGENTS.md](https://github.com/ghostty-org/ghostty/blob/main/AGENTS.md) **has almost every line stemming from a bad Agent behavior**, and once added, **they almost never repeat the mistake**.

This belongs to the same family as [OpenAI 11](/en/blog/11-harness-engineering/)'s mechanization of norms and mapping of knowledge, but Hashimoto's version is more **personal and accumulated line-by-line**—ideal for single-repo maintainers with high commit frequency.

#### B. True Programmatic Tools

Scripts: taking screenshots, running **filtered tests**, and other reproducible checks.
And **inform the tool's existence** in AGENTS.md, otherwise the Agent won't use it.

**Differences from Organizational-Level Harness**: OpenAI talks about millions of lines and custom linters; Fowler talks about sensor coverage; Hashimoto talks about **small, explicit steps you can take daily on your own**.

### Step 6: There is Always an Agent Running

The goal advanced **simultaneously** with Step 5:
**If no Agent is running, ask yourself, "Is there something to delegate right now?"**

He prefers **slow and deep** models (like Amp's deep mode, akin to GPT-5.2-Codex); small changes can take **30+ minutes**, but the quality is high.

#### Realistic Numbers and Restraint

- On a typical workday, he can truly let a background Agent run effectively for about **10–20%** of the time—this remains a **goal** for continuous improvement.
- He **has not yet**, and **doesn't really want to**, run multiple Agents in parallel: one background Agent is already a balance between "deep manual craft" and "a somewhat dumb but high-output robot."

#### The Real Bottleneck

It's not about "having no model to run," but **whether you can continuously generate a high-quality task queue worth delegating**—this is a system that senior engineers should master, even without AI.

### Today: Where He Is Now

End of the article: He believes he is using modern AI in a **pragmatic, down-to-earth** way; he **doesn't care** whether AI is here to stay, he just wants to build software he loves.

He also leaves room to "feel this post is naive soon"—embarrassment is the price of growth, and he hopes the direction is right.

### The Six Stages Are Not a Linear Prerequisite: Where Are You?

| If your current situation is... | Primary reference |
|-------------|----------|
| Still using web chat to modify production code | Step 1 → Agent Tools |
| Agent always requires massive fixes | Step 2 Redo commits; check if tasks are too large |
| Having fragmented time poorly utilized | Step 3 Off-peak triage / research |
| Knowing Agent's strengths but still doing chores manually | Step 4 + **Turn off notifications** |
| Same mistakes repeat over and over | Step 5 AGENTS.md + Scripts |
| Wanting to increase delegation ratio | Step 6 + Task queue design |

### Relationship with the Three "Theory/Product/Organization" Articles in this Series

| Article | Perspective | What Hashimoto Supplements |
|------|------|------------------|
| OpenAI 11 | Organization, million lines, GC | How an individual arrives at similar discipline |
| Fowler 14 | Cybernetics, behavior gap | The everyday version of "Every error → sensor/guide" |
| LangChain 15 | Component catalog | The place of AGENTS.md, bash, and scripts in the narrative |
| **This Post** | Adoption history | Emotion, time, notifications, skill trade-offs |

### Takeaways and Advice: Three Actionable Items for This Week

1. **Pick a recent manual commit**, have an Agent redo it without seeing your solution—just to learn the boundaries, not to rush work.
2. **Add one line to AGENTS.md**: corresponding to "the most frequent repeated mistake the Agent made last week"—a single line is enough.
3. **Turn off Coding Agent desktop notifications**, check the results at two fixed time slots.

### Summary

Harness Engineering under Hashimoto's pen is very unpretentious: **Bad Thing → never happens again; Good Thing → verifiable by tools.** The six stages depict **how trust and delegation are built progressively**, rather than an advertisement for "which model to buy." Phase 1 deep dive concludes here; for the five articles in Phase 2, see the [Reading Map](/en/blog/13-harness-engineering-reading-map/).

Original Source:
**Mitchell Hashimoto (2026). My AI Adoption Journey.**
URL: <https://mitchellh.com/writing/my-ai-adoption-journey>
