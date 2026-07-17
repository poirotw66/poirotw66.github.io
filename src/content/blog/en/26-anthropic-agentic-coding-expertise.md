---
title: "Anthropic's Latest Research: The State of Agentic Coding and the Persistent Value of Domain Expertise"
description: "Anthropic releases a privacy-preserving analysis of 400,000 Claude Code interactions. The research reveals the true division of labor for AI coding agents: humans decide 'what to do', while AI decides 'how to do it'. More importantly, success depends not on 'coding ability', but on 'domain expertise'. This has profound implications for the future of knowledge work."
pubDate: 2026-06-19
updatedDate: 2026-06-19
tldr:
  - "Anthropic releases a privacy-preserving analysis of 400,000 Claude Code interactions"
  - "The research reveals the true division of labor for AI coding agents: humans decide 'what to do', while AI decides 'how to do it'"
  - "More importantly, success depends not on 'coding ability', but on 'domain expertise'"
  - "This has profound implications for the future of knowledge work"
audience:
  - "Engineers and PMs tracking AI product and industry signals"
  - "Readers who want a fast brief before deciding whether to go deeper"
category: "Technology"
tags: ["Anthropic", "Claude Code", "AI Agent", "Agentic Coding", "Future of Work"]
image: "/blog/26-anthropic-agentic-coding-expertise/title_image.webp"
subtitle: "Humans Decide 'What to Do', AI Decides 'How to Do It': In-Depth Analysis of 400,000 Claude Code Interactions"
kind: article
showToc: true
---

![Agentic coding and persistent returns to expertise](/blog/26-anthropic-agentic-coding-expertise/title_image.webp)

As AI agents gradually integrate into everyday work, automated software development (Agentic Coding) has also seen explosive growth. Agent activity on GitHub has tripled since late 2025, and Claude Code users spend an average of 20 hours per week on the tool.

A key question emerges: **Can people with no formal coding experience successfully guide agents to complete complex technical tasks?** And what do the rapid popularization and advancement of these tools mean for the vast majority of knowledge workers?

To answer these questions, Anthropic published its latest research, **"Agentic coding and persistent returns to expertise"**, based on a privacy-preserving analysis of approximately 400,000 Claude Code interactive sessions (covering 235,000 users) between October 2025 and April 2026. The findings not only reveal the actual usage of agent tools but also provide early signals for the transformation of the future labor market.

---

## Key Findings

