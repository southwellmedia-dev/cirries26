import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string().default('Cirries Team'),
    category: z.enum(['AI & Machine Learning', 'Network Performance', '5G Technology', 'Security', 'Industry Insights']),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
