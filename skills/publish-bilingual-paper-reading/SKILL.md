---
name: publish-bilingual-paper-reading
description: Create, audit, repair, localize, or publish a source-grounded, argument-faithful, and comprehension-complete Bloss0m paper-reading article as a Traditional Chinese and English pair, including original-paper body figures with provenance and an Evidence Atlas cover for a new reading. Use for approved Paper Radar briefs, deep reading notes, Paper Essence Contract or teach-back audits, conceptual and taxonomy fidelity checks, figure/evidence verification, metadata verification, bilingual parity, engineering interpretation, cover creation, or publication validation.
---

# Publish Bilingual Paper Reading

Turn one approved paper into a durable, critical reading path.

The goal is not to expand an abstract into polished promotional prose. The goal is to preserve the paper's evidence, argument structure, conceptual distinctions, uncertainty, and engineering consequences closely enough that a reader can reconstruct the paper's main reasoning without silently inheriting a distorted version of it.

A strong reading should be:

* **source-grounded:** every substantive claim can be traced to the primary paper or a verified artifact;
* **argument-faithful:** the article preserves the paper's conceptual ontology, assumptions, reasoning structure, and claim strength;
* **comprehension-complete:** a reader can explain the problem, model, mechanism, evidence, boundary, and practical consequence after reading;
* **editorially useful:** the article explains why the work matters without pretending that engineering interpretation is part of the original contribution.

## Required context

* In a Bloss0m checkout, read `AGENTS.md`, `src/content.config.ts`, [references/content-standard.md](references/content-standard.md), and `docs/guideline/content/content-reading-quality.md`.
* When drafting or substantially rewriting an article, read [references/article-template.md](references/article-template.md). Preserve its teaching functions without forcing identical headings onto every paper type.
* When creating a new paper-reading pair or explicitly replacing its cover, read [references/cover-art.md](references/cover-art.md).
* Read the approved Paper Radar brief and its current ledger record before drafting.
* Open the full primary paper, not only its abstract. Inspect appendices, tables, figures, limitations, supplementary material, and official artifacts relevant to the article's claims.
* Identify the paper type before drafting. At minimum distinguish among:

  * empirical or benchmark paper;
  * systems paper;
  * theoretical or formal paper;
  * taxonomy or conceptual paper;
  * dataset or evaluation paper;
  * position or perspective paper;
  * mixed paper.
* Build a visual-evidence inventory separately from the Evidence Atlas cover. Enumerate the paper's figures, their sections, teaching purpose, direct image endpoints, version, and reuse license or restriction. Do not treat the cover as a paper figure.
* Open every material code, dataset, demo, checkpoint, benchmark, and project URL independently. Record whether each endpoint is usable, empty, gated, missing, stale, partial, or merely announced. Do not infer availability from a paper or project-page claim.
* Inspect the closest existing Traditional Chinese and English paper-reading pair for current formatting and route conventions.
* Inspect `git status` and preserve unrelated local work.

## Modes

* **new:** create a new publication-ready bilingual pair from an explicitly approved brief.
* **localize:** create a missing counterpart while preserving information and argument parity.
* **repair:** fix metadata, evidence, terminology, conceptual fidelity, formatting, or bilingual drift without changing the route unless authorized.
* **audit:** report gaps without editing content.

## Workflow

### 1. Resolve identity and mode

Confirm the mode and resolve:

* the exact approved brief;
* stable paper ID;
* canonical title;
* author list;
* current source version;
* publication or preprint status;
* canonical primary paper URL;
* official artifacts;
* relevant prior versions.

Stop if:

* a new article lacks explicit editorial approval;
* the paper identity is unresolved;
* the source is withdrawn without an editorial reason to cover it;
* the full paper is inaccessible;
* the primary version cannot be established.

Do not silently switch between arXiv versions, conference versions, workshop versions, or later revisions.

### 2. Build the argument and evidence map before prose

Do not begin from the abstract and fill outward.

Build an internal map of what the paper actually argues.

Always capture:

* problem;
* prior limitation or gap;
* motivation;
* central research question;
* core idea;
* formal or conceptual model;
* assumptions;
* abstraction levels;
* named entities and terminology;
* mechanisms;
* dependencies between concepts;
* claimed guarantees;
* capability requirements;
* boundaries;
* failure modes;
* limitations;
* evidence supporting the central claims;
* claims the evidence does not support;
* adoption or deployment constraints;
* open questions.

For **empirical or benchmark papers**, additionally capture:

* datasets;
* splits;
* baselines;
* metrics;
* evaluation protocol;
* statistical uncertainty when reported;
* ablations;
* subgroup results;
* failure slices;
* calibration;
* cost;
* latency;
* robustness;
* transfer;
* external validity;
* benchmark contamination concerns when relevant.

