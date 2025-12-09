import { z, defineCollection } from 'astro:content';

/**
 * Pages collection schema - Hierarchical Structure
 *
 * Validates all markdown files in src/content/pages/
 *
 * New structure (as of 2025-12-09):
 * - type: Hierarchy level (home | section | detail)
 * - category: Content category (etendused | workshopid | about | gallery | contact | news)
 * - subcategory: Optional grouping within category (suurtele | noorele-publikule)
 *
 * Migration from old structure:
 * - Old type: 'landing' + slug: 'index' → New type: 'home'
 * - Old type: 'landing' + slug: 'etendused-*' → New type: 'section'
 * - Old type: 'performance' | 'workshop' → New type: 'detail'
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

    // NEW: Hierarchical type system
    type: z.enum([
      'home',      // Homepage (index.md)
      'section',   // Category/section page (etendused-suurtele.md, workshopid.md)
      'detail',    // Individual detail page (etendused-suurtele-habi.md)
    ], {
      errorMap: () => ({ message: 'Type must be "home", "section", or "detail"' }),
    }),

    // NEW: Content category
    category: z.enum([
      'etendused',   // Performances
      'workshopid',  // Workshops
      'about',       // About/team pages
      'gallery',     // Photo galleries
      'contact',     // Contact pages
      'news',        // News/press
    ], {
      errorMap: () => ({ message: 'Invalid category' }),
    }),

    // NEW: Optional subcategory for grouping
    subcategory: z.string().optional(), // e.g., 'suurtele', 'noorele-publikule'

    status: z.enum(['published', 'draft'], {
      errorMap: () => ({ message: 'Status must be "published" or "draft"' }),
    }),

    // Optional metadata fields
    description: z.string().optional(),
    page_type: z.string().optional(), // Legacy field, preserved for reference
    original_url: z.string().url().optional(),
    order: z.number().optional(), // Manual ordering for subsections

    // Media fields
    hero_image: z.string().optional(),
    background_color: z.string().optional(), // Custom background color (CSS color value)
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
