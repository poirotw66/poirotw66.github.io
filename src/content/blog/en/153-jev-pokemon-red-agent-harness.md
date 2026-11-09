---
title: "Jev Beat Pokémon Red: Was It the Model or the Harness?"
description: "Using Jev's Pokémon Red run and public code, this article separates the decision model's role from game state, pathfinding, and recovery mechanisms in a long-running agent."
pubDate: 2026-11-09
updatedDate: 2026-11-09
tldr:
  - "Jev's author reports a 37-hour, 40-minute Pokémon Red run with 16,150 decisions; no independent rerun verified the figures."
  - "Jev chooses among actions prepared by the harness, which reads game RAM, plans paths, supplies goals, and checks progress."
  - "The result shows how a model and program can work together; it does not prove Jev can finish the game without game-specific support or generalize to other games."
audience:
  - "Engineers building long-running agents and their harnesses"
  - "Readers assessing what an AI game-completion demo actually measures"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 55
kind: "article"
showToc: true
readingStyle: focused
image: "/blog/153-jev-pokemon-red-agent-harness/title_image.webp"
imageAlt: "Huahua examines a handheld game showing a pixel maze; a state notebook and copper compass represent the division between model decisions and game code."
---

Jev's author reports that it completed Pokémon Red during a livestream on September 25–26, 2026: 37 hours and 40 minutes, with 16,150 decisions. It is easy to shorten that result to “an AI played through the game on its own.” The public code raises a more useful engineering question: **when every decision depends on game state decoded by software, prepared options, and computed routes, what part of the result does the model actually measure?**

The answer is not the model or the harness alone. This run measures a composed system: Jev judges what to do from program-provided options, while game-specific code turns the environment into decision-ready state, computes movement, and checks whether objectives are complete. That division is worth studying, but the whole system's result should not be attributed to the model by itself.

## First, distinguish the two Jev playthroughs

