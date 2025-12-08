/**
 * TypeScript type definitions for Zuga content.
 *
 * SYNC WARNING: These types mirror Pydantic models in Python codebase.
 * When modifying, update corresponding Python models:
 * - scripts/extraction_models.py (ExtractedPage, MediaItem, VideoEmbed)
 * - scripts/frontmatter_models.py (ContentFrontmatter, TranslationReference)
 *
 * Sync protocol: https://github.com/mitselek/zuga.ee/issues/13
 * After changes:
 * 1. Update this file (content.ts)
 * 2. Update Zod schemas (validators.ts)
 * 3. Run tests: pnpm test
 * 4. Verify 35/35 markdown files validate
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Supported languages for bilingual content.
 * Python source: scripts/extraction_models.py::Language
 */
export enum Language {
  ESTONIAN = "et",
  ENGLISH = "en",
}

/**
 * Types of media items found in content.
 * Python source: scripts/extraction_models.py::MediaType
 */
export enum MediaType {
  IMAGE = "image",
  BACKGROUND_IMAGE = "background_image",
  GALLERY_ITEM = "gallery_item",
  SITE_LOGO = "site_logo",
  HERO_IMAGE = "hero",
  VIDEO = "video",
  YOUTUBE = "youtube",
}

/**
 * Content type classification.
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter.type
 */
export type PageType = "page" | "performance" | "news";

/**
 * Publication status.
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter.status
 */
export type ContentStatus = "published" | "draft";

/**
 * Video platforms.
 * Python source: scripts/extraction_models.py::VideoEmbed.platform
 */
export type VideoPlatform = "youtube" | "vimeo";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

/**
 * Unified media item (images, videos, backgrounds).
 * Python source: scripts/extraction_models.py::MediaItem
 */
export interface MediaItem {
  /** Type of media item */
  type: MediaType;
  /** Media URL (Google Photos, YouTube, etc.) */
  url: string;
  /** Unique identifier for cross-referencing */
  id?: string;
  /** Human-readable description */
  description?: string;
  /** Usage context or placement notes */
  context?: string;

  // Video-specific fields
  /** Video platform */
  platform?: VideoPlatform;
  /** Platform-specific video ID */
  video_id?: string;
  /** Video title */
  title?: string;
  /** Embed configuration token */
  embed_config?: string;

  // Image-specific fields
  /** Image width (e.g., '1280') */
  width?: string;
  /** CSS styling instructions */
  styling?: string;
}

/**
 * YouTube video embed (legacy - migrate to MediaItem).
 * Python source: scripts/extraction_models.py::VideoEmbed
 */
export interface VideoEmbed {
  /** YouTube embed URL */
  url: string;
  /** Video platform */
  platform: VideoPlatform;
  /** Platform-specific video ID */
  video_id: string;
  /** Video title */
  title?: string;
  /** Embed configuration token */
  embed_config?: string;
}

/**
 * Reference to a translated version of content.
 * Python source: scripts/frontmatter_models.py::TranslationReference
 */
export interface TranslationReference {
  /** Target language code */
  language: "et" | "en";
  /** Slug of translated content */
  slug: string;
}

// ============================================================================
// FRONTMATTER TYPE
// ============================================================================

/**
 * YAML frontmatter for markdown content files.
 *
 * This defines the metadata at the top of each markdown file
 * in packages/content/pages/{en,et}/.
 *
 * Python source: scripts/frontmatter_models.py::ContentFrontmatter
 *
 * Example:
 * ```yaml
 * ---
 * title: "Noise"
 * slug: "noise"
 * language: "en"
 * original_url: "https://www.zuga.ee/english/noise"
 * status: "published"
 * type: "performance"
 * tags: ["performance"]
 * translated:
 *   - language: "et"
 *     slug: "kahin"
 * ---
 * ```
 */
export interface PageFrontmatter {
  // Required fields
  /** Content title */
  title: string;
  /** URL-friendly identifier */
  slug: string;
  /** Content language */
  language: "et" | "en";
  /** Full canonical URL */
  original_url: string;
  /** Publication status */
  status: ContentStatus;

  // Optional fields
  /** Content classification */
  type?: PageType;
  /** Meta description */
  description?: string;
  /** Content tags */
  tags: string[];
  /** Links to translations */
  translated: TranslationReference[];
}

/**
 * Complete content document with frontmatter and body.
 *
 * Represents a parsed markdown file with both metadata (frontmatter)
 * and content (body).
 */
export interface ContentDocument {
  /** YAML frontmatter metadata */
  frontmatter: PageFrontmatter;
  /** Markdown content body */
  body: string;
  /** Optional file path for reference */
  path?: string;
}
