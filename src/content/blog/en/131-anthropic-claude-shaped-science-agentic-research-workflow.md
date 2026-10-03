---
title: "Claude-Shaped Science: Agents Can Calculate; People Still Choose the Questions"
description: "Matthew Schwartz describes using BootLoops to bring agents into checkable quantitative research—and why human problem selection, expert review, and scientific judgment still matter."
pubDate: 2026-10-03
updatedDate: 2026-10-03
tldr:
  - "BootLoops combines quantitative-science tools, operating protocols, and acceptance checks in a harness that can be driven by different LLMs."
  - "Schwartz reports completing 30 end-to-end Feynman integrals—15 reproductions of known results and 15 not previously computed—in a few weeks; this is not an independently audited productivity study."
  - "Researchers still choose which problems are worth solving, and domain experts judge whether a technically correct result matters to the field."
audience:
  - "Engineers designing agent harnesses, verifiable computation, or research workflows"
  - "Lab leaders and researchers assessing how AI may change scientific tasks and research roles"
category: "AI Engineering"
tags: ["AI Agent", "Research", "Machine Learning"]
kind: "article"
showToc: true
image: "/blog/131-anthropic-claude-shaped-science-agentic-research-workflow/title_image.webp"
---

If an agent can shrink a calculation from weeks to tens of minutes, does that mean scientists can simply do less work? Physicist Matthew D. Schwartz offers a more qualified answer in [“Claude-shaped science”](https://www.anthropic.com/research/claude-shaped-science), a guest post published by Anthropic Science on October 1, 2026. Agents can help with work that is codable, repeatable, and checkable. People still have to choose worthwhile questions and decide whether an answer matters to a field.

Schwartz recounts research he pursued with Claude and BootLoops, a toolkit he built. This is a researcher’s first-person account—not an independent Anthropic productivity evaluation or evidence of job displacement. Its value is in making the workflow concrete: calculations can be automated, verification can be built into the tools, while humans remain responsible for direction and significance.

> **Huahua in one sentence**
>
> An agent can expand the range of calculations researchers can perform, but it does not automatically know which correct answer deserves to become a scientific result.

## Look for problems that fit agents, not agents that imitate scientists

Schwartz argues that current language models do not fully match what researchers expect from a human collaborator. Models can read many papers, write code, and work quickly on well-specified mathematical problems. With open-ended scientific questions, however, a researcher may need to repeatedly redirect the model before it produces something useful.

He therefore began with a different question: which research tasks fit an agent’s current strengths? He calls these “Claude-shaped” problems. Rather than asking a model to produce a major theory in one step, look for work that can be represented clearly, handled in code, and checked through an independent route. This is the author’s working hypothesis, not a classification established by a comparative study across all scientific work.

## BootLoops connects model capability to checkable tools

[BootLoops](https://github.com/BootLoops-ai/bootloops) is neither a new foundation model nor an Anthropic product. Built and maintained by Schwartz, it is a set of quantitative-science tools and working protocols for LLM agents. The disclosure in the Anthropic guest post says Schwartz was a visiting researcher at Anthropic and that BootLoops is not an Anthropic project.

The engineering point is not simply to hand tools to an agent. The GitHub README says each tool documents what it does, when to use it, what its output means, and which test an answer must pass. Some calculations use exact or high-precision arithmetic, error bounds, completeness certificates, or independent computational routes; each tool has its own acceptance conditions. In short, an agent may propose and run calculations, but its own claim that it is “done” is not enough to accept the result.

For engineering teams, this is more concrete than a universal research prompt: package domain methods as reusable tools and keep acceptance rules in the workflow. It is not a turnkey, single-command application, either. The repository notes that some external computational engines must be installed separately and that some self-tests require data not included in the repository. Before adopting it, a team still needs to verify dependencies, input data, and the appropriate validation route for its problem.

## What the 30 integrals show—and what they do not

The clearest example in the post is Feynman integrals. Schwartz says Claude helped port methods scattered across papers and programming languages into a common framework, then extended the existing computational tools. They completed 30 integrals end to end: 15 reproductions of known results using a new method and 15 results that had not previously been computed. The author says this work took a few weeks.

That is a specific and interesting research report, but its evidence boundary matters. The counts and time frame are Schwartz’s account in a guest post, not an independent audit of labor, cost, or overall productivity. Reproducing known results and computing previously uncomputed integrals also do not mean that 15 important scientific discoveries were made. To assess an individual result, readers need its corresponding paper, code, and verification evidence—not only a total count.

## Experts move a result from “correct” to “worth studying”

One example is more revealing than a success tally. Claude solved an equation in a neutral biodiversity model, and Schwartz brought the initial result to ecologist James O’Dwyer. Schwartz says O’Dwyer accepted the technical accomplishment but warned that many ecologists might find the conclusion unsurprising. He suggested instead analyzing the difference between observations and the model’s prediction. The two then worked with Claude to shape a predictive model closer to questions ecologists cared about.

This exposes a boundary that “agents discover science” narratives often skip. Computational checks can tell us whether a derivation or number satisfies specified rules. They cannot, by themselves, decide whether a question matters, whether a field already knows a similar result, or what the next question should be. That gap grows across disciplines. The author says that in almost every case, domain experts helped steer technically correct findings toward more meaningful questions.

> **Huahua's engineering note**
>
> A reproducible answer is not complete scientific validation. Check assumptions, data provenance, an independent verification route, and how domain experts judge the result’s significance.

## How to design a research-agent workflow

Schwartz also describes the setup he used to coordinate several research projects. Claude Code sessions ran on Google Cloud virtual machines. A master session coordinated subprojects, compute, and validation; intermediate state was kept in Markdown files in each project. Separate sessions handled code validation and adversarial-referee review. This is the author’s description of his working environment, not a cloud-orchestration system that BootLoops automatically provides to every user.

The post is candid about failures, too: the agent declared victory too early, estimated time unreliably, preferred grinding through a long computation over building a faster tool, and could lose context during long jobs. These are not minor quirks; they are failure modes a research workflow has to handle. Practical design steps include:

1. Have a person define the question, acceptable outputs, and stop conditions; the agent should not rewrite its own acceptance criteria.
2. Break expensive work into small tests, measure first, and only then decide whether to scale up.
3. Require a reproducible result, an independent route, or a test with positive and negative controls for important numerical claims—not merely a model-written summary.
4. Persist plans, data, tool versions, and intermediate results so long-running work can resume and be reviewed by collaborators.
5. Let people with domain expertise judge novelty, significance, and the next research question.

These are engineering recommendations drawn from Schwartz’s experience, not universal best practices established by the post. The GitHub README also warns that some tools evaluate the contents of input files and may execute arbitrary commands. Untrusted inputs should be handled in an isolated environment. Numerical certificates can reduce computational error; they are not a security sandbox.

## Counts do not measure research quality or labor impact

Schwartz also reports that over three months, he and 19 coauthors advanced 36 manuscripts across 18 fields, from roughly 400 candidate problems. These are the author’s project-level figures; they do not mean all 36 manuscripts were published, peer reviewed, or equally mature. The guest post does not provide comparison data to estimate researcher-hours saved per paper, changes in research costs, or effects on job demand.

The evidence supports a narrower conclusion: for large, formalizable calculations that can be checked, an agent harness may reduce technical friction and help researchers explore more problems. The post does not establish the size of a productivity gain across science, much less show that research staff will be replaced. The author emphasizes that scientific progress still depends on acquiring, understanding, and checking real-world data before asking the next question.

## BootLoops licensing and use boundaries

The current GitHub main repository labels BootLoops code MIT and its repository prose and figures CC BY 4.0. That does not mean every tool or adjacent repository uses the same license. The main repository says some third-party code retains its original license and identifies GPL components; other repositories published by the same organization can have separate licenses. Anyone redistributing BootLoops in a product or research service should check the actual files, external engines, and sibling repositories in use rather than relying on a single organization-level label.

## Three small experiments for a research team

To learn from this pattern, do not start by asking an agent to “do the whole research project.” Choose a small quantitative task with a trusted answer and have the agent reproduce it against fixed data and versions. Then add a new question that requires human judgment. Observe which parts tool-based verification can handle and which still need domain experts. Finally, record error types, human corrections, compute costs, and researcher time spent choosing the problem. Those measurements can answer the practical question: did the agent shorten a verifiable calculation, or merely move the work into checking its output?

This article differs from [Anthropic’s study of robot work](/en/blog/130-anthropic-robot-work-exposure-cost-boundary/): #130 compares robots’ exposure to physical tasks with their cost competitiveness; this post focuses on agents, calculation, verification, and research direction. For an architecture overview of agent state, tools, and governance, see the [AI Agent guide](/en/blog/64-ai-agent-guide/). For a research workbench that handles governance and artifact provenance, continue with [AIPOCH Open Science](/en/blog/90-aipoch-open-science-workbench/).

### Sources

- Matthew D. Schwartz, [“Claude-shaped science”](https://www.anthropic.com/research/claude-shaped-science), Anthropic Science guest post, 2026-10-01. Schwartz discloses that he was a visiting researcher at Anthropic; BootLoops is not an Anthropic project and is owned and maintained by him.
- [BootLoops main repository](https://github.com/BootLoops-ai/bootloops): toolkit, verification protocols, installation and platform notes, and licensing details.
- [BootLoops project site](https://bootloops.ai/): overview of the model-independent harness, tools, and application manuscripts.
