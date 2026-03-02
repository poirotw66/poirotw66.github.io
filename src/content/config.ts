import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
  }),
});

const stickers = defineCollection({
  type: 'content',
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

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Short tagline under the title on the detail page */
    subtitle: z.string().optional(),
    /** e.g. GitHub repo URL */
    repoUrl: z.string().optional(),
    /** Metric tags for cards and detail page, e.g. ["161 users", "AIGO Top 20"] */
    metrics: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, stickers, projects };
