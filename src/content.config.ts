import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    disclaimer: z.string(),
    trustPoints: z.array(z.string()),
    useCaseCategories: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
});

const reasons = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/reasons' }),
  schema: z.object({
    number: z.number(),
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { site, reasons };
