---
title: "The Impact of AI on the Labor Market: A New Measure from 'Theoretical Capability' to 'Observed Exposure'"
description: "A summary based on Anthropic's 'Labor market impacts of AI: A new measure and early evidence': introduces the 'observed exposure' metric, explains which occupations are most exposed to AI, its relationship with employment growth and unemployment rates, and implications for policy, businesses, and individual careers."
pubDate: 2026-03-17
updatedDate: 2026-03-17
tldr:
  - "A summary based on Anthropic's 'Labor market impacts of AI: A new measure and early evidence': introduces the 'observed exposure' metric, explains which occupations are most…"
audience:
  - "Engineers and product teams interested in Industry Pulse, implementation patterns, and technical trade-offs."
  - "Readers who want actionable notes rather than marketing summaries."
category: "Industry Pulse"
tags: ["Anthropic","AI","Research"]

image: "/blog/05-labor-market-impacts-of-ai/title_image.webp"
showToc: true
---
Economic Research Notes  
The Impact of AI on the Labor Market: A New Measure from 'Theoretical Capability' to 'Observed Exposure'

> Original source: [Labor market impacts of AI: A new measure and early evidence](https://www.anthropic.com/research/labor-market-impacts) (Massenkoff & McCrory, 2026) \[English\]


<audio controls style="width: 100%; margin: 1.5rem 0;">
  <source src="https://github.com/poirotw66/Bloss0m-Audio/raw/refs/heads/main/AI%20%E5%B0%8D%E5%8B%9E%E5%8B%95%E5%B8%82%E5%A0%B4%E7%9A%84%E8%A1%9D%E6%93%8A.m4a" type="audio/mpeg" />
  Your browser does not support built-in audio playback. Please download using the link below or open in a new tab:
  <a href="https://github.com/poirotw66/Bloss0m-Audio/raw/refs/heads/main/AI%20%E5%B0%8D%E5%8B%9E%E5%8B%95%E5%B8%82%E5%A0%B4%E7%9A%84%E8%A1%9D%E6%93%8A.m4a">Listen to the audio explanation</a>
</audio>
---

> **花花的一句話**：喵～AI 真的會搶走工作嗎？其實是看我們怎麼把 AI 融入日常啦！跟著花花一起學習，掌握最新趨勢就不怕！
>
> **花花的工程提醒**：評估 AI 對產業的影響時，應從『理論上的能力』轉向『實際的工具曝光度與應用場景』，以更務實的角度規劃企業轉型與個人職涯。

### Why Do We Need Another Study on "AI and Jobs"?

In the past few years since the popularization of generative AI, "Will AI take my job?" has become a cliché. However, looking back at predictions over the last two decades, many "seemingly severe" warnings ultimately did not come true:

- **Offshoring risk**: Studies once estimated that about 1/4 of US jobs were highly "offshorable," but ten years later, employment in most of these occupations still grew steadily.
- **Government employment forecasts**: The Department of Labor's occupational growth forecasts, while generally correct in direction, were practically not much better than "extrapolating past trends."
- **The effects of major shocks are hard to untangle**: The true impact of industrial robots and the "China shock" on the labor market is still debated in academia today.

What this study aims to do is to establish an **iteratively updatable measurement framework** before "the impact of AI fully materializes," to track AI's effect on various jobs and demographics, rather than guessing the causes in hindsight.

---

### The Core of the Study: From "Theoretically Capable" to "Actually Used"

Most labor studies focusing on AI share a key concept: **exposure**. Simply put, it refers to how many tasks in a job can theoretically be handled by AI.

The common approach is:

- First, break jobs down into tasks;
- Assess whether each task can be assisted by AI or fully automated;
- Then aggregate these to determine exposure at the occupational level.

This study continues this line of thought but introduces a critical practical consideration:  
**It looks not just at "whether AI is theoretically capable," but also at "whether people are actually using AI to do it."**

Specifically, the study combines three types of data:

- **O\*NET Task Database**: Lists about 800 US occupations and their respective tasks.
- **Anthropic's internal usage data (Anthropic Economic Index)**: What tasks are actually completed using Claude, and in what contexts.
- **Eloundou et al. (2023) task automatability metric β**:  
  - β = 1: LLMs alone can double the speed of a task.
  - β = 0.5: Requires additional tooling (e.g., retrieval, image processing).
  - β = 0: Even with LLMs, task completion time would not be significantly halved.

The study finds that this "theoretical capability" is highly correlated with "actual usage":  
**97% of tasks observed in actual usage fall within the scope of tasks that can theoretically be accelerated by AI (β = 0.5 or 1).**

---

### Observed Exposure: A Risk Metric Closer to Reality

The new metric proposed by the authors is called **"observed exposure."** The central question is:

> Among all tasks that "AI can theoretically do," **how many are actually already being automated or semi-automated by AI?**

Their measurement approach includes several key designs:

- **Tasks must be theoretically accelerable by LLMs** (derived from the β metric).
- **Substantial AI usage is observed in practice** (from Anthropic's internal usage data).
- **Focus on "work contexts"**: Filter out non-work uses.
- **Distinguish between automation vs. augmentation**:  
  - Fully automated workflows receive higher weighting.
  - Human-AI collaboration and augmentative uses receive only half the weighting.
- **Weighted average based on "time spent on the task relative to the whole job"**:  
  Some highly exposed tasks might only account for a small fraction of a job, and vice versa.

The resulting **occupation-level exposure metric** reflects not just "what AI can do," but "what AI is **actually** being used for currently, and to what extent it has penetrated the core tasks of that occupation."

Looking at the chart results (Original Figure 2):

- ![Illustration of the gap between AI theoretical capability and actual usage across different occupational categories](/blog/05-labor-market-impacts-of-ai/Theoretical%20capability%20and%20observed%20exposure.webp)

- In "Computer and Mathematical Occupations" and "Office and Administrative Support Occupations":  
  - The proportion of tasks that can theoretically be handled by LLMs is over 90%;  
  - However, **the tasks actually observed to be covered by AI currently stand at only around 30%**.
- That is to say, **there is still a large unrealized gap between AI's "theoretical capability" and "actual penetration."**

---

### Which Jobs Are Currently Most "Exposed" to AI?

In occupational rankings (Original Figure 3), the group currently observed to have the highest AI exposure largely aligns with our intuition:

- ![Illustration of the top ten occupations with the highest AI exposure](/blog/05-labor-market-impacts-of-ai/Most%20exposed%20occupations.webp)

- **Computer Programmers**: About 75% of tasks covered by AI.
- **Customer Service Representatives**: Widely implemented through APIs and automated workflows.
- **Data Entry Keyers**: Tasks involving reading documents and inputting data are highly automatable (about 67%).

On the other end of the spectrum, **about 30% of workers are in occupations with almost zero AI coverage**, including:

- Cooks
- Motorcycle Mechanics
- Lifeguards
- Bartenders
- Dishwashers
- Fitting Room Attendants

These occupations share two commonalities:

- Tasks heavily rely on physical manipulation or face-to-face interaction;
- Or they appear with extremely low frequency in current AI usage data.

From this, a key point emerges:  
**The jobs most deeply affected by AI currently are still knowledge and service jobs primarily focused on "text and information processing," rather than purely physical labor.**

---

### Who Are the Workers in High-Exposure Occupations?

The authors then link observed exposure with the 2024–2034 occupational employment growth projections released by the US Department of Labor in 2025, as well as demographic characteristics.

#### The Relationship Between Employment Growth Projections and Exposure

- Running a weighted regression at the occupation level (weighted by current employment numbers), the results show:  
  - **For every 10 percentage point increase in observed exposure, the occupation's projected employment growth rate declines by approximately 0.6 percentage points.**
- While this relationship is not drastic, it at least demonstrates:  
  **The exposure metric formed from "actual usage data" is consistent with the direction of mainstream labor market analysis forecasts.**
- Interestingly: if only the "theoretical feasibility metric" β from Eloundou et al. is used, this correlation is not evident.

In other words, **what truly matters is not how much AI can do, but where people actually use AI.**

![Scatter plot of the relationship between occupational exposure and 2024–2034 projected employment growth rate](/blog/05-labor-market-impacts-of-ai/%20BLS%20projected%20employment.webp)

#### Differences Between High-Exposure and Zero-Exposure Groups (Original Figure 5)

Using Current Population Survey (CPS) data from August–October 2022, the authors compared:

- **Workers in the top quartile of exposure**
- **The 30% of workers with zero AI coverage**

The two groups have distinct demographic differences:

- The high-exposure group:
  - Has a female proportion about 16 percentage points higher.
  - Has a white proportion 11 percentage points higher, and the Asian proportion is nearly doubled.
  - Has an average wage about 47% higher.
  - Has a graduate degree proportion about 4 times that of the zero-exposure group.

This brings up a very important, yet often overlooked, fact:

> **The occupations currently most susceptible to AI impact are often higher-paying, higher-educated, predominantly white-collar jobs, rather than the low-wage workers traditionally considered most vulnerable.**

![Demographic and wage differences between high AI exposure and zero exposure workers](/blog/05-labor-market-impacts-of-ai/%20Differences%20between%20high%20and%20low.webp)

---

### Which Metrics Reveal the True Impact of AI?

Many existing studies look at:

- Changes in occupational structure (how the proportion of different occupations shifts)
- The number of job openings
- Employment numbers across different age groups or industries

This study chose to **focus on unemployment rates**, for straightforward reasons:

- If someone is unemployed, it means they are actively looking for work but temporarily cannot find any;
- This captures the essence of "economic harm" more closely than merely looking at job openings or total employment;
- Even if a highly exposed occupation sees a decrease in job openings, workers might be absorbed by other related occupations, which may not directly reflect in aggregate employment figures.

The authors' hypothesis is:  
**If AI truly brings a "harmful" labor market impact, we should see a noticeable and sustained increase in the unemployment rates of certain highly exposed groups.**

The Current Population Survey is well-suited for this analysis because unemployed respondents report the occupation and industry of their last job, which can be used to track the unemployment status of specific occupational cohorts.

---

### Early Results: No "Mass Unemployment" Seen Yet, but Youth Hiring Shows Signs of Slowing

The authors then merged observed exposure with CPS unemployment data since 2016 to test several key questions.

#### 1. Has the unemployment rate for highly exposed workers risen significantly?

- Define the "treatment group" as workers in the top 25% of occupational exposure, and the "control group" as the 30% of workers completely uncovered by AI.
- Using a difference-in-differences approach to observe:
  - Whether there was a systematic change in the unemployment gap between the two groups before and after the release of ChatGPT (around late 2022).

The findings:

- During COVID, workers with more physical contact and lower AI exposure saw a sharp rise in unemployment (which aligns with intuition).
- Afterward, the unemployment trends of both groups were roughly parallel;
- Post-ChatGPT, the unemployment rate of the high-exposure group **rose slightly, but it was statistically insignificant**.

In plain language:

> **To date, there is no clear evidence that "AI is causing mass unemployment in high-exposure occupations."**

According to the confidence intervals, if:

- The unemployment rate for the high-exposure group rose by about 1 percentage point, this framework could roughly detect it;
- If a "white-collar Great Recession" occurred—such as the high-exposure group's unemployment rate doubling from 3% to 6%—it should clearly reflect on the chart.

But current data shows that such a massive jump has not happened.

![Comparison of long-term unemployment rate trends between high-exposure and zero-exposure occupation workers](/blog/05-labor-market-impacts-of-ai/Trends%20in%20the%20unemployment.webp)

#### 2. Is it harder for young people to enter high-exposure occupations?

Previous work by Brynjolfsson et al. (2025) found a 6–16% decline in employment of 22–25-year-olds in high-exposure occupations, seemingly driven by **slower hiring rather than increased firing**.

This study first checks the unemployment rate of youth in high-exposure occupations and finds:

- **The unemployment rate itself is quite stable, with no evident deterioration.**

However, unemployment rates may not capture the whole picture, especially:

- Some young people might exit the labor market entirely or stay in old jobs instead of looking for new jobs while unemployed.

To look more directly at "entry opportunities," the authors used the longitudinal panel structure of the CPS to calculate:

- The proportion of 22–25-year-old young workers **switching jobs or starting new employment in high-exposure vs. zero-exposure occupations** across different months.

Starting in 2024, the graph shows a clear divergence (Original Figure 7):

- The probability of entering a low-exposure occupation remained steady at around 2% per month;
- The probability of entering a high-exposure occupation fell by about 0.5 percentage points;
- Cumulatively, **after ChatGPT, the "inflow rate" of young people into high-exposure occupations declined by roughly 14% (compared to 2022).**

This result perfectly corroborates the findings of Brynjolfsson et al.:  
**In the short term, AI doesn't seem to have created mass unemployment, but it may have already started "quietly shifting which good jobs young people can enter."**

The authors also caution that there are other possible explanations:

- Young people might choose to return to school;
- They might enter other industries or occupations;
- Or there might be high survey error when measuring job-switching behavior.

![Changes in job opportunities for 22–25-year-old young workers entering high-exposure and zero-exposure occupations](/blog/05-labor-market-impacts-of-ai/%20New%20job%20starts%20among%20workers%20.webp)

---

### Implications of This Study

Synthesizing the above, the signals provided by this framework so far can be roughly summarized in several points:

- **AI's "theoretical capability" far exceeds its current actual impact.**  
  In many white-collar occupations, AI can theoretically cover the vast majority of tasks, but the proportion actually covered by AI currently is still just a small fraction.

- **Those most exposed to AI are not the lowest-paid workers, but the higher-paid, higher-educated white-collar cohorts.**  
  Especially occupations like computer programming, customer service, financial analysis, and data entry.

- **So far, we have not observed that "AI is causing unemployment rates in specific high-exposure occupations to spike significantly."**  
  This does not mean the risk doesn't exist; rather, it suggests that within existing data, if an impact exists, its magnitude is still too small to be easily distinguished from other cyclical economic factors.

- **What truly merits attention may be changes in "entry opportunities," rather than "immediate unemployment."**  
  The chances for young people to enter high-exposure, high-paying white-collar jobs seem to have begun a slight decline; this could be where the labor shock of AI first appears.

---

### Practical Advice for Policy and Individual Careers

From this study, we can extrapolate several concrete directions for policymakers, businesses, and individuals to consider.

#### For Policymakers

- **Don't just stare at headline unemployment rates**:  
  Unemployment might remain stable, but the employment structure and "who can get into good jobs" are already shifting.
- **Continuously track young workers in high-exposure occupations**:  
  If entry barriers keep rising, there may be a need for:
  - Transition subsidies and training programs designed for fresh graduates;
  - Integrating AI into the core curricula of vocational and higher education.
- **Strengthen data and measurement frameworks**:  
  Exposure metrics like this that combine theoretical capability with actual usage data should be continuously updated and made as open to external research communities as possible.

#### For Businesses

- **Treat AI as a tool to augment manpower, not just a means to cut headcount**:  
  In practice, current AI usage in many high-exposure occupations still leans toward "augmentation" rather than "replacement."
- **Rethink job design**:  
  Intentionally preserve or enhance those tasks that are temporarily hard for AI to cover, such as:
  - Higher-level decision making and accountability;
  - High-degree interpersonal interaction and trust building;
  - Cross-departmental communication and integration.

#### For Individual Workers

- **Don't just ask, "Will my job be replaced by AI?"**  
  The more critical questions are:
  - Which tasks can be delegated to AI, freeing up my time for higher-value activities?
  - Can I become someone who "uses AI exceptionally well"?
- **If you are in a high-exposure occupation (e.g., engineer, customer service representative, analyst)**:
  - This study shows the risk of being "immediately laid off en masse" in the short term is not high;
  - However, **those who do not know how to use AI are very likely to be at a disadvantage in promotions and job transitions in the future**.
- **If you are still in school or early in your career**:
  - Treat "how to collaborate with AI" as a foundational skill, not just a bonus;
  - Stay flexible—choose skills and disciplines that can transfer across functions.

---

### Conclusion: The AI Labor Shock is Currently More Like an "Undertow" than a "Tsunami"

The value of this study lies not in offering a sensational conclusion, but in providing an **updatable observation dashboard**:

- By combining theoretical capabilities with real usage data for "observed exposure,"  
  this framework can be updated whenever AI's functionalities and penetration levels change;
- Once we see:
  - Unemployment rates for certain high-exposure occupations begin to rise noticeably, or
  - Entry opportunities for certain groups (like youth) steadily worsen,
  it can be detected earlier, rather than waiting to assess the damage in hindsight.

Currently, what we see is:

- **There is no statistical evidence of "mass unemployment" yet;**
- But **career entryways, occupational structures, and skill demands have quietly begun to shift.**

If you care about positioning your career in the AI era, rather than being spooked by alarmist headlines, refer to this kind of research grounded in actual usage data and calmly ask yourself:

> In my job, which tasks are easiest for AI to cover?  
> Am I actively learning, positioning myself on the "side of utilizing AI," rather than being a passive waiter of outcomes?

Original Link:  
**Massenkoff, M. & McCrory, P. (2026). Labor market impacts of AI: A new measure and early evidence.**  
URL: <https://www.anthropic.com/research/labor-market-impacts>
