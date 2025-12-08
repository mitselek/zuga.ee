/**
 * Validation tests for Zuga content types and schemas.
 *
 * Test strategy:
 * 1. Validate all 35 real markdown files from packages/content/pages/
 * 2. Test edge cases with invalid data
 * 3. Verify type safety and schema validation
 * 4. Achieve 100% code coverage
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  PageFrontmatterSchema,
  ContentDocumentSchema,
  TranslationReferenceSchema,
  MediaItemSchema,
  VideoEmbedSchema,
  type PageFrontmatter,
  type ContentDocument,
} from "../src";

// ============================================================================
// HELPERS
// ============================================================================

const CONTENT_ROOT = path.resolve(__dirname, "../../content/pages");

/**
 * Load all markdown files from a directory.
 */
function loadMarkdownFiles(dir: string): Array<{
  path: string;
  frontmatter: unknown;
  body: string;
}> {
  const files: Array<{ path: string; frontmatter: unknown; body: string }> =
    [];

  const enDir = path.join(dir, "en");
  const etDir = path.join(dir, "et");

  // Load English files
  if (fs.existsSync(enDir)) {
    const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith(".md"));
    for (const file of enFiles) {
      const filePath = path.join(enDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = matter(content);
      files.push({
        path: filePath,
        frontmatter: parsed.data,
        body: parsed.content,
      });
    }
  }

  // Load Estonian files
  if (fs.existsSync(etDir)) {
    const etFiles = fs.readdirSync(etDir).filter((f) => f.endsWith(".md"));
    for (const file of etFiles) {
      const filePath = path.join(etDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = matter(content);
      files.push({
        path: filePath,
        frontmatter: parsed.data,
        body: parsed.content,
      });
    }
  }

  return files;
}

// ============================================================================
// REAL DATA VALIDATION TESTS
// ============================================================================

describe("Content Validation - Real Files", () => {
  const files = loadMarkdownFiles(CONTENT_ROOT);

  it("should find exactly 35 markdown files", () => {
    expect(files.length).toBe(35);
  });

  it("should validate all 35 markdown file frontmatters", () => {
    const results = files.map((file) => ({
      path: path.basename(file.path),
      valid: PageFrontmatterSchema.safeParse(file.frontmatter).success,
      errors: PageFrontmatterSchema.safeParse(file.frontmatter).error,
    }));

    const invalid = results.filter((r) => !r.valid);

    if (invalid.length > 0) {
      console.error("Invalid files:", invalid);
    }

    expect(invalid.length).toBe(0);
    expect(results.every((r) => r.valid)).toBe(true);
  });

  it("should validate all files as complete ContentDocuments", () => {
    const results = files.map((file) => {
      const doc: ContentDocument = {
        frontmatter: file.frontmatter as PageFrontmatter,
        body: file.body,
        path: file.path,
      };
      return {
        path: path.basename(file.path),
        valid: ContentDocumentSchema.safeParse(doc).success,
      };
    });

    expect(results.every((r) => r.valid)).toBe(true);
  });

  it("should have 9 English files", () => {
    const enFiles = files.filter((f) => f.path.includes("/en/"));
    expect(enFiles.length).toBe(9);
  });

  it("should have 26 Estonian files", () => {
    const etFiles = files.filter((f) => f.path.includes("/et/"));
    expect(etFiles.length).toBe(26);
  });

  it("all frontmatter language fields should match directory", () => {
    const mismatches = files.filter((file) => {
      const parsed = PageFrontmatterSchema.parse(file.frontmatter);
      const inEnDir = file.path.includes("/en/");
      const inEtDir = file.path.includes("/et/");

      if (inEnDir) return parsed.language !== "en";
      if (inEtDir) return parsed.language !== "et";
      return false;
    });

    expect(mismatches.length).toBe(0);
  });

  it("all files should have valid slugs", () => {
    const files = loadMarkdownFiles(CONTENT_ROOT);
    const slugs = files.map((file) => {
      const parsed = PageFrontmatterSchema.parse(file.frontmatter);
      return parsed.slug;
    });

    // All slugs should be non-empty
    expect(slugs.every((s) => s.length > 0)).toBe(true);

    // No duplicate slugs
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("bilingual links should reference existing slugs", () => {
    const files = loadMarkdownFiles(CONTENT_ROOT);
    const allSlugs = new Set(
      files.map((f) => {
        const parsed = PageFrontmatterSchema.parse(f.frontmatter);
        return parsed.slug;
      })
    );

    const brokenLinks: Array<{
      file: string;
      targetSlug: string;
    }> = [];

    files.forEach((file) => {
      const parsed = PageFrontmatterSchema.parse(file.frontmatter);

      // Handle both string array and object array formats
      const translatedSlugs = parsed.translated.map(ref =>
        typeof ref === 'string' ? ref : ref.slug
      );

      translatedSlugs.forEach((slug) => {
        if (!allSlugs.has(slug)) {
          brokenLinks.push({
            file: path.basename(file.path),
            targetSlug: slug,
          });
        }
      });
    });

    if (brokenLinks.length > 0) {
      console.error("Broken translation links:", brokenLinks);
    }

    expect(brokenLinks.length).toBe(0);
  });
});

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe("PageFrontmatter Schema", () => {
  it("should validate minimal valid frontmatter", () => {
    const valid = {
      title: "Test Page",
      slug: "test-page",
      language: "en",
      original_url: "https://www.zuga.ee/test",
      status: "published",
      tags: [],
      translated: [],
    };

    const result = PageFrontmatterSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate full frontmatter with all fields", () => {
    const valid = {
      title: "Test Performance",
      slug: "test-performance",
      language: "et",
      original_url: "https://www.zuga.ee/etendused/test",
      status: "published",
      type: "performance",
      description: "A test performance",
      tags: ["performance", "test"],
      translated: [{ language: "en", slug: "test-performance-en" }],
    };

    const result = PageFrontmatterSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const invalid = {
      title: "Test",
      // missing slug, language, original_url, status
    };

    const result = PageFrontmatterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid language", () => {
    const invalid = {
      title: "Test",
      slug: "test",
      language: "fr", // invalid
      original_url: "https://www.zuga.ee/test",
      status: "published",
    };

    const result = PageFrontmatterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const invalid = {
      title: "Test",
      slug: "test",
      language: "en",
      original_url: "https://www.zuga.ee/test",
      status: "pending", // invalid
    };

    const result = PageFrontmatterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL", () => {
    const invalid = {
      title: "Test",
      slug: "test",
      language: "en",
      original_url: "not-a-url",
      status: "published",
    };

    const result = PageFrontmatterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should apply defaults for optional arrays", () => {
    const minimal = {
      title: "Test",
      slug: "test",
      language: "en",
      original_url: "https://www.zuga.ee/test",
      status: "published",
    };

    const result = PageFrontmatterSchema.parse(minimal);
    expect(result.tags).toEqual([]);
    expect(result.translated).toEqual([]);
  });
});

// ============================================================================
// TRANSLATION REFERENCE TESTS
// ============================================================================

describe("TranslationReference Schema", () => {
  it("should validate valid translation reference", () => {
    const valid = { language: "et", slug: "test-slug" };
    const result = TranslationReferenceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject empty slug", () => {
    const invalid = { language: "en", slug: "" };
    const result = TranslationReferenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid language", () => {
    const invalid = { language: "de", slug: "test" };
    const result = TranslationReferenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MEDIA ITEM TESTS
// ============================================================================

describe("MediaItem Schema", () => {
  it("should validate minimal image", () => {
    const valid = {
      type: "image",
      url: "https://photos.google.com/image.jpg",
    };
    const result = MediaItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate video with all fields", () => {
    const valid = {
      type: "youtube",
      url: "https://www.youtube.com/embed/abc123",
      platform: "youtube",
      video_id: "abc123",
      title: "Test Video",
      embed_config: "config123",
    };
    const result = MediaItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const invalid = {
      type: "image",
      url: "not-a-url",
    };
    const result = MediaItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid media type", () => {
    const invalid = {
      type: "pdf",
      url: "https://example.com/file.pdf",
    };
    const result = MediaItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// VIDEO EMBED TESTS
// ============================================================================

describe("VideoEmbed Schema", () => {
  it("should validate complete video embed", () => {
    const valid = {
      url: "https://www.youtube.com/embed/abc123",
      platform: "youtube",
      video_id: "abc123",
      title: "Test Video",
    };
    const result = VideoEmbedSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const invalid = {
      url: "https://www.youtube.com/embed/abc123",
      // missing platform and video_id
    };
    const result = VideoEmbedSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid platform", () => {
    const invalid = {
      url: "https://www.dailymotion.com/video/abc",
      platform: "dailymotion",
      video_id: "abc",
    };
    const result = VideoEmbedSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// CONTENT DOCUMENT TESTS
// ============================================================================

describe("ContentDocument Schema", () => {
  it("should validate complete document", () => {
    const valid = {
      frontmatter: {
        title: "Test",
        slug: "test",
        language: "en",
        original_url: "https://www.zuga.ee/test",
        status: "published",
        tags: [],
        translated: [],
      },
      body: "# Test\n\nContent here.",
      path: "/content/en/test.md",
    };
    const result = ContentDocumentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate document without optional path", () => {
    const valid = {
      frontmatter: {
        title: "Test",
        slug: "test",
        language: "en",
        original_url: "https://www.zuga.ee/test",
        status: "published",
        tags: [],
        translated: [],
      },
      body: "Content",
    };
    const result = ContentDocumentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid frontmatter", () => {
    const invalid = {
      frontmatter: {
        title: "Test",
        // missing required fields
      },
      body: "Content",
    };
    const result = ContentDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
