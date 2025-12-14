#!/usr/bin/env node

/**
 * Generate Rename Mapping for Issue #33
 *
 * Analyzes English files with `english-*` prefix and generates mapping
 * to category-based naming convention matching Estonian files.
 */

const fs = require('fs');
const path = require('path');

const enDir = 'apps/web/src/content/pages/en';
const etDir = 'apps/web/src/content/pages/et';

// Extract slug from filename (remove .md extension)
const getSlugFromFilename = (filename) => {
  return path.basename(filename, '.md');
};

// Extract slug from translated field
const getTranslatedSlug = (content) => {
  // Match multi-line format: translated:\n- language: et\n  slug: xxx
  const lines = content.split('\n');
  let inTranslated = false;
  let foundEt = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^translated:/)) {
      inTranslated = true;
      continue;
    }
    if (inTranslated && lines[i].match(/^\s*-\s*language:\s*et/)) {
      foundEt = true;
      continue;
    }
    if (inTranslated && foundEt && lines[i].match(/^\s+slug:\s*(.+)$/)) {
      return lines[i].match(/^\s+slug:\s*(.+)$/)[1].trim();
    }
    if (inTranslated && !lines[i].match(/^\s*-?\s*/)) {
      // End of translated block
      break;
    }
  }

  return null;
};

// Determine new filename based on category and subcategory
const determineNewFilename = (oldFilename, category, subcategory, translatedSlug) => {
  const slug = getSlugFromFilename(oldFilename).replace(/^english-/, '');

  if (category === 'workshopid') {
    return `workshops-${slug}.md`;
  }

  if (category === 'about') {
    // For about pages, try to simplify slug (remove redundant "about-" prefix)
    const cleanSlug = slug.replace(/^about-/, '').replace(/-1$/, '');
    return `about-${cleanSlug}.md`;
  }

  if (category === 'etendused') {
    if (subcategory === 'noorele-publikule') {
      return `performances-for-young-audiences-${slug}.md`;
    }
    if (subcategory === 'suurtele') {
      return `performances-for-adults-${slug}.md`;
    }

    // No subcategory - check translated field to infer
    if (translatedSlug) {
      if (translatedSlug.startsWith('etendused-noorele-publikule-')) {
        return `performances-for-young-audiences-${slug}.md`;
      }
      if (translatedSlug.startsWith('etendused-suurtele-')) {
        return `performances-for-adults-${slug}.md`;
      }
    }

    // Default: assume for adults if no subcategory and no translated field
    console.warn(`⚠️  No subcategory or translated field for ${oldFilename}, defaulting to for-adults`);
    return `performances-for-adults-${slug}.md`;
  }

  // Fallback: keep original name but remove english- prefix
  return slug + '.md';
};

// Process files
const files = fs.readdirSync(enDir)
  .filter(f => f.startsWith('english-') && f.endsWith('.md'))
  .map(f => path.join(enDir, f));

const mapping = {};

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    console.error(`⚠️  No frontmatter in ${file}`);
    return;
  }

  const frontmatter = frontmatterMatch[1];
  const categoryMatch = frontmatter.match(/^category:\s*(.+)$/m);
  const subcategoryMatch = frontmatter.match(/^subcategory:\s*(.+)$/m);
  const translatedSlug = getTranslatedSlug(frontmatter);

  const category = categoryMatch ? categoryMatch[1].trim() : null;
  const subcategory = subcategoryMatch ? subcategoryMatch[1].trim() : null;

  const oldFilename = path.basename(file);
  const newFilename = determineNewFilename(oldFilename, category, subcategory, translatedSlug);

  mapping[file] = path.join(enDir, newFilename);

  console.log(`${oldFilename} → ${newFilename} (category: ${category}, subcategory: ${subcategory || 'none'})`);
});

// Output JSON mapping
const mappingJson = JSON.stringify(mapping, null, 2);
fs.writeFileSync('rename-map-33.json', mappingJson);
console.log(`\n✅ Generated rename-map-33.json with ${Object.keys(mapping).length} mappings`);
