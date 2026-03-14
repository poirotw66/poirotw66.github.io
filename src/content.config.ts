import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    /** Optional cover image path (e.g. /blog/post-id/title_image.png) for preview cards */
    image: z.string().optional(),
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
  }),
});

export const collections = { blog, stickers, stickerTools, projects };
