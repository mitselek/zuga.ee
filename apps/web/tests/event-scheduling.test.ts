/**
 * Event scheduling validation tests (#54)
 *
 * Tests for premiere, showings, tickets, venue ID lookup, and date parsing.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

const CONTENT_ROOT = resolve(__dirname, '../src/content/pages');
const VENUES_ROOT = resolve(__dirname, '../../../knowledge-base/venues');

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

/** Build set of valid venue IDs from knowledge-base/venues/ (uses `id:` field) */
function loadVenueIds(): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(VENUES_ROOT)) return ids;
  for (const file of readdirSync(VENUES_ROOT)) {
    if (!file.endsWith('.md')) continue;
    const content = readFileSync(join(VENUES_ROOT, file), 'utf-8');
    const { data } = matter(content);
    if (data.id) ids.add(data.id);
    // Also add filename stem as fallback (e.g. "kanuti-gildi-saal")
    ids.add(file.replace(/\.md$/, ''));
  }
  return ids;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const allFiles = findMarkdownFiles(CONTENT_ROOT);
let validVenueIds: Set<string>;

beforeAll(() => {
  validVenueIds = loadVenueIds();
});

// ─── Premiere validation ──────────────────────────────────────────────────────

describe('Event scheduling — premiere validation', () => {
  const filesWithPremiere = allFiles.filter((f) => {
    const { data } = matter(readFileSync(f, 'utf-8'));
    return data.premiere != null;
  });

  it('at least one content file has premiere data', () => {
    expect(filesWithPremiere.length).toBeGreaterThan(0);
  });

  for (const filePath of filesWithPremiere) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const { premiere } = data;

    it(`"${label}" premiere.date is YYYY-MM-DD`, () => {
      expect(typeof premiere.date).toBe('string');
      expect(premiere.date).toMatch(DATE_REGEX);
    });

    if (premiere.time != null) {
      it(`"${label}" premiere.time is HH:MM`, () => {
        expect(premiere.time).toMatch(TIME_REGEX);
      });
    }

    if (premiere.venue_id != null) {
      it(`"${label}" premiere.venue_id "${premiere.venue_id}" is a known venue`, () => {
        expect(
          validVenueIds.has(premiere.venue_id),
          `Unknown venue_id "${premiere.venue_id}" in ${label}. Valid IDs: ${[...validVenueIds].join(', ')}`
        ).toBe(true);
      });
    }
  }
});

// ─── Showings validation ──────────────────────────────────────────────────────

describe('Event scheduling — showings validation', () => {
  const filesWithShowings = allFiles.filter((f) => {
    const { data } = matter(readFileSync(f, 'utf-8'));
    return Array.isArray(data.showings) && data.showings.length > 0;
  });

  it('at least one content file has showings data', () => {
    expect(filesWithShowings.length).toBeGreaterThan(0);
  });

  for (const filePath of filesWithShowings) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const showings: any[] = data.showings;

    it(`"${label}" showings is a non-empty array`, () => {
      expect(Array.isArray(showings)).toBe(true);
      expect(showings.length).toBeGreaterThan(0);
    });

    for (let i = 0; i < showings.length; i++) {
      const showing = showings[i];

      it(`"${label}" showings[${i}].date is YYYY-MM-DD`, () => {
        expect(typeof showing.date).toBe('string');
        expect(showing.date).toMatch(DATE_REGEX);
      });

      if (showing.time != null) {
        it(`"${label}" showings[${i}].time is HH:MM`, () => {
          expect(showing.time).toMatch(TIME_REGEX);
        });
      }

      if (showing.venue_id != null) {
        it(`"${label}" showings[${i}].venue_id "${showing.venue_id}" is a known venue`, () => {
          expect(
            validVenueIds.has(showing.venue_id),
            `Unknown venue_id "${showing.venue_id}" in ${label}[${i}]`
          ).toBe(true);
        });
      }

      if (showing.status != null) {
        it(`"${label}" showings[${i}].status is valid enum`, () => {
          expect(['scheduled', 'sold-out', 'cancelled']).toContain(showing.status);
        });
      }
    }
  }
});

// ─── Tickets validation ───────────────────────────────────────────────────────

