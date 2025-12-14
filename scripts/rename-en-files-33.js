#!/usr/bin/env node

/**
 * Rename EN Files Script for Issue #33
 *
 * Renames English web content files from `english-*` pattern to category-based
 * naming convention matching Estonian files.
 *
 * Steps:
 * 1. Rename files using git mv
 * 2. Update slug fields in renamed files
 * 3. Update translated fields in ET files (bidirectional)
 * 4. Update translated fields in EN files (bidirectional)
 * 5. Update any KnB used_in_pages references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const MAPPING_FILE = 'rename-map-33.json';

// Load rename mapping
if (!fs.existsSync(MAPPING_FILE)) {
  console.error(`❌ ERROR: Mapping file not found: ${MAPPING_FILE}`);
  console.error('   Run: node scripts/generate-rename-map-33.js first');
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
const renamePairs = Object.entries(mapping);

console.log(`📋 Loaded ${renamePairs.length} file rename mappings\n`);

// Step 1: Rename files
console.log('Step 1: Renaming files...\n');
const slugUpdates = [];

renamePairs.forEach(([oldPath, newPath]) => {
  const oldBasename = path.basename(oldPath, '.md');
  const newBasename = path.basename(newPath, '.md');

  if (DRY_RUN) {
    console.log(`Would rename: ${oldBasename} → ${newBasename}`);
  } else {
    try {
      execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });
      console.log(`✅ Renamed: ${oldBasename} → ${newBasename}`);
      slugUpdates.push({ file: newPath, oldSlug: oldBasename, newSlug: newBasename });
    } catch (error) {
      console.error(`❌ Error renaming ${oldPath}: ${error.message}`);
      process.exit(1);
    }
  }
});

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN MODE - No files were renamed');
  process.exit(0);
}

// Step 2: Update slug fields in renamed files
console.log('\nStep 2: Updating slug fields...\n');
slugUpdates.forEach(({ file, oldSlug, newSlug }) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Update slug field
    content = content.replace(/^slug:\s*.+$/m, `slug: ${newSlug}`);

    if (content !== original) {
      fs.writeFileSync(file, content);
      if (VERBOSE) console.log(`  Updated slug in: ${path.basename(file)}`);
    }
  } catch (error) {
    console.error(`❌ Error updating slug in ${file}: ${error.message}`);
  }
});

// Step 3: Update translated fields in ET files
console.log('\nStep 3: Updating translated fields in ET files...\n');
const etDir = 'apps/web/src/content/pages/et';
const etFiles = fs.readdirSync(etDir)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(etDir, f));

let etFilesUpdated = 0;
renamePairs.forEach(([oldPath, newPath]) => {
  const oldSlug = path.basename(oldPath, '.md');
  const newSlug = path.basename(newPath, '.md');

  etFiles.forEach(etFile => {
    try {
      let content = fs.readFileSync(etFile, 'utf8');
      const original = content;

      // Update translated field if it references the old slug
      const translatedRegex = new RegExp(`(translated:\\s*\\n\\s*-\\s*language:\\s*en\\s*\\n\\s+slug:\\s*)${oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      if (translatedRegex.test(content)) {
        content = content.replace(translatedRegex, `$1${newSlug}`);
        fs.writeFileSync(etFile, content);
        etFilesUpdated++;
        if (VERBOSE) console.log(`  Updated ET file: ${path.basename(etFile)} (${oldSlug} → ${newSlug})`);
      }
    } catch (error) {
      // Skip if file can't be read
    }
  });
});

console.log(`✅ Updated ${etFilesUpdated} ET file(s)`);

// Step 4: Update translated fields in EN files (bidirectional)
console.log('\nStep 4: Updating translated fields in EN files...\n');
const enDir = 'apps/web/src/content/pages/en';
const enFiles = fs.readdirSync(enDir)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(enDir, f));

let enFilesUpdated = 0;
renamePairs.forEach(([oldPath, newPath]) => {
  const oldSlug = path.basename(oldPath, '.md');
  const newSlug = path.basename(newPath, '.md');

  enFiles.forEach(enFile => {
    try {
      let content = fs.readFileSync(enFile, 'utf8');
      const original = content;

      // Update translated field if it references the old slug
      const translatedRegex = new RegExp(`(translated:\\s*\\n\\s*-\\s*language:\\s*et\\s*\\n\\s+slug:\\s*)${oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      if (translatedRegex.test(content)) {
        content = content.replace(translatedRegex, `$1${newSlug}`);
        fs.writeFileSync(enFile, content);
        enFilesUpdated++;
        if (VERBOSE) console.log(`  Updated EN file: ${path.basename(enFile)} (${oldSlug} → ${newSlug})`);
      }
    } catch (error) {
      // Skip if file can't be read
    }
  });
});

console.log(`✅ Updated ${enFilesUpdated} EN file(s)`);

// Step 5: Update KnB used_in_pages references
console.log('\nStep 5: Updating KnB used_in_pages references...\n');
const knbDirs = ['knowledge-base/articles', 'knowledge-base/persons', 'knowledge-base/press', 'knowledge-base/research'];
let knbFilesUpdated = 0;

renamePairs.forEach(([oldPath, newPath]) => {
  const oldFilename = path.basename(oldPath);
  const newFilename = path.basename(newPath);

  knbDirs.forEach(knbDir => {
    if (!fs.existsSync(knbDir)) return;

    const knbFiles = fs.readdirSync(knbDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(knbDir, f));

    knbFiles.forEach(knbFile => {
      try {
        let content = fs.readFileSync(knbFile, 'utf8');
        const original = content;

        // Update used_in_pages array if it contains the old filename
        // Match: used_in_pages:\n  - en/english-xxx.md
        const usedInPagesRegex = new RegExp(`(used_in_pages:\\s*\\n(?:\\s*-\\s*[^\\n]+\\n)*\\s*-\\s*)en/${oldFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        if (usedInPagesRegex.test(content)) {
          content = content.replace(usedInPagesRegex, `$1en/${newFilename}`);
          fs.writeFileSync(knbFile, content);
          knbFilesUpdated++;
          if (VERBOSE) console.log(`  Updated KnB file: ${path.basename(knbFile)} (${oldFilename} → ${newFilename})`);
        }
      } catch (error) {
        // Skip if file can't be read
      }
    });
  });
});

console.log(`✅ Updated ${knbFilesUpdated} KnB file(s)`);

console.log('\n✅ Rename operation complete!');
console.log(`\nNext steps:`);
console.log(`  1. Review changes: git diff`);
console.log(`  2. Validate: cd apps/web && npm run build`);
console.log(`  3. Commit: git commit -m "refactor(web): Standardize EN file naming"`);
