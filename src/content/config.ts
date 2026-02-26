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

export const collections = { blog, stickers };
