---
title: "ABC-LLM: How Can AI Edit a Passage and Preserve the Rest of the Score?"
description: "How ABC states, operation scopes, and preservation conditions turn music generation into incremental editing—and what the evaluation actually establishes."
pubDate: 2026-10-29
updatedDate: 2026-10-29
essence:
  - ["Problem", "Revise one persistent score while preserving material outside the authorized change."]
  - ["Core idea", "Adapt an instruction model with before-and-after supervision over ABC state, operation scope and preservation requirements."]
  - ["Evidence", "In fixed IrishMan operation tests, the authors report improved admission and conditional compliance, not musical-quality ratings."]
  - ["Boundary", "Evidence is limited to in-domain lead sheets and chords; musician studies and confirmed paper-specific asset versions remain missing."]
tldr:
  - "Each returned score becomes the next state; operations specify both authorized changes and required preservation."
  - "LoRA improves author-reported admission and conditional compliance within the tested IrishMan operations."
audience:
  - "Engineers interested in controllable creative tools and symbolic music"
tags: ["Paper Reading", "Research"]
topics:
  - "generative-media-interaction"
image: "/paperReading/105-persistent-symbolic-music-editing/title_image.webp"
field: "AI Music"
difficulty: "intermediate"
paperType: "mixed"
showToc: true
paper:
  title: "From One-Shot Generation to Incremental Music Composition: Adapting a General-Purpose Instruction LLM for Persistent Symbolic Editing"
  authors:
    - "André Ricardo Ducca Fernandes"
    - "Jean-Pierre Briot"
    - "Simone Diniz Junqueira Barbosa"
    - "Hélio Côrtes Vieira Lopes"
  year: 2026
  venue: "arXiv:2609.34994v1, preprint, 2026-09-28"
  links:
    pdf: "https://arxiv.org/pdf/2609.34994v1"
    arxiv: "https://arxiv.org/abs/2609.34994v1"
---

