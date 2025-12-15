/**
 * Venue utilities for loading and resolving venue data from knowledge-base
 *
 * Loads venue information from knowledge-base/venues/ markdown files
 * and provides lookup functions for resolving venue_id → venue name
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Venue {
  id: string;
  name: {
    et: string;
    en?: string;
  };
  short_name?: string;
  address: {
    street: string;
    city: string;
    postal_code?: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity?: number;
  accessibility?: {
    wheelchair?: boolean;
    elevator?: boolean;
    hearing_loop?: boolean;
  };
  parking?: {
    available: boolean;
    details?: string;
  };
  transit?: {
    tram?: string[];
    bus?: string[];
    nearest_stop?: string;
  };
  website?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
  status: 'active' | 'inactive' | 'temporary';
}

let venuesCache: Map<string, Venue> | null = null;

/**
 * Load all venues from knowledge-base/venues/
 * Caches results for performance
 */
export function loadVenues(): Map<string, Venue> {
  if (venuesCache) {
    return venuesCache;
  }

  // Resolve path relative to project root
  // Try multiple path resolution strategies for compatibility
  let projectRoot: string;
  try {
    // Astro build context: resolve from current working directory
    projectRoot = process.cwd();
    // If we're in apps/web, go up to project root
    if (projectRoot.endsWith('apps/web') || projectRoot.endsWith('apps\\web')) {
      projectRoot = path.resolve(projectRoot, '../..');
    }
  } catch {
    // Fallback: assume we're at project root
    projectRoot = process.cwd();
  }
  const venuesDir = path.join(projectRoot, 'knowledge-base', 'venues');
  const venues = new Map<string, Venue>();

  try {
    if (!fs.existsSync(venuesDir)) {
      console.warn(`Venues directory not found: ${venuesDir}`);
      return venues;
    }

    const files = fs.readdirSync(venuesDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(venuesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;

      try {
        const data = yaml.load(frontmatterMatch[1]) as Venue;
        if (data.id && data.status === 'active') {
          venues.set(data.id, data);
        }
      } catch (error) {
        console.warn(`Error parsing venue file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading venues:', error);
  }

  venuesCache = venues;
  return venues;
}

/**
 * Get venue by ID
 */
export function getVenue(venueId: string): Venue | undefined {
  const venues = loadVenues();
  return venues.get(venueId);
}

/**
 * Get venue name in specified language
 */
export function getVenueName(venueId: string, language: 'et' | 'en' = 'et'): string {
  const venue = getVenue(venueId);
  if (!venue) return venueId; // Fallback to ID if venue not found

  if (language === 'en' && venue.name.en) {
    return venue.name.en;
  }
  return venue.name.et;
}

/**
 * Get venue short name or fallback to full name
 */
export function getVenueShortName(venueId: string, language: 'et' | 'en' = 'et'): string {
  const venue = getVenue(venueId);
  if (!venue) return venueId;

  if (venue.short_name) {
    return venue.short_name;
  }
  return getVenueName(venueId, language);
}
