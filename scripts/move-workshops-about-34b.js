#!/usr/bin/env node

/**
 * Move Workshop and About Files to Folder Structure
 *
 * Moves workshop and about/team files from flat directory structure into hierarchical folders:
 * - Workshops: workshopid-*.md → {lang}/workshops/*.md
 * - About: meist.md, tegijad.md, auhinnad.md → et/about/*.md
 * - About: about.md, about-us.md → en/about/*.md
 *
 * Usage:
 *   node scripts/move-workshops-about-34b.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run: Show what would be moved without actually moving files
 *   --verbose: Print detailed progress
 *
 * Related Issue: #47
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
 * Extract workshop name from filename
 * e.g., "workshopid-meelekolu-mangud-mindstuff-games.md" -> "meelekolu-mangud-mindstuff-games"
 * e.g., "workshops-future-movers.md" -> "future-movers"
 */
function extractWorkshopName(filename, lang) {
  if (lang === 'en') {
    // Remove "workshopid-" or "workshops-" prefix
    return filename
      .replace(/^workshopid-/, '')
      .replace(/^workshops-/, '')
      .replace(/-en\.md$/, '.md') // Remove -en suffix if present
      .replace(/\.md$/, '');
  } else {
    // Remove "workshopid-" prefix
    return filename
      .replace(/^workshopid-/, '')
      .replace(/\.md$/, '');
  }
}

/**
 * Extract about page name from filename
 * e.g., "meist.md" -> "meist"
 * e.g., "about-us.md" -> "about-us"
 */
function extractAboutName(filename) {
  return filename.replace(/\.md$/, '');
}

/**
 * Determine if file is a workshop detail page
 */
function isWorkshopDetail(filename, lang) {
  if (lang === 'en') {
    return filename.startsWith('workshopid-') ||
           (filename.startsWith('workshops-') && filename !== 'workshops.md');
  } else {
    return filename.startsWith('workshopid-') && filename !== 'workshopid.md';
  }
}

/**
 * Determine if file is an about page
 */
function isAboutPage(filename, lang) {
  if (lang === 'et') {
    return ['meist.md', 'tegijad.md', 'auhinnad.md'].includes(filename);
  } else {
    // Move about.md and about-us.md to about/ folder
    // about.md becomes about/index.md (section page)
    return filename === 'about.md' || filename === 'about-us.md';
  }
}

/**
 * Build file mappings for all workshop and about files
 */
function buildMappings() {
  ['en', 'et'].forEach(lang => {
    const langDir = path.join(CONTENT_DIR, lang);
    if (!fs.existsSync(langDir)) {
      console.error(`❌ Directory not found: ${langDir}`);
      return;
    }

    const files = fs.readdirSync(langDir)
      .filter(file => file.endsWith('.md'));

    files.forEach(file => {
      const oldPath = path.join(langDir, file);
      let newPath;
      let targetFolder;
      let newFilename;

      // Handle workshop detail pages
      if (isWorkshopDetail(file, lang)) {
        targetFolder = 'workshops';
        const workshopName = extractWorkshopName(file, lang);
        newFilename = `${workshopName}.md`;
        newPath = path.join(langDir, targetFolder, newFilename);

        fileMappings.push({
          oldPath,
          newPath,
          lang,
          file,
          newFilename,
          targetFolder,
          type: 'workshop-detail',
        });
      }
      // Handle about pages
      else if (isAboutPage(file, lang)) {
        targetFolder = 'about';
        let newFilename;
        let aboutName = extractAboutName(file);

        // about.md becomes index.md in about/ folder (section page)
        if (file === 'about.md') {
          newFilename = 'index.md';
        } else {
          newFilename = `${aboutName}.md`;
        }

        newPath = path.join(langDir, targetFolder, newFilename);

        fileMappings.push({
          oldPath,
          newPath,
          lang,
          file,
          newFilename,
          targetFolder,
          type: 'about',
        });
      }
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
 * Update translated field paths in frontmatter
 */
function updateTranslatedPaths(filePath, oldRelativePath, newRelativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  let updatedFrontmatter = frontmatter;

  // Update translated field if it exists
  if (frontmatter.includes('translated:')) {
    // Match translated array entries
    updatedFrontmatter = updatedFrontmatter.replace(
      new RegExp(`(slug:\\s*)${oldRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      `$1${newRelativePath}`
    );
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

      // Update translated paths in all files
      // This is a simplified approach - in practice, we'd need to update all files
      // that reference the moved files, but that's complex and can be done separately

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
  console.log('Move Workshop and About Files to Folder Structure');
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
