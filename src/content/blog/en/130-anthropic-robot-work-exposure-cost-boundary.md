---
title: "Robots Can Do the Task. Does Automation Pay? Anthropic’s Exposure–Cost Gap"
description: "Anthropic estimates that robots can perform 74% of US physical tasks in some settings, yet are cost-competitive for only 0.3% of work today. This analysis explains the tiers, cost assumptions, and implications for deployment decisions."
pubDate: 2026-10-02
updatedDate: 2026-10-02
tldr:
  - "Anthropic rates robots as capable of performing 74% of US physical tasks in at least some circumstances, equal to about 34% of all work hours; this is capability exposure, not adoption."
  - "The study estimates that robots are cost-competitive for only 0.3% of work today. If prices keep falling at roughly 3% a year as in past trends, reaching 10% of work would take about 40 years."
  - "E0–E3 describe how controlled an environment must be, with task time and occupational employment used as weights; the measure can help identify pilots, but it is not a job-loss forecast."
  - "Before projecting labor savings, enterprises should validate deployment costs, reliability, exception handling, and the actual work setting across the full workflow."
audience:
  - "Engineering, operations, and finance teams evaluating robotics, automation, and physical AI investments"
  - "Enterprise leaders and labor-market researchers following technology exposure, cost, and employment change"
category: "Industry Pulse"
tags: ["Anthropic", "AI", "Research"]
kind: "article"
showToc: true
image: "/blog/130-anthropic-robot-work-exposure-cost-boundary/title_image.webp"
---