When a composer asks for chords, the melody usually needs to survive. When they request a replacement for bars three through five, the rest of the piece should remain their existing work. An assistant that produces a different piece after every request makes earlier decisions difficult to accumulate. This September 2026 preprint asks whether a general-purpose instruction model can learn successive, differentiated edits over one inspectable symbolic score. Its base-versus-adapted comparison tests that interaction contract, rather than which model produces better-sounding music. [Sections 1 and 6](https://arxiv.org/html/2609.34994v1#S1)

## Start with a score that can be edited again

ABC is a plain-text notation. The paper's minimal Figure 3 example uses these notes and chord annotations:

```abc
X:1
L:1/4
M:4/4
K:C
"CM7" E F G A | "FM7" A G F E |
```

`L:1/4` sets the default duration, `M:4/4` the meter, and `K:C` the key. Bar lines separate measures; quoted strings are chord symbols. The representation primarily describes a melody with optional chord annotations, rather than a fully arranged polyphonic score. [Section 3.2, Figure 3](https://arxiv.org/html/2609.34994v1#S3.F3)

![The paper's two-bar score rendering](/paperReading/105-persistent-symbolic-music-editing/lead_sheet_score.png)
Figure 3, Section 3.2: conventional notation for the ABC above; melody and chord annotations can be inspected separately within one representation. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S3.F3), CC BY 4.0; original image, unchanged.

To understand Add chords, imagine an input containing only `E F G A | A G F E |`, followed by an output that inserts the quoted chords without changing the notes. This is a Bloss0m teaching scenario extracted from the paper's example, not a recorded model response. Changing E to D would violate melody preservation even if the output parsed correctly and sounded acceptable.

The authors also select an evaluated four-turn dialogue, `song_id=44`: create an A Dorian melody in 6/8; add Am and G chords; inpaint bars 3–5; then transpose to C Dorian. Each result becomes the next input. These are successive versions of one artifact, rather than four unrelated samples. [Section 4.4, Table 2](https://arxiv.org/html/2609.34994v1#S4.T2)

![The paper's four-turn persistent editing illustration](/paperReading/105-persistent-symbolic-music-editing/persistent_dialogue_example.png)
Figure 8, Section 4.4: the schematic corresponds to Table 2's operation semantics. It illustrates continuity and does not independently establish success across all dialogues. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S4.F8), CC BY 4.0; original image, unchanged.

## How state, scope, and preservation fit together

The authors denote the current score by $s_{t-1}$, the user request by $u_t$, the resolved operation by $o_t$, and its transformation scope by $r_t$. Equation 1 expresses the next state as:

$$s_t=F_{o_t}(s_{t-1},u_t,r_t).$$

This is an interaction contract, not a theorem guaranteeing correct model behavior. An operation determines both the authorized transformation and the relationships that must survive. Create a melody and Create a melody with chords initialize or replace the artifact. Add chords, Inpainting, and Transpose edit its current state. In this implementation, chord addition and transposition affect the whole artifact; only inpainting takes a selected bar span. “Transpose only bars five through eight” is consequently a future extension, not a tested capability. [Sections 3.1 and 7](https://arxiv.org/html/2609.34994v1#S3.SS1)

Chord addition must preserve melody. Inpainting must preserve material outside the target. Transposition changes tonal content, including chord symbols, while preserving structural and rhythmic relations. Parsing alone cannot establish any of those properties: syntax admission allows the response to reach an operation-specific checker, which then compares the required changes and invariants.

![The paper's operation-aware artifact transition](/paperReading/105-persistent-symbolic-music-editing/artifact_state_transition.svg)
Figure 2, Section 3.1: an operation constrains both change and preservation, and the revised artifact becomes the next state. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S3.F2), CC BY 4.0; original image, unchanged.

The paper builds on existing editing work. Its related-work discussion identifies local rewriting in DeepBach and Coconet, dedicated edit mechanisms in BeatEdit, and persistent composition through a hybrid LLM/symbolic architecture in MusiChat. This paper's design point is to learn operation semantics through before-and-after supervision of a general-purpose instruction model. Its qualitative design-space projections are not rankings, and the experiment does not establish superiority over those systems under a common budget. [Section 2](https://arxiv.org/html/2609.34994v1#S2)

## Training teaches before-and-after relationships

The source repertoire is IrishMan: 216,284 Irish traditional tunes, with a reported split of 214,122 training tunes and 2,162 validation tunes. Dialogues are constructed from training material; held-out material supplies evaluation references. Six scenarios combine melody-only and chord-bearing artifacts with model-created or user-provided starting material. [Sections 3.2–3.3](https://arxiv.org/html/2609.34994v1#S3.SS3)

Chord addition pairs unannotated melodies with annotated counterparts. Inpainting replaces one to four parsed bars and copies the remainder. Transposition applies a sampled interval to the current artifact, including existing chords. Natural-language variation comes from 856 template records across 19 internal prompt types. The constructed dataset contains 496,038 JSONL records, but only 495,853 contain at least one supervised operation. There are 3,241,509 user–assistant operation instances, averaging 6.535 operations per record, with 1–20 in nonempty records. Tunes, dialogue records, and operation instances are different counting units.

The checkpoint is Llama 3.1 8B Instruct. LoRA freezes its base weights and learns low-rank updates from before-and-after supervision. The adapter is merged into the base model for evaluation; the resulting model is provisionally named ABC-LLM. This does not introduce a deterministic editing engine at inference time. [Section 3.4](https://arxiv.org/html/2609.34994v1#S3.SS4)

## First ask whether a response can be checked

Each model receives 500 dialogues. The 250 melody-only dialogues produce generation, inpainting, and transposition responses. Another 250 produce melody generation before harmonization, chord addition, inpainting with chords, and transposition with chords. This gives seven output states, 250 attempts each, or 1,750 attempts per model. The trained Create a melody with chords operation is not a separate evaluated state. [Section 3.5](https://arxiv.org/html/2609.34994v1#S3.SS5)

The authors report extractable ABC in 1,234 base-model attempts, of which 514 reach an operation checker. For the adapted model those counts are 1,750 and 1,739. Admission therefore rises from 29.37% to 99.37% of all attempts. Conditional compliance rises from 0.7205 to 0.9798, but its population comprises each model's admitted responses. It cannot be rewritten as “97.98% of all 1,750 attempts perfectly completed the operation,” or as a human quality rating. [Section 4.1, Table 1](https://arxiv.org/html/2609.34994v1#S4.T1)

![Original per-state admission and compliance figure](/paperReading/105-persistent-symbolic-music-editing/per_operation_reliability.svg)
Figure 6, Section 4.1: the seven-state decomposition of Table 1. The base model retains some conditional transposition competence while losing many attempts before checking. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S4.F6), CC BY 4.0; original image, unchanged.

Diagnostics make the remaining failures concrete. The adapted model preserves 4,639/4,644 compared melody bars during chord addition, while 224/249 admitted responses add expected quoted chord symbols. Inpainting preserves 8,886/9,043 non-target bars and changes 1,168/1,230 target bars. Transposition matches the requested key in 492/496 admitted responses. These checks use different units: preserved-bar proportions are not complete-dialogue success rates. Changes outside the inpainting target also show why a high average score is not a hard preservation guarantee. [Section 4.1](https://arxiv.org/html/2609.34994v1#S4.SS1)

## Musical features and corpus overlap answer separate questions

Only 14/1,750 base-model outputs pass strict musical-feature eligibility. The adapted model retains 1,548 before scenario equalization and 1,471 afterward. All 63 planned comparisons—nine pitch/rhythm features across seven states—can therefore be calculated for the adapted model, while the base population is too sparse for equivalent characterization. This is not a matched-population demonstration of better music. [Section 4.2](https://arxiv.org/html/2609.34994v1#S4.SS2)

![Original population retention funnel](/paperReading/105-persistent-symbolic-music-editing/population_funnel.svg)
Figure 7, Sections 4.1–4.2: populations are expressed relative to 1,750 attempts per model. Strict feature eligibility precedes scenario equalization. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S4.F7), CC BY 4.0; original image, unchanged.

Feature analysis uses pairwise Euclidean distances, KLD, and overlap area (OA). Distances are nonnegative, but a symmetric Gaussian KDE can place density below zero; the authors apply Schuster's mirror-image boundary correction. Chord-bearing states also use the chord-tone/non-chord-tone ratio, CTnCTR. Pitch- and chord-in-scale comparisons use Mann–Whitney tests with Holm correction. Both reference and candidate medians are 1.0 in all ten in-scale comparisons, indicating substantial ceiling effects. Distributional agreement still does not establish whether listeners enjoy a piece. [Sections 3.5.2 and 4.2](https://arxiv.org/html/2609.34994v1#S3.SS5.SSS2)

The memorization analysis instead uses tonic-relative LCS encoding, retaining durations and event order while making consistent global transposition irrelevant. Candidate-to-training overlap is compared with held-out validation-to-training overlap. Under the strict `copy > 0.8` flag, all seven state rates fall below corresponding held-out baselines: 15.60% for chord-bearing references and 27.60% for melody-only references. Add chords has an unadjusted $p=0.0072$, but its flagged rate is lower, at 14.47%; the other six $p$ values range from 0.0622 to 0.5852. The authors find no systematic increase in high overlap under this protocol. Neither low overlap nor nonsignificance establishes absence of memorization, and this is not a plagiarism detector. [Sections 3.5.3 and 4.3](https://arxiv.org/html/2609.34994v1#S4.SS3)

## The prototype supplies an interface path, not musician evidence

The experimental NONOTO extension lets a user inspect a score, request an operation in natural language, receive ABC, view notation, and audition the result. It connects to existing playback and MIDI facilities. Figure 9 illustrates integration rather than a professional composition environment or an HCI evaluation. [Section 5](https://arxiv.org/html/2609.34994v1#S5)

![Extended NONOTO prototype](/paperReading/105-persistent-symbolic-music-editing/nonoto_prototype.png)
Figure 9, Section 5: the natural-language/ABC prototype. The screenshot explicitly identifies a local ABC LLM mock; it does not establish a live model integration, usability, or co-creative value. Source: [Fernandes et al., v1](https://arxiv.org/html/2609.34994v1#S5.F9), CC BY 4.0; original image, unchanged.

As of 2026-10-29, the public [upstream NONOTO repository](https://github.com/SonyCSLParis/music-inpainting-ts) and [TunesFormer repository](https://github.com/sander-wood/tunesformer) provide background resources. They do not substitute for this paper's exact adapted checkpoint, generated dialogues, or interface extension. Downloadable versions of those paper-specific assets remain unconfirmed. Results discussed here are author-reported; there is no independent model-evaluation rerun behind this article.

The evidence is bounded by predominantly monophonic melody with chord annotations, the IrishMan domain, template-based requests, and fixed operation scopes. It includes neither cross-genre validation nor musician listening/control studies, nor a common-protocol comparison with dedicated editors. Readable training settings do not establish cost, latency, recovery from invalid intermediate states, or stability in longer dialogues. [Sections 6–7](https://arxiv.org/html/2609.34994v1#S6)

## Bloss0m engineering judgment: make preservation explicit

The authors support learnability of an operation contract under the tested conditions. Bloss0m's further interpretation is to specify artifact state, authorized scope, and preservation conditions before choosing which steps need generation. This gives “change only this passage” a concrete before-and-after reference. It remains an engineering interpretation, without cross-media validation in this study.

For exact transposition alone, the authors themselves prefer a deterministic symbolic algorithm. The interesting design point arises when heterogeneous operations share a natural-language interface and an evolving artifact. Adding difference views, scope checks, and verification before accepting changes is Bloss0m's recommendation, not an evaluated reliability mechanism from the paper.

> **Huahua's engineering note**
>
> Preserving the melody is a checkable requirement. Preserving musical intent also needs musicians' judgment. The gap between them is precisely what later user studies must investigate.

## Primary sources

- [Full paper v1: method, two tables, and nine figures](https://arxiv.org/html/2609.34994v1)
- [arXiv version and author record](https://arxiv.org/abs/2609.34994v1)
- [Upstream NONOTO interface repository](https://github.com/SonyCSLParis/music-inpainting-ts)
- [TunesFormer and IrishMan background resources](https://github.com/sander-wood/tunesformer)
