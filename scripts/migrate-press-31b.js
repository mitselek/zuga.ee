#!/usr/bin/env node

/**
 * Migration Script: Press Collection to Source Attribution Schema
 *
 * Migrates press release files from legacy field names to new source attribution schema.
 * Part of Issue #43: [#31b] Migrate press collection to new schema
 *
 * Transformations:
 * - Rename `source` → `source_url` (if URL)
 * - Add `issued_by: ZUGA` (required for press releases)
 * - Add `issued_date` from existing `date` field (with format conversion)
 * - Add `archived_date: 2025-12-14`
 * - Add `source_type` mapped from `type` field
 * - Fix date formats: YYYY-MM → YYYY-MM-01
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BACKUP_DIR = process.argv.find(arg => arg.startsWith('--backup='))?.split('=')[1];

// Safety check: Verify backup exists
if (!BACKUP_DIR) {
  const backups = fs.readdirSync('knowledge-base').filter(d => d.startsWith('press.backup'));
  if (backups.length === 0) {
    console.error('❌ ERROR: No backup found. Create backup before running migration.');
    console.error('   Run: cp -r knowledge-base/press knowledge-base/press.backup.$(date +%Y%m%d_%H%M%S)');
    process.exit(1);
  }
  console.log(`✅ Backup found: ${backups[0]}`);
}

// Map press type to source_type
const typeToSourceType = {
  'press-release': 'press_release',
  'announcement': 'announcement',
  'media-kit': 'media_kit',
  'promotional': 'promotional',
};

// Date format fixes (YYYY-MM to YYYY-MM-01)
const fixDateFormat = (dateStr) => {
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  return dateStr;
};

// Check if string is a URL
const isUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

// Process files - allow specific files to be passed as arguments
const pressDir = 'knowledge-base/press';
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
  files = fs.readdirSync(pressDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(pressDir, f));
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

    // Track if we need to add source_type
    let needsSourceType = true;
    let pressType = null;

    // Extract type for source_type mapping
    const typeMatch = frontmatter.match(/^type:\s*(.+)$/m);
    if (typeMatch) {
      pressType = typeMatch[1].trim();

      // Check if source_type already exists
      if (/^source_type:/m.test(frontmatter)) {
        needsSourceType = false;
      }
    }

    // Add source_type if needed
    if (needsSourceType && pressType && typeToSourceType[pressType]) {
      const sourceType = typeToSourceType[pressType];
      // Insert after type field
      frontmatter = frontmatter.replace(/^(type:.*)$/m, `$1\nsource_type: ${sourceType}`);
      if (VERBOSE) console.log(`  Added: source_type: ${sourceType}`);
    }

    // Rename source to source_url if it's a URL
    const sourceMatch = frontmatter.match(/^source:\s*(.+)$/m);
    if (sourceMatch) {
      const sourceValue = sourceMatch[1].trim();
      if (isUrl(sourceValue)) {
        frontmatter = frontmatter.replace(/^source:/m, 'source_url:');
        if (VERBOSE) console.log(`  Renamed: source → source_url (URL detected)`);
      }
      // If not a URL, leave as source (legacy field, optional)
    }

    // Use date field as issued_date if issued_date doesn't exist
    const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
    if (dateMatch && !/^issued_date:/m.test(frontmatter)) {
      let dateValue = dateMatch[1].trim();
      // Convert YYYY-MM to YYYY-MM-01 for issued_date
      if (/^\d{4}-\d{2}$/.test(dateValue)) {
        dateValue = fixDateFormat(dateValue);
        if (VERBOSE) console.log(`  Converted date format: ${dateMatch[1].trim()} → ${dateValue} for issued_date`);
      }
      // Use if it's a full date format (YYYY-MM-DD or YYYY-MM converted to YYYY-MM-01)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        // Insert issued_date after date field
        frontmatter = frontmatter.replace(/^(date:.*)$/m, `$1\nissued_date: ${dateValue}`);
        if (VERBOSE) console.log(`  Added: issued_date: ${dateValue} (from date field)`);
      }
    }

    // Add issued_by if missing
    if (!/^issued_by:/m.test(frontmatter)) {
      frontmatter += `\nissued_by: ZUGA`;
      if (VERBOSE) console.log(`  Added: issued_by: ZUGA`);
    }

    // Add archived_date if missing
    if (!/^archived_date:/m.test(frontmatter)) {
      frontmatter += `\narchived_date: 2025-12-14`;
      if (VERBOSE) console.log(`  Added: archived_date: 2025-12-14`);
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
