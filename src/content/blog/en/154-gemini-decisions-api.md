---
title: "Gemini Decisions API: Routing AI Agents with Probabilities and Confidence"
description: "Explore Gemini Decision 1's three question types, a Python routing example, confidence thresholds, and multimodal limits."
pubDate: 2026-11-12
updatedDate: 2026-11-12
tldr:
  - "Decisions API evaluates yes/no, choice, and ordered scoring questions against shared multimodal input and returns probabilities and confidence."
  - "Questions are independent; application code must handle dependencies, thresholds, and subsequent actions."
  - "Google reports low latency and input-based pricing, but production use requires evaluation of quality, cost, and failure handling on real traffic."
audience:
  - "Engineers designing AI agents, support routing, and content evaluation workflows"
  - "Technical leads assessing model routing and automation risk"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Enterprise AI"]
kind: "article"
showToc: true
image: "/blog/154-gemini-decisions-api/title_image.webp"
---

When a support assistant receives a fault description and a device photo, it may first need a decision rather than a written response: Is this an IT support request? Which queue should receive it? How urgent is it? The application needs an answer it can use directly and a way to identify cases that need human review.

Google introduced the [Gemini Decisions API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) on November 11, 2026. Its `gemini-decision-1` model scores predefined outcomes. This article uses the announcement and [API documentation](https://aistudio.google.com/docs/decisions-api) to explain the interface and an illustrative, untested support-routing example. Performance figures are Google's reports, not independent measurements by this article.

> **Huahua in one sentence**
>
> Decisions API scores predefined outcomes and reports confidence; the application still decides what action to take.

## Which part of the workflow does it address?

An AI application can ask a generative model to read a message and produce JSON, then parse the classification in application code. That approach is flexible: a model can explain its reasoning, extract fields, or supply tool arguments. But a task that only chooses among known categories still waits for generated output and handles its format, and the generated text does not necessarily provide comparable probabilities for all options.

Decision 1 exposes a different interface. The developer defines candidate outcomes and criteria, and the model scores those options in one forward pass instead of generating a reply token by token. This is Google's description of the mechanism. Generating zero output text tokens does not mean zero compute, and it does not mean every decision can be reduced to one scoring pass. [Product announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)

One possible agent workflow looks like this:

```text
User request and attachments
    ↓
Decisions API: intent, scope, and candidate path
    ↓
Application: thresholds, authorization, and failures
    ↓
FAQ search / generated answer / human review / other controlled flow
```

This is an architectural option, not the only deployment Google guarantees. Selecting a path is one step: retrieving data, extracting fields, writing a response, and executing tools still require other components. For open-ended outcomes, external lookups, or multi-step reasoning, compare a generative model rather than forcing the task into a fixed set of options.

## Three question types over shared input

A request contains shared `input` and a set of `questions`, each evaluated independently against that input. Text, images, audio, video, and PDFs can be combined as input, while question instructions accept text only. The [documentation](https://aistudio.google.com/docs/decisions-api#question-types) defines three types:

| Type | Purpose | Main result |
| --- | --- | --- |
| `noul` | Check whether a statement holds | Probability of yes and confidence |
| `choice` | Pick from fixed options | Winning option, probabilities, and confidence |
| `score` | Rate an ordered rubric | Probability-weighted continuous score, per-level probabilities, and confidence |

For example, three severity levels have indices 0, 1, and 2. Given probabilities 0.2, 0.5, and 0.3, the score is `0 × 0.2 + 1 × 0.5 + 2 × 0.3 = 1.1`. This is an expected level, not a category named “1.1”. Describe each level distinctly and use a sensible linear scale.

Unlike a generative model asked to produce JSON, Decisions API directly scores closed outcomes. For summaries, extracting custom fields, explanations, or tool calls with arguments, use an interface that supports generation and tool calling instead. [Google's comparison](https://aistudio.google.com/docs/decisions-api#when-to-use) describes the distinction.

### Which decision fits each type?

Use `noul` for a specific yes/no condition, such as whether a photo shows damage to a device case. When “defect” could be confused with customer preference or shipping problems, optional `true_description` and `false_description` criteria can define the boundary. Keep each question focused: “Is it damaged and should we refund immediately?” combines a factual judgment with business policy.

Use `choice` to allocate a queue or select a next step from a bounded list. Describe when each option applies rather than providing only short labels such as `network` or `device`. Probabilities compare the specified candidates; they are not a guarantee about the open world. One option can still win when none fits, which is why an `other` option, an independent scope check, and review policy matter.

Use `score` for an ordered rubric, such as levels from “cosmetic only” to “work fully blocked with no workaround.” Google recommends 2–10 levels for most rubrics. Do not rely on the expected score alone: `[0, 1, 0]` and `[0.5, 0, 0.5]` both average to 1, but the first is concentrated in the middle while the second is split between extremes. If a discrete level is needed, Google's documentation recommends the highest-probability level rather than simply rounding the average. [Score documentation](https://aistudio.google.com/docs/decisions-api#score)

## Python example: check scope before routing

Create an API key in [Google AI Studio](https://aistudio.google.com/api-keys), set the `GEMINI_API_KEY` environment variable, and install version 3.2 or later of the `google-genai` SDK:

```bash
pip install -U google-genai
export GEMINI_API_KEY="YOUR_API_KEY"
```

The example asks three independent questions. The `0.85` thresholds are illustrative, not production recommendations. Running it requires a valid API key and model access.

```python
from google import genai

client = genai.Client(http_options={"api_version": "v1beta"})

result = client.decisions.create(
    model="gemini-decision-1",
    input="My laptop cannot connect to the office Wi-Fi since this morning.",
    questions={
        "in_scope": {
            "type": "noul",
            "instructions": "Is this an IT support request?",
        },
        "queue": {
            "type": "choice",
            "instructions": "Which IT support queue best fits this request?",
            "criteria": {
                "network": "Wi-Fi, connectivity, or network access problems.",
                "device": "Laptop hardware or operating system problems.",
                "account": "Sign-in, password, or account access problems.",
                "other": "An IT support issue outside the listed categories.",
            },
        },
        "urgency": {
            "type": "score",
            "instructions": "Rate the urgency described in the request.",
            "criteria": [
                "Low: a minor issue with a practical workaround.",
                "Medium: work is affected but not fully blocked.",
                "High: work is blocked or many people are affected.",
            ],
        },
    },
)

scope = result.answers["in_scope"]
queue = result.answers["queue"]
urgency = result.answers["urgency"]

# These thresholds are illustrative, not validated operating policy.
if scope.noul < 0.85 or queue.confidence < 0.85:
    print("Route to human review")
else:
    print(f"Suggested queue: {queue.choice}")
    print(f"Expected urgency level: {urgency.score:.2f}")
```

The code checks `scope.noul`, the probability that this is a support request, rather than just `scope.confidence`: confidence can also be high when the model is sure the answer is no. It sends uncertain or out-of-scope requests and low-confidence routing results to review. A production system also needs to handle API errors and missing values and decide how to use urgency according to risk. This example prints a suggestion; it does not create a ticket or call a tool.

### Reading a response

The following response is hypothetical and illustrates the structure; it is not an observed result from the preceding program:

```json
{
  "answers": {
    "in_scope": { "type": "noul", "noul": 0.96, "confidence": 0.96 },
    "queue": {
      "type": "choice",
      "choice": "network",
      "probabilities": { "network": 0.78, "device": 0.12, "account": 0.05, "other": 0.05 },
      "confidence": 0.78
    },
    "urgency": {
      "type": "score",
      "score": 1.1,
      "probabilities": { "0": 0.2, "1": 0.5, "2": 0.3 },
      "legend": { "0": "Low", "1": "Medium", "2": "High" },
      "confidence": 0.5
    }
  },
  "usage": { "total_input_tokens": 300, "total_output_tokens": 0, "total_tokens": 300 }
}
```

Under the example policy, the 0.96 scope probability passes, but the 0.78 queue confidence falls below the illustrative 0.85 threshold, so the request goes to review. Urgency's most likely level is 1, but it has probability 0.5 and the high level still has 0.3. When missing a severe case is costly, an average of 1.1 alone should not automatically lower priority. In a real response, `legend` maps back to the full supplied descriptions; `usage` can also contain token counts by modality. Inspect the actual response for your request.

### Confidence is not the same as the probability of yes

According to the [documentation](https://aistudio.google.com/docs/decisions-api#confidence), `noul` is the probability of yes and binary confidence is `max(noul, 1 - noul)`. Thus `noul = 0.03` and `confidence = 0.97` means a strong preference for no, not a 97% preference for yes. For a choice question, confidence corresponds to the highest-probability option.

The documentation specifies that `noul` values range from 0.01 to 0.99; for example, a condition of `noul > 0.99` will never match. Account for that range and the comparison operator when setting thresholds.

Google describes the values as calibrated probabilities, but 0.9 does not guarantee an individual answer is correct or establish 90% accuracy on your traffic. Check observed error rates across confidence bands using your own labeled examples, accounting for the different costs of false positives and false negatives.

## Keep workflow dependencies in application code

Questions cannot see one another's answers. In the example, `queue` does not know the outcome of `in_scope`, so the application must check scope before using the route. If a second question truly needs the first result, make a second request after reading it; alternatively, ask both together and ignore an answer that does not apply. [Google's multiple-question guidance](https://aistudio.google.com/docs/decisions-api#multiple-questions) explains this behavior.

A `choice` question picks a provided option even when none fits. Include a clear `other` option or a separate scope check, and send low-confidence cases to review. The model does not see question keys, so put the complete question in `instructions` and describe each option and rubric level. Leave precise comparisons of numbers and dates to deterministic code.

Option keys are sorted in UTF-8 byte order, and exact ties go to the first key in that order. Do not rely on the order in the JSON request or assume `none_of_the_above` will be last; a clearly described `other` is a better catch-all. [Choice specification](https://aistudio.google.com/docs/decisions-api#choice)

> **Huahua's engineering note**
>
> A confidence threshold is an operational choice. Measure coverage, errors by category, and review volume on real examples before choosing it. High confidence does not replace authorization checks or confirmation for consequential actions.

## Multimodal example: a support message and device photo

Shared input need not be a single string. This example sends ticket text and a local JPEG in one request, then asks a specific question about the photo. Its format follows the [official multimodal example](https://aistudio.google.com/docs/decisions-api#media). This code has not been exercised against the live API.

```python
import base64
from pathlib import Path
from google import genai

client = genai.Client(http_options={"api_version": "v1beta"})
photo = base64.b64encode(Path("device.jpg").read_bytes()).decode("utf-8")

result = client.decisions.create(
    model="gemini-decision-1",
    input=[
        {"type": "text", "text": "Photo attached to a laptop support request."},
        {"type": "image", "data": photo, "mime_type": "image/jpeg", "resolution": "high"},
    ],
    questions={
        "visible_damage": {
            "type": "noul",
            "instructions": "Does the photo show physical damage to the laptop?",
        },
    },
)
print(result.answers["visible_damage"].noul)
```

No visible damage does not establish that a device is working: angle, resolution, or obstruction can leave the evidence insufficient. Test blurred images, unrelated photos, different lighting, and conflicts between text and image. The documentation allows image and video resolution settings, but higher resolution increases token use; compare quality and cost on representative data.

Make sure the MIME type matches the actual file. The documented inline limit is 100 MB per request, or 50 MB for PDFs; each external HTTPS URL is limited to 15 MB. Adjacent text blocks are concatenated without automatic whitespace or newlines, so add separators explicitly. Serialize structured JSON as text and refer to its field paths in the question. [Input specification](https://aistudio.google.com/docs/decisions-api#input)

## What does Google say it is building?

The announcement describes several Google applications. These are product-team examples and claims, not benefits independently verified in this article:

- **Gemini Notebook model routing:** chooses a model tier and thinking level. Google reports up to 40% lower latency for everyday queries. Routing is separate from subsequent generation; the gain depends on routing errors and overhead.
- **Stitch rapid design experiment:** supports responsive product-flow wireframes and voice or tap edits before handing the design to the fuller workflow for refinement.
- **CC emoji reactions:** selects a reaction from more than 200 options, illustrating real-time choice over a large fixed set.
- **Search MCP tool safety layer:** detects adversarial behavior and content. A model-based check can be one layer of defense; it does not by itself establish tool safety.

All four examples define a usable set of outcomes before the surrounding system acts. A router can still send an easy question to an expensive model or a difficult one to an inadequate model. Evaluate end-to-end answer quality, latency, and cost together, not classification speed alone. [Google announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)

## Multimodal input, pricing, and boundaries

A request can contain up to 1,000 questions, with a **262,144-token** context shared by input and all questions. A `choice` supports 2–255 options and a `score` supports 2–255 levels. Media can be sent using a Files API URI, public or signed HTTPS URL, or inline base64; YouTube URLs and direct `gs://` URIs are unsupported. Image and video resolution can be adjusted to trade detail for token cost. See the [input and limits documentation](https://aistudio.google.com/docs/decisions-api#limits).

At publication, the interface is available through Gemini Developer API `v1beta`, with Python and JavaScript SDKs and REST, and supports only `gemini-decision-1`. Conversation history, thought, and tool-call blocks cannot be passed as input blocks; serialize the necessary conversation context as text. Flex and Priority inference are also unsupported. Google describes Google Cloud support as coming soon; check the documentation for current availability. [API limitations](https://aistudio.google.com/docs/decisions-api#limitations)

At publication, Google lists **$0.10 per million input tokens**, no output-token charge, and a free tier. Shared input is billed once within a request, while question instructions and criteria add input tokens. Input repeated across requests is billed again: context caching and the Batch API are currently unsupported. See the [announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) and [limitations](https://aistudio.google.com/docs/decisions-api#limitations); prices and quotas can change, so check the [current pricing](https://aistudio.google.com/docs/pricing#gemini-decision) before implementation.

Google reports **150–250 ms** end-to-end latency in its tests at up to 16K tokens, with nearly flat latency from 1 to 100 questions. It also reports that the API was nearly five times cheaper than Gemini 3.5 Flash-Lite across its shared benchmark suite. These are not guarantees for every request and do not establish the same latency for 1,000 questions or a full 256K context. Measure end-to-end time and total cost on your own inputs, network, and traffic.

### Calculate the workload, not just the unit price

Suppose shared input contains 10,000 tokens and instructions and criteria for three questions total another 600. At the announced rate, illustrative input cost is `(10,000 + 600) / 1,000,000 × $0.10 = $0.00106`. This is only a pricing example: it excludes later generative-model calls, networking, human review, and other system costs. Read actual token counts from `usage`. If the same input is sent in three separate requests with 200 question tokens each, the total becomes `3 × (10,000 + 200) = 30,600` tokens, or approximately $0.00306.

Combining independent questions can reduce repeated input, but dependency still determines the right workflow: if the second question must be constructed from the first answer, two requests may be necessary. A capacity limit is not an optimal batch size. Instructions and options also occupy context, so test quality and latency at different batch sizes.

## Start with offline evaluation

Collect labeled real-world examples, including multiple intents, missing information, out-of-scope requests, rare categories, and adversarial instructions. Compare against existing rules or a generative model. Measure errors by category, calibration across confidence bands, human-review volume, and the token cost of multimodal inputs. Then observe live traffic in a mode that records suggestions without taking action.

A safety filter can return HTTP 400 instead of answers; network errors, timeouts, and quota exhaustion also need explicit fallback paths. User input is untrusted and may try to influence classification. Check applicable data-processing terms before sending sensitive information. The model can help route requests, but it should not be the sole authorization or security boundary. See [Google's best practices](https://aistudio.google.com/docs/decisions-api#best-practices).

Turn the evaluation into four practical decisions:

1. **Data and labels:** have domain owners define categories, out-of-scope cases, and correct routing. Keep a test set separate from threshold tuning, including near-duplicate versions of the same case.
2. **Baselines:** compare existing rules, the current model, and Decisions API on the same cases, including calls, retries, subsequent generation, and review in end-to-end cost.
3. **Thresholds:** inspect confusion, error costs, and review volume by category. A higher threshold generally reduces automatic coverage; it does not guarantee that every rare category becomes safer. Verify that on held-out data.
4. **Monitoring and rollback:** record model and question versions, outcomes, and reviewer corrections while minimizing retained data. Watch for distribution changes, failures, and review backlogs, and provide a way to disable automatic routing.

For example, routing a login request to the network queue may cost an extra transfer; rating a major outage as low priority has a different consequence. Those errors should not share an unvalidated threshold by default. For refunds, deletion, or permission changes, option scores are signals alongside existing authorization and approval controls.

If you already have an [AI agent architecture](/en/blog/64-ai-agent-guide/), start with one routing decision that has clear options and can be checked by a person. Decide whether to automate only after validating the data, questions, and failure handling.
