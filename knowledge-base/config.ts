import { z } from 'zod';

/**
 * Knowledge Base Collection Schemas
 *
 * Type-safe validation for all markdown files in the knowledge-base directory.
 * Organized by collection type: articles, persons, press, research, venues
 *
 * Constitutional Compliance: §1 Type Safety First
 */

/**
 * Articles Collection Schema
 *
 * Validates press articles, reviews, interviews, and features about ZUGA performances.
 * Files in: knowledge-base/articles/
 * Naming: YYYY-MM-publication-slug.md
 */
export const articleSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Title is required'),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    z.string().regex(/^\d{4}-\d{2}$/, 'Date must be YYYY-MM format'),
    z.string().regex(/^\d{4}$/, 'Date must be YYYY format'),
  ]),
  type: z.enum([
    'article',
    'review',
    'interview',
    'preview',
    'news',
    'radio-interview',
    'radio',
    'television-program',
  ], {
    errorMap: () => ({ message: 'Type must be one of: article, review, interview, preview, news, radio-interview, radio, television-program' }),
  }),
  language: z.enum(['en', 'et'], {
    errorMap: () => ({ message: 'Language must be "en" or "et"' }),
  }),

  // Source attribution (REQUIRED per CONTENT_STANDARDS.md)
  source_url: z.string().url('Original source URL is required'), // Original URL where content was found
  source_type: z.enum([
    'article',
    'press_release',
    'interview',
    'review',
    'preview',
    'news',
    'photo',
    'video',
    'social_media',
    'radio',
    'television',
    'podcast',
  ], {
    errorMap: () => ({ message: 'Source type is required' }),
  }),
  source_publication: z.string().min(1, 'Source publication is required'), // Publication name - ERR, EPL, etc.
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Source date must be YYYY-MM-DD format'), // Original publication date
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Archived date must be YYYY-MM-DD format'), // Date added to KnB

  // Optional source metadata
  source_language: z.enum(['en', 'et', 'other']).optional(), // Language of original source
  source_author: z.string().optional(), // Author if available
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),
  archive_location: z.string().optional(), // For physical copies

  // Publication metadata (legacy/optional)
  publication: z.string().optional(), // e.g., "ERR Kultuuriportaal", "CriticalDance"
  author: z.string().optional(), // Author name
  url: z.string().url().optional(), // Original article URL
  source: z.string().optional(), // Alternative to url/publication

  // Content metadata
  tags: z.array(z.string()).optional(), // e.g., ['ilma', 'review', 'climate-change']
  related_performances: z.array(z.string()).optional(), // Performance slugs/names
  performance_date: z.string().optional(), // Date of performance (YYYY-MM-DD)
  venue: z.string().optional(), // Performance venue

  // Additional fields for specific types
  program: z.string().optional(), // For radio/TV programs (e.g., "Teatriluup", "Ökoskoop")
  host: z.string().optional(), // Radio/TV host name
  hosts: z.array(z.string()).optional(), // Multiple hosts
  interviewees: z.array(z.string()).optional(), // People interviewed
  guests: z.array(z.string()).optional(), // Guests on radio/TV programs (alternative to interviewees)
  director: z.string().optional(), // For TV programs
  awards: z.array(z.string()).optional(), // Awards mentioned

  // Bidirectional linking fields
  used_in_pages: z
    .array(z.string())
    .optional()
    .describe(
      'List of web content pages that reference this KnB article. ' +
        'Format: "et/etendused-noorele-publikule-ilma.md" or ' +
        '"en/performances-for-young-audiences-weather-or-not.md"'
    ),
  related_knb: z
    .object({
      performances: z
        .array(z.string())
        .optional()
        .describe('Performance IDs from registry (e.g., "ilma", "habi")'),
      persons: z
        .array(z.string())
        .optional()
        .describe('Person file slugs (e.g., "paar-parenson", "kart-tonisson")'),
      articles: z
        .array(z.string())
        .optional()
        .describe('Related article file slugs (e.g., "2024-10-err-kultuur-ilma")'),
      press: z
        .array(z.string())
        .optional()
        .describe('Related press release file slugs'),
      research: z
        .array(z.string())
        .optional()
        .describe('Related research file slugs'),
    })
    .optional()
    .describe('Cross-references to related KnB content'),

  // Status
  status: z.enum(['active', 'archived', 'review-pending', 'ready-to-publish'], {
    errorMap: () => ({ message: 'Status must be "active", "archived", "review-pending", or "ready-to-publish"' }),
  }).optional().default('active'),
});

/**
 * Persons Collection Schema
 *
 * Validates profiles of ZUGA members and collaborators.
 * Files in: knowledge-base/persons/
 * Naming: slug-name.md
 */
