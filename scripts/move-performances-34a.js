#!/usr/bin/env node

/**
 * Move Performance Files to Folder Structure
 *
 * Moves performance files from flat directory structure into hierarchical folders:
 * - ET: etendused-suurtele-*.md → et/performances/for-adults/*.md
 * - ET: etendused-noorele-publikule-*.md → et/performances/for-young-audiences/*.md
 * - EN: performances-for-adults-*.md → en/performances/for-adults/*.md
 * - EN: performances-for-young-audiences-*.md → en/performances/for-young-audiences/*.md
 *
 * Usage:
 *   node scripts/move-performances-34a.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run: Show what would be moved without actually moving files
 *   --verbose: Print detailed progress
 *
 * Related Issue: #46
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
 * Extract performance name from filename
 * e.g., "performances-for-adults-shame.md" -> "shame"
 * e.g., "etendused-suurtele-habi.md" -> "habi"
 */
function extractPerformanceName(filename, lang) {
  if (lang === 'en') {
    // Remove "performances-for-adults-" or "performances-for-young-audiences-" prefix
    return filename
      .replace(/^performances-for-adults-/, '')
      .replace(/^performances-for-young-audiences-/, '')
      .replace(/\.md$/, '');
  } else {
    // Remove "etendused-suurtele-" or "etendused-noorele-publikule-" prefix
    return filename
      .replace(/^etendused-suurtele-/, '')
      .replace(/^etendused-noorele-publikule-/, '')
      .replace(/\.md$/, '');
  }
}

/**
 * Determine target folder based on filename
 */
function getTargetFolder(filename, lang) {
  if (lang === 'en') {
    if (filename.startsWith('performances-for-adults')) {
      return 'performances/for-adults';
    } else if (filename.startsWith('performances-for-young-audiences')) {
      return 'performances/for-young-audiences';
    }
  } else {
    if (filename.startsWith('etendused-suurtele')) {
      return 'performances/for-adults';
    } else if (filename.startsWith('etendused-noorele-publikule')) {
      return 'performances/for-young-audiences';
    }
  }
  return null;
}

/**
 * Build file mappings for all performance files
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
      .filter(file => {
        // Match performance files (detail pages) and section index files
        if (lang === 'en') {
          return file.startsWith('performances-for-adults-') ||
                 file.startsWith('performances-for-young-audiences-') ||
                 file === 'performances-for-adults.md' ||
                 file === 'performances-for-young-audiences.md';
        } else {
          return file.startsWith('etendused-suurtele-') ||
                 file.startsWith('etendused-noorele-publikule-') ||
                 file === 'etendused-suurtele.md' ||
                 file === 'etendused-noorele-publikule.md';
        }
      });

    files.forEach(file => {
      const targetFolder = getTargetFolder(file, lang);
      if (!targetFolder) {
        console.warn(`⚠️  Could not determine target folder for: ${file}`);
        return;
      }

      // Check if this is a section index file
      const isSectionIndex = (lang === 'en' && (file === 'performances-for-adults.md' || file === 'performances-for-young-audiences.md')) ||
                            (lang === 'et' && (file === 'etendused-suurtele.md' || file === 'etendused-noorele-publikule.md'));

      const oldPath = path.join(langDir, file);
      let newPath;
      let performanceName;

      if (isSectionIndex) {
        // Section index files become index.md in their folder
        newPath = path.join(langDir, targetFolder, 'index.md');
        performanceName = 'index';
      } else {
        // Detail pages use extracted performance name
        performanceName = extractPerformanceName(file, lang);
        newPath = path.join(langDir, targetFolder, `${performanceName}.md`);
      }

      fileMappings.push({
        oldPath,
        newPath,
        lang,
        file,
        performanceName,
        targetFolder,
        isSectionIndex,
      });
    });
  });
}

/**
 * Update slug field in frontmatter
 * For section index files, keep original slug or use folder-based slug
 * For detail pages, use performance name
 */
