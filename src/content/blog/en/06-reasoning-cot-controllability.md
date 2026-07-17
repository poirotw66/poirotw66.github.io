---
title: "Why Reasoning Models 'Cannot Control Their Own Train of Thought' — And Why That's Good News for AI Safety"
description: "OpenAI's latest research reveals that current frontier reasoning models are almost completely unable to hide or alter their Chain of Thought (CoT) based on instructions, with maximum controllability at only 15.4%. This 'flaw' is not a problem, but rather the key reason why current CoT monitoring mechanisms can be trusted."
pubDate: 2026-03-17
updatedDate: 2026-03-17
tldr:
  - "OpenAI's latest research reveals that current frontier reasoning models are almost completely unable to hide or alter their Chain of Thought (CoT) based on instructions, with…"
  - "This 'flaw' is not a problem, but rather the key reason why current CoT monitoring mechanisms can be trusted"
audience:
  - "Engineers and PMs tracking AI product and industry signals"
  - "Readers who want a fast brief before deciding whether to go deeper"
category: "Technology"
tags: ["AI Safety", "Reasoning Models", "Chain of Thought", "CoT Monitoring", "OpenAI", "Explainable AI"]
image: "/blog/06-reasoning-cot-controllability/title_image.webp"
---

Discussions on AI safety often come down to the question: "Can we understand what it's thinking?" If a powerful AI system could deliberately hide its true reasoning process while being monitored, then all safety mechanisms based on "observing reasoning steps" would fail.

In this study published in March 2026, OpenAI asked this key question regarding the rapidly proliferating **reasoning models**: Do current frontier models have the ability to "deliberately control their chain of thought" to present a false facade to monitoring systems?

The answer is surprisingly reassuring.