export const personSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'), // e.g., "Tantsija, koreograaf"

  // Source attribution (REQUIRED per CONTENT_STANDARDS.md)
  source_url: z.string().url('Original source URL is required'), // Where bio/info came from
  source_type: z.enum(['bio', 'press_release', 'article', 'interview', 'website'], {
    errorMap: () => ({ message: 'Source type is required' }),
  }),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Archived date must be YYYY-MM-DD format'),

  // Optional source metadata
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Source date must be YYYY-MM-DD').optional(),
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),

  // Membership
  member_since: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d{4}$/, 'Member since must be a year (YYYY)'),
  ]).optional(),
  founding_member: z.boolean().optional(), // true if founding member

  // Bidirectional linking fields
  used_in_pages: z
    .array(z.string())
    .optional()
    .describe(
      'List of web content pages that reference this person profile. ' +
        'Format: "et/etendused-noorele-publikule-ilma.md" or ' +
        '"en/performances-for-young-audiences-weather-or-not.md"'
    ),
  related_knb: z
    .object({
      performances: z
        .array(z.string())
        .optional()
        .describe('Performance IDs from registry where this person was involved'),
      persons: z
        .array(z.string())
        .optional()
        .describe('Related person file slugs (collaborators, team members)'),
      articles: z
        .array(z.string())
        .optional()
        .describe('Articles mentioning this person'),
      press: z
        .array(z.string())
        .optional()
        .describe('Press releases mentioning this person'),
      research: z
        .array(z.string())
        .optional()
        .describe('Research/awards related to this person'),
    })
    .optional()
    .describe('Cross-references to related KnB content'),

  status: z.enum(['active', 'inactive', 'former'], {
    errorMap: () => ({ message: 'Status must be "active", "inactive", or "former"' }),
  }).optional().default('active'),
});

/**
 * Press Collection Schema
 *
 * Validates press releases, media kits, and promotional materials.
 * Files in: knowledge-base/press/
 * Naming: YYYY-MM-performance-slug.md
 */
export const pressSchema = z.object({
  // Required fields
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    z.string().regex(/^\d{4}-\d{2}$/, 'Date must be YYYY-MM format'),
    z.string().regex(/^\d{4}$/, 'Date must be YYYY format'),
  ]),
  type: z.enum([
    'press-release',
    'announcement',
    'media-kit',
    'promotional',
  ], {
    errorMap: () => ({ message: 'Type must be "press-release", "announcement", "media-kit", or "promotional"' }),
  }),
  language: z.enum(['en', 'et'], {
    errorMap: () => ({ message: 'Language must be "en" or "et"' }),
  }),

  // Source attribution (REQUIRED per CONTENT_STANDARDS.md)
  source_type: z.enum(['press_release', 'announcement', 'media_kit', 'promotional'], {
    errorMap: () => ({ message: 'Source type matches press type' }),
  }), // Matches the main type field
  issued_by: z.string().min(1, 'Issuing organization required').default('ZUGA'), // Usually ZUGA
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be YYYY-MM-DD format'), // When press release was issued
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Archived date must be YYYY-MM-DD format'),

  // Optional source metadata
  source_url: z.string().url().optional(), // If published online
  distribution: z.enum(['public', 'media_only', 'internal']).optional(),

  // Legacy source metadata
  source: z.string().optional(), // Original URL or publication name
  publication: z.string().optional(), // Publication name (alternative to source)

  // Related content
  performance: z.string().optional(), // Performance name with year, e.g., "Mis Sul viga on?! (2026)"
  related_performances: z.array(z.string()).optional(), // Performance slugs/names
  tags: z.array(z.string()).optional(),

  // Bidirectional linking fields
  used_in_pages: z
    .array(z.string())
    .optional()
    .describe(
      'List of web content pages that reference this press release. ' +
        'Format: "et/etendused-noorele-publikule-ilma.md" or ' +
        '"en/performances-for-young-audiences-weather-or-not.md"'
    ),
  related_knb: z
    .object({
      performances: z
        .array(z.string())
        .optional()
        .describe('Performance IDs from registry related to this press release'),
      persons: z
        .array(z.string())
        .optional()
        .describe('Person file slugs mentioned in this press release'),
      articles: z
        .array(z.string())
        .optional()
        .describe('Related articles covering the same topic'),
      press: z
        .array(z.string())
        .optional()
        .describe('Related press releases'),
      research: z
        .array(z.string())
        .optional()
        .describe('Related research/awards'),
    })
    .optional()
    .describe('Cross-references to related KnB content'),

  // Status
  status: z.enum(['active', 'archived', 'upcoming', 'draft'], {
    errorMap: () => ({ message: 'Status must be "active", "archived", "upcoming", or "draft"' }),
  }).optional().default('active'),
});

/**
 * Research Collection Schema
 *
 * Validates background research, awards, interviews, and production notes.
 * Files in: knowledge-base/research/
 * Naming: topic-slug.md
 */
