---
title: "Harnesses for Long-Running Agents: Stable Delivery Across Contexts"
description: "Based on Anthropic's 'Effective harnesses for long-running agents': Using an initializer agent + progressive coding agent + feature list and end-to-end testing to allow agents to continuously advance and maintain a clean state across multiple context windows."
pubDate: 2026-03-30
updatedDate: 2026-03-30
tldr:
  - "Based on Anthropic's 'Effective harnesses for long-running agents': Using an initializer agent + progressive coding agent + feature list and end-to-end testing to allow agents to…"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Claude","Architecture Patterns"]

image: "/blog/10-effective-harnesses-for-long-running-agents/title_image.webp"
showToc: true
---
Original source:
**Justin Young (2025). Effective harnesses for long-running agents.**
URL: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>

The challenge with long-running agents often lies not in "getting it right the first time," but in "being able to recover after making a mistake" and "being able to continue moving forward when the next round takes over." When tasks must span multiple `context window`s and be executed in phases, the agent acts like a software team working in shifts: the next member lacks a natural memory of what the previous shift did, making progress and quality prone to drifting.

In this engineering article, Anthropic starts from the way human engineers work and proposes a set of practical harness structures: engineering constraints such as environment initialization, progressive delivery, and end-to-end testing are integrated into the agent process itself, rather than just relying on prompts to pray the model "doesn't break."

> **Huahua in one sentence**
>
> Meow~Agent is like a relay race! Cut the task into small pieces, keep the environment clean every time you hand over, and use tests to confirm the progress, so you won't get lost!
>
> **Huahua's engineering note**
>
> When dealing with long tasks across context windows, model compaction alone is not enough. Engineering constraints for environment initialization, progressive delivery, and end-to-end testing should be implemented to prevent agents from falling into state instability or repetitive guessing during multiple rounds of dialogue.

### Background: Why crossing context windows remains prone to instability

The article first points out a common misunderstanding: since the Claude Agent SDK supports compaction (in-place summarization), in theory, the agent should be able to work "indefinitely" across multiple windows. But experiments show that relying solely on compaction is still not enough. When the model is given only high-level instructions (such as "build a claude.ai clone") and advances itself in a loop, two typical failure modes emerge.

The first is "doing too much at once": the agent attempts to complete the entire project one-shot, but halfway through, the context runs out, leaving the next round having to guess and restart from a "half-finished state lacking documentation." This forces subsequent rounds to spend massive amounts of time getting basic functions back to a usable state, causing the cost of long-running tasks to skyrocket.

The second is "declaring completion prematurely": in the later stages of the project, when a new agent instance reads the existing progress, it might judge that "it looks about done," thereby hastily releasing features that still have gaps. This is not simply a lack of capability, but a lack of a clear "definition of done" and "obligation to verify."

### Core concept: Using initializer + coding, and externalizing progress and completion criteria

Anthropic's solution actually closely resembles how real software teams hand over work: the first round establishes the environment and a trackable list of requirements, and each subsequent round tackles only a small chunk, leaving a clean, mergeable state at the end of the round.

They propose two main agent roles (the initial conversation uses a different prompt, but other conditions are the same):

1. **Initializer agent**: Responsible for setting up the environment during the first session so that the subsequent coding agent can quickly get up to speed.
2. **Coding agent**: Makes only progressive changes in each subsequent session and leaves behind a consistently neat state and progress record.

> The core of a long-running agent is not a stronger model, but a more effective handover: a readable environment, verifiable completion criteria, and a clean state that allows getting back on track.

#### Initializing the environment: Building "handover readiness" with init.sh, a progress file, and an initial git commit

The Initializer agent lands three things in the first session so that the next round won't have to guess:

- `init.sh`: Used to start the development server and necessary environment, reducing the cost of "figuring out how to run it in every round."
- `claude-progress.txt`: Records the agent's working context in the project, allowing the fresh context to quickly align on "what was recently done, and where it is currently stuck."
- Initial git commit: Incorporates the newly added files into the version history, enabling subsequent rounds to reliably roll back or track changes using git.

The value of this set of designs lies in: the agent no longer needs to re-understand how the entire system operates within each window, but can quickly read the state and choose the next step.

