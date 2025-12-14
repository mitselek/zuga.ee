import { z } from 'zod';

/**
 * Knowledge Base Collection Schemas
 *
 * Type-safe validation for all markdown files in the knowledge-base directory.
 * Organized by collection type: articles, persons, press, research
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

  // Status
  status: z.enum(['active', 'archived'], {
    errorMap: () => ({ message: 'Status must be "active" or "archived"' }),
  }).optional().default('active'),
});

/**
 * Collection type definitions for TypeScript
 */
export type Article = z.infer<typeof articleSchema>;
export type Person = z.infer<typeof personSchema>;
export type Press = z.infer<typeof pressSchema>;
export type Research = z.infer<typeof researchSchema>;

/**
 * Collection schemas map
 * Can be used for validation in scripts or tools
 */
export const collections = {
  articles: articleSchema,
  persons: personSchema,
  press: pressSchema,
  research: researchSchema,
} as const;
