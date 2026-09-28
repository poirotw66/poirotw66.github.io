---
title: "Project Swap: Agents Can Trade Without Knowing What Their People Want"
description: "Anthropic's low-stakes employee book exchange found that preference estimates constrained outcomes more than bargaining rules, making preference understanding a separate test for delegated agents."
pubDate: 2026-09-28
updatedDate: 2026-09-28
tldr:
  - "Anthropic ran a Claude-powered book exchange with 201 employees across six office pools; this was a low-stakes, single-company controlled study."
  - "Fable 5's rankings from a five-minute preference conversation agreed with participants on 61% of ranked book pairs among 188 people who submitted rankings, versus 50% at random; this is not a 61% chance of choosing each person's favorite."
  - "Scored against participants' own rankings, the market reached 0.55 versus a 0.89 utilitarian optimum; the authors attribute about 85% of that gap to noisy preference rankings."
  - "Evaluate preference understanding, bargaining, authority, and observability separately. The book-swap results do not generalize to high-stakes delegation."
audience:
  - "Engineers building personal assistants, agent marketplaces, and delegated workflows"
  - "Technical leaders responsible for agent evaluation, product governance, and authority boundaries"
category: "Industry Pulse"
tags: ["AI Agent", "Research", "Evaluation", "Enterprise AI"]
cluster: "ai-agent"
clusterRole: "signal"
clusterOrder: 40
kind: "article"
showToc: true
image: "/blog/125-anthropic-project-swap-agent-market-preference/title_image.webp"
---

An agent closing a trade for someone does not prove it made a good choice for that person. Anthropic's Project Swap separated those two questions in a Claude-powered book exchange involving 201 Anthropic employees across six office pools: San Francisco, New York City, London, Seattle, Washington, DC, and Dublin. The researchers measured both whether an agent could infer someone's taste and whether the market could move books to people who valued them more. This was a low-stakes study designed and run by Anthropic. It offers a prototype for testing delegated preference understanding, not evidence that agents are ready to represent people in high-stakes decisions.

> **Huahua in one sentence**
>
> An agent can be good at closing a deal and still get its person's preferences wrong; measure preference understanding before market efficiency.

## Separate “can trade” from “knows its person”

Each participant brought a book to exchange and spent about five minutes discussing reading preferences with Claude. Anthropic used Fable 5 to infer a ranking of books in the participant's pool, then gave that ranking to the agent on the trading floor. Agents could propose or accept bilateral swaps and multi-party rotations; a trade required consent from everyone involved. Participants also ranked a small subset of books so researchers could check how well the agent represented them.

This design makes two stages visible. A preference model turns what a person says into a ranking. A bargaining agent then tries to realize that ranking through trades. If someone ends up with a book they dislike, the failure may be in the first stage—the model misunderstood them—or the second—the agent failed to secure an outcome it already knew they wanted. A single “market success” score hides which component needs work.

## What 61% pairwise agreement measures

Among the 188 participants who submitted rankings, Claude's ranking from the intake conversation agreed with participants on **61% of comparable book pairs**. Randomly guessing which of two books a person preferred would score **50%**. The metric asks whether the model places the preferred book above the other for a given pair. It does not mean the model has a 61% chance of choosing someone's top book, nor that every participant was represented equally well.

The 61% from Fable 5 is a useful signal, not a general certification of personalization. Participants typed a median of about 216 words across eight messages in the intake. The authors also report that participants who wrote more tended to be better represented. Still, preferences can be incomplete, context-dependent, or difficult for people to articulate even to themselves. A ranking inferred from one short conversation is an uncertain model, not a formal authorization record.

## The denominator and conditions behind the 85% shortfall attribution

The researchers treated participants' own rankings as “ground truth”: each person ranked ten books from their pool. If a received book was not on that short list, the authors imputed a score based on what other participants gave books at a similar position in Claude's ranking. They tested alternatives; without imputation, the best assignment scored 0.88 and the final outcome 0.62, but this excluded the 38% of participants on rerun floors who did worst and could overstate the result. Under the main scoring method, a book's position on the participant's ranking became a score from 0 to 1, averaged across participants. Because several people may want the same book, the best feasible assignment is not one where everyone gets a first choice. If a centralized allocator knew everyone's true ranking, the best possible assignment—the utilitarian optimum—scored **0.89**. The decentralized market averaged **0.55** against those same participant rankings.

To separate the two gaps, Anthropic asked what score the best assignment would achieve if it used Claude's noisy rankings, but was still scored against participants' own rankings. The answer was **0.60**. The drop from 0.89 to 0.60 is 0.29; divided by the total gap of 0.89−0.55=0.34, that is about **85%**. The remaining 15% is the gap between the decentralized floor and the idealized assignment under those noisy rankings. This is a shortfall decomposition for one market and scoring method, not a causal law that “preference errors cause 85% of all agent failures.”