A robot picking up a box in a demo and a robot completing an entire job reliably, safely, and cheaply in a real warehouse are different propositions. Anthropic’s September 30, 2026 report, [“Can we predict the jobs robots will do?”](https://www.anthropic.com/research/what-work-can-robots-do), quantifies that gap. It estimates that robots can perform 74% of US physical tasks in at least some circumstances, accounting for about 34% of all work hours. Once costs are included, however, the study estimates robots are cheaper than labor for only 0.3% of work tasks today.

This is not a forecast that robots will soon replace three-quarters of jobs. The first figure rates current capabilities across tasks and settings; the second comes from Anthropic’s separate comparison of estimated robot and labor costs for task output. Together, the figures show that moving from “can do” to “worth deploying” involves barriers in environment, reliability, integration, and cost.

> **Huahua in one sentence**
>
> Robot exposure asks where a robot can do the work; cost competitiveness begins to answer whether a business has a reason to buy one now.

## Read the denominators behind 74%, 34%, and 0.3%

Anthropic starts with US Department of Labor O*NET occupation and task data, identifies physical tasks that would require robots to automate, and uses Claude to assess whether current robots can perform them and in what work settings. Under the study’s weighting, robots can perform about 74% of physical tasks in at least one setting; those tasks account for about 34% of all US work hours. Claude estimates the time each occupation spends on each task, and the study weights by occupational employment from the Bureau of Labor Statistics (BLS). So 34% is an estimated share of total work time—not 34% of jobs or hours already automated.

The study assigns tasks to four environment tiers:

- **E0: Cannot perform today.** No cited system can complete the task even in a purpose-built robotic setting.
- **E1: Purpose-built robotic environment.** The workspace must be designed around the robot, with fixtures, one-way conveyors, or an isolated work cell, for example.
- **E2: Structured human workplace.** The place was built for people but has a relatively stable layout and process, such as a hospital, hotel, or logistics warehouse.
- **E3: Unstructured environment.** The setting varies and is not maintained to a consistent standard, such as a public road, home, or construction site.

All of E1–E3 count as exposure, but they carry very different commercial implications. A robot that welds at a fixed factory station may not handle changing materials at every construction site. A robot moving boxes in a warehouse may not sort objects in an unfamiliar home. Less controlled settings bring robots closer to the range of environments people can work in, but that does not automatically make them cheaper.

## How task ratings turn demonstrations into inspectable evidence

The researchers did not ask Claude to guess a score from task titles alone. Claude with web search generated representative instances of each O*NET task and estimated how much time each instance takes. It then searched for relevant robot deployments, commercial products, or demonstrations and assessed whether systems could perform the work at a human-like level of speed, reliability, and error rate in different settings. Only demonstrated capabilities count; a surgical device fully controlled by a remote operator, for example, is not treated as an autonomous robot.

The instance weights affect the final task tier. A task reaches a given tier only when more than half of its weighted instances can be done at that level or higher. This prevents one striking demo from standing in for a whole task. The public [robot exposure data documentation](https://huggingface.co/datasets/Anthropic/EconomicIndex/blob/main/robot_exposure/README.md) says the task file includes time shares, exposure tiers, Claude’s reasoning, instance examples, and source fields. The occupation exposure index is a time-weighted average of E1–E3 scores, with E0 scored as zero.

### A weighted exposure score is not an individual worker’s risk

To aggregate work, the study estimates how much time each occupation spends on each task and multiplies that by employment in the occupation. This is closer to the distribution of work in the labor market than simply counting task statements, but it remains a modeled estimate at the occupation level. People with the same job title can work in very different settings and perform different tasks. The score does not tell us what share of a particular employee’s role will disappear, and it does not observe staffing changes after a company deploys a robot.

The method also depends on the quality of its evidence and classification choices. O*NET task descriptions can be terse, so Claude must infer work instances. Source relevance, freshness, and the distinction between a demo and a commercial deployment can all affect a rating. The task data include reasoning and citations so readers can inspect those judgments instead of treating model output as direct measurement.

## Why are only 0.3% of tasks cost-competitive if robots can do them?

Capability exposure and cost competitiveness use different comparisons. For exposed tasks, the study asks Claude to estimate the deployment cost of the cited robots for the same annual task output. It includes annualized fixed costs such as purchase and installation, plus operating costs such as maintenance, energy, and some human supervision, then compares them with the occupation’s compensation allocated to the same share of task time. The model uses assumptions including an approximately ten-year hardware life and an 8% cost of capital; different workplace configurations also change deployment cost.

Packers and packagers illustrate the method. The study estimates that automating their exposed tasks requires several robots costing more than $2 million to purchase and install. After annualizing the equipment and adding operating costs, the robot cost is about $45,000 per year for each worker-equivalent of output—slightly below the estimated labor cost. This makes the occupation one of the few near or at cost parity in the model. It is an estimate, not a quote or business case for a specific warehouse.

Anthropic estimates that robots are cost-competitive for only 0.3% of work today. If robot prices continue to fall at roughly 3% a year, in line with past trends, the study’s scenario reaches 10% of work at cost parity in about 40 years, holding to its assumptions. This is a conditional projection, not a guaranteed price path or an employment forecast. New manufacturing methods, scale, or capability gains could change cost and task coverage. Even at cost parity, exception handling, downtime, human preferences, and regulation can still shape adoption.

> **Huahua's engineering note**
>
> Compare the cost of the whole task chain: site changes, integration, maintenance, supervision, failure recovery, and throughput all belong in the ledger. Hardware price and a successful demo do not establish usable unit economics.

## What the backtest from 1977 onward can and cannot tell us

Anthropic links historical occupation task descriptions with robot capability ratings from several years, then examines changes in wages and employment since 1977. The report says that occupations with greater exposure to the robots available at the time saw larger wage and employment declines in later decades, after controls for industry trends and other potential confounders. The authors use this historical relationship as a predictive check on today’s exposure measure. They also estimate that robot capabilities expanded each year to cover about 2% of physical tasks that robots previously could not perform.

This remains an association in historical data. It does not prove that robot exposure caused wage or employment declines, and the study does not measure current worker displacement. Demand, trade, policy, geography, and changes in how work is organized also affect occupations. A backtest can increase confidence in an indicator without removing the possibility that future technology and economic conditions will differ.

## How enterprises can use the findings

The report is most useful as a map for finding a first process worth testing. Operations and engineering teams can identify tasks with high exposure, controlled settings, and concentrated volumes. They can then use site data to test environmental variation, exceptions, and safety boundaries. Finally, they can compare labor and robot costs for the same output unit and measure availability, human intervention, maintenance downtime, quality, and bottlenecks across the workflow during a pilot.

Companies should not turn exposure rankings directly into a layoff list. Robots may take on repetitive or hazardous steps while creating new bottlenecks in replenishment, inspection, exception handling, or coordination across tasks. The study itself estimates that costs, capability, regulation, and human preferences can all prevent scaled adoption; many physical tasks remain limited by dexterity. For investment decisions, the ability to standardize a setting and sustain high utilization may matter more than whether a robot can perform one motion once.

## What the public data include—and what the license labels say

Anthropic’s Hugging Face [EconomicIndex robot exposure folder](https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main/robot_exposure) offers `robot_exposure_tasks.csv` and `robot_exposure_occupations.csv` for download. The data card describes 18,796 occupation-task rows and 923 occupation rows; the task CSV is about 99.5 MB. Its file page says the file is too large for browser preview but can be downloaded. The dataset viewer is currently unavailable. The CSVs let readers inspect public task ratings, reasoning, and source fields, but they are not enough by themselves to fully reproduce the report’s cost estimates and complete analysis pipeline.

The license labels also need care: the dataset page’s top-level metadata says MIT, while the page’s License section and the robot exposure README specify CC BY data and MIT code. The README specifies CC BY 4.0 and includes an O*NET attribution notice. Anyone reusing the data should follow the data-specific terms and attribution, rather than relying on the single top-level label.

## Related reading and sources

- [AI and labor markets: the gap between theoretical capability and observed use](/en/blog/05-labor-market-impacts-of-ai/): how capability exposure differs from evidence of actual AI use.
- [Anthropic’s Model Hardware Standard: how agents reach physical devices](/en/blog/97-model-hardware-standard/): the interface and safety responsibilities involved when AI reaches hardware.
- [How Anthropic measures AI participation in research work](/en/blog/115-anthropic-ai-led-rd-measurements/): another exposure-measurement case built from task categories, model ratings, and weighting.

Primary sources: [Anthropic’s report](https://www.anthropic.com/research/what-work-can-robots-do) (Russell Legate-Yang and Maxim Massenkoff, 2026-09-30) and the [Anthropic EconomicIndex robot exposure data and documentation](https://huggingface.co/datasets/Anthropic/EconomicIndex/blob/main/robot_exposure/README.md). This article labels the report’s figures as author estimates; its enterprise guidance and interpretation are Bloss0m analysis.
