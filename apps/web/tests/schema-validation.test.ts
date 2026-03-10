/**
 * Schema validation tests (#70 Phase 1)
 *
 * Parses every content .md file with gray-matter and validates the
 * frontmatter against the Zod schema from src/content/schema.ts.
 *
 * Unknown fields (not in schema) are flagged as warnings but do not fail
 * the test — Astro's passthrough behavior means they won't cause build
 * errors, but they indicate the schema needs updating.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import matter from 'gray-matter';
import { pagesSchema } from '../src/content/schema';

const CONTENT_ROOT = resolve(__dirname, '../src/content/pages');

/** Recursively find all .md files under a directory */
function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = findMarkdownFiles(CONTENT_ROOT);

describe('Schema validation — all content files', () => {
  for (const filePath of allFiles) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');

    it(`"${label}" passes Zod schema`, () => {
      const raw = readFileSync(filePath, 'utf-8');
      const { data } = matter(raw);

      const result = pagesSchema.safeParse(data);

      if (!result.success) {
        const errors = result.error.issues
          .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
          .join('\n');
        throw new Error(`Schema validation failed for ${label}:\n${errors}`);
      }
    });
  }
});
