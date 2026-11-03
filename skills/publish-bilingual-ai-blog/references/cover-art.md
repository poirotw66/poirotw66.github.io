# Huahua cover-art standard

## Inputs and output

- Character reference: `public/brand/bloom-hero.webp`
- Output: `public/blog/<number>-<slug>/title_image.webp`
- Canvas: 1200 × 750, 16:10 landscape
- Generate one coherent editorial scene, not a collage or dashboard screenshot.
- Use the built-in `image_gen` tool. SVG, Canvas, programmatic compositions and rasterized geometric templates are not cover-generation substitutes. If unavailable, report the blocker instead of switching to a paid CLI/API or lower-quality placeholder.
- Before generation, actually view the character reference and at least two representative published or approved Blog covers (for example, Blog 140/146 or the approved AI Cosmos watercolor). Filenames and prompts alone are not visual references.
- After generation, cropping, resizing, format conversion and compression are allowed; preserve the generated original and keep the key composition intact.

Inspect the reference image before generation. Preserve Huahua as the same recognizable calico cat: cream-white fur, warm orange and dark-brown patches, round gentle face, curious and calm expression.

## Visual language

- Warm cream background, copper and caramel accents, deep ink linework, optional muted navy or sage secondary color.
- Refined watercolor-and-ink editorial illustration with fine fur strokes, paper/pigment texture, soft natural light and a coherent scene with layered depth.
- Give each topic a distinct action and composition. Preserve Huahua's identity without reusing one fixed pose and swapping props.
- Keep Huahua large enough to remain recognizable in a 480 × 300 card crop.
- Place the focal scene slightly right of center. Leave clean space at the upper left and lower right for existing site overlays.
- Use at most three large topic props. Prefer one visual metaphor over many tiny interface elements.
- Do not generate text, letters, numbers, article titles, logos, watermarks, fake UI, or code.
- Avoid photorealism, neon cyberpunk, generic corporate stock art, crowded dashboards, extra cats, distorted paws, and 3D plastic-toy rendering.

## Prompt construction

Start from this pattern and replace the scene with the article's actual editorial angle:

```text
Create a 1200 × 750 landscape editorial cover for Bloss0m, a premium enterprise AI engineering publication. Use the attached image only to preserve Huahua, the same calico cat mascot: cream-white fur, warm orange and dark-brown patches, round gentle face, calm curious expression.

Scene: [one concrete visual metaphor for the article's central technical decision]. Huahua is [one clear action]. Include [up to three large props representing the key architecture, evidence, or trade-off]. The scene must communicate [central engineering meaning] without readable interfaces or text.

Art direction: warm cream background, copper and caramel accents, deep ink linework, [optional secondary color], refined watercolor-and-ink illustration, fine fur strokes, visible paper texture, soft natural light and layered scene depth. Compose slightly right of center and leave clean space in the upper left and lower right for website overlays. One cat only. No text, letters, numbers, watermark, logo, humans, extra animals, cluttered dashboard, neon cyberpunk, photorealism, or 3D toy style.
```

## Topic metaphors

- Agent systems: goal marker, toolbox, state notebook, evaluation shield, observable workflow path.
- RAG: document garden, search lantern, reranking tray, verified evidence card, permission hedge.
- Platform engineering: blueprint, deployment blocks, observability gauge, guarded runtime path.
- Security and governance: identity badge, permission gate, audit trail, human approval checkpoint.
- Model or industry trend: telescope, signal constellation, routing paths, scale balancing quality, latency, and cost.
- Research paper: reading desk, layered diagrams, evidence cards, magnifying glass, one highlighted limitation.

## Acceptance checks

- Actually view the full generated image and a 480 × 300 card crop beside the representative covers. Compare texture, depth, topic, character identity and action/composition differences; reject a visible quality regression even when dimensions, loading and CI pass.
- Inspect the actual desktop/mobile image slots when integrating a cover; card, hero and share crops may differ. Report any lost key cue instead of assuming the source canvas proves every crop.
- Huahua matches the reference character and is the only cat.
- The image communicates the article topic without a caption.
- No accidental text or malformed UI appears.
- Important details survive a 480 × 300 preview.
- The composition leaves room for site overlays.
- The local WebP exists before adding the frontmatter image path.