There were two Jev Pokémon Red playthroughs around the same time, and their details should not be combined. Andrew Boyd's page says Jev entered the Hall of Fame on September 23 and credits Opus 5 with monitoring the game log and building the harness in real time. Christian Mathiesen streamed a separate run on September 25–26; this article focuses on that run because it comes with a public [GitHub repository](https://github.com/christianmat/jev-pokemon) and a detailed README. [Boyd's project page](https://jev-plays-pokemon.standardagents.ai/) and [Tom's Hardware's contemporaneous report](https://www.tomshardware.com/tech-industry/artificial-intelligence/developer-says-jev-decision-model-beat-pokemon-red-in-under-a-week-non-llm-engine-succeeds-where-traditional-chatbots-stalled-for-months-but-claude-opus-5-coached-the-model-through-its-dead-ends) also describe them separately.

Mathiesen's README describes Jev as the decision model and reports a 37-hour, 40-minute run, 16,150 decisions, about 39.2 million input tokens, about US\$1.65 in Jev costs, 16 team wipes, and 15 Elite Four attempts. The project page repeats some of these figures. They are author-provided run statistics, not independent verification from two pages; this article did not rerun the game and does not borrow Opus's involvement or statistics from the other playthrough. [README](https://github.com/christianmat/jev-pokemon#result) · [Project page](https://jev-pokemon.vercel.app/)

## Jev chooses; the program turns the game into options

TypeSafe's documentation describes Jev as a model that receives state and typed questions, then returns structured answers that software can use. A `Choice` question selects from a supplied set of options and returns probability and confidence information; Jev does not need to generate free-form text describing which button to press. The [official introduction](https://docs.typesafe.ai/introduction) recommends breaking decisions into narrow questions and composing their results in code.

This game project places that interface inside a dedicated harness. The program reads the Game Boy emulator's RAM to obtain the map, coordinates, party, battle, inventory, and screen text. A comment in `GameState` explicitly says this is pure observation and does not write to game memory. The [state reader](https://github.com/christianmat/jev-pokemon/blob/main/src/game/state.ts) and the [README's system description](https://github.com/christianmat/jev-pokemon#how-it-works) make that boundary inspectable.

The harness does not hand the model raw RAM and stop there. It builds legal actions with supporting facts. Battle choices may include move type, estimated damage, or whether a move could knock out a target. Overworld choices can include walking to an NPC, taking an exit, using an item, or pushing a boulder. The [battle code](https://github.com/christianmat/jev-pokemon/blob/main/src/agent/battle.ts) computes and presents some combat information; the [overworld code](https://github.com/christianmat/jev-pokemon/blob/main/src/agent/overworld.ts) builds paths and candidate actions.

So neither “Jev chooses” nor “the harness decides everything” is quite right. Jev still chooses whether to progress, train, heal, catch, shop, or manage its team, as well as dialogue and battle actions. But the game program has already parsed and constrained the choice space. It converts many low-level problems into candidate actions before the model judges among them.

## Paths, goals, and completion checks live outside the model

Long tasks require more than choosing a good move in the current moment. The system also needs to know where to go next and what counts as completion. This project uses a milestone list to provide a goal and its location. The README says progress is checked against in-game event flags rather than trusting a model's claim that it finished. The [milestone code](https://github.com/christianmat/jev-pokemon/blob/main/src/knowledge/milestones.ts) says the program gives the goal and where to pursue it, while Jev still decides where to walk, who to talk to, how to fight, and when to heal, grind, or catch.

The program also calculates tile movement. `overworld.ts` uses A* pathfinding and a region graph to reason about passages, obstacles, interactable objects, and distance to goals, then gives Jev meaningful options. That lets the model spend its decisions on questions such as where to make progress or whether to restock instead of deriving a sequence of directional inputs from coordinates on every turn.

This design reduces task difficulty, and it is also part of the system's capability. If the goal is to build a game-playing system that can run for a long time, these software supports are not cheating; they are part of the product. If the goal is to compare a model's visual understanding or general navigation ability, they must be listed as experimental conditions. The final result alone cannot settle that comparison.

## The failure counts make “beating the game” look like system resilience

The author reports 16 full-team defeats and 15 attempts at the Elite Four. Those figures are a reminder that success was not a smooth sequence of good choices, and that it depends on more than one-step decision quality. The README describes tracking repeated choices, adjusting options when the agent gets stuck, saving at milestones, and returning to a checkpoint when necessary. The program accumulates no-progress decisions, map state, and attempted actions to inform its recovery behavior. The [agent tracking code](https://github.com/christianmat/jev-pokemon/blob/main/src/agent/agent.ts) exposes some of that progress and recovery logic.

From an engineering perspective, the central result is not simply whether the model made mistakes, but whether the system could continue after errors, repeated actions, and failed battles. Long-task reliability often comes from environment reading, viable actions, external progress checks, memory, and recovery strategies working together. Reporting only completion time or success rate omits those mechanisms; reporting only model accuracy cannot describe whether the whole workflow keeps moving.

> **Huahua's engineering note**
>
> An agent's success record is first a result for the whole execution system. To attribute it to the model, we need to know what it saw, which options code removed, and how it recovered from errors.

## What does this run support—and what does it not?

It supports a concrete observation: a typed decision model can be placed inside a game-specific state machine and harness, make decisions from constrained options for a long period, and rely on code to verify progress. Public source code makes the responsibility boundaries studyable rather than leaving only a completion screen.

But this is not proof that Jev completed the game alone, and the project does not provide a baseline comparison against a simplified harness. No independent team has rerun it, so the statistics remain author-reported. The task also depends on one game, game-specific ROM data, map logic, and milestones; the result does not establish transfer to other games or unfamiliar environments. A reader can reconstruct how the system is designed without treating one run as a generalization test.

To explore it, start with the [README](https://github.com/christianmat/jev-pokemon), then inspect `src/game/state.ts`, `src/knowledge/milestones.ts`, and `src/agent/`. Rerunning requires macOS or Linux, Node 20 or newer, your own legally obtained US or EU Pokémon Red ROM, and an AI Gateway key. The project page is not a live playable web demo; it mainly provides run statistics and highlights.

## Turn “model capability” into a responsibility checklist

If you evaluate your own agent, this case suggests more concrete questions: Does the model see the raw environment or a prepared state? Which options has code removed? Who sets and tracks goals? Is completion reported by the model or verified against external state? When the same error recurs, does the system retry, change strategy, ask a person, or keep looping?

Those answers explain more than “the model beat the game.” If you first want to understand Jev's typed decision interface, continue with [TypeSafe AI and Jev](/en/blog/107-typesafe-ai-jev-system-one/). For ways to place Jev in an agent runtime, see [confidence-gated routing](/en/blog/108-jev-confidence-gated-agent-runtime/). This article looks at a different layer: how one long-running task connects state, model decisions, program execution, and verification.

## Sources and further reading

- [Jev Plays Pokémon Red — GitHub repository](https://github.com/christianmat/jev-pokemon) — The author's implementation, README, setup, and run statistics.
- [Jev Plays Pokémon Red — project page](https://jev-pokemon.vercel.app/) — The author's summary of the run and highlights.
- [GameState](https://github.com/christianmat/jev-pokemon/blob/main/src/game/state.ts), [milestones](https://github.com/christianmat/jev-pokemon/blob/main/src/knowledge/milestones.ts), [battle decisions](https://github.com/christianmat/jev-pokemon/blob/main/src/agent/battle.ts), and [overworld decisions](https://github.com/christianmat/jev-pokemon/blob/main/src/agent/overworld.ts) — Inspectable code for game state, goals, options, and pathfinding.
- [TypeSafe AI Introduction](https://docs.typesafe.ai/introduction) — Jev's state, typed questions, and structured-decision interface.
- [Jev plays Pokémon Red](https://jev-plays-pokemon.standardagents.ai/) — Andrew Boyd's separate run, whose page credits Opus 5 with monitoring the game log and building the harness in real time.
- [Tom's Hardware: Jev beats Pokémon Red](https://www.tomshardware.com/tech-industry/artificial-intelligence/developer-says-jev-decision-model-beat-pokemon-red-in-under-a-week-non-llm-engine-succeeds-where-traditional-chatbots-stalled-for-months-but-claude-opus-5-coached-the-model-through-its-dead-ends) — Contemporaneous reporting that distinguishes Boyd's and Mathiesen's runs; it is not an independent rerun of Mathiesen's run.
