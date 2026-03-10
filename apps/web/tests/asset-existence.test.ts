/**
 * Asset existence tests (#70 Phase 1)
 *
 * For every local hero_image path (starting with /images/ or /videos/),
 * verify the file exists in the public/ directory.
 * External URLs (http/https) are skipped.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import matter from 'gray-matter';

const CONTENT_ROOT = resolve(__dirname, '../src/content/pages');
const PUBLIC_ROOT = resolve(__dirname, '../public');

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

function isLocalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

const allFiles = findMarkdownFiles(CONTENT_ROOT);

describe('Asset existence — hero_image', () => {
  for (const filePath of allFiles) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const heroImage: string | undefined = data.hero_image;

    if (!heroImage || !isLocalPath(heroImage)) continue;

    it(`"${basename(filePath)}" hero_image exists: ${heroImage}`, () => {
      const absolutePath = join(PUBLIC_ROOT, heroImage);
      expect(
        existsSync(absolutePath),
        `Missing asset "${heroImage}" referenced in ${filePath}`
      ).toBe(true);
    });
  }
});

describe('Asset existence — gallery images', () => {
  for (const filePath of allFiles) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const gallery: Array<{ url: string }> = data.gallery ?? [];
    const localGallery = gallery.filter((g) => isLocalPath(g.url));

    if (localGallery.length === 0) continue;

    for (const item of localGallery) {
      it(`"${basename(filePath)}" gallery image exists: ${item.url}`, () => {
        const absolutePath = join(PUBLIC_ROOT, item.url);
        expect(
          existsSync(absolutePath),
          `Missing gallery asset "${item.url}" referenced in ${filePath}`
        ).toBe(true);
      });
    }
  }
});
