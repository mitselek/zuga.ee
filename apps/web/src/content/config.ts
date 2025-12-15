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
      platform: z.enum(['youtube', 'vimeo', 'err']),
      video_id: z.string().optional(), // Deprecated: ID is now extracted from url automatically
      title: z.string().optional(),
      url: z.string().url(), // Required: Video URL (ID extracted automatically for youtube/vimeo)
      source: z.string().optional(), // For ERR videos
      date: z.string().optional(), // For ERR videos
    })).optional(),
    audio: z.array(z.object({
      platform: z.enum(['soundcloud', 'err', 'custom']),
      track_id: z.string().optional(), // Deprecated: ID is now extracted from url automatically
      title: z.string().optional(),
      url: z.string().url(), // Required: Audio URL (ID extracted automatically for soundcloud)
      source: z.string().optional(), // e.g., "ERR Vikerraadio"
      date: z.string().optional(), // Broadcast/publication date
    })).optional(),

    // Bilingual linking
    translated: z.array(z.object({
      language: z.string(),
      slug: z.string(),
    })).optional(),

    // Bidirectional linking to Knowledge Base
    knowledge_base_sources: z
      .object({
        articles: z
          .array(z.string())
          .optional()
          .describe(
            'KnB article file paths relative to knowledge-base root. ' +
              'Example: "articles/2024-10-err-kultuur-ilma.md"'
          ),
        persons: z
          .array(z.string())
          .optional()
          .describe(
            'KnB person file paths relative to knowledge-base root. ' +
              'Example: "persons/paar-parenson.md"'
          ),
        press: z
          .array(z.string())
          .optional()
          .describe(
            'KnB press release file paths relative to knowledge-base root. ' +
              'Example: "press/2024-10-ilma-announcement.md"'
          ),
        research: z
          .array(z.string())
          .optional()
          .describe(
            'KnB research file paths relative to knowledge-base root. ' +
              'Example: "research/awards-tantsuauhind.md"'
          ),
      })
      .optional()
      .describe(
        'Knowledge Base sources that support the content on this page. ' +
          'Enables traceability and validation of claims made on web pages.'
      ),

    // Event Scheduling (Issue #54)
    // Legacy fields - DEPRECATED: Use premiere.date and premiere.venue_id instead
    premiere_date: z
      .union([
        z.string(),
        z.date().transform((d) => d.toISOString().split('T')[0]), // Convert Date to YYYY-MM-DD
      ])
      .optional()
      .describe('DEPRECATED: Use premiere.date instead'),
    venue: z.string().optional().describe('DEPRECATED: Use premiere.venue_id instead'),

    // NEW: Structured premiere information
    premiere: z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format')
          .optional(),
        venue_id: z
          .string()
          .optional()
          .describe('Venue ID from knowledge-base/venues/ (e.g., "stl", "kanuti-gildi-saal")'),
      })
      .optional()
      .describe('Premiere date, time, and venue information'),

    // NEW: Multiple showings/tour dates
    showings: z
      .array(
        z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
          time: z
            .string()
            .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format')
            .optional(),
          venue_id: z
            .string()
            .optional()
            .describe('Venue ID from knowledge-base/venues/ (overrides premiere venue if different)'),
          status: z
            .enum(['scheduled', 'sold-out', 'cancelled'], {
              errorMap: () => ({ message: 'Status must be "scheduled", "sold-out", or "cancelled"' }),
            })
            .optional()
            .default('scheduled'),
          notes: z.string().optional().describe('Additional notes (e.g., "Gala performance", "Külalisetendus")'),
        })
      )
      .optional()
      .describe('Additional performance dates (tour dates, repeat showings)'),

    // NEW: Ticket sales information
    tickets: z
      .object({
        on_sale: z.boolean().optional().default(false),
        sale_start: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sale start date must be YYYY-MM-DD format')
          .optional(),
        sale_end: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sale end date must be YYYY-MM-DD format')
          .optional(),
        platforms: z
          .array(
            z.object({
              name: z.string().min(1, 'Platform name is required'),
              url: z.string().url('Platform URL must be a valid URL'),
            })
          )
          .optional()
          .describe('Ticket platforms (Fienta, Piletilevi, venue website, etc.)'),
        pricing: z
          .array(
            z.object({
              type: z.string().min(1, 'Price type is required').describe('e.g., "adult", "student", "child", "family"'),
              price: z.number().positive('Price must be positive'),
              currency: z.string().default('EUR'),
            })
          )
          .optional()
          .describe('Ticket pricing tiers'),
      })
      .optional()
      .describe('Ticket sales and pricing information'),

    // NEW: Special events tied to performance/workshop
    special_events: z
      .array(
        z.object({
          type: z.enum(['artist-talk', 'workshop', 'discussion', 'screening', 'masterclass'], {
            errorMap: () => ({
              message: 'Type must be "artist-talk", "workshop", "discussion", "screening", or "masterclass"',
            }),
          }),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
          time: z
            .string()
            .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format')
            .optional(),
          duration: z.number().positive().optional().describe('Duration in minutes'),
          free: z.boolean().optional().default(false),
          registration_required: z.boolean().optional().default(false),
          description: z
            .object({
              et: z.string().optional(),
              en: z.string().optional(),
            })
            .optional()
            .describe('Bilingual description of the special event'),
        })
      )
      .optional()
      .describe('Special events (artist talks, workshops, discussions) related to this performance/workshop'),

    // NEW: Workshop booking information (workshops only)
    // Supports both legacy string format and new structured object format
    booking: z
      .union([
        z.string().describe('Legacy format: Simple booking description (e.g., "Ettetellimisel")'),
        z.object({
          required: z.boolean().describe('Whether pre-booking is required (vs walk-in)'),
          contact: z.object({
            name: z.string().min(1, 'Contact name is required'),
            email: z.string().email('Contact email must be valid'),
            phone: z.string().optional(),
          }),
          requirements: z
            .object({
              min_participants: z.number().positive().optional(),
              max_participants: z.number().positive().optional(),
              space: z.string().optional().describe('Space requirements (e.g., "Klassiruum või saal")'),
              equipment: z.string().optional().describe('Equipment needed (e.g., "Kõlarid")'),
            })
            .optional(),
          pricing: z
            .object({
              model: z.enum(['per-group', 'per-person'], {
                errorMap: () => ({ message: 'Pricing model must be "per-group" or "per-person"' }),
              }),
              amount: z.number().positive('Amount must be positive'),
              currency: z.string().default('EUR'),
              outside_tallinn_fee: z.boolean().optional().describe('Whether travel fee applies outside Tallinn'),
            })
            .optional(),
          target_age: z.string().optional().describe('Target age range (e.g., "6-13")'),
          duration: z.number().positive().optional().describe('Workshop duration in minutes'),
        }),
      ])
      .optional()
      .describe('Workshop booking requirements and contact information (legacy string or structured object)'),
  }),
});

export const collections = {
  'pages': pagesCollection,
};
