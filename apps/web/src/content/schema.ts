/**
 * Pages collection Zod schema — importable without Astro runtime.
 *
 * This file uses only `zod` (not `astro:content`) so it can be imported
 * directly in Vitest tests and other non-Astro contexts.
 */
import { z } from 'zod';

export const pagesSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Title is required'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric with hyphens')
    .optional(), // Optional since Astro uses filename as ID
  language: z.enum(['en', 'et'], {
    errorMap: () => ({ message: 'Language must be "en" or "et"' }),
  }),

  // Hierarchical type system
  type: z.enum([
    'home',      // Homepage (index.md)
    'section',   // Category/section page
    'detail',    // Individual detail page
  ], {
    errorMap: () => ({ message: 'Type must be "home", "section", or "detail"' }),
  }),

  // Content category
  category: z.enum([
    'etendused',   // Performances
    'workshopid',  // Workshops
    'about',       // About/team pages
    'gallery',     // Photo galleries
    'contact',     // Contact pages
    'news',        // News/press
    'kalender',    // Calendar/events
  ], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),

  subcategory: z.string().optional(),

  status: z.enum(['published', 'draft'], {
    errorMap: () => ({ message: 'Status must be "published" or "draft"' }),
  }),

  // Optional metadata fields
  description: z.string().optional(),
  page_type: z.string().optional(),
  original_url: z.string().url().optional(),
  order: z.number().optional(),

  // Performance/workshop info fields
  duration: z.union([z.number().positive(), z.string()]).optional(),
  age_recommendation: z.string().optional(),
  collaboration: z.union([z.string(), z.array(z.string())]).optional(),
  related_exhibition: z.string().optional(),
  credits: z.record(z.union([z.string(), z.array(z.string())])).optional(),
  awards: z.array(z.string()).optional(),

  // Media fields
  hero_image: z.string().optional(),
  hero_video: z.string().optional(),
  background_color: z.string().optional(),
  gallery: z.array(z.object({
    url: z.string(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    description: z.string().optional(),
  })).optional(),
  videos: z.array(z.object({
    platform: z.enum(['youtube', 'vimeo', 'err']),
    video_id: z.string().optional(),
    title: z.string().optional(),
    url: z.string().url(),
    source: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  audio: z.array(z.object({
    platform: z.enum(['soundcloud', 'err', 'custom']),
    track_id: z.string().optional(),
    title: z.string().optional(),
    url: z.string().url(),
    source: z.string().optional(),
    date: z.string().optional(),
  })).optional(),

  // Bilingual linking
  translated: z.array(z.object({
    language: z.string(),
    slug: z.string(),
  })).optional(),

  // Knowledge Base linking
  knowledge_base_sources: z.object({
    articles: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),

  // Event scheduling — legacy fields
  premiere_date: z.union([
    z.string(),
    z.date().transform((d) => d.toISOString().split('T')[0]),
  ]).optional(),
  venue: z.string().optional(),

  // Structured premiere information
  premiere: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format').optional(),
    venue_id: z.string().optional(),
  }).optional(),

  // Multiple showings/tour dates
  showings: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format').optional(),
    venue_id: z.string().optional(),
    status: z.enum(['scheduled', 'sold-out', 'cancelled']).optional().default('scheduled'),
    notes: z.string().optional(),
  })).optional(),

  // Ticket sales information
  tickets: z.object({
    on_sale: z.boolean().optional().default(false),
    sale_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sale_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    platforms: z.array(z.object({
      name: z.string().min(1),
      url: z.string().url(),
    })).optional(),
    pricing: z.array(z.object({
      type: z.string().min(1),
      price: z.number().positive(),
      currency: z.string().default('EUR'),
    })).optional(),
    school_groups: z.object({
      url: z.string().url(),
    }).optional(),
  }).optional(),

  // Special events
  special_events: z.array(z.object({
    type: z.enum(['artist-talk', 'workshop', 'discussion', 'screening', 'masterclass']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    duration: z.number().positive().optional(),
    free: z.boolean().optional().default(false),
    registration_required: z.boolean().optional().default(false),
    description: z.object({
      et: z.string().optional(),
      en: z.string().optional(),
    }).optional(),
  })).optional(),

  // Workshop booking
  booking: z.union([
    z.string(),
    z.object({
      required: z.boolean(),
      contact: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      requirements: z.object({
        min_participants: z.number().positive().optional(),
        max_participants: z.number().positive().optional(),
        space: z.string().optional(),
        equipment: z.string().optional(),
      }).optional(),
      pricing: z.object({
        model: z.enum(['per-group', 'per-person']),
        amount: z.number().positive(),
        currency: z.string().default('EUR'),
        outside_tallinn_fee: z.boolean().optional(),
      }).optional(),
      target_age: z.string().optional(),
      duration: z.number().positive().optional(),
    }),
  ]).optional(),
});

export type PagesData = z.infer<typeof pagesSchema>;
