#!/usr/bin/env node

/**
 * Migration Script: Articles Collection to Source Attribution Schema
 *
 * Migrates article files from legacy field names to new source attribution schema.
 * Part of Issue #42: [#31a] Migrate articles collection to new schema
 *
 * Transformations:
 * - Rename `url`/`source` → `source_url`
 * - Rename `publication` → `source_publication`
 * - Rename `author` → `source_author`
 * - Add `archived_date: 2025-12-14`
 * - Fix type enums: `preview-article` → `preview`
 * - Fix date formats: YYYY-MM → YYYY-MM-01
 * - Map `type` to `source_type` appropriately
 * - Use `date` as `source_date` if full date format
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BACKUP_DIR = process.argv.find(arg => arg.startsWith('--backup='))?.split('=')[1];

// Safety check: Verify backup exists
if (!BACKUP_DIR) {
  const backups = fs.readdirSync('knowledge-base').filter(d => d.startsWith('articles.backup'));
  if (backups.length === 0) {
    console.error('❌ ERROR: No backup found. Create backup before running migration.');
    console.error('   Run: cp -r knowledge-base/articles knowledge-base/articles.backup.$(date +%Y%m%d_%H%M%S)');
    process.exit(1);
  }
  console.log(`✅ Backup found: ${backups[0]}`);
}

// Field mapping configuration
const fieldMappings = {
  'url': 'source_url',
  'source': 'source_url', // Both url and source map to source_url
  'publication': 'source_publication',
  'author': 'source_author',
};

// Type enum fixes
const enumFixes = {
  'preview-article': 'preview',
};

// Map article type to source_type
const typeToSourceType = {
  'article': 'article',
  'review': 'review',
  'interview': 'interview',
  'preview': 'preview',
  'news': 'news',
  'radio-interview': 'radio',
  'radio': 'radio',
  'television-program': 'television',
  'television': 'television',
};

// Date format fixes (YYYY-MM to YYYY-MM-01)
const fixDateFormat = (dateStr) => {
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  return dateStr;
};

// Process files - allow specific files to be passed as arguments
const articlesDir = 'knowledge-base/articles';
const args = process.argv.slice(2);
const fileArgs = args.filter(arg => !arg.startsWith('--') && arg.endsWith('.md'));

let files;
if (fileArgs.length > 0) {
  // Specific files provided as arguments
  files = fileArgs.map(f => {
    // Handle both relative and absolute paths
    if (path.isAbsolute(f)) {
      return f;
    }
    return path.isAbsolute(f) ? f : path.join(process.cwd(), f);
  });
} else {
  // Process all files
  files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(articlesDir, f));
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
    let articleType = null;

    // Apply field mappings
    Object.entries(fieldMappings).forEach(([oldField, newField]) => {
      const regex = new RegExp(`^${oldField}:`, 'gm');
      if (regex.test(frontmatter)) {
        // Handle special case: both 'url' and 'source' map to 'source_url'
        // If both exist, prefer 'url', otherwise use whichever exists
        if (oldField === 'source' && /^url:/m.test(frontmatter)) {
          // url takes precedence, remove source
          frontmatter = frontmatter.replace(/^source:.*$/gm, '');
          if (VERBOSE) console.log(`  Removed duplicate 'source' (keeping 'url')`);
        } else {
          frontmatter = frontmatter.replace(regex, `${newField}:`);
          if (VERBOSE) console.log(`  Renamed: ${oldField} → ${newField}`);
        }
      }
    });

    // Extract type for source_type mapping
    const typeMatch = frontmatter.match(/^type:\s*(.+)$/m);
    if (typeMatch) {
      articleType = typeMatch[1].trim();

      // Fix type enum
      if (enumFixes[articleType]) {
        const oldType = articleType;
        const newType = enumFixes[articleType];
        frontmatter = frontmatter.replace(/^type:\s*.+$/m, `type: ${newType}`);
        articleType = newType;
        if (VERBOSE) console.log(`  Fixed enum: ${oldType} → ${newType}`);
      }

      // Check if source_type already exists
      if (/^source_type:/m.test(frontmatter)) {
        needsSourceType = false;
      }
    }

    // Add source_type if needed
    if (needsSourceType && articleType && typeToSourceType[articleType]) {
      const sourceType = typeToSourceType[articleType];
      // Insert after type field
      frontmatter = frontmatter.replace(/^(type:.*)$/m, `$1\nsource_type: ${sourceType}`);
      if (VERBOSE) console.log(`  Added: source_type: ${sourceType}`);
    }

    // Fix date formats (for source_date and archived_date)
    frontmatter = frontmatter.replace(/^(source_date|archived_date):\s*(\d{4}-\d{2})(?!-\d{2})$/gm,
      (match, field, date) => {
        const fixed = fixDateFormat(date);
        if (VERBOSE && fixed !== date) console.log(`  Fixed date format: ${field}: ${date} → ${fixed}`);
        return `${field}: ${fixed}`;
      });

    // Use date field as source_date if source_date doesn't exist
    const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
    if (dateMatch && !/^source_date:/m.test(frontmatter)) {
      let dateValue = dateMatch[1].trim();
      // Convert YYYY-MM to YYYY-MM-01 for source_date
      if (/^\d{4}-\d{2}$/.test(dateValue)) {
        dateValue = fixDateFormat(dateValue);
        if (VERBOSE) console.log(`  Converted date format: ${dateMatch[1].trim()} → ${dateValue} for source_date`);
      }
      // Use if it's a full date format (YYYY-MM-DD or YYYY-MM converted to YYYY-MM-01)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        // Insert source_date after date field
        frontmatter = frontmatter.replace(/^(date:.*)$/m, `$1\nsource_date: ${dateValue}`);
        if (VERBOSE) console.log(`  Added: source_date: ${dateValue} (from date field)`);
      }
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
