#!/usr/bin/env node

/**
 * Populate Web→KnB References (knowledge_base_sources)
 *
 * Analyzes web page content to identify KnB references and populates
 * knowledge_base_sources field in web page frontmatter.
 *
 * Usage:
 *   node scripts/populate-web-links.js [--dry-run] [--verbose] [--review]
 *
 * Options:
 *   --dry-run: Show what would be added without modifying files
 *   --verbose: Print detailed matching information
 *   --review: Show suggestions for manual review (semi-automated mode)
 *
 * Related Issue: #50
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
const REVIEW_MODE = process.argv.includes('--review');

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
 * Load all KnB articles and build URL/title index
 */
function loadKnBArticles() {
  const articlesDir = path.join(KNB_DIR, 'articles');
  const articles = [];

  if (!fs.existsSync(articlesDir)) {
    return articles;
  }

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const { data } = parseFrontmatter(filePath);

    if (data && !data.error) {
      articles.push({
        file: `articles/${file}`,
        slug: file.replace(/\.md$/, ''),
        title: data.title || '',
        source_url: data.source_url || '',
        source_publication: data.source_publication || '',
        author: data.source_author || data.author || '',
        date: data.date || '',
      });
    }
  }

  return articles;
}

/**
 * Load all KnB persons and build name index
 */
function loadKnBPersons() {
  const personsDir = path.join(KNB_DIR, 'persons');
  const persons = [];

  if (!fs.existsSync(personsDir)) {
    return persons;
  }

  const files = fs.readdirSync(personsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(personsDir, file);
    const { data } = parseFrontmatter(filePath);

    if (data && !data.error) {
      const nameParts = (data.name || '').split(' ');
      persons.push({
        file: `persons/${file}`,
        slug: file.replace(/\.md$/, ''),
        name: data.name || '',
        firstName: nameParts[0] || '',
        lastName: nameParts[nameParts.length - 1] || '',
        fullName: data.name || '',
      });
    }
  }

  return persons;
}

/**
 * Normalize URL for comparison (extract domain and path)
 */
function normalizeUrl(url) {
  try {
    // Remove protocol, www, and trailing slashes
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Match article URLs in page content to KnB articles
 */
function findArticleMatches(pageContent, articles) {
  const matches = [];

  // Extract URLs from markdown links: [text](url)
  const urlPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = urlPattern.exec(pageContent)) !== null) {
    const [, linkText, url] = match;

    // Normalize URLs for comparison
    const normalizedPageUrl = normalizeUrl(url);

    // Try to match by full URL or URL path
    for (const article of articles) {
      if (!article.source_url) continue;

      const normalizedArticleUrl = normalizeUrl(article.source_url);

      // Match if URLs are similar (domain + path match)
      if (normalizedPageUrl === normalizedArticleUrl ||
          normalizedPageUrl.includes(normalizedArticleUrl.split('/').pop()) ||
          normalizedArticleUrl.includes(normalizedPageUrl.split('/').pop())) {
        if (!matches.find(m => m.file === article.file)) {
          matches.push({
            file: article.file,
            confidence: 'high',
            reason: `URL match: ${url}`,
          });
          break;
        }
      }
    }

    // Try to match by publication and author/date
    if (linkText.includes('ERR') || linkText.includes('EPL') || linkText.includes('CriticalDance') || linkText.includes('Postimees')) {
      // Extract date from link text if present (e.g., "13.11.2024")
      const dateMatch = linkText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      let year, month, day;
      if (dateMatch) {
        [, day, month, year] = dateMatch;
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');
      }

      const pubMatch = articles.find(a => {
        // Match publication
        const pubMatch = linkText.includes(a.source_publication) ||
                        (a.source_publication && linkText.toLowerCase().includes(a.source_publication.toLowerCase().split(' ')[0]));

        // Match author if present
        const authorMatch = a.author && linkText.includes(a.author);

        // Match date if present
        let dateMatch = true;
        if (year && a.date) {
          const articleDateStr = String(a.date);
          const articleYear = articleDateStr.substring(0, 4);
          dateMatch = articleYear === year;
          if (month && dateMatch && articleDateStr.length >= 7) {
            const articleMonth = articleDateStr.substring(5, 7);
            dateMatch = articleMonth === month;
          }
        }

        return (pubMatch || authorMatch) && dateMatch;
      });

      if (pubMatch && !matches.find(m => m.file === pubMatch.file)) {
        matches.push({
          file: pubMatch.file,
          confidence: 'medium',
          reason: `Publication/author/date match: ${linkText}`,
        });
      }
    }
  }

  // Also search for article titles in content (partial match)
  for (const article of articles) {
    if (article.title) {
      // Try full title match
      if (pageContent.includes(article.title)) {
        if (!matches.find(m => m.file === article.file)) {
          matches.push({
            file: article.file,
            confidence: 'medium',
            reason: `Title match: ${article.title}`,
          });
        }
      } else {
        // Try partial title match (first 5 words)
        const titleWords = article.title.split(' ').slice(0, 5).join(' ');
        if (titleWords.length > 20 && pageContent.includes(titleWords)) {
          if (!matches.find(m => m.file === article.file)) {
            matches.push({
              file: article.file,
              confidence: 'low',
              reason: `Partial title match: ${titleWords}`,
            });
          }
        }
      }
    }
  }

  return matches;
}

/**
 * Match person names in page content to KnB persons
 */
