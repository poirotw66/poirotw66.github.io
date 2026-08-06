# Projects Working Artifact cover standard

## Contract

- Apply this standard to every new Projects cover and every explicitly requested replacement.
- Keep existing covers unchanged unless the user names them for replacement.
- Output `public/projects/<slug>/title_image.webp` at 1200 × 750 (16:10).
- Do not use Huahua, another mascot, or the Blog cover visual system.

## Evidence hierarchy

Choose the first usable source:

1. A real product screen, generated document, dataset view, physical result, or other project output.
2. A real workflow capture or architecture diagram grounded in the implementation.
3. An original Working Artifact illustration that accurately represents the implemented components.

Never replace missing evidence with a fabricated dashboard. If a real screenshot is visually weak, frame it as an artifact inside an editorial composition without altering its material content.

## Composition modes

### Case study

Use for a deployed or operational project with real evidence. Make the verified result or interface the dominant object and use architecture only as supporting context.

### Engineering prototype

Use for a working system whose architecture is stronger than its UI. Show one tangible pipeline, control plane, document flow, or model-runtime artifact with clear input-to-outcome structure.

### Creative experiment

Use for Lab or exploratory work. Allow a more expressive material metaphor, but keep one recognizable output or mechanism tied to the actual project.

## Visual language

- Deep navy or warm technical gray base with copper, muted sage, or restrained electric blue accents.
- Blueprint precision, modular depth, and one dominant engineered object.
- Use up to three supporting modules; avoid sprawling system maps at card size.
- Preserve whitespace for site overlays and keep the artifact recognizable in a 480 × 300 crop.
- No mascot, cat, humans, fake UI, fake code, readable labels, logos, watermarks, generic corporate stock scene, glowing brain, neon cyberpunk overload, or decorative components not present in the project.

## Generated-illustration prompt pattern

```text
Create a 1200 × 750 landscape Working Artifact cover for an engineering project portfolio.

Artifact claim: [one factual sentence describing what the project built]. Show [one dominant implemented system, workflow, or output] with [up to three verified supporting modules]. The visual must communicate [the concrete input-to-outcome transformation] without inventing an interface, metric, component, or production claim.

Art direction: deep navy or warm technical gray background, copper and muted sage accents with restrained electric blue only where functional, precise blueprint-inspired editorial illustration, modular depth, clean engineering composition, generous whitespace. No mascot, cat, humans, readable text, letters, numbers, code, dashboard labels, logo, watermark, fake UI, generic glowing brain, or decorative cyberpunk clutter.
```

## Acceptance checks

- The dominant object is a real artifact or a truthful representation of the implemented system.
- The cover answers “what was built?” without needing a title.
- No unverified component, result, interface, or metric appears.
- No Huahua or mascot appears.
- Real screenshots remain materially faithful.
- The artifact remains legible at a 480 × 300 crop.
- The local WebP exists before frontmatter references it.