describe('Event scheduling — tickets validation', () => {
  const filesWithTickets = allFiles.filter((f) => {
    const { data } = matter(readFileSync(f, 'utf-8'));
    return data.tickets != null;
  });

  for (const filePath of filesWithTickets) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const { tickets } = data;

    if (Array.isArray(tickets?.platforms)) {
      for (let i = 0; i < tickets.platforms.length; i++) {
        const platform = tickets.platforms[i];

        it(`"${label}" tickets.platforms[${i}].name is non-empty string`, () => {
          expect(typeof platform.name).toBe('string');
          expect(platform.name.length).toBeGreaterThan(0);
        });

        it(`"${label}" tickets.platforms[${i}].url is valid URL`, () => {
          expect(() => new URL(platform.url)).not.toThrow();
        });
      }
    }

    if (Array.isArray(tickets?.pricing)) {
      for (let i = 0; i < tickets.pricing.length; i++) {
        const tier = tickets.pricing[i];

        it(`"${label}" tickets.pricing[${i}].type is non-empty string`, () => {
          expect(typeof tier.type).toBe('string');
          expect(tier.type.length).toBeGreaterThan(0);
        });

        it(`"${label}" tickets.pricing[${i}].price is positive number`, () => {
          expect(typeof tier.price).toBe('number');
          expect(tier.price).toBeGreaterThan(0);
        });
      }
    }

    if (tickets?.school_groups != null) {
      it(`"${label}" tickets.school_groups.url is valid URL`, () => {
        expect(() => new URL(tickets.school_groups.url)).not.toThrow();
      });
    }
  }
});

// ─── Venue ID lookup ──────────────────────────────────────────────────────────

describe('Event scheduling — venue ID lookup', () => {
  it('knowledge-base/venues/ directory contains venue files', () => {
    expect(existsSync(VENUES_ROOT)).toBe(true);
    expect(validVenueIds.size).toBeGreaterThan(0);
  });

  const allVenueIdUsages: Array<{ label: string; venueId: string; context: string }> = [];

  for (const filePath of allFiles) {
    const { data } = matter(readFileSync(filePath, 'utf-8'));
    const label = filePath.replace(CONTENT_ROOT + '/', '');

    if (data.premiere?.venue_id) {
      allVenueIdUsages.push({ label, venueId: data.premiere.venue_id, context: 'premiere' });
    }
    for (const showing of data.showings ?? []) {
      if (showing.venue_id) {
        allVenueIdUsages.push({ label, venueId: showing.venue_id, context: 'showing' });
      }
    }
  }

  for (const { label, venueId, context } of allVenueIdUsages) {
    it(`"${label}" ${context} venue_id "${venueId}" resolves in knowledge-base`, () => {
      expect(
        validVenueIds.has(venueId),
        `venue_id "${venueId}" not found in knowledge-base/venues/`
      ).toBe(true);
    });
  }
});

// ─── Calendar date parsing ────────────────────────────────────────────────────

describe('Event scheduling — calendar date parsing', () => {
  const filesWithShowings = allFiles.filter((f) => {
    const { data } = matter(readFileSync(f, 'utf-8'));
    return Array.isArray(data.showings) && data.showings.length > 0;
  });

  const filesWithPremiere = allFiles.filter((f) => {
    const { data } = matter(readFileSync(f, 'utf-8'));
    return data.premiere?.date != null;
  });

  for (const filePath of filesWithPremiere) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');
    const { data } = matter(readFileSync(filePath, 'utf-8'));

    it(`"${label}" premiere.date is a valid calendar date`, () => {
      const d = new Date(data.premiere.date);
      expect(isNaN(d.getTime()), `Invalid date "${data.premiere.date}" in ${label}`).toBe(false);
      expect(d.getFullYear()).toBeGreaterThanOrEqual(2000);
      expect(d.getFullYear()).toBeLessThanOrEqual(2100);
    });
  }

  for (const filePath of filesWithShowings) {
    const label = filePath.replace(CONTENT_ROOT + '/', '');
    const { data } = matter(readFileSync(filePath, 'utf-8'));

    it(`"${label}" all showings dates are valid calendar dates`, () => {
      for (const showing of data.showings) {
        const d = new Date(showing.date);
        expect(isNaN(d.getTime()), `Invalid date "${showing.date}" in ${label}`).toBe(false);
        // Sanity check: year is reasonable (2000–2100)
        expect(d.getFullYear()).toBeGreaterThanOrEqual(2000);
        expect(d.getFullYear()).toBeLessThanOrEqual(2100);
      }
    });
  }

  it('all premiere and showings dates can be sorted chronologically', () => {
    const allDates: Date[] = [];
    for (const filePath of filesWithPremiere) {
      const { data } = matter(readFileSync(filePath, 'utf-8'));
      allDates.push(new Date(data.premiere.date));
    }
    for (const filePath of filesWithShowings) {
      const { data } = matter(readFileSync(filePath, 'utf-8'));
      for (const showing of data.showings) {
        allDates.push(new Date(showing.date));
      }
    }
    const sorted = [...allDates].sort((a, b) => a.getTime() - b.getTime());
    expect(sorted.every((d) => !isNaN(d.getTime()))).toBe(true);
  });
});
