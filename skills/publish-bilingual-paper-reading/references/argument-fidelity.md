# Argument and evidence fidelity

Read before source analysis, substantial rewriting, or an evidence/conceptual audit. Apply the paper-type sections relevant to the source. Keep these maps in working notes, not as task-execution commentary in the article.

## Build the argument and evidence map before prose

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

## Build a terminology and conceptual ontology map

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

## Identify author contribution versus Bloss0m synthesis

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

## Prefer canonical examples for formal concepts

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

## Anchor substantive claims

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

## Preserve claim strength and scope

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

## Final fidelity review

Check the final draft against the argument and terminology maps. Verify conceptual types, parent/child relations, assumptions, guarantees, and author-defined versus editorial stages. Search strong claims (proves, guarantees, always, never, impossible, must, necessary, sufficient, production-ready) and verify their scope in both languages. Any central conceptual collapse, unsupported strengthening, or unlabeled Bloss0m framework blocks publication.
