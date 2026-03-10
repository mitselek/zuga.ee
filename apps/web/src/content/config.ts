import { defineCollection } from 'astro:content';
import { pagesSchema } from './schema';

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
 *
 * Schema definition lives in ./schema.ts (importable without Astro runtime).
 */
const pagesCollection = defineCollection({
  type: 'content',
  schema: pagesSchema,
});

export const collections = {
  'pages': pagesCollection,
};
