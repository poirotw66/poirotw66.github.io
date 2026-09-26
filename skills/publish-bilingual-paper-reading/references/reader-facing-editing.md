# Reader-facing paper editing

Use this pass when drafting, repairing editorial voice, or auditing readability. The intended reader is a technically capable person who wants to understand the paper without first reading it. Understanding the central argument does not imply the article replaces the full paper for reproduction or reviewer-level critique.

## Publish conclusions of verification, not its execution history

For a sentence about the writing or checking process, ask whether it changes the reader's understanding, trust in a result, or ability to use an artifact. Retain that consequence and its source; move operational detail to working notes or the final handoff. Do not create a new audit file unless the workflow or user needs one.

| Information | Public article | Working notes or final handoff |
| --- | --- | --- |
| Paper identity | Exact version, date, and publication status in a short note | Pages, sections, and files inspected |
| Evidence | Claim, relevant setting, interpretation, and source anchor | Claim-check checklist and validation output |
| Figures | Number, teaching purpose, source, reuse rights, and adaptation status | Inventory, count exceptions, download attempts |
| Artifacts | Dated access state, material gates or missing components, usable links | API/browser diagnostics, fallback requests, retries |
| Reproduction | Whether results are author-reported, partially checked, or independently rerun, with relevant scope | Installation/download command history and unexecuted steps |

If a transient tool failure leaves availability unresolved, publish the uncertainty. If another verified route resolves it, publish the established state. A failed request alone does not establish that an artifact is absent.

## Shape the explanation around a paper story

Give the opening a connected account of the prior problem, the authors' changed question or idea, how they investigated it, the central finding, and its significance. This can be a short paragraph or integrated into the ninety-second map. It is not an additional abstract or a fixed word-count requirement.

Then help the reader understand the concepts and mechanism, interpret the evidence, and judge practical consequences and limits. Preserve definitions, method comparisons, canonical examples, and a faithful worked example. Compress repeated administration and caveats before compressing the explanation that makes the paper understandable.

Keep claim-local qualifications such as metric, dataset, assumption, relative-versus-absolute change, and author-reported status wherever omission would mislead. Discuss repeated general external-validity concerns together in the limitations section. A limitation may need to appear twice when a TL;DR, caption, or result can be read independently. Do not use a disclaimer quota or ban negative phrasing.

## Opening, headings, and attribution

Keep a concise source-version/status note near the opening, then continue the research story. Put detailed source and artifact discussion after the mechanism and main evidence by default. An early dedicated section is useful when a withdrawal, version change, or other source issue materially changes interpretation; provenance alone does not require one.

Usually one or two short paragraphs can explain artifact availability, material license/access requirements, necessary services, and reproduction scope. Expand only for reader-relevant complexity, not to inventory checks. Preserve teaching examples and the evidence chain when pruning; do not impose a universal word quota.

Read the headings and table of contents on their own. They must not promise an ablation, causal explanation, proof, or reproduction that the body and source do not establish. A later disclaimer does not repair a misleading heading. For example, use “方法的失敗型態與成本陷阱 / Failure patterns and cost trade-offs” for diagnostic comparisons without an ablation study. Do not add unsupported evidence labels to satisfy an audit keyword.

For original recommendations, prefer “Bloss0m 工程判斷 / Bloss0m engineering judgment” in the heading. When a section combines author guidance with original recommendations, attribute the author guidance and label the transition to Bloss0m synthesis locally. Attribution elsewhere in the article does not automatically carry across a change of voice.

## Review the delivered version

During repair, review inherited prose as well as changed paragraphs. After the last edit, reopen both saved files and apply the gate to the whole body. Search can locate phrases such as “我核對了”, “我直接檢查”, “瀏覽器回傳”, or “未執行”, but assess their purpose in context. Merely changing “I verified” to “verification was performed” does not turn an execution log into editorial prose.

External feedback can refer to an older published page or another draft. Compare its quoted passages with the current files and identify the reviewed version before claiming a remaining defect or successful fix. Keep revision and validation details in the handoff.

If feedback reports duplicated TL;DR, audience, or TOC content, first distinguish duplication in the Markdown from duplication introduced by the page layout. Text extraction alone does not establish a visible or accessibility defect. When rendered-page investigation is in scope and available, inspect the affected viewport and accessibility state, including responsive or expandable variants. Report an unverified rendering concern as such; do not delete substantive article content or alter shared site components solely on extraction evidence.

## Bilingual editing examples

These are illustrative wording transformations, not verified claims about a particular paper. Substitute only facts supported by the current sources.

### Source and figure notes

Execution wording: “I checked the v1 HTML, PDF, Tables 1–3, and Figures 1–2. There is no third reusable figure, so I did not invent one.”

Reader-facing Traditional Chinese: 「本文依據 arXiv v1；Figure 1 與 Figure 2 引自原論文。」

Reader-facing English: “This reading follows arXiv v1; Figures 1 and 2 are reproduced from the paper.”

Keep the exact version date and link where known, and retain full attribution and license notes in the captions. Put figure-count exceptions in the audit invocation and handoff.

### Artifact access and reproduction

Execution wording: “I checked the repository, README, dataset card, and API. The browser returned an internal error, but the API worked. I did not install dependencies or download models.”

Reader-facing Traditional Chinese: 「截至查核日期，程式碼可公開取得，資料集須申請存取。本文未重跑完整 benchmark，實驗數據採用作者報告結果。」

Reader-facing English: “As of the checked date, the code is public and the dataset requires access approval. The full benchmark was not rerun for this article; the experimental results are those reported by the authors.”

Replace the date and access state with verified facts. If only static inspection or a limited smoke test was performed, distinguish that scope from reproducing the results. Keep a genuine missing component and its consequence visible.

Do not infer that the public artifacts are insufficient for independent reproduction merely because this article did not rerun the benchmark. Such a claim needs separate evidence of a material missing component or access barrier.

### Result qualifications

Reader-facing Traditional Chinese: 「在這組硬體與索引設定下，方法 A 的建索引吞吐量較高。這個結果支持它作為該情境的效率基準。」

Reader-facing English: “Under this hardware and index configuration, method A has higher indexing throughput. The result supports using it as an efficiency baseline for that setting.”

Discuss broader hardware, batching, and implementation sensitivity once in the limitations section. Preserve the measured setting beside the claim; do not turn a scoped finding into a universal recommendation.

## Editorial acceptance pass

Read each language independently, then check semantic parity:

1. Can a reader retell the problem, idea, investigation, finding, and significance as one connected story?
2. Can they follow a representative example and explain why the central evidence supports the conclusion?
3. Does each process-oriented sentence convey a reader-relevant fact, or should its useful consequence replace it?
4. Are material qualifications, figure provenance, source links, synthesis labels, and reproduction limits still visible after compression?
5. Have repeated general caveats been consolidated without hiding conditions essential to individual claims?
6. Do both languages carry the same teaching content, claim strength, and uncertainty in natural prose?
7. Do the opening and standalone headings accurately guide the reader, and is the transition from author recommendations to Bloss0m synthesis visible?
8. Was this pass performed on both complete saved bodies after the last edit, including inherited prose?

This pass implements the required reader-facing publication gate in `SKILL.md`. Task-execution commentary that fails that gate blocks a publication-ready handoff even when all automated checks pass. Repair failures and repeat the gate on the revised prose in both languages before calling the prose ready. Record review findings in the handoff; do not append this checklist to the article. Automated heading and keyword checks cannot establish editorial quality. Do not add token audit phrases to satisfy a checker or silently weaken a strict gate; investigate a structural failure and preserve both meaningful coverage and readable prose.