export const researchSchema = z.object({
  // Required fields
  type: z.enum([
    'award',
    'research-notes',
    'interview',
    'production-notes',
    'background',
  ], {
    errorMap: () => ({ message: 'Type must be "award", "research-notes", "interview", "production-notes", or "background"' }),
  }),

  // Date
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    z.string().regex(/^\d{4}-\d{2}$/, 'Date must be YYYY-MM format'),
    z.string().regex(/^\d{4}$/, 'Date must be YYYY format'),
  ]).optional(),

  // Source attribution (REQUIRED per CONTENT_STANDARDS.md)
  source_url: z.string().url('Original source URL is required'), // Where information came from
  source_type: z.enum(['award_announcement', 'grant_info', 'production_notes', 'interview', 'article', 'document'], {
    errorMap: () => ({ message: 'Source type is required' }),
  }),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Archived date must be YYYY-MM-DD format'),

  // Optional source metadata
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Source date must be YYYY-MM-DD').optional(),
  source_publication: z.string().optional(),
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),

  // Award-specific fields
  award: z.string().optional(), // e.g., "Tantsuauhind"
  awarded_by: z.string().optional(), // e.g., "Eesti Teatriliit"
  recipients: z.array(z.string()).optional(), // Award recipients
  organization: z.string().optional(), // Organization receiving award
  performance: z.string().optional(), // Related performance
  year: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d{4}$/, 'Year must be YYYY format'),
  ]).optional(),

  // Legacy source field (deprecated - use source_url instead)
  source: z.string().url().optional(), // Source URL (deprecated)

  // Bidirectional linking fields
  used_in_pages: z
    .array(z.string())
    .optional()
    .describe(
      'List of web content pages that reference this research document. ' +
        'Format: "et/about.md" or "en/about.md"'
    ),
  related_knb: z
    .object({
      performances: z
        .array(z.string())
        .optional()
        .describe('Performance IDs from registry related to this research'),
      persons: z
        .array(z.string())
        .optional()
        .describe('Person file slugs related to this research'),
      articles: z
        .array(z.string())
        .optional()
        .describe('Articles related to this research'),
      press: z
        .array(z.string())
        .optional()
        .describe('Press releases related to this research'),
      research: z
        .array(z.string())
        .optional()
        .describe('Related research documents'),
    })
    .optional()
    .describe('Cross-references to related KnB content'),

  // Status
  status: z.enum(['active', 'archived'], {
    errorMap: () => ({ message: 'Status must be "active" or "archived"' }),
  }).optional().default('active'),
});

/**
 * Venues Collection Schema
 *
 * Validates venue profiles for performance and event locations.
 * Files in: knowledge-base/venues/
 * Naming: venue-slug.md (e.g., soltumatu-tantsu-lava.md)
 */
export const venueSchema = z.object({
  // Required fields
  id: z.string().min(1, 'Venue ID is required'), // Short identifier (e.g., "stl", "kanuti-gildi-saal")
  name: z.object({
    et: z.string().min(1, 'Estonian name is required'),
    en: z.string().optional(), // English name if available
  }),
  short_name: z.string().optional(), // Abbreviation (e.g., "STL")

  // Address information
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().optional(),
    country: z.string().default('Estonia'),
  }),

  // Geographic coordinates (optional, for maps)
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),

  // Venue capacity
  capacity: z.number().positive().optional(),

  // Accessibility information
  accessibility: z.object({
    wheelchair: z.boolean().optional(),
    elevator: z.boolean().optional(),
    hearing_loop: z.boolean().optional(),
  }).optional(),

  // Parking information
  parking: z.object({
    available: z.boolean(),
    details: z.string().optional(), // e.g., "Street parking, Telliskivi parking lot nearby"
  }).optional(),

  // Public transit information
  transit: z.object({
    tram: z.array(z.string()).optional(), // Tram line numbers
    bus: z.array(z.string()).optional(), // Bus line numbers
    nearest_stop: z.string().optional(), // Name of nearest stop
  }).optional(),

  // Contact and website
  website: z.string().url().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),

  // Status
  status: z.enum(['active', 'inactive', 'temporary'], {
    errorMap: () => ({ message: 'Status must be "active", "inactive", or "temporary"' }),
  }).default('active'),
});

/**
 * Collection type definitions for TypeScript
 */
export type Article = z.infer<typeof articleSchema>;
export type Person = z.infer<typeof personSchema>;
export type Press = z.infer<typeof pressSchema>;
export type Research = z.infer<typeof researchSchema>;
export type Venue = z.infer<typeof venueSchema>;

/**
 * Collection schemas map
 * Can be used for validation in scripts or tools
 */
export const collections = {
  articles: articleSchema,
  persons: personSchema,
  press: pressSchema,
  research: researchSchema,
  venues: venueSchema,
} as const;