The figures also show why “efficiency” should not be used as a synonym for negotiation skill. A 0.55 market score is roughly the fifth-ranked book on a participant's list of ten. It reflects both the estimated preferences and the trading process. Using the same imperfect rankings, centralized Top Trading Cycles scored 0.60 while decentralized bargaining scored 0.55. A different market mechanism cannot fully compensate for inaccurate inputs.

> **Huahua's engineering note**
>
> The 85% is a ratio derived from three specific scores—0.89, 0.60, and 0.55—under Anthropic's employee sample, preference estimates, and rank-based scoring. Do not use it as a baseline or forecast for other delegated tasks.

## Reruns compared models and instructions without removing preference error

To separate chance from more stable features, the authors reran the trading floor. For model comparisons, they used neutral instructions across the five main office pools and ran **80 homogeneous floors**: 20 each for Haiku 4.5, Sonnet 4.5, Opus 4.8, and Fable 5, with every agent on a floor using the same model. They also ran **60 mixed floors**, again with neutral instructions: 20 for each of three model pairings, with half the agents on Opus and the other half on one of the three other models. These reruns suggest model family changed trading outcomes more than the tested “ruthless” versus “prosocial” instructions. But those model comparisons mostly scored market dynamics on Claude's own rankings; differences narrowed when outcomes were evaluated against participants' rankings.

The engineering implication is not “upgrade the model first” or “prosocial instructions do not matter.” Hold preference inputs fixed to compare bargaining policies, and measure preference calibration separately. If an agent is scored against its own estimate of what a person wants, it can appear more efficient while optimizing the wrong objective. Evaluation should make the scoring oracle, success criteria, and information visible to the model explicit. The related [XYEval analysis](/en/blog/118-xyeval-agent-bad-advice/) similarly shows why an evaluator must specify the ground truth and the inputs an agent receives; the [AI Agent architecture guide](/en/blog/64-ai-agent-guide/) covers the surrounding state, tools, and control flow.

The instruction comparison also surfaces a trade-off between loyalty and fairness. A “ruthless” agent focused only on getting a preferred book for its own participant; a “prosocial” one also had a secondary goal of ensuring everyone ended up with a book they liked. The former did slightly better on average, while the latter sometimes conceded. “Maximize for me” and “improve the market overall” are different policies. A real system should make its authority and acceptable compromises legible instead of asking an agent to define “handle this for me” on its own.

## A three-week follow-up is an acceptance signal, not a safety proof

Three weeks after books were distributed, Anthropic surveyed participants. Respondents rated their books **7.2/10** on average and said they would let an agent control about **30%** of their next year's book budget. As a comparison, they would hand about **40%** to a well-read friend who knew their taste. The report says only about **59%** of employees answered this follow-up, creating potential response bias. The budget question assumed the agent could choose and buy books on its own without a final veto. These are self-reported intentions about low-stakes book purchases, not observed delegation of assets or high-impact decisions.

Other limitations matter too. The six office pools included **201 people**, but Dublin had only **3**; the authors excluded it from most analyses because the pool was too small to learn from. Most core ranking results therefore use 188 non-Dublin participants who submitted rankings. All participants were Anthropic employees, were not incentivized to participate, and all agents were Claude production models post-trained to be polite and largely cooperative. Market rules were also held fixed rather than varied as they might be in a real marketplace. Anthropic published a 26-page report and appendix, but as of this article's source check, the research page did not provide participant-level raw data or runnable simulation code, so outside readers cannot independently recompute the market results.

## Turn the study into engineering checks for delegated agents

Project Swap's most useful lesson is to treat preference understanding as its own release gate. For an agent that will act for someone, ask:

1. Which conversations, settings, or past actions produced its preference estimate? How confident and current is each inference?
2. Can the user inspect representative choices, correct an assumption, or require human confirmation first?
3. Which trade-offs did the user authorize, and which require asking again? Could the agent sacrifice its person's outcome for the market as a whole?
4. What messages and decision records can other market participants see? Is there a traceable rationale and a path to review afterward?

Testing “how the model understands this person” in low-stakes choices before expanding autonomy is more informative than relying only on deal rate, task completion, or model rankings. Any delegation involving money, healthcare, employment, or rights would require new representative samples, explicit authorization, and independent safety evidence. Project Swap provides none of those.

### Further reading

- [AI Agent architecture guide](/en/blog/64-ai-agent-guide/): agent state, tools, and control flow.
- [XYEval: Why agents say yes to bad advice](/en/blog/118-xyeval-agent-bad-advice/): evaluating how agents handle misleading or goal-diverting input.
- [Takt: Multi-agent coordination topologies](/en/blog/70-takt-agent-coordination-topology/): further reading on coordination and control boundaries.

### Sources

- Anthropic Research, Economics. [“Project Swap: What happens when agents trade for us?”](https://www.anthropic.com/research/project-swap), 2026-09-24. [Full 26-page report and appendix](https://www-cdn.anthropic.com/3818cf6119b88f9714d995f6549fa8aac0bd5ab5/Project-Swap.pdf).
