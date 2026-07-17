import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Optional date when the technical content was last re-verified. */
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    /** Optional cover image path (e.g. /blog/post-id/title_image.webp) for preview cards */
    image: z.string().optional(),
    /** One-line subtitle under the title on the post page */
    subtitle: z.string().optional(),
    /** Long-form guide vs standard article (styling + optional TOC) */
    kind: z.enum(['article', 'guide']).default('article'),
    /** Show auto-generated TOC from Markdown headings (guide-friendly) */
    showToc: z.boolean().optional(),
    /** Optional version label for guides, e.g. v0.3 */
    guideVersion: z.string().optional(),
  }),
});

const paperLinkSchema = z.object({
  pdf: z.string().url().optional(),
  arxiv: z.string().url().optional(),
  doi: z.string().url().optional(),
  code: z.string().url().optional(),
  project: z.string().url().optional(),
});

const paperSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()).min(1),
  year: z.number().int().min(1900).max(2100),
  venue: z.string().optional(),
  links: paperLinkSchema.optional(),
});

const paperSeriesSchema = z.object({
  /** Stable key used for series pages and grouping. */
  id: z.string(),
  /** Human-friendly series title shown on pages. */
  title: z.string(),
  /** 1-based part number for ordering within the series. */
  part: z.number().int().min(1),
  totalParts: z.number().int().min(1).optional(),
});

const paperReading = defineCollection({
  loader: glob({ base: './src/content/paperReading', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Optional date when the reading notes were last re-verified. */
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    /** Optional cover image path (e.g. /paper-reading/post-id/title_image.webp) for preview cards */
    image: z.string().optional(),
    /** Paper metadata shown as an info card on the article page */
    paper: paperSchema,
    /** Optional series grouping (e.g. AlexNet part 1/3) */
    series: paperSeriesSchema.optional(),
    /** Optional filters for the hub page */
    field: z.string().optional(),
    difficulty: z.enum(['intro', 'intermediate', 'advanced']).optional(),
    /** Show auto-generated TOC from Markdown headings (h2–h3) */
    showToc: z.boolean().optional(),
  }),
});

const stickers = defineCollection({
  loader: glob({ base: './src/content/stickers', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lineStoreUrl: z.string(),
    image: z.string().optional(),
    /** Optional sprite / storyboard images shown below the hero on the detail page */
    spriteImages: z.array(z.string()).optional(),
    pubDate: z.coerce.date(),
  }),
});

const stickerTools = defineCollection({
  loader: glob({ base: './src/content/stickerTools', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    repoUrl: z.string(),
    order: z.number(),
    image: z.string().optional(),
    useCases: z.array(z.string()).optional(),
  }),
});

const projectTier = z.enum(['flagship', 'aigc', 'main', 'lab']);

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Optional date when the project write-up was last updated. */
    updatedDate: z.coerce.date().optional(),
    /** flagship | aigc | main | lab. lab = only on /lab/; others on /projects/ and optionally homepage */
    tier: projectTier,
    /** 1–4 for homepage featured order; null = not on homepage */
    featuredOrder: z.number().min(1).max(4).optional(),
    /** Short tagline under the title on the detail page */
    subtitle: z.string().optional(),
    /** e.g. GitHub repo URL */
    repoUrl: z.string().optional(),
    /** Metric tags for cards and detail page, e.g. ["161 users", "AIGO Top 20"] */
    metrics: z.array(z.string()).optional(),
    /** One-line impact for cards, e.g. "16.7x speed improvement" or "X days manual → Y hours auto" */
    impact: z.string().optional(),
    /** Optional cover image path (e.g. /projects/project-id/title_image.webp) for project cards */
    image: z.string().optional(),
    /** Lab subsection when tier is lab: competition (Kaggle etc.) or creative (default) */
    labZone: z.enum(['competition', 'creative']).optional(),
  }),
});

export const collections = { blog, paperReading, stickers, stickerTools, projects };
