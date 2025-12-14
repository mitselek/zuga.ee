#!/usr/bin/env node

/**
 * Populate KnB→Web Bidirectional Links (used_in_pages)
 *
 * Analyzes web page knowledge_base_sources to build reverse mapping
 * and populate used_in_pages field in KnB files.
 *
 * Usage:
 *   node scripts/populate-knb-links.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run: Show what would be added without modifying files
 *   --verbose: Print detailed matching information
 *
 * Related Issue: #49
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

const WEB_CONTENT_DIR = 'apps/web/src/content/pages';
const KNB_DIR = 'knowledge-base';

/**
 * Parse markdown frontmatter
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return { error: 'No frontmatter found' };
    }

    const frontmatterYaml = frontmatterMatch[1];
    const data = yaml.load(frontmatterYaml);

    return { data, content, frontmatterMatch };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Build reverse mapping: KnB file → web pages that reference it
 */
function buildReverseMapping() {
  const mapping = new Map(); // KnB file path → array of web page paths

  // Collect all web pages
  function collectPages(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const pages = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Skip backup directories
        if (!entry.name.includes('.backup')) {
          pages.push(...collectPages(fullPath, relativePath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        pages.push({ fullPath, relativePath });
      }
    }

    return pages;
  }

  const pages = collectPages(WEB_CONTENT_DIR);

  console.log(`📄 Scanning ${pages.length} web pages for knowledge_base_sources...\n`);

  for (const { fullPath, relativePath } of pages) {
    const { data, error } = parseFrontmatter(fullPath);

    if (error || !data.knowledge_base_sources) {
      continue;
    }

    const sources = data.knowledge_base_sources;

    // Process each source type
    for (const [type, files] of Object.entries(sources)) {
      if (!files || !Array.isArray(files)) continue;

      for (const knbFile of files) {
        // Normalize path (remove leading slash if present)
        const normalizedKnbPath = knbFile.startsWith('/') ? knbFile.slice(1) : knbFile;

        if (!mapping.has(normalizedKnbPath)) {
          mapping.set(normalizedKnbPath, []);
        }

        // Add web page path (relative to pages/ directory, with .md extension)
        // Format: et/performances/for-adults/habi.md (per schema requirement)
        const webPagePath = relativePath; // Keep .md extension
        if (!mapping.get(normalizedKnbPath).includes(webPagePath)) {
          mapping.get(normalizedKnbPath).push(webPagePath);
        }
      }
    }
  }

  return mapping;
}

/**
 * Update KnB file frontmatter with used_in_pages
 */
function updateKnBFile(knbFilePath, webPagePaths) {
  const fullPath = path.join(KNB_DIR, knbFilePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  KnB file not found: ${knbFilePath}`);
    return null;
  }

  const { data, content, frontmatterMatch, error } = parseFrontmatter(fullPath);

  if (error) {
    console.warn(`⚠️  Error parsing ${knbFilePath}: ${error}`);
    return null;
  }

  // Sort web page paths for consistency
  const sortedPaths = webPagePaths.sort();

  // Check if used_in_pages already exists
  const existingPaths = data.used_in_pages || [];
  const allPaths = [...new Set([...existingPaths, ...sortedPaths])].sort();

  // Only update if there are new paths
  if (allPaths.length === existingPaths.length &&
      allPaths.every((p, i) => p === existingPaths[i])) {
    return null; // No changes needed
  }

  const frontmatter = frontmatterMatch[1];
  let updatedFrontmatter = frontmatter;

  // Update or add used_in_pages field
  if (frontmatter.includes('used_in_pages:')) {
    // Update existing field
    const pathsYaml = yaml.dump(allPaths, { indent: 2 }).replace(/^/gm, '  ');
    updatedFrontmatter = frontmatter.replace(
      /^used_in_pages:\s*\n(?:  - [^\n]+\n)*/m,
      `used_in_pages:\n${pathsYaml}`
    );
  } else {
    // Add new field before closing ---
    const pathsYaml = yaml.dump(allPaths, { indent: 2 }).replace(/^/gm, '  ');
    updatedFrontmatter = frontmatter + `\nused_in_pages:\n${pathsYaml}`;
  }

  const updatedContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFrontmatter}\n---`);

  return { fullPath, updatedContent, oldPaths: existingPaths, newPaths: allPaths };
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Populate KnB→Web Bidirectional Links (used_in_pages)');
  console.log('='.repeat(60));

  const mapping = buildReverseMapping();

  if (mapping.size === 0) {
    console.log('\n⚠️  No KnB files referenced by web pages.');
    console.log('   Make sure Issue #50 is complete (knowledge_base_sources populated).');
    return;
  }

  console.log(`\n📊 Found ${mapping.size} KnB files with incoming references:\n`);

  const updates = [];

  for (const [knbFile, webPages] of mapping.entries()) {
    if (VERBOSE || DRY_RUN) {
      console.log(`${knbFile}:`);
      webPages.forEach(wp => console.log(`  ← ${wp}`));
      console.log('');
    }

    const update = updateKnBFile(knbFile, webPages);
    if (update) {
      updates.push({ knbFile, ...update });
    }
  }

  if (updates.length === 0) {
    console.log('✅ All KnB files already have correct used_in_pages entries.');
    return;
  }

  console.log(`\n📝 Found ${updates.length} KnB files to update:\n`);

  updates.forEach((update, index) => {
    const newCount = update.newPaths.length - update.oldPaths.length;
    console.log(`${index + 1}. ${update.knbFile}`);
    console.log(`   ${update.oldPaths.length} → ${update.newPaths.length} pages (+${newCount})`);
    if (VERBOSE) {
      update.newPaths.forEach(p => console.log(`     - ${p}`));
    }
    console.log('');
  });

  if (DRY_RUN) {
    console.log('='.repeat(60));
    console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
    return;
  }

  // Apply updates
  console.log('\n🚀 Applying updates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      fs.writeFileSync(update.fullPath, update.updatedContent, 'utf8');
      successCount++;

      if (VERBOSE) {
        console.log(`✅ Updated ${update.knbFile}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${update.knbFile}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully updated ${successCount} KnB files`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} errors`);
  }
  console.log('\nNext steps:');
  console.log('1. Validate: node scripts/validate-all.js --knb-only');
  console.log('2. Validate bidirectional links: node scripts/validate-all.js --links-only');
  console.log('='.repeat(60));
}

main();
