# Huahua cover-art standard

## Inputs and output

- Character reference: `public/brand/bloom-hero.webp`
- Output: `public/blog/<number>-<slug>/title_image.webp`
- Canvas: 1200 × 750, 16:10 landscape
- Generate one coherent editorial scene, not a collage or dashboard screenshot.

Inspect the reference image before generation. Preserve Huahua as the same recognizable calico cat: cream-white fur, warm orange and dark-brown patches, round gentle face, curious and calm expression.

## Visual language

- Warm cream background, copper and caramel accents, deep ink linework, optional muted navy or sage secondary color.
- Refined flat editorial illustration with subtle paper texture and soft ambient light.
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

Art direction: warm cream background, copper and caramel accents, deep ink linework, [optional secondary color], refined flat editorial illustration, subtle paper texture, soft ambient light. Compose slightly right of center and leave clean space in the upper left and lower right for website overlays. One cat only. No text, letters, numbers, watermark, logo, humans, extra animals, cluttered dashboard, neon cyberpunk, photorealism, or 3D toy style.
```

## Topic metaphors

- Agent systems: goal marker, toolbox, state notebook, evaluation shield, observable workflow path.
- RAG: document garden, search lantern, reranking tray, verified evidence card, permission hedge.
- Platform engineering: blueprint, deployment blocks, observability gauge, guarded runtime path.
- Security and governance: identity badge, permission gate, audit trail, human approval checkpoint.
- Model or industry trend: telescope, signal constellation, routing paths, scale balancing quality, latency, and cost.
- Research paper: reading desk, layered diagrams, evidence cards, magnifying glass, one highlighted limitation.

## Acceptance checks

- Huahua matches the reference character and is the only cat.
- The image communicates the article topic without a caption.
- No accidental text or malformed UI appears.
- Important details survive a 480 × 300 preview.
- The composition leaves room for site overlays.
- The local WebP exists before adding the frontmatter image path.
