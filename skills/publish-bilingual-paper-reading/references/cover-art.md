# Paper Reading Evidence Atlas cover standard

## Contract

- Apply this standard to every new Paper Reading cover and every explicitly requested replacement.
- Do not retroactively replace an existing cover during audit, repair, localization, or unrelated article work.
- Output `public/paperReading/<basename>/title_image.webp` at 1200 × 750 (16:10).
- Do not use Huahua, another mascot, a copied paper figure, or a screenshot as the cover.

## Editorial idea

Turn the article's evidence map into one original visual system. Show what kind of evidence changes the engineering decision: a benchmark matrix, evaluation path, retrieval landscape, failure split, capability map, or experimental comparison. The illustration is conceptual and must not imply measurements the paper did not report.

## Visual language

- Warm ivory paper background, deep navy structure, research blue fields, and one restrained copper accent.
- Quiet academic-publication tone with precise geometry, generous whitespace, subtle paper texture, and soft depth.
- Use one dominant evidence structure and at most three large supporting elements.
- Keep the focal structure slightly right of center and preserve clean space for site overlays.
- A series may use one consistent secondary accent, but the evidence structure must remain specific to the paper.
- No readable text, letters, numbers, formulas, axes labels, logos, watermarks, fake UI, neon cyberpunk, photorealistic laboratory scenes, or decorative data points presented as results.

## Prompt pattern

```text
Create a 1200 × 750 landscape Evidence Atlas cover for a rigorous AI engineering paper-reading publication.

Evidence structure: [one precise visual metaphor derived from the paper's evidence map]. Show [the main comparison, failure split, capability map, or evaluation path] using one dominant structure and at most three large supporting elements. The image should communicate [the bounded engineering conclusion] without claiming unreported measurements.

Art direction: warm ivory paper background, deep navy geometry, research blue fields, one restrained copper accent, precise editorial illustration, subtle paper texture, soft depth, generous whitespace. Compose slightly right of center and leave clean space in the upper left and lower right. No mascot, cat, humans, readable text, letters, numbers, formulas, chart labels, logo, watermark, fake UI, neon cyberpunk, or photorealism.
```

## Acceptance checks

- The cover visualizes an evidence relationship, not merely the paper topic.
- The implied relationship is supported by the paper and does not invent a result.
- No mascot or Huahua appears.
- No readable text, fake chart labels, malformed UI, or copied paper figure appears.
- The main structure remains legible at a 480 × 300 card crop.
- The local WebP exists before either language frontmatter references it.
