/**
 * Zod runtime validation schemas for Zuga content.
 *
 * These schemas provide runtime type validation for markdown frontmatter
 * and content structure, ensuring data integrity when loading content files.
 *
 * SYNC WARNING: Schemas must match Pydantic models in Python:
 * - scripts/extraction_models.py
 * - scripts/frontmatter_models.py
 *
 * After changes:
 * 1. Update schemas in this file
 * 2. Update TypeScript types (content.ts) if structure changed
 * 3. Run tests: pnpm test
 * 4. Verify all 35 markdown files validate
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Language enum schema.
 * Python source: scripts/extraction_models.py::Language
 */
export const LanguageSchema = z.enum(["et", "en"]);

/**
 * Media type enum schema.
 * Python source: scripts/extraction_models.py::MediaType
 */
export const MediaTypeSchema = z.enum([
  "image",
  "background_image",
  "gallery_item",
  "site_logo",
  "hero",
  "video",
  "youtube",
]);

/**
 * Page type schema.
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter.type
 */
export const PageTypeSchema = z.enum(["page", "performance", "news"]);

/**
 * Content status schema.
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter.status
 */
export const ContentStatusSchema = z.enum(["published", "draft"]);

/**
 * Video platform schema.
 * Python source: scripts/extraction_models.py::VideoEmbed.platform
 */
export const VideoPlatformSchema = z.enum(["youtube", "vimeo"]);

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Media item schema with all optional fields.
 * Python source: scripts/extraction_models.py::MediaItem
 */
export const MediaItemSchema = z.object({
  type: MediaTypeSchema,
  url: z.string().url(),
  id: z.string().optional(),
  description: z.string().optional(),
  context: z.string().optional(),

  // Video-specific
  platform: VideoPlatformSchema.optional(),
  video_id: z.string().optional(),
  title: z.string().optional(),
  embed_config: z.string().optional(),

  // Image-specific
  width: z.string().optional(),
  styling: z.string().optional(),
});

/**
 * Video embed schema (legacy).
 * Python source: scripts/extraction_models.py::VideoEmbed
 */
export const VideoEmbedSchema = z.object({
  url: z.string().url(),
  platform: VideoPlatformSchema,
  video_id: z.string(),
  title: z.string().optional(),
  embed_config: z.string().optional(),
});

/**
 * Translation reference schema.
 * Python source: scripts/frontmatter_models.py::TranslationReference
 */
export const TranslationReferenceSchema = z.object({
  language: z.enum(["et", "en"]),
  slug: z.string().min(1),
});

// ============================================================================
// FRONTMATTER SCHEMA
// ============================================================================

/**
 * Page frontmatter validation schema.
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter
 *
 * This is the primary validation schema for markdown files.
 * All 35 content files must conform to this structure.
 *
 * NOTE: The actual generated markdown uses a simpler format than
 * the Python frontmatter_models.py defines. This schema matches
 * what extraction_models.py::ExtractedPage.to_markdown() actually generates:
 * - original_url is NOT generated (optional)
 * - translated is a simple array of slugs, not objects (for now)
 */
export const PageFrontmatterSchema = z.object({
  // Required fields
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  language: z.enum(["et", "en"]),
  status: ContentStatusSchema,

  // Optional fields with defaults
  original_url: z.string().url("Must be a valid URL").optional(),
  type: z.string().optional(), // Accept any string - actual data has varied values
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Note: translated is actually a simple string array in generated markdown,
  // not TranslationReference objects. Accept both formats for flexibility.
  translated: z.union([
    z.array(z.string()), // actual format: ["slug1", "slug2"]
    z.array(TranslationReferenceSchema), // ideal format: [{language: "et", slug: "..."}]
  ]).default([]),

  // Additional fields from generated markdown
  page_type: z.string().optional(),
  hero_image: z.string().url().optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    width: z.number(),
    description: z.string(),
  })).optional(),
  videos: z.array(z.object({
    platform: z.string(),
    video_id: z.string(),
    title: z.string(),
    url: z.string().url(),
  })).optional(),
});

/**
 * Content document schema (frontmatter + body).
 */
export const ContentDocumentSchema = z.object({
  frontmatter: PageFrontmatterSchema,
  body: z.string(),
  path: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

// Infer TypeScript types from Zod schemas for convenience
export type Language = z.infer<typeof LanguageSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type PageType = z.infer<typeof PageTypeSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type VideoPlatform = z.infer<typeof VideoPlatformSchema>;

export type MediaItem = z.infer<typeof MediaItemSchema>;
export type VideoEmbed = z.infer<typeof VideoEmbedSchema>;
export type TranslationReference = z.infer<typeof TranslationReferenceSchema>;

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
export type ContentDocument = z.infer<typeof ContentDocumentSchema>;