> Reference article: [Reasoning models struggle to control their chains of thought, and that's good](https://openai.com/zh-Hant/index/reasoning-models-chain-of-thought-controllability/) (Korbak, Carroll, Baker & Kivlichan, 2026) \[English\]



<audio controls style="width: 100%; margin: 1.5rem 0;">
  <source src="https://raw.githubusercontent.com/poirotw66/Bloss0m-Audio/refs/heads/main/AI_%E8%97%8F%E4%B8%8D%E4%BD%8F%E5%BF%83%E4%BA%8B%E5%8F%8D%E8%80%8C%E6%9B%B4%E5%AE%89%E5%85%A8.m4a" type="audio/mpeg" />
  Your browser does not support built-in audio playback. Please use the following link to download or open it in a new tab:
  <a href="https://raw.githubusercontent.com/poirotw66/Bloss0m-Audio/refs/heads/main/AI_%E8%97%8F%E4%B8%8D%E4%BD%8F%E5%BF%83%E4%BA%8B%E5%8F%8D%E8%80%8C%E6%9B%B4%E5%AE%89%E5%85%A8.m4a">Listen to the audio explanation</a>
</audio>
---

### What is "Chain of Thought Controllability"?

Modern reasoning models (such as OpenAI's o-series, GPT-5.x Thinking) generate a series of **intermediate reasoning steps** before answering a question, which is known as a **Chain of Thought (CoT)**.

These reasoning steps are a critical window for AI safety monitoring: when a model is asked to perform complex tasks, researchers can observe the CoT to see if the model has anomalous intentions, deviates from user goals, or exhibits behavior of "surface compliance, underlying evasion."

**CoT controllability** measures:
> The extent to which a model can comply when explicitly instructed to "alter its reasoning process in a certain way."

For example: "Please do not use the word XOR during your reasoning," "Add a specific word at the end of every sentence," or "Only use lowercase letters for reasoning."

This seems like a simple formatting instruction, but the core of the issue is:  
**If the model could perfectly follow even this kind of "instruction to alter CoT," then theoretically, it would also have the ability to deliberately disguise its reasoning process under monitoring.**

---

### Study Design: The CoT-Control Evaluation Suite

To systematically measure this capability, the research team created an open-source evaluation suite called **CoT-Control**, featuring:

- **Scale**: Over **13,000 tasks**, covering mainstream benchmarks like GPQA, MMLU-Pro, HLE, BFCL, and SWE-Bench Verified.
- **Design Logic**: Each task = one standard question + one CoT-specific formatting instruction (e.g., banning specific keywords, converting all letters to lowercase, appending specific words to the end of every sentence).
- **Measurement**: Calculating the percentage of "the model successfully complying with CoT instructions" as the controllability score.

The brilliance of this design lies in: CoT instructions are deliberately designed to be **unrelated to the answer of the question itself**, purely testing the model's ability to follow formatting instructions during the reasoning process.

The study tested a total of **13 reasoning models**, covering OpenAI's own models and several open-weights models.

---

### Main Findings: Controllability is Generally Extremely Low

The results are very clear:

> **The CoT controllability scores of all frontier reasoning models range between 0.1% and a maximum of 15.4%.**

![Reasoning models' ability to control their chain of thought is far lower than their ability to control outputs](/blog/06-reasoning-cot-controllability/Reasoning%20models%20struggle%20to%20control%20their%20CoT%20compared%20to%20controlling%20their%20output.svg)

In other words, even when explicitly told "please do not use a certain word while reasoning," models still fail to do so over 85% of the time.

More interestingly, models do not fail because they **misunderstand** the instruction. Researchers found that during their own reasoning process, models often **already realize they have not followed the instruction**, but after admitting it, they continue to violate the instruction anyway.

The original article cites an actual case of GPT-5.2 Thinking:

> The model realizes it should not use the banned words (marked in red), and then, while panicking, uses them 4 more times.

This phenomenon illustrates: **It is not that the model doesn't want to comply, but rather it lacks the ability to precisely control its own train of thought during reasoning.**

---

### Further Patterns: Scale, Training Volume, and Adversarial Settings

The study also uncovered several interesting patterns:

#### The larger the scale, the slightly higher the controllability — but with diminishing returns

In the open-weights model family, larger models do exhibit slightly higher CoT controllability, but this improvement tends to plateau as model scale continues to increase, **not showing linear growth**.

![In open-weights models, chain of thought controllability increases with the number of parameters](/blog/06-reasoning-cot-controllability/在開放權重模型中，思路鏈可控性會隨參數量增加而提升.svg)

#### The longer the thought and the more the training, the lower the controllability

This is one of the most counterintuitive findings:

- Giving the model "more time to think (more test-time compute)" actually significantly **decreases** controllability.

![As reasoning length increases, chain of thought controllability decreases](/blog/06-reasoning-cot-controllability/隨著推理長度增加，思路鏈可控性會下降.svg)

- Observations on OLMo-3-7B-RL-Zero-Math show that as reinforcement learning training progresses, the controllability score drops by over **tenfold**.

![As RLVR (Reinforcement Learning with Verifiable Rewards) training volume increases, chain of thought controllability decreases](/blog/06-reasoning-cot-controllability/隨著%20RLVR（可驗證獎勵強化學習）訓練量增加，思路鏈可控性會下降.svg)

This suggests: **post-training and deeper reasoning actually strengthen the robustness of the model's "autonomous train of thought,"** making it harder to be swayed by external instructions.

#### Informing it is being monitored slightly increases controllability — but the margin is limited

The study also tested two "adversarial" settings:

- **Monitoring Awareness**: Informing the model "your chain of thought is being monitored."
- **Evaluation Awareness**: Informing the model "you are undergoing an evaluation of CoT controllability."

Both indeed slightly improved controllability, but not by much. Moreover, highly controllable prompts found via automated prompt optimization **generalized poorly to unseen instruction types**.

![Although the impact of situational awareness on chain of thought controllability is small, it cannot be ignored](/blog/06-reasoning-cot-controllability/情境意識對思路鏈可控性的影響雖然不大，但不容忽視.svg)

---

### Why is "Inability to Control" Actually a Good Thing?

This result is unexpectedly good news for the AI safety community:

**If models cannot deliberately hide or alter their reasoning process according to external instructions, then safety mechanisms based on CoT monitoring become much more reliable.**

OpenAI's safety strategy adopts a "**defense-in-depth**" architecture:
- Safety training
- Behavioral testing
- Agentic code review
- **Chain of Thought (CoT) monitoring** ← The level this study focuses on

The premise of CoT monitoring is that "the steps a model reveals during reasoning are genuine and trustworthy." This study provides the most direct empirical support to date for this premise.

---

### Outlook: As an Early Warning Indicator

The research team also clearly pointed out that this optimistic conclusion has its premises and limitations:

- **CoT-Control is a proxy metric**: An ideal evaluation should directly test whether "a model with misaligned goals can hide its intentions," but currently, "whether it can follow formatting instructions" is used as an approximation.
- **We do not yet understand why controllability is low**: We also do not know whether this property will disappear as model capabilities improve.
- **Low controllability does not equal high monitorability**: Even if a model cannot deliberately alter its CoT, other mechanisms (such as direct optimization pressure during training) could still reduce CoT monitorability.

Based on these considerations, OpenAI announced:

> **Starting with GPT-5.4 Thinking, the evaluation results of both CoT controllability and CoT monitorability will be reported simultaneously in the System Card,**  
> and they continue to pledge not to apply direct optimization pressure to the chain of thought of frontier reasoning models.

This makes the CoT controllability evaluation a **"canary eval"**: once the score starts to climb significantly, it will serve as an early warning that AI systems are developing the capability to "deliberately fake reasoning."

---

### Conclusion: A Piece of the AI Safety Puzzle, Still Intact for Now

The core message conveyed by this study can be simplified into one sentence:

> **Current reasoning models cannot even "deliberately format text incorrectly" — let alone "systematically deceive monitoring systems."**

This doesn't mean the problem will never arise. But it tells us: as AI capabilities rapidly advance, an important layer of safety still holds true, and we now have the tools to quantitatively track it.

For policymakers, enterprise teams adopting AI, and everyday people anxious about AI safety, the significance of such **boundary evaluation** research lies not in declaring "everything is fine," but in establishing a dashboard for continuous observation — giving us a chance to see problems coming before they truly appear.

Original link:  
**Korbak, T., Carroll, M., Baker, B. & Kivlichan, I. (2026). Reasoning models struggle to control their chains of thought, and that's good.**  
URL: <https://openai.com/zh-Hant/index/reasoning-models-chain-of-thought-controllability/>
