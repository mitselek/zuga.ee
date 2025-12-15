#!/usr/bin/env node

/**
 * Migration script for Issue #54: Migrate to event scheduling system
 *
 * Converts legacy premiere_date and venue fields to new premiere object structure.
 * Keeps old fields for backward compatibility during transition.
 *
 * Usage:
 *   node scripts/migrate-to-event-system.js --dry-run
 *   node scripts/migrate-to-event-system.js
 */

const fs = require('fs');
const path = require('path');

// Try to load dependencies from knowledge-base/node_modules
const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base');
const nodeModulesPath = path.join(knowledgeBasePath, 'node_modules');

let yaml;
try {
  try {
    yaml = require(path.join(nodeModulesPath, 'js-yaml'));
  } catch {
    yaml = require('js-yaml');
  }
} catch (error) {
  console.error('❌ Error: js-yaml not found. Please install it:');
  console.error('   cd knowledge-base && npm install js-yaml');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const SKIP_BACKUPS = process.argv.includes('--skip-backups');

const CONTENT_DIR = 'apps/web/src/content/pages';

/**
 * Map venue names to venue IDs
 */
const VENUE_NAME_TO_ID = {
  // Estonian names
  'Sõltumatu Tantsu Lava': 'stl',
  'Kanuti Gildi SAAL': 'kanuti-gildi-saal',
  'Kumu Kunstimuuseum': 'kumu',
  'Rakvere Teater': 'rakvere-teater',
  // English names
  'Independent Dance Stage': 'stl',
  'Kanuti Gildi SAAL': 'kanuti-gildi-saal',
  'Kumu Art Museum': 'kumu',
  'Rakvere Theatre': 'rakvere-teater',
};

/**
 * Normalize date string to YYYY-MM-DD format
 */
function normalizeDate(dateValue) {
  if (!dateValue) return null;

  // If already a string in YYYY-MM-DD format
  if (typeof dateValue === 'string') {
    // Handle ISO date strings (2011-10-08T00:00:00.000Z)
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
  }

  // If Date object, convert to YYYY-MM-DD
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Map venue name to venue_id
 */
function mapVenueToId(venueName) {
  if (!venueName) return null;

  // Direct match
  if (VENUE_NAME_TO_ID[venueName]) {
    return VENUE_NAME_TO_ID[venueName];
  }

  // Case-insensitive match
  const lowerVenueName = venueName.toLowerCase();
  for (const [name, id] of Object.entries(VENUE_NAME_TO_ID)) {
    if (name.toLowerCase() === lowerVenueName) {
      return id;
    }
  }

  // No match found - return null (venue_id will be omitted)
  return null;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      if (SKIP_BACKUPS && (file.name.includes('.backup') || file.name.includes('source_zuga_ee'))) {
        continue;
      }
      findMarkdownFiles(filePath, fileList);
    } else if (file.isFile() && file.name.endsWith('.md')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return { error: 'No frontmatter found (missing --- delimiters)' };
    }

    const frontmatterYaml = frontmatterMatch[1];
    const data = yaml.load(frontmatterYaml, { schema: yaml.DEFAULT_SCHEMA });

    return { data, content, frontmatterMatch };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const { data, content, frontmatterMatch, error } = parseFrontmatter(filePath);

  if (error) {
    console.error(`❌ Error parsing ${filePath}: ${error}`);
    return null;
  }

  if (!frontmatterMatch) {
    return null; // No frontmatter, skip
  }

  // Check if file has premiere_date or venue fields
  const hasPremiereDate = data.premiere_date !== undefined;
  const hasVenue = data.venue !== undefined;

  if (!hasPremiereDate && !hasVenue) {
    return null; // Nothing to migrate
  }

  // Skip if premiere object already exists (already migrated)
  if (data.premiere) {
    if (VERBOSE) {
      console.log(`⏭️  Skipping ${path.relative(process.cwd(), filePath)}: already has premiere object`);
    }
    return null;
  }

  let modified = false;
  const newData = { ...data };

  // Migrate premiere_date → premiere.date
  if (hasPremiereDate && !newData.premiere) {
    const normalizedDate = normalizeDate(data.premiere_date);

    if (normalizedDate) {
      newData.premiere = {
        date: normalizedDate,
      };
      modified = true;

      if (VERBOSE) {
        console.log(`  ✓ Migrated premiere_date: ${data.premiere_date} → premiere.date: ${normalizedDate}`);
      }
    } else {
      console.warn(`⚠️  Could not normalize premiere_date in ${filePath}: ${data.premiere_date}`);
    }
  }

  // Migrate venue → premiere.venue_id
  if (hasVenue && newData.premiere) {
    const venueId = mapVenueToId(data.venue);

    if (venueId) {
      newData.premiere.venue_id = venueId;
      modified = true;

      if (VERBOSE) {
        console.log(`  ✓ Migrated venue: "${data.venue}" → premiere.venue_id: ${venueId}`);
      }
    } else {
      console.warn(`⚠️  Could not map venue "${data.venue}" to venue_id in ${filePath}`);
      if (VERBOSE) {
        console.log(`    Available venues: ${Object.keys(VENUE_NAME_TO_ID).join(', ')}`);
      }
    }
  }

  if (!modified) {
    return null; // No changes made
  }

  // Reconstruct file content
  const updatedFrontmatter = yaml.dump(newData, { indent: 2, lineWidth: -1 });
  const bodyContent = content.slice(frontmatterMatch[0].length);
  const updatedContent = `---\n${updatedFrontmatter}---${bodyContent}`;

  return {
    filePath,
    updatedContent,
    changes: {
      premiere_date: hasPremiereDate,
      venue: hasVenue,
    },
  };
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Migrate to Event Scheduling System');
  console.log('='.repeat(60));

  // Find all markdown files
  const allFiles = findMarkdownFiles(CONTENT_DIR);
  console.log(`\n📄 Found ${allFiles.length} markdown files to process`);

  const filesToUpdate = [];

  // Process each file
  for (const filePath of allFiles) {
    const result = processFile(filePath);
    if (result) {
      filesToUpdate.push(result);
    }
  }

  if (filesToUpdate.length === 0) {
    console.log('\n✅ No files need updating (all already migrated or no premiere_date/venue fields found)');
    return;
  }

  console.log(`\n📊 Found ${filesToUpdate.length} files to update:`);
  filesToUpdate.forEach((file, index) => {
    console.log(`   ${index + 1}. ${path.relative(process.cwd(), file.filePath)}`);
    if (file.changes.premiere_date) {
      console.log(`      → Migrating premiere_date → premiere.date`);
    }
    if (file.changes.venue) {
      console.log(`      → Migrating venue → premiere.venue_id`);
    }
  });

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - No files will be modified');
    console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n🚀 Applying updates...');
    let updatedCount = 0;

    for (const file of filesToUpdate) {
      try {
        fs.writeFileSync(file.filePath, file.updatedContent, 'utf8');
        if (VERBOSE) console.log(`✅ Updated: ${path.relative(process.cwd(), file.filePath)}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${file.filePath}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully updated ${updatedCount} files`);
    console.log('\nNext steps:');
    console.log('1. Test build: cd apps/web && npm run build');
    console.log('2. Verify pages render correctly');
    console.log('3. Check that premiere objects are correctly populated');
    console.log('='.repeat(60));
  }
}

main();