For **systems papers**, additionally capture:

* system boundary;
* architecture;
* components;
* interfaces;
* control plane and data plane when relevant;
* invariants;
* failure model;
* consistency model;
* recovery path;
* concurrency assumptions;
* operational dependencies;
* evaluation environment;
* overhead;
* scalability;
* production assumptions.

For **theoretical, formal, taxonomy, or conceptual papers**, additionally capture:

* formal objects;
* abstraction hierarchy;
* definitions;
* taxonomies;
* category relationships;
* invariants;
* propositions;
* lemmas;
* theorems;
* counterexamples;
* necessary and sufficient conditions;
* impossibility or boundary arguments;
* conjectures;
* proof assumptions;
* capability relationships;
* conceptual dependencies.

For **dataset or evaluation papers**, additionally capture:

* construction process;
* collection methodology;
* annotation process;
* sampling frame;
* filtering;
* inclusion/exclusion criteria;
* known biases;
* benchmark design;
* leakage risks;
* representativeness;
* evaluation dimensions.

The argument map must preserve the paper's **argument topology**: not only what conclusions appear, but how the authors move from assumptions and definitions to evidence and conclusions.

### 3. Build a terminology and conceptual ontology map

For every central named concept, record internally:

* exact paper term;
* definition;
* conceptual type;
* parent category;
* child categories;
* dependencies;
* related but distinct concepts;
* whether the term is author-defined or inherited from prior work;
* where it is defined in the paper.

Examples of conceptual types include:

* assumption;
* anomaly;
* taxonomy class;
* profile;
* capability;
* mechanism;
* operation property;
* metric;
* guarantee;
* theorem;
* protocol stage;
* architecture component;
* failure mode;
* evaluation slice.

Do not collapse concepts merely because doing so makes the article easier to narrate.

A taxonomy class must not silently become a guarantee profile.

A capability must not silently become an algorithm.

A limitation must not silently become an impossibility result.

A heuristic must not silently become a theorem.

A paper-defined term should retain its semantic role even if the article introduces a simpler reader-facing explanation.

### 4. Build the Paper Essence Contract

Before drafting, write accurate answers to these seven questions.

1. **Problem:** What exact problem is the paper trying to solve or characterize?
2. **Prior limitation:** Why are existing methods, abstractions, systems, or assumptions insufficient?
3. **Core idea:** What is the paper's central new idea?
4. **Formal or conceptual scaffold:** What are the key entities, abstraction levels, assumptions, taxonomies, and relations, and how do they lead toward the main conclusion?
5. **End-to-end mechanism:** How does the proposed method, system, framework, or reasoning process work from input to outcome?
6. **Supporting evidence:** What evidence supports the paper's central claims, and what kind of evidence is it?
7. **Adoption boundary:** Under what conditions should a practitioner trust, adopt, reject, or remain uncertain about the paper's conclusions?

If the paper cannot support one answer, explicitly mark the uncertainty instead of filling it with inference.

A reader should be able to reconstruct the paper's main conceptual model from the final article alone.

### 5. Identify author contribution versus Bloss0m synthesis

Before drafting engineering recommendations, classify every major framework or conclusion as one of:

* explicitly proposed by the authors;
* directly derived from the authors' analysis;
* reasonable engineering interpretation;
* Bloss0m synthesis;
* speculation or open question.

Any framework, checklist, architecture, sequence, taxonomy, or recommendation created by Bloss0m but not explicitly proposed by the authors must be visibly labeled at first introduction.

Preferred labels include:

* `Bloss0m 工程化整理`
* `Bloss0m engineering synthesis`
* `工程解讀`
* `engineering interpretation`

Do not write phrases such as:

* "the paper proposes";
* "the authors define";
* "the method consists of";
* "the framework has five stages";

unless the primary source explicitly supports that description.

### 6. Choose the reader question and series track

Choose:

* one primary reader question;
* one primary series track;
* one narrative spine.

Use a single-part article for new work. Do not create `-part-N` files.

The article should answer one dominant question rather than becoming a dump of every interesting detail found during reading.

### 7. Draft for comprehension before completeness

Give the reader an orientation layer early, but do not repeat the full article several times.

A strong article will usually:

* give a concise ninety-second map;
* explain the core intuition before notation;
* introduce abstraction levels before relying on them;
* define central terminology before compressing it;
* walk one representative input, execution, proof path, or failure case through the mechanism;
* show how the main argument is constructed;
* interpret the central evidence;
* distinguish evidence from engineering extrapolation;
* explain important failure modes;
* state the boundary of the paper's conclusions;
* end with three durable memory points when they add retention value.