1. **Humans decide "what to do", Claude decides "how to do it"**: In a typical session, humans made most of the **planning decisions**, while Claude took on most of the **execution decisions**. The more domain expertise users had, the more work Claude completed per instruction.
2. **"Domain expertise" determines success rates, not "coding ability"**: In coding tasks, the average success rate for major non-software professions is almost on par with software engineers. Success (achieving the user's intended goal, with verifiable evidence such as passing tests or commit records) correlates positively with the user's level of domain expertise.
3. **Evolution of work patterns: moving towards end-to-end**: Over the 7 months observed, the proportion of sessions spent on Debugging (Fixing) dropped by nearly half, and usage behavior gradually shifted towards more end-to-end agent operations, including deploying and running programs, data analysis, and writing non-code documents. Meanwhile, the estimated economic value of tasks increased by an average of about 25%.

---

## Division of Labor: Collaboration Model Between Humans and Claude

### What do people use Claude Code for?

Anthropic categorized all interaction sessions into **9 major work modes**:

- **Writing/Maintaining Code (4 categories)**: Building new features, Fixing bugs, Testing code, Orchestrating automation.
- **Operating Software (1 category)**: Deploying, configuring, and monitoring systems (Operating).
- **Analysis and Planning (2 categories)**: Understanding existing systems, Planning before making modifications.
- **Non-code Tasks (2 categories)**: Analyzing data, Communicating (writing presentations, documents, etc.).

Data shows that about 56% of sessions are related to directly working with code (Building 25%, Fixing 26%, Testing and Orchestrating 5%). Operating software accounts for 17%, planning and exploration for 14%, and analysis and writing for 13%.

![The nine modes of work](/blog/26-anthropic-agentic-coding-expertise/image_1.png)
*Figure 1: The nine modes of work. Each interactive session is categorized into the single mode that best describes its goal.*

### Allocation of Decision Rights: Who decides what?

How autonomous is Claude Code exactly? In practical applications, there is a clear division of labor between humans and AI:

*   **Humans control planning**: On average, humans made about 70% of planning decisions (deciding what to do, which approach to take, and when it is considered done).
*   **Claude is responsible for execution**: Claude made about 80% of execution decisions (deciding which files to modify, what code to write, which language to use, and which commands to run).

When humans retain more execution decisions, Claude takes fewer actions per response (about 8 actions); but when Claude takes over more execution details, its number of actions increases significantly (about 16 actions).

![Planning and execution decision distribution](/blog/26-anthropic-agentic-coding-expertise/image_2.png)
*Figure 2: The distribution of planning (left) and execution (right) decisions made by Claude.*

---

## The Key to Success lies in "Domain Expertise", Not "Coding Proficiency"

Anthropic's research points out an exciting phenomenon: **Claude provides proportional value based on the "expertise" demonstrated by the user**.

"Expertise" here does not refer to the user's job title, but to **task-specific expertise**. For example: If a senior software engineer asks a question about Rust for the first time, they are a novice; but if an accountant who has never written Python can accurately tell Claude what reconciliation rules and edge cases a month-end script should include, they are an expert in that task.

![Expertise classifier examples](/blog/26-anthropic-agentic-coding-expertise/image_3.png)
*Table 1: Definitions and examples of the expertise classifier. Novices give generic instructions, while experts demonstrate a deep understanding of the codebase and technical environment.*

For expert-level users, Claude produces **more than twice as many actions (12)** and **five times the output volume (3,200 words)** per prompt. In other words, the deeper the context and expertise a user can provide, the stronger Claude's automation "multiplier effect".

![Experts unlock more of Claude's potential](/blog/26-anthropic-agentic-coding-expertise/image_4.png)
*Figure 3: As user expertise increases, the number of actions (left) and word count (right) generated by Claude per prompt also increase significantly.*

### When encountering difficulties, experts know better how to get unstuck

Regardless of the success metric used, expertise brings significant differences:

*   **Novice users**: A rigorously verified success rate of 15%, and a 77% chance of being at least partially successful.
*   **Intermediate and above users**: A rigorously verified success rate of 28-33%, and a 91-92% chance of being at least partially successful.

Most notably, when a project encounters difficulties (such as encountering errors or failed tests), **about 19% of novices will directly abandon the task** (0 lines of code produced), whereas the abandonment rate for other experience levels is only 5-7%. This implies that the value of expertise lies not only in giving instructions but also in guiding the Agent back on track.

![Expertise and session outcomes](/blog/26-anthropic-agentic-coding-expertise/image_7.png)
*Figure 5: The correlation between user expertise and session outcomes. The left chart shows all sessions, while the middle and right charts show session outcomes when encountering difficulties.*

![Definition of success and failure](/blog/26-anthropic-agentic-coding-expertise/image_6.png)
*Table 2: Definitions of success and failure in the classifier.*

### Professional Background is No Longer a Barrier

In sessions involving code modification, the success rate for software-related professions is about 34%, while the success rate for other professions is about 29%. If relaxed to "partial success", the gap between the two narrows even further to 89% vs 88%.

This indicates that **the success rates of major non-software professions are almost on par with those of software engineers** (the gaps are all within 7%). The verified success rate of management levels is even slightly higher than that of software engineers, which may reflect that management skills have extremely high transfer value in "guiding AI agents".

![Success rates of various professions in coding sessions](/blog/26-anthropic-agentic-coding-expertise/image_8.png)
*Figure 6: Verified and judged success rates in code-generating sessions across the top ten major occupational groups.*

---

## Task Evolution: Less Debugging, Higher Value

In just seven months from October 2025 to April 2026, the usage patterns of Claude Code underwent a substantial shift:

*   **Demand for Debugging plummeted**: The proportion of sessions used for Fixing errors dropped from 33% to 19%.
*   **End-to-end applications surged**: The proportions of operating software, analyzing data, and writing documentation almost doubled.

By comparing quotes with freelancer market data, Anthropic estimates that over the past seven months, **the average value of tasks handled by Claude increased by approximately 27%**.

![Changes in work composition and task value](/blog/26-anthropic-agentic-coding-expertise/image_5.png)
*Figure 4: Changes in the proportions of work types handled by Claude Code from October 2025 to April 2026, showing a significant decrease in the proportion of bug fixing.*

---

## Looking Ahead: The Value of Knowledge Workers in the AI Era

This research report outlines a brand-new picture of the future labor force:

1. **Code is no longer a high wall**: With the assistance of Agentic Coding tools, "not knowing how to code" is no longer an obstacle to solving technical problems. Software development is becoming part of the daily work across various industries, rather than the exclusive domain of a single profession.
2. **The golden age of "Domain Expertise"**: The key to successfully utilizing AI lies in having a profound understanding of the problem itself. The more users understand business logic and domain knowledge, the more implementation grunt work AI agents can help complete.
3. **Shifting from "How to implement" to "What problem to solve"**: As models absorb more and more underlying implementation work, the value of knowledge workers will entirely depend on the **planning decision capabilities** and **domain insights** they bring.

In the era of agentic coding, AI is diminishing the value of sheer programming syntax, but **greatly amplifying the leverage of domain expertise**. Directing your AI with a deep understanding of the problem—this is the ultimate work mode of the future.

> **References**:
> [Anthropic: Agentic coding and persistent returns to expertise](https://www.anthropic.com/research/claude-code-expertise)
