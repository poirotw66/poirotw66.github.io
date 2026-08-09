# Paper Reading comprehension quality

This guideline defines the reader outcome for Bloss0m paper readings. Evidence coverage is necessary, but the article is complete only when a target reader can reconstruct the paper's central argument without opening the paper first.

## Paper Essence Contract

After reading the article, the target reader must be able to answer, in their own words:

1. What problem does the paper solve?
2. Why is the previous approach insufficient?
3. What is the paper's core technical idea?
4. How does one representative input move through the method?
5. Which evidence supports the headline claim?
6. Where does the claim stop, and what is the engineering consequence?

An article that lists all sections and tables but cannot support these six answers is evidence-complete, not comprehension-complete.

## Required teaching layers

### 1. Ninety-second map

Open with a compact map containing the problem, core insight, strongest evidence, and main boundary. Do not repeat the abstract. State the article's bounded verdict.

### 2. Prerequisites on demand

Define only concepts needed for this paper. Introduce each symbol before use. Prefer a local definition and contrast over a detached background survey.

### 3. Core intuition before machinery

Explain why the method could work before presenting implementation detail or equations. Name the exact decision point changed from the previous approach.

### 4. End-to-end worked example

Walk one faithful, simplified input through the method:

`input → intermediate representation → model or system decision → output → likely failure point`

Use a paper example when available. Clearly label a Bloss0m-created example as explanatory, not experimental evidence.

### 5. Mechanism and equations

For every material equation, explain:

- what it computes;
- what each symbol means;
- what increasing or decreasing the value implies;
- where it changes system behavior.

Do not translate notation sentence by sentence without explaining its operational role.

### 6. Evidence interpretation

Read each central result through five questions:

1. What question does this experiment test?
2. What was held constant?
3. What changed or improved?
4. What mechanism might explain the observation?
5. What does the experiment not establish?

Prefer a small number of figures with distinct teaching purposes. A copied figure must be attributed and explained; an original diagram should reduce cognitive load without inventing measurements.

### 7. Exit recap

End with three durable memory points: the technical idea, the strongest evidence, and the adoption boundary. The recap must synthesize rather than repeat the TL;DR verbatim.

## Paper-type adaptations

- **Method or architecture:** emphasize the changed control point, data flow, objective, and ablation.
- **Benchmark or evaluation:** emphasize label construction, protocol, metrics, leakage, slices, and what the score means.
- **Empirical finding:** emphasize hypothesis, identification strategy, confounders, effect size, and external validity.
- **System or dataset:** emphasize interfaces, collection pipeline, coverage, operational cost, artifact status, and failure taxonomy.

## Teach-back review

Run the deterministic comprehension audit first. Then perform a semantic teach-back without consulting the paper:

1. Answer the six Paper Essence Contract questions using only the article.
2. Cite the article section supporting each answer.
3. Mark an answer `unclear` if it requires inference, outside knowledge, or the original paper.
4. Revise every `unclear` answer and repeat once.
5. Reject publication if the second pass still cannot state the mechanism, evidence, or boundary accurately.

The deterministic audit is a structural proxy. Keyword compliance never overrides a failed semantic teach-back.

## Review scorecard

Score each dimension from 0 to 2:

- `0`: absent or misleading;
- `1`: present but requires reconstruction;
- `2`: explicit, accurate, and teachable from the article alone.

Dimensions: problem, prior limitation, core intuition, worked example, mechanism, evidence interpretation, boundary, engineering transfer, and exit recap. Publication target: no zero, at least 15/18, and a score of 2 for core intuition, mechanism, evidence interpretation, and boundary.

## Anti-patterns

- Following paper section order without a reader question.
- Starting with notation before a mental model.
- Treating the best table row as the paper's meaning.
- Adding length without adding a causal explanation or example.
- Using figures decoratively or repeating the same evidence.
- Calling a repository link reproducibility.
- Conflating author claims, experimental evidence, and Bloss0m judgment.
