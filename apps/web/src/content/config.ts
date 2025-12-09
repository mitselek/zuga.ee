import { z, defineCollection } from 'astro:content';

/**
 * Pages collection schema
 * 
 * Validates all markdown files in src/content/pages/
 * Based on frontmatter structure from source_zuga_ee/pages/
 * 
 * Constitutional Compliance: §1 Type Safety First
 */
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Required fields
    title: z.string().min(1, 'Title is required'),
    slug: z.string()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric with hyphens')
      .optional(), // Optional since Astro uses filename as ID
    language: z.enum(['en', 'et'], {
      errorMap: () => ({ message: 'Language must be "en" or "et"' }),
    }),
    type: z.enum([
      'performance',
      'about',
      'workshop',
      'news',
      'gallery',
      'contact',
      'landing',
    ], {
      errorMap: () => ({ message: 'Invalid page type' }),
    }),
    status: z.enum(['published', 'draft'], {
      errorMap: () => ({ message: 'Status must be "published" or "draft"' }),
    }),

    // Optional metadata fields
    description: z.string().optional(),
    page_type: z.string().optional(), // Legacy field, preserved for reference
    original_url: z.string().url().optional(),

    // Media fields
    hero_image: z.string().optional(),
    gallery: z.array(z.object({
      url: z.string(),
      width: z.number().positive().optional(),
      description: z.string().optional(),
    })).optional(),
    videos: z.array(z.object({
      platform: z.enum(['youtube', 'vimeo']),
      video_id: z.string().min(1),
      title: z.string().optional(),
      url: z.string().url(),
    })).optional(),

    // Bilingual linking
    translated: z.array(z.object({
      language: z.string(),
      slug: z.string(),
    })).optional(),
  }),
});

export const collections = {
  'pages': pagesCollection,
};