function findPersonMatches(pageContent, persons) {
  const matches = [];

  for (const person of persons) {
    // Match full name
    if (person.name && pageContent.includes(person.name)) {
      matches.push({
        file: person.file,
        confidence: 'high',
        reason: `Full name match: ${person.name}`,
      });
      continue;
    }

    // Match first + last name (if both present)
    if (person.firstName && person.lastName &&
        pageContent.includes(person.firstName) &&
        pageContent.includes(person.lastName)) {
      // Check they're close together (within 50 chars)
      const firstNameIndex = pageContent.indexOf(person.firstName);
      const lastNameIndex = pageContent.indexOf(person.lastName);
      if (Math.abs(firstNameIndex - lastNameIndex) < 50) {
        if (!matches.find(m => m.file === person.file)) {
          matches.push({
            file: person.file,
            confidence: 'medium',
            reason: `Name parts match: ${person.firstName} ${person.lastName}`,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Update frontmatter with knowledge_base_sources
 */
function updateFrontmatter(content, frontmatterMatch, sources) {
  const frontmatter = frontmatterMatch[1];
  let updatedFrontmatter = frontmatter;

  // Build knowledge_base_sources object
  const sourcesObj = {};
  if (sources.articles && sources.articles.length > 0) {
    sourcesObj.articles = sources.articles;
  }
  if (sources.persons && sources.persons.length > 0) {
    sourcesObj.persons = sources.persons;
  }
  if (sources.press && sources.press.length > 0) {
    sourcesObj.press = sources.press;
  }
  if (sources.research && sources.research.length > 0) {
    sourcesObj.research = sources.research;
  }

  if (Object.keys(sourcesObj).length === 0) {
    return content; // No sources to add
  }

  // Check if knowledge_base_sources already exists
  if (frontmatter.includes('knowledge_base_sources:')) {
    // Update existing field
    const sourcesYaml = yaml.dump(sourcesObj, { indent: 2 }).replace(/^/gm, '  ');
    updatedFrontmatter = frontmatter.replace(
      /^knowledge_base_sources:\s*\n(?:  [^\n]+\n)*/m,
      `knowledge_base_sources:\n${sourcesYaml}`
    );
  } else {
    // Add new field before closing ---
    const sourcesYaml = yaml.dump(sourcesObj, { indent: 2 }).replace(/^/gm, '  ');
    updatedFrontmatter = frontmatter + `\nknowledge_base_sources:\n${sourcesYaml}`;
  }

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFrontmatter}\n---`);
}

/**
 * Process all web pages
 */
function processWebPages() {
  const articles = loadKnBArticles();
  const persons = loadKnBPersons();

  console.log(`📚 Loaded ${articles.length} KnB articles and ${persons.length} KnB persons\n`);

  const updates = [];

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

  console.log(`📄 Processing ${pages.length} web pages...\n`);

  for (const { fullPath, relativePath } of pages) {
    const { data, content, frontmatterMatch, error } = parseFrontmatter(fullPath);

    if (error) {
      if (VERBOSE) {
        console.warn(`⚠️  Skipping ${relativePath}: ${error}`);
      }
      continue;
    }

    // Skip if already has knowledge_base_sources (unless reviewing)
    if (data.knowledge_base_sources && !REVIEW_MODE) {
      continue;
    }

    // Find matches
    const articleMatches = findArticleMatches(content, articles);
    const personMatches = findPersonMatches(content, persons);

    if (articleMatches.length === 0 && personMatches.length === 0) {
      continue; // No matches found
    }

    // Build sources object
    const sources = {
      articles: articleMatches.map(m => m.file),
      persons: personMatches.map(m => m.file),
      press: [],
      research: [],
    };

    // Remove duplicates
    sources.articles = [...new Set(sources.articles)];
    sources.persons = [...new Set(sources.persons)];

    updates.push({
      file: relativePath,
      fullPath,
      sources,
      articleMatches,
      personMatches,
      content,
      frontmatterMatch,
    });
  }

  return updates;
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Populate Web→KnB References (knowledge_base_sources)');
  console.log('='.repeat(60));

  const updates = processWebPages();

  if (updates.length === 0) {
    console.log('\n✅ No pages need updates (or all already have knowledge_base_sources)');
    return;
  }

  console.log(`\n📊 Found ${updates.length} pages to update:\n`);

  // Show summary
  updates.forEach((update, index) => {
    const totalSources = (update.sources.articles?.length || 0) +
                        (update.sources.persons?.length || 0) +
                        (update.sources.press?.length || 0) +
                        (update.sources.research?.length || 0);

    console.log(`${index + 1}. ${update.file}`);
    if (update.sources.articles?.length > 0) {
      console.log(`   Articles: ${update.sources.articles.length}`);
      if (VERBOSE) {
        update.sources.articles.forEach(a => console.log(`     - ${a}`));
      }
    }
    if (update.sources.persons?.length > 0) {
      console.log(`   Persons: ${update.sources.persons.length}`);
      if (VERBOSE) {
        update.sources.persons.forEach(p => console.log(`     - ${p}`));
      }
    }
    console.log(`   Total sources: ${totalSources}\n`);
  });

  if (DRY_RUN || REVIEW_MODE) {
    console.log('='.repeat(60));
    if (DRY_RUN) {
      console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
    } else {
      console.log('✅ Review complete. Run without --review to apply changes.');
    }
    return;
  }

  // Apply updates
  console.log('\n🚀 Applying updates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      const updatedContent = updateFrontmatter(
        update.content,
        update.frontmatterMatch,
        update.sources
      );

      fs.writeFileSync(update.fullPath, updatedContent, 'utf8');
      successCount++;

      if (VERBOSE) {
        console.log(`✅ Updated ${update.file}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${update.file}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully updated ${successCount} pages`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} errors`);
  }
  console.log('\nNext steps:');
  console.log('1. Validate: node scripts/validate-all.js --web-only');
  console.log('2. Test build: cd apps/web && npm run build');
  console.log('3. Run Issue #49 to populate used_in_pages in KnB files');
  console.log('='.repeat(60));
}

main();
