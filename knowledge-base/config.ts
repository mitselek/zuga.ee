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

  // Publication metadata
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

  // Source metadata
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

  // Source
  source: z.string().url().optional(), // Source URL

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