The ninety-second map, core explanation, section recaps, and final memory points must serve different teaching functions:

* **orientation:** what is this paper about?
* **reasoning:** why does the argument work?
* **retention:** what should remain in memory?

Remove a layer when it only paraphrases an earlier one.

Do not allow a summary article to become harder to navigate than the source paper without a strong teaching reason.

### 8. Prefer canonical examples for formal concepts

When introducing:

* a formal anomaly;
* theorem boundary;
* taxonomy item;
* counterexample;
* failure model;
* protocol property;

prefer the paper's canonical example when it is clear and reusable.

If replacing it with an original engineering example:

* verify that it demonstrates the same causal mechanism;
* verify that it does not introduce an additional anomaly or confound;
* state when the example is Bloss0m-created;
* preserve the paper's logical boundary.

A memorable example is useful only if it teaches the same concept.

### 9. Create the Traditional Chinese article first

Draft the Traditional Chinese article first.

Include:

* source-grounded claims;
* correct terminology;
* explicit distinction between author claims and Bloss0m synthesis;
* selected body figures;
* evidence anchors;
* engineering consequences;
* limitations;
* artifact status;
* next-reading path.

Then produce an editorial English localization with matching:

* claims;
* conceptual distinctions;
* argument structure;
* figure assets;
* captions;
* source anchors;
* teaching layers;
* metadata;
* callout intent;
* uncertainty;
* synthesis labels;
* next-reading path.

Do not publish a reduced English summary.

Bilingual parity means semantic parity, not sentence-by-sentence literal translation.

### 10. Anchor substantive claims

Follow `content-standard.md`.

Use locatable:

* Figure;
* Table;
* section;
* subsection;
* appendix;
* equation;
* theorem;
* definition;
* artifact;

anchors for substantive claims.

A claim should be traceable to the place where the evidence or definition actually appears.

Distinguish:

* what the authors claim;
* what their evidence demonstrates;
* what the evidence suggests;
* what Bloss0m infers;
* what remains unresolved.

Do not use a citation merely because it is nearby. The cited anchor must support the actual claim.

### 11. Preserve claim strength and scope

Audit modal verbs, quantifiers, and logical strength.

Pay special attention to transformations such as:

```text
may
→ must

can fail
→ always fails

under these assumptions
→ universally

no general solution is shown
→ impossible

the authors conjecture
→ the paper proves

correlates with
→ causes

supports
→ demonstrates conclusively

sufficient under condition X
→ sufficient

observed in benchmark Y
→ production behavior
```

Preserve distinctions among:

* possible;
* likely;
* observed;
* supported;
* necessary;
* sufficient;
* conjectured;
* proven;
* impossible;
* unsupported;
* unknown.

Do not strengthen a conditional, scoped, empirical, approximate, or conjectural claim into a universal conclusion.

When simplifying wording for readability, preserve the original logical force.

### 12. Link verified internal routes

Link 2-4 verified internal routes when useful.

Use:

* `/paper-reading/.../` in Traditional Chinese;
* `/en/paper-reading/.../` in English.

Internal links should serve conceptual continuation, not SEO filler.

### 13. Create the Evidence Atlas cover

For every new bilingual pair, create one Evidence Atlas cover from the article's evidence map.

The cover is not a paper figure and never satisfies the body-figure requirement.

Do not use:

* Huahua;
* another mascot;
* fake dashboards;
* readable paragraphs of text;
* decorative benchmark numbers;
* unverified paper claims;
* invented diagrams presented as evidence.

Preserve an existing cover during audit, repair, or localization unless the user explicitly asks to replace it.

### 14. Apply the body-figure gate

A new or substantially repaired pair must embed at least three distinct original-paper figure placements per language when the paper exposes three or more reusable material figures.

Otherwise include every material reusable figure.

The repository-wide archive gate requires at least one body figure per language.

When selecting figures:

* prefer central evidence over decoration;
* prefer a main result over a generic architecture diagram when the result is essential;
* include subgroup, ablation, or failure-mode evidence when it materially affects interpretation;
* avoid adding figures that the article never teaches.

Reuse the same stable local asset or exact remote endpoint in both languages.

Every figure needs a caption that includes:

* paper figure number;
* section or locatable figure anchor;
* explanation of what the reader should notice;
* original figure anchor;
* license or copyright/reuse restriction.

A no-figure exception requires an explicit reason in the audit command and final handoff.

Valid reasons include:

* the paper has no figures;
* the endpoint is inaccessible;
* reuse is not permitted;
* all available figures are non-material and reuse would reduce rather than improve comprehension.

