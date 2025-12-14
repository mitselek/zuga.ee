import { z } from 'zod';

/**
 * Registry Schema
 *
 * Type-safe validation for performance and workshop registry YAML files.
 * Used to ensure canonical data structure and enable slug validation.
 *
 * Constitutional Compliance: §1 Type Safety First
 */

/**
 * Bilingual title object
 */
const bilingualTitleSchema = z.object({
  et: z.string().nullable().optional(),
  en: z.string().nullable().optional(),
}).refine(
  (data) => data.et !== null || data.en !== null,
  { message: 'At least one language (et or en) must be provided' }
);

/**
 * Bilingual slug object
 */
const bilingualSlugSchema = z.object({
  et: z.string().nullable().optional(),
  en: z.string().nullable().optional(),
}).refine(
  (data) => data.et !== null || data.en !== null,
  { message: 'At least one language (et or en) must be provided' }
);

/**
 * Performance schema
 */
export const performanceSchema = z.object({
  id: z.string().min(1, 'Performance ID is required'),
  title: bilingualTitleSchema,
  slug: bilingualSlugSchema,
  full_slug: bilingualSlugSchema,
  premiere: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Premiere must be YYYY-MM-DD format').nullable().optional(),
  venue: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  target_audience: z.enum(['adults', 'young_audiences', 'families', 'children'], {
    errorMap: () => ({ message: 'Target audience must be: adults, young_audiences, families, or children' }),
  }),
  age_recommendation: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'upcoming'], {
    errorMap: () => ({ message: 'Status must be: active, archived, or upcoming' }),
  }),
  categories: z.array(z.string()).min(1, 'At least one category is required'),
});

/**
 * Workshop schema
 */
export const workshopSchema = z.object({
  id: z.string().min(1, 'Workshop ID is required'),
  title: bilingualTitleSchema,
  slug: bilingualSlugSchema,
  full_slug: bilingualSlugSchema,
  target_audience: z.enum(['adults', 'young_audiences', 'families', 'children']).nullable().optional(),
  age_recommendation: z.string().nullable().optional(),
  duration: z.union([
    z.number().int().positive(),
    z.string(), // For ranges like "15-20"
  ]).nullable().optional(),
  venue: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'upcoming'], {
    errorMap: () => ({ message: 'Status must be: active, archived, or upcoming' }),
  }),
  dates: z.string().nullable().optional(), // For date ranges like "2021-10-15 - 2022-02-18"
  collaboration: z.string().nullable().optional(),
  categories: z.array(z.string()).min(1, 'At least one category is required'),
});

/**
 * Performances registry schema
 */
export const performancesRegistrySchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Last updated must be YYYY-MM-DD format'),
  performances: z.array(performanceSchema).min(1, 'At least one performance is required'),
});

/**
 * Workshops registry schema
 */
export const workshopsRegistrySchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Last updated must be YYYY-MM-DD format'),
  workshops: z.array(workshopSchema).min(1, 'At least one workshop is required'),
});

/**
 * Type exports
 */
export type Performance = z.infer<typeof performanceSchema>;
export type Workshop = z.infer<typeof workshopSchema>;
export type PerformancesRegistry = z.infer<typeof performancesRegistrySchema>;
export type WorkshopsRegistry = z.infer<typeof workshopsRegistrySchema>;