function updateSlug(filePath, newSlug, isSectionIndex, targetFolder) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    console.warn(`⚠️  No frontmatter found in: ${filePath}`);
    return content;
  }

  let frontmatter = frontmatterMatch[1];
  const bodyContent = content.slice(frontmatterMatch[0].length);

  // For section index files, use folder-based slug (e.g., "performances/for-adults")
  // For detail pages, use performance name
  const finalSlug = isSectionIndex ? targetFolder.replace(/\//g, '/') : newSlug;

  // Update slug field - remove all existing slug entries first, then add new one
  frontmatter = frontmatter.replace(/^slug:.*$/gm, '');
  // Remove empty lines that might result
  frontmatter = frontmatter.replace(/\n\n+/g, '\n');

  // Add new slug field after title
  if (/^title:/.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^(title:.*)$/m, `$1\nslug: ${finalSlug}`);
  } else {
    // Add slug field after title
    if (/^title:/.test(frontmatter)) {
      frontmatter = frontmatter.replace(/^(title:.*)$/m, `$1\nslug: ${finalSlug}`);
    } else {
      frontmatter = `slug: ${finalSlug}\n${frontmatter}`;
    }
  }

  return `---\n${frontmatter}\n---${bodyContent}`;
}

/**
 * Update translated field paths in moved files
 */
function updateTranslatedFields(filePath, performanceName, lang) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return content;
  }

  let frontmatter = frontmatterMatch[1];
  const bodyContent = content.slice(frontmatterMatch[0].length);

  // Find the corresponding file in other language
  const otherLang = lang === 'en' ? 'et' : 'en';
  const otherLangMapping = fileMappings.find(m => {
    if (m.lang !== otherLang) return false;
    // Match by performance name
    return m.performanceName === performanceName && !m.isSectionIndex;
  });

  if (otherLangMapping) {
    const otherNewSlug = otherLangMapping.performanceName;

    // Update translated slug - match the pattern more flexibly
    // Pattern: translated:\n  - language: et\n    slug: OLD_SLUG
    const translatedPattern = new RegExp(
      `(translated:\\s*\\n\\s*-\\s*language:\\s*${otherLang}\\s*\\n\\s*slug:\\s*)[^\\n]+`,
      'm'
    );

    if (translatedPattern.test(frontmatter)) {
      frontmatter = frontmatter.replace(translatedPattern, `$1${otherNewSlug}`);
    }
  }

  return `---\n${frontmatter}\n---${bodyContent}`;
}

/**
 * Main execution
 */
function main() {
  console.log('📁 Building file mappings...\n');
  buildMappings();

  if (fileMappings.length === 0) {
    console.log('❌ No performance files found to move.');
    process.exit(1);
  }

  console.log(`Found ${fileMappings.length} performance files to move:\n`);

  // Create directories
  const directories = new Set();
  fileMappings.forEach(({ newPath }) => {
    directories.add(path.dirname(newPath));
  });

  if (!DRY_RUN) {
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (VERBOSE) console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  // Move files
  let movedCount = 0;
  fileMappings.forEach(({ oldPath, newPath, lang, file, performanceName }) => {
    if (!fs.existsSync(oldPath)) {
      console.warn(`⚠️  File not found: ${oldPath}`);
      return;
    }

    if (DRY_RUN) {
      console.log(`Would move: ${oldPath}`);
      console.log(`         → ${newPath}`);
    } else {
      try {
        // Use git mv to preserve history
        execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });

        // Update slug in frontmatter
        const mapping = fileMappings.find(m => m.newPath === newPath);
        const newContent = updateSlug(newPath, performanceName, mapping.isSectionIndex, mapping.targetFolder);
        fs.writeFileSync(newPath, newContent);

        // Update translated fields (will be done in second pass)
        movedCount++;
        if (VERBOSE) {
          console.log(`✅ Moved: ${file} → ${path.basename(newPath)}`);
        }
      } catch (error) {
        console.error(`❌ Error moving ${oldPath}: ${error.message}`);
        process.exit(1);
      }
    }
  });

  // Second pass: Update translated fields (skip section index files)
  if (!DRY_RUN && movedCount > 0) {
    console.log('\n🔄 Updating translated fields...\n');
    fileMappings
      .filter(({ isSectionIndex }) => !isSectionIndex)
      .forEach(({ newPath, lang, performanceName }) => {
        const content = updateTranslatedFields(newPath, performanceName, lang);
        fs.writeFileSync(newPath, content);
        if (VERBOSE) {
          console.log(`✅ Updated translated fields in: ${path.basename(newPath)}`);
        }
      });
  }

  console.log(`\n${DRY_RUN ? 'Would move' : 'Moved'} ${movedCount} files.`);

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to execute the migration.');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('📝 Next steps:');
    console.log('   1. Update KnB used_in_pages references (if any)');
    console.log('   2. Run: cd apps/web && npm run build');
    console.log('   3. Test URLs to ensure they work correctly');
  }
}

main();
