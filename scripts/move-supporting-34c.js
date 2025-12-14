#!/usr/bin/env node

/**
 * Move Supporting Pages to Folder Structure
 *
 * Moves remaining supporting pages (gallery, contact, news, section indexes) into hierarchical folders:
 * - Gallery files → {lang}/gallery/*.md
 * - Contact files → {lang}/contact/*.md
 * - News files → {lang}/news/*.md
 * - Section indexes stay in root (they're section pages, not detail pages)
 *
 * Usage:
 *   node scripts/move-supporting-34c.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run: Show what would be moved without actually moving files
 *   --verbose: Print detailed progress
 *
 * Related Issue: #48
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const CONTENT_DIR = 'apps/web/src/content/pages';

// Mapping: old path -> new path
const fileMappings = [];

/**
 * Extract page name from filename
 */
function extractPageName(filename) {
  return filename.replace(/\.md$/, '');
}

/**
 * Determine target folder and filename for a file
 */
function getTargetMapping(filename, lang) {
  // Gallery files
  if (filename.startsWith('galerii') || filename.startsWith('gallery')) {
    const pageName = extractPageName(filename);
    // galerii.md becomes index.md (main gallery page)
    if (filename === 'galerii.md' || filename === 'gallery-section.md') {
      return { folder: 'gallery', filename: 'index.md', type: 'gallery-section' };
    }
    // Other gallery files keep their names
    return { folder: 'gallery', filename: filename, type: 'gallery-detail' };
  }

  // Contact files
  if (filename.startsWith('kontakt') || filename === 'contact.md') {
    const pageName = extractPageName(filename);
    // kontakt.md becomes index.md (main contact page)
    if (filename === 'kontakt.md' || filename === 'contact.md') {
      return { folder: 'contact', filename: 'index.md', type: 'contact-section' };
    }
    // Other contact files keep their names
    return { folder: 'contact', filename: filename, type: 'contact-detail' };
  }

  // News files
  if (filename.startsWith('press') || filename === 'uudised.md') {
    return { folder: 'news', filename: filename, type: 'news' };
  }

  // Section indexes stay in root (handled separately)
  const sectionIndexes = {
    et: ['etendused.md', 'workshopid.md'],
    en: ['performances.md', 'workshops.md'],
  };

  if (sectionIndexes[lang]?.includes(filename)) {
    return null; // Don't move section indexes
  }

  return null;
}

/**
 * Build file mappings for all supporting files
 */
function buildMappings() {
  ['en', 'et'].forEach(lang => {
    const langDir = path.join(CONTENT_DIR, lang);
    if (!fs.existsSync(langDir)) {
      console.error(`❌ Directory not found: ${langDir}`);
      return;
    }

    const files = fs.readdirSync(langDir)
      .filter(file => file.endsWith('.md'))
      .filter(file => file !== 'index.md'); // Don't move home page

    files.forEach(file => {
      const mapping = getTargetMapping(file, lang);
      if (!mapping) {
        return; // Skip files that shouldn't be moved
      }

      const oldPath = path.join(langDir, file);
      const newPath = path.join(langDir, mapping.folder, mapping.filename);

      fileMappings.push({
        oldPath,
        newPath,
        lang,
        file,
        newFilename: mapping.filename,
        targetFolder: mapping.folder,
        type: mapping.type,
      });
    });
  });
}

/**
 * Update slug field in frontmatter
 */
function updateSlug(filePath, newSlug) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    console.warn(`⚠️  No frontmatter found in: ${filePath}`);
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  let updatedFrontmatter = frontmatter;

  // Update slug field
  if (frontmatter.includes('slug:')) {
    updatedFrontmatter = updatedFrontmatter.replace(
      /^slug:\s*.+$/m,
      `slug: ${newSlug}`
    );
  } else {
    // Add slug field after title or language
    const insertAfter = frontmatter.match(/^(title|language):\s*.+$/m);
    if (insertAfter) {
      const insertPos = frontmatter.indexOf(insertAfter[0]) + insertAfter[0].length;
      updatedFrontmatter =
        frontmatter.slice(0, insertPos) +
        `\nslug: ${newSlug}` +
        frontmatter.slice(insertPos);
    } else {
      // Add at the end of frontmatter
      updatedFrontmatter = frontmatter + `\nslug: ${newSlug}`;
    }
  }

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFrontmatter}\n---`);
}

/**
 * Execute file moves
 */
function executeMoves() {
  console.log(`\n${DRY_RUN ? '🔍 DRY RUN' : '🚀 EXECUTING'} - Moving ${fileMappings.length} files...\n`);

  // Create target directories
  const targetDirs = new Set();
  fileMappings.forEach(mapping => {
    const dir = path.dirname(mapping.newPath);
    targetDirs.add(dir);
  });

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      if (DRY_RUN) {
        console.log(`📁 Would create directory: ${dir}`);
      } else {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }
  });

  // Move files
  fileMappings.forEach((mapping, index) => {
    const { oldPath, newPath, lang, file, newFilename, targetFolder, type } = mapping;
    const relativeOldPath = path.relative(process.cwd(), oldPath);
    const relativeNewPath = path.relative(process.cwd(), newPath);

    if (VERBOSE || DRY_RUN) {
      console.log(`\n[${index + 1}/${fileMappings.length}] ${type}: ${file}`);
      console.log(`   ${relativeOldPath}`);
      console.log(`   → ${relativeNewPath}`);
    }

    if (DRY_RUN) {
      return;
    }

    try {
      // Read and update frontmatter
      let content = fs.readFileSync(oldPath, 'utf8');

      // Update slug to use new filename (without extension)
      const newSlug = newFilename.replace(/\.md$/, '');
      content = updateSlug(oldPath, newSlug);

      // Use git mv to preserve history
      execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });

      // Write updated content
      fs.writeFileSync(newPath, content, 'utf8');

      if (!VERBOSE) {
        console.log(`✅ ${file} → ${targetFolder}/${newFilename}`);
      }
    } catch (error) {
      console.error(`❌ Error moving ${file}: ${error.message}`);
      process.exit(1);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Move Supporting Pages to Folder Structure');
  console.log('='.repeat(60));

  buildMappings();

  if (fileMappings.length === 0) {
    console.log('\n⚠️  No files found to move.');
    return;
  }

  console.log(`\n📊 Found ${fileMappings.length} files to move:`);
  fileMappings.forEach((mapping, index) => {
    console.log(`   ${index + 1}. ${mapping.type}: ${mapping.file} → ${mapping.targetFolder}/${mapping.newFilename}`);
  });

  executeMoves();

  console.log('\n' + '='.repeat(60));
  if (DRY_RUN) {
    console.log('✅ Dry run complete. Run without --dry-run to execute moves.');
  } else {
    console.log('✅ All files moved successfully!');
    console.log('\nNext steps:');
    console.log('1. Test build: cd apps/web && npm run build');
    console.log('2. Verify URLs are stable');
    console.log('3. Update any KnB used_in_pages references if populated');
  }
  console.log('='.repeat(60));
}

main();
