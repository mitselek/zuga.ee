#!/usr/bin/env node

/**
 * Fix slug and translated fields in moved performance files
 *
 * Updates:
 * 1. Slug field to use just performance name (e.g., "shame" not "performances-for-adults-shame")
 * 2. Translated field slugs to match new structure
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = 'apps/web/src/content/pages';

// Performance name mappings for translated fields
const performanceMappings = {
  en: {
    'shame': 'habi',
    'care': 'hool',
    'noise': 'mura',
    'tempo': 'tempo',
    'the-great-unknown': 'suur-teadmatus',
    '2-2-22': '2-2-22',
    'ilma': 'weather-or-not',
    'kaeik': 'thepassage',
    'meelekolu': null, // No EN equivalent
    'mis-sul-viga-on': 'whats-wrong-with-you',
    'uperpall': 'topsy-turvy',
    'voluvaerk': 'magic-stuff',
    'zugazuugzuh-zuh-zuh': null, // No EN equivalent
    'inthemood': null, // No ET equivalent
  },
  et: {
    'habi': 'shame',
    'hool': 'care',
    'mura': 'noise',
    'tempo': 'tempo',
    'suur-teadmatus': 'the-great-unknown',
    '2-2-22': '2-2-22',
    'ilma': 'weather-or-not',
    'kaeik': 'thepassage',
    'meelekolu': null,
    'mis-sul-viga-on': 'whats-wrong-with-you',
    'uperpall': 'topsy-turvy',
    'voluvaerk': 'magic-stuff',
    'zugazuugzuh-zuh-zuh': null,
    'naine-ja-hunt': null, // No EN equivalent
  },
};

function fixFile(filePath, lang) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return content;
  }

  let frontmatter = frontmatterMatch[1];
  const bodyContent = content.slice(frontmatterMatch[0].length);
  const filename = path.basename(filePath, '.md');

  // Skip index files
  if (filename === 'index') {
    return content;
  }

  // Fix slug - remove all slug entries, add correct one
  frontmatter = frontmatter.replace(/^slug:.*$/gm, '');
  frontmatter = frontmatter.replace(/\n\n+/g, '\n');

  // Add correct slug after title
  if (/^title:/.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^(title:.*)$/m, `$1\nslug: ${filename}`);
  }

  // Fix translated field
  const otherLang = lang === 'en' ? 'et' : 'en';
  const otherSlug = performanceMappings[lang]?.[filename];

  if (otherSlug) {
    // Update translated slug
    const translatedPattern = new RegExp(
      `(translated:\\s*\\n\\s*-\\s*language:\\s*${otherLang}\\s*\\n\\s*slug:\\s*)[^\\n]+`,
      'm'
    );

    if (translatedPattern.test(frontmatter)) {
      frontmatter = frontmatter.replace(translatedPattern, `$1${otherSlug}`);
    }
  }

  return `---\n${frontmatter}\n---${bodyContent}`;
}

// Process all performance files
['en', 'et'].forEach(lang => {
  const performancesDir = path.join(CONTENT_DIR, lang, 'performances');
  if (!fs.existsSync(performancesDir)) {
    return;
  }

  ['for-adults', 'for-young-audiences'].forEach(audience => {
    const audienceDir = path.join(performancesDir, audience);
    if (!fs.existsSync(audienceDir)) {
      return;
    }

    const files = fs.readdirSync(audienceDir)
      .filter(file => file.endsWith('.md') && file !== 'index.md');

    files.forEach(file => {
      const filePath = path.join(audienceDir, file);
      const fixedContent = fixFile(filePath, lang);
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed: ${lang}/performances/${audience}/${file}`);
    });
  });
});

console.log('\n✅ All performance files fixed!');