#### Feature list: Materializing "completion" into an updatable list

To prevent the agent from doing too much at once or declaring victory prematurely, Anthropic has the initializer first write a "feature list". In the claude.ai clone example, this list contains hundreds of end-to-end feature descriptions, using structured JSON to express the state of each feature (e.g., from "failing" to "passing").

More critically, they require the subsequent coding agent to only update the status fields in the list, not allowing the model to easily alter the tests or the list itself. This is a highly effective constraint: it shifts the "definition of done" from subjective judgment to a controllable, auditable process.

#### Progressive delivery and clean state: Making the environment recoverable with git commits and summaries

When the coding agent is equipped with the initialized environment, the next step is to prevent it from constantly overturning itself in every round. The article points out that they require the coding agent to do the following after completing a feature change:

- Commit the changes with a descriptive git commit message.
- Write a brief summary of the changes in the progress file.

This combination brings two direct benefits. First, if the changes in the current round leave an error, the next round can roll back to a working state much faster, rather than guessing from a broken state. Second, the agent doesn't have to use copious amounts of text to explain to itself "what on earth I did" at the end of the round, because the changes have been structurally landed in the git history and progress artifact.

#### Testing: Handing over "is it actually usable?" to end-to-end verification tools

The last key module in the article is testing. They observed that, without explicit prompts, agents often make code changes and unit tests (or use `curl` to test the dev server), but may not recognize that "the overall interaction flow simply isn't working."

Therefore, in the web app case, they emphasize providing browser automation tools (such as Puppeteer MCP), allowing the agent to act like a human user:

- Start the local development server and run through the basic flows first.
- Use a browser automation interface to operate the UI (e.g., adding a conversation, sending a message, verifying the response).
- Before the session ends, ensure the environment doesn't leave behind unrecorded major bugs.

The article also acknowledges that limitations remain: factors like the model's visual capabilities (vision) and browser automation coverage can still make certain types of errors harder to detect; for example, native browser alert modals might be difficult to recognize through the tool.

### Data / Research findings: How common failure modes are specifically resolved by harnesses

The article uses a "problem—behavior—solution" comparison table to summarize several common failure modes, pointing out what the initializer and coding agent should each do.

A core signal is that each failure mode corresponds to a specific structural gap in the harness.

For example, when the agent "prematurely declares the entire project complete," the initializer's response is not to add more "please be careful" prompts, but to create a feature list, forcing the subsequent coding agent to select the highest priority uncompleted items from the list and verify them one by one.

When the agent leaves behind a "messy environment or unrecorded bugs," the initializer will first create git and progress artifacts; the coding agent then reads these states at the beginning of a new session, runs basic end-to-end tests, and finally converges with a git commit and progress update.

When the agent treats a feature as "done but actually untested," they require that the state be updated to passing only after thorough testing.

### Takeaways and recommendations: Treat harnesses as engineering processes, not temporary umbrellas for agents

Condensing this article into actionable engineering principles, I would understand it like this:

1. Externalize "completion": Use an updatable list (feature list) to define each end-to-end behavior, restricting the agent to advance only within verified boundaries.
2. Engineer "handovers": Use `init.sh` and progress files so every new window can quickly return to a working starting point of context.
3. Standardize "convergence": Use git commits and summaries to make states recoverable and traceable, rather than relying on the model's verbal descriptions.
4. Delegate "is it actually usable?" to end-to-end tools: Especially for interactive web apps, unit tests are not an adequate substitute for browser-level validation.

The essence of this approach is to move uncertainty "out of the model" and hand it over to structured process control. The model is still responsible for creating and modifying, but the harness is responsible for ensuring the modifications can be continued, verified, and have a mechanism to get back on track in case of failure.

### Conclusion

Anthropic's conclusion can be summed up in one sentence: The stability of long-running agents does not rely on luck. It relies on the four engineering pillars of initialization, progress lists, clean states, and end-to-end testing, making each context window a relay in a known state, rather than a restoration by blind guessing.

Original source:
**Justin Young (2025). Effective harnesses for long-running agents.**
URL: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>
