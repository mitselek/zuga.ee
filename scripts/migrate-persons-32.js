#!/usr/bin/env node

/**
 * Migration Script: Persons Collection - Add Source Attribution
 *
 * Adds required source attribution fields to person profile files.
 * Part of Issue #32: Add source attribution to person profiles
 *
 * Transformations:
 * - Add `source_url: internal://zuga-team-bios`
 * - Add `source_type: bio`
 * - Add `archived_date: 2025-12-14`
 * - Optionally add `retrieved_via` if specified
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BACKUP_DIR = process.argv.find(arg => arg.startsWith('--backup='))?.split('=')[1];

// Source attribution policy (Option A: Internal docs)
const SOURCE_URL = 'internal://zuga-team-bios';
const SOURCE_TYPE = 'bio';
const ARCHIVED_DATE = '2025-12-14';

// Safety check: Verify backup exists
if (!BACKUP_DIR) {
  const backups = fs.readdirSync('knowledge-base').filter(d => d.startsWith('persons.backup'));
  if (backups.length === 0) {
    console.error('❌ ERROR: No backup found. Create backup before running migration.');
    console.error('   Run: cp -r knowledge-base/persons knowledge-base/persons.backup.$(date +%Y%m%d_%H%M%S)');
    process.exit(1);
  }
  console.log(`✅ Backup found: ${backups[0]}`);
}

// Process files - allow specific files to be passed as arguments
const personsDir = 'knowledge-base/persons';
const args = process.argv.slice(2);
const fileArgs = args.filter(arg => !arg.startsWith('--') && arg.endsWith('.md'));

let files;
if (fileArgs.length > 0) {
  // Specific files provided as arguments
  files = fileArgs.map(f => {
    return path.isAbsolute(f) ? f : path.join(process.cwd(), f);
  });
} else {
  // Process all files
  files = fs.readdirSync(personsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(personsDir, f));
}

let stats = {
  total: files.length,
  changed: 0,
  errors: [],
};

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      if (VERBOSE) console.log(`⚠️  Skipping ${file}: No frontmatter found`);
      return;
    }

    let frontmatter = frontmatterMatch[1];
    const bodyContent = content.slice(frontmatterMatch[0].length);

    // Check if source attribution already exists
    const hasSourceUrl = /^source_url:/m.test(frontmatter);
    const hasSourceType = /^source_type:/m.test(frontmatter);
    const hasArchivedDate = /^archived_date:/m.test(frontmatter);

    // Add source_url if missing
    if (!hasSourceUrl) {
      // Insert after name field (or role if name not found)
      if (/^name:/m.test(frontmatter)) {
        frontmatter = frontmatter.replace(/^(name:.*)$/m, `$1\nsource_url: ${SOURCE_URL}`);
      } else if (/^role:/m.test(frontmatter)) {
        frontmatter = frontmatter.replace(/^(role:.*)$/m, `$1\nsource_url: ${SOURCE_URL}`);
      } else {
        // Add at the beginning if neither found
        frontmatter = `source_url: ${SOURCE_URL}\n${frontmatter}`;
      }
      if (VERBOSE) console.log(`  Added: source_url: ${SOURCE_URL}`);
    }

    // Add source_type if missing
    if (!hasSourceType) {
      // Insert after source_url
      frontmatter = frontmatter.replace(/^(source_url:.*)$/m, `$1\nsource_type: ${SOURCE_TYPE}`);
      if (VERBOSE) console.log(`  Added: source_type: ${SOURCE_TYPE}`);
    }

    // Add archived_date if missing
    if (!hasArchivedDate) {
      // Insert after source_type (or at end if not found)
      if (/^source_type:/m.test(frontmatter)) {
        frontmatter = frontmatter.replace(/^(source_type:.*)$/m, `$1\narchived_date: ${ARCHIVED_DATE}`);
      } else {
        frontmatter += `\narchived_date: ${ARCHIVED_DATE}`;
      }
      if (VERBOSE) console.log(`  Added: archived_date: ${ARCHIVED_DATE}`);
    }

    // Reconstruct content
    content = `---\n${frontmatter}\n---${bodyContent}`;

    // Write or show changes
    if (content !== original) {
      stats.changed++;
      if (DRY_RUN) {
        console.log(`Would change: ${file}`);
      } else {
        fs.writeFileSync(file, content);
        console.log(`✅ Migrated: ${file}`);
      }
    } else {
      if (VERBOSE) console.log(`  No changes needed: ${file}`);
    }
  } catch (error) {
    stats.errors.push({ file, error: error.message });
    console.error(`❌ Error processing ${file}: ${error.message}`);
  }
});

// Report
console.log(`\n📊 Migration Summary:`);
console.log(`   Total files: ${stats.total}`);
console.log(`   ${DRY_RUN ? 'Would change' : 'Changed'}: ${stats.changed}`);
console.log(`   Unchanged: ${stats.total - stats.changed}`);
console.log(`   Errors: ${stats.errors.length}`);
if (stats.errors.length > 0) {
  console.log(`\n❌ Errors:`);
  stats.errors.forEach(({ file, error }) => console.log(`   - ${file}: ${error}`));
  process.exit(1);
}

if (DRY_RUN) {
  console.log(`\n⚠️  DRY RUN MODE - No files were modified`);
  console.log(`   Run without --dry-run to apply changes`);
} else {
  console.log(`\n✅ Migration complete!`);
  console.log(`   Next step: Run validation: cd knowledge-base && npm run validate`);
}
