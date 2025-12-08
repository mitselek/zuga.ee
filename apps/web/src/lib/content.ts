/**
 * Content loading utilities for Zuga website.
 *
 * Loads and validates markdown content files using type-safe schemas
 * from @zuga/types package.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PageFrontmatterSchema } from "@zuga/types/validators";
import type { PageFrontmatter } from "@zuga/types";

/**
 * Base path to content directory (relative to project root)
 */
const CONTENT_BASE = path.join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "content",
  "pages"
);

/**
 * Result of loading a markdown file
 */
export interface LoadedContent {
  frontmatter: PageFrontmatter;
  content: string;
  slug: string;
}

/**
 * Load and parse a single markdown file with validation.
 *
 * @param language - Content language ('et' or 'en')
 * @param slug - Page slug (filename without .md extension)
 * @returns Parsed and validated content
 * @throws Error if file not found or validation fails
 */
export function loadContent(language: "et" | "en", slug: string): LoadedContent {
  const filePath = path.join(CONTENT_BASE, language, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${language}/${slug}.md`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Validate frontmatter with Zod schema
  const frontmatter = PageFrontmatterSchema.parse(data);

  return {
    frontmatter,
    content: content.trim(),
    slug,
  };
}

/**
 * Load all content files for a specific language.
 *
 * @param language - Content language ('et' or 'en')
 * @returns Array of all content in that language
 */
export function loadAllContent(language: "et" | "en"): LoadedContent[] {
  const langDir = path.join(CONTENT_BASE, language);

  if (!fs.existsSync(langDir)) {
    return [];
  }

  const files = fs
    .readdirSync(langDir)
    .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md");

  return files.map((file) => {
    const slug = file.replace(".md", "");
    return loadContent(language, slug);
  });
}

/**
 * Load content by type (e.g., all performances, all landing pages).
 *
 * @param language - Content language ('et' or 'en')
 * @param type - Content type to filter by
 * @returns Array of content matching the type
 */
export function loadContentByType(
  language: "et" | "en",
  type: PageFrontmatter["type"]
): LoadedContent[] {
  const allContent = loadAllContent(language);
  return allContent.filter((item) => item.frontmatter.type === type);
}

/**
 * Load the landing page for a language.
 *
 * @param language - Content language ('et' or 'en')
 * @returns Landing page content or null if not found
 */
export function loadLandingPage(language: "et" | "en"): LoadedContent | null {
  try {
    // Try to load index/english landing pages
    const slug = language === "et" ? "index" : "english";
    return loadContent(language, slug);
  } catch {
    // Fallback: find any landing page
    const landingPages = loadContentByType(language, "landing");
    return landingPages[0] || null;
  }
}

/**
 * Get translated version of content if available.
 *
 * @param content - Source content with translation links
 * @returns Translated content or null if not available
 */
export function getTranslation(content: LoadedContent): LoadedContent | null {
  const { translated } = content.frontmatter;

  if (!translated || translated.length === 0) {
    return null;
  }

  const translationRef = translated[0];
  if (!translationRef) return null;

  const targetLang = translationRef.language;
  const targetSlug = translationRef.slug;

  try {
    return loadContent(targetLang, targetSlug);
  } catch {
    return null;
  }
}
