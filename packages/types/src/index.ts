/**
 * Zuga content types and validators.
 *
 * This package provides TypeScript types and Zod validation schemas
 * for Zuga content files, mirroring Pydantic models from the Python
 * extraction pipeline.
 *
 * @packageDocumentation
 */

// Export all types from content.ts
export * from "./content";

// Export Zod schemas and validation utilities
export {
  // Schemas
  LanguageSchema,
  MediaTypeSchema,
  PageTypeSchema,
  ContentStatusSchema,
  VideoPlatformSchema,
  MediaItemSchema,
  VideoEmbedSchema,
  TranslationReferenceSchema,
  PageFrontmatterSchema,
  ContentDocumentSchema,
} from "./validators";
