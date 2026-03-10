/**
 * Bilingual pairing tests (#70 Phase 1)
 *
 * For every page with a `translated` frontmatter field, verify that:
 * 1. The referenced slug corresponds to an existing file in the opposite language directory.
 * 2. The target file's `slug` field (or filename stem) matches the referenced slug.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import matter from 'gray-matter';

const CONTENT_ROOT = resolve(__dirname, '../src/content/pages');
const ET_ROOT = join(CONTENT_ROOT, 'et');
const EN_ROOT = join(CONTENT_ROOT, 'en');

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

/** Build a map of slug -> file path for a language directory */
function buildSlugMap(langRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const filePath of findMarkdownFiles(langRoot)) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    // Use explicit slug field if present, otherwise use filename stem
    const slug: string = data.slug ?? basename(filePath, extname(filePath));
    map.set(slug, filePath);
  }
  return map;
}

const etSlugMap = buildSlugMap(ET_ROOT);
const enSlugMap = buildSlugMap(EN_ROOT);

const etFiles = findMarkdownFiles(ET_ROOT);
const enFiles = findMarkdownFiles(EN_ROOT);

describe('Bilingual pairing — ET → EN', () => {
  for (const filePath of etFiles) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const translated: Array<{ language: string; slug: string }> = data.translated ?? [];
    const enLinks = translated.filter((t) => t.language === 'en');

    if (enLinks.length === 0) continue;

    for (const link of enLinks) {
      it(`ET "${basename(filePath)}" → EN slug "${link.slug}" exists`, () => {
        expect(
          enSlugMap.has(link.slug),
          `No EN file found with slug "${link.slug}" (referenced from ${filePath})`
        ).toBe(true);
      });
    }
  }
});

describe('Bilingual pairing — EN → ET', () => {
  for (const filePath of enFiles) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const translated: Array<{ language: string; slug: string }> = data.translated ?? [];
    const etLinks = translated.filter((t) => t.language === 'et');

    if (etLinks.length === 0) continue;

    for (const link of etLinks) {
      it(`EN "${basename(filePath)}" → ET slug "${link.slug}" exists`, () => {
        expect(
          etSlugMap.has(link.slug),
          `No ET file found with slug "${link.slug}" (referenced from ${filePath})`
        ).toBe(true);
      });
    }
  }
});