Never silently omit figures.

### 15. Run the strict figure audit

Run:

```bash
node skills/publish-bilingual-paper-reading/scripts/audit-paper-figures.mjs --strict --min-body-figures 3 <basename>
```

Treat the following as blockers:

* missing figures;
* fewer than three material placements when reusable figures are available;
* mismatched bilingual image counts;
* mismatched bilingual paths;
* missing local assets;
* missing source anchors;
* missing license notes;
* missing captions.

Use:

```bash
--allow-no-body-figures --reason "..."
```

only for an explicit documented exception.

### 16. Audit artifact availability at publication time

Verify every material artifact independently.

Separate:

> the paper says the artifact is released

from:

> the artifact is currently accessible and usable

Record:

* direct endpoint;
* access state;
* version;
* as-of date;
* required account or permission;
* missing files;
* documentation state;
* whether reproduction is actually possible.

For partial releases, say so explicitly.

Make reproduction steps conditional when required files are unavailable.

Do not describe an announced artifact as reproducible.

### 17. Run the semantic teach-back

Using only the draft, answer all seven Paper Essence Contract questions.

Do not consult the paper during this comprehension pass.

For each answer:

* cite the supporting draft section;
* classify it as `clear`, `partial`, or `unclear`;
* identify missing conceptual links;
* identify places where the reader would need the original paper to reconstruct the argument.

Revise every `partial` or `unclear` answer.

Repeat the teach-back once.

The teach-back should test whether the article preserves the argument, not merely whether it contains the right keywords.

### 18. Run the conceptual fidelity audit

Before publication, test the draft against the internal terminology and ontology map.

Verify:

* every central term retains its original conceptual type;
* parent/child taxonomy relationships are correct;
* profiles are not confused with anomalies;
* mechanisms are not confused with capabilities;
* assumptions are not presented as findings;
* conjectures are not presented as proofs;
* metrics are not presented as goals;
* evaluation categories are not presented as architectural components;
* author-defined stages are distinguished from Bloss0m-created sequences;
* abstraction levels remain visible when they matter to the conclusion.

For every renamed concept, verify that the simplified wording preserves the original semantics.

Any central conceptual collapse is a publication blocker.

### 19. Run the synthesis boundary audit

Search the article for:

* checklists;
* design rules;
* implementation sequences;
* architecture recommendations;
* production patterns;
* adoption advice;
* new diagrams;
* new taxonomies.

For each item, determine whether it is:

* directly authored in the paper;
* directly derived;
* Bloss0m synthesis.

If it is Bloss0m synthesis, label it visibly at first introduction.

The article should never make a reader falsely attribute a Bloss0m-created framework to the paper authors.

### 20. Run the claim-strength audit

Search for strong language such as:

* proves;
* guarantees;
* always;
* never;
* impossible;
* requires;
* must;
* sufficient;
* necessary;
* exactly;
* production-ready;
* superior;
* solves.

Verify each usage against the primary source.

Also inspect translated claims to ensure the English and Traditional Chinese versions have equivalent logical strength.

A bilingual translation must not accidentally turn:

> may help

into:

> will improve

or:

> under this model

into:

> in real systems.

### 21. Update Paper Radar only after validation

Update the Paper Radar brief and ledger only after:

* both language files exist;
* conceptual fidelity passes;
* body figures exist or an explicit no-figure exception is documented;
* the local Evidence Atlas cover exists for new readings;
* artifact status is verified;
* strict validation passes.

Preserve:

* stable ID;
* canonical source;
* source version history;
* approval state.

Add a recheck trigger for:

* preprints;
* active submissions;
* incomplete artifacts;
* pending checkpoints;
* missing datasets;
* announced but unavailable code;
* expected camera-ready revisions.

### 22. Run all publication validation

Run:

```bash
node skills/publish-bilingual-paper-reading/scripts/audit-paper-figures.mjs --strict --min-body-figures 3 <basename>
node skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs --strict <basename>
node skills/publish-bilingual-paper-reading/scripts/audit-paper-comprehension.mjs --strict <basename>
npm run check:reading-quality
npm run check:i18n
npm run check:paper-radar
npm run build
```

Treat strict failures involving:

* figure integrity;
* source coverage;
* comprehension;
* conceptual fidelity;
* bilingual parity;
* detailed-note floor;
* metadata;
* broken routes;
* artifact claims;

as blockers.

Do not downgrade a strict failure into a warning merely to publish.

## Argument fidelity checklist

Before final handoff, verify that a reader could answer:

1. What exact problem does the paper address?
2. What was insufficient before this work?
3. What is the paper's actual contribution?
4. What conceptual or formal objects does the argument depend on?
5. What are the abstraction levels?
6. What assumptions does the conclusion require?
7. What mechanism connects the starting point to the result?
8. What evidence supports each major claim?
9. Which conclusions are empirical, theoretical, conjectural, or interpretive?
10. What does the paper explicitly not establish?
11. Which parts of the article are Bloss0m engineering synthesis?
12. What would break if one of the paper's assumptions were removed?

If several of these cannot be answered from the article alone, the reading is not comprehension-complete.

## Editorial compression rules

A deep reading may be detailed, but detail should increase understanding rather than article mass.

Avoid repeating the same thesis across:

* TL;DR;
* ninety-second map;
* Paper Essence summary;
* section introductions;
* section conclusions;
* callouts;
* final memory points.

Each repetition must perform a new teaching function.

Prefer:

```text
orientation
→ model
→ mechanism
→ evidence
→ boundary
→ engineering consequence
```

over:

```text
summary
→ longer summary
→ another summary
→ detailed content
→ summary again
```

When the article grows substantially longer than the source paper, verify that the additional length is caused by teaching, evidence interpretation, or engineering context rather than repetition.

## Guardrails

* Never invent a baseline, metric, ablation, limitation, citation, figure result, theorem, assumption, code release, dataset detail, or artifact state.
* Never call an artifact released or reproducible solely because the abstract, paper, repository README, or project page says so. Verify the direct endpoint and describe access restrictions.
* Never imply peer review when the source is only an arXiv preprint, technical report, workshop submission, or active submission.
* Never treat benchmark improvement as production superiority without checking scope, cost, evaluation design, and external validity.
* Never treat absence of evidence as evidence of absence.
* Never transform a paper-specific observation into a universal industry claim without separate evidence.
* Never present a taxonomy item as another conceptual type for narrative convenience.
* Preserve the paper's conceptual ontology. Do not collapse or rename a taxonomy, anomaly class, capability, profile, mechanism, assumption, guarantee, theorem, operation property, or evaluation category into another category.
* Preserve claim strength and scope. Do not strengthen conditional, scoped, empirical, approximate, or conjectural claims into universal, necessary, sufficient, proven, or impossible claims unless the paper explicitly supports that wording.
* Any framework, checklist, architecture, sequence, taxonomy, design rule, or recommendation synthesized by Bloss0m but not explicitly proposed by the authors must be visibly labeled as Bloss0m synthesis or engineering interpretation at first introduction.
* For theoretical, systems, taxonomy, and conceptual papers, preserve the formal or conceptual scaffold: abstraction levels, entities, assumptions, relations, invariants, capability requirements, guarantees, and boundary arguments.
* A reader should be able to reconstruct the main argument structure from the article alone.
* Prefer the paper's canonical example when teaching a formal concept. When substituting an original engineering example, verify that it isolates the same mechanism and does not introduce additional failure modes.
* Do not convert a missing general solution into an impossibility theorem.
* Do not convert a conjecture into a proof.
* Do not convert a sufficient condition into a necessary condition.
* Do not convert an implementation hint into a semantic guarantee.
* Do not convert API metadata into runtime behavior unless independently verified.
* Do not convert correlation into causation.
* Do not convert benchmark scope into production scope.
* Define symbols before using them.
* Keep equations in KaTeX syntax.
* Preserve important abstraction boundaries even when simplifying notation.
* Explain why notation exists before presenting dense notation when possible.
* Keep both languages independently readable.
* Do not publish a reduced English summary.
* Maintain equivalent uncertainty and claim strength across languages.
* Keep new paper covers in the Evidence Atlas system.
* Do not add Huahua, fake dashboards, readable decorative text, invented benchmark numbers, or unverified claims to the cover.
* Do not treat the Evidence Atlas cover as evidence from the paper.
* Do not silently omit reusable material paper figures.
* Do not silently replace an unavailable paper figure with a recreated image that could be mistaken for original evidence.
* Avoid redundant teaching layers. The ninety-second map, core explanation, section recap, and final memory points must serve distinct purposes rather than repeatedly paraphrasing the same thesis.
* Do not auto-merge, push, or publish.
* Hand off a validated local pair or Draft PR only when requested.

## Preferred article outcome

A successful Bloss0m paper reading should leave a technically capable reader able to say:

> I understand what problem the authors are solving, how they model it, why the mechanism or argument works, what evidence supports it, what assumptions and boundaries remain, and which engineering conclusions came from the authors versus Bloss0m.

The article should reduce the cost of reading the paper without replacing the paper with a simpler but materially different story.
