#!/usr/bin/env node

/**
 * Comprehensive Validation Script
 *
 * Validates all KnB files, web content files, registry files, and linking integrity.
 *
 * Usage:
 *   node scripts/validate-all.js [--verbose] [--knb-only] [--web-only] [--registry-only] [--links-only]
 *
 * Options:
 *   --verbose: Print detailed validation output
 *   --knb-only: Only validate KnB files
 *   --web-only: Only validate web content files
 *   --registry-only: Only validate registry files
 *   --links-only: Only check linking integrity
 *
 * Exit codes:
 *   0: All validations passed
 *   1: Validation errors found
 */

const fs = require('fs');
const path = require('path');

// Try to load dependencies from knowledge-base/node_modules
const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base');
const nodeModulesPath = path.join(knowledgeBasePath, 'node_modules');

let yaml, z;
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

try {
  try {
    z = require(path.join(nodeModulesPath, 'zod')).z;
  } catch {
    z = require('zod').z;
  }
} catch (error) {
  console.error('❌ Error: zod not found. Please install it:');
  console.error('   cd knowledge-base && npm install zod');
  process.exit(1);
}

const VERBOSE = process.argv.includes('--verbose');
const KNB_ONLY = process.argv.includes('--knb-only');
const WEB_ONLY = process.argv.includes('--web-only');
const REGISTRY_ONLY = process.argv.includes('--registry-only');
const LINKS_ONLY = process.argv.includes('--links-only');

// If no specific flag, run all validations
const RUN_ALL = !KNB_ONLY && !WEB_ONLY && !REGISTRY_ONLY && !LINKS_ONLY;

/**
 * Parse markdown frontmatter from file
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return { error: 'No frontmatter found (missing --- delimiters)' };
    }

    const frontmatterYaml = frontmatterMatch[1];
    // Use custom schema to preserve dates as strings
    const data = yaml.load(frontmatterYaml, { schema: yaml.DEFAULT_SCHEMA });

    // Convert Date objects to ISO strings (YYYY-MM-DD format)
    function convertDates(obj) {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) {
        return obj.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }
      if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = convertDates(value);
        }
        return result;
      }
      return obj;
    }

    const normalizedData = convertDates(data);

    return { data: normalizedData };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Load registry data
 */
function loadRegistry() {
  const registryPath = path.join(knowledgeBasePath, 'registry', 'performances.yaml');
  try {
    const content = fs.readFileSync(registryPath, 'utf8');
    const data = yaml.load(content);
    return { valid: true, performances: data.performances || [] };
  } catch (error) {
    return { valid: false, error: error.message, performances: [] };
  }
}

/**
 * Define KnB schemas (duplicated from config.ts for Node.js compatibility)
 */
const bilingualSchema = z.object({
  et: z.string().nullable().optional(),
  en: z.string().nullable().optional(),
}).refine(
  (data) => data.et !== null || data.en !== null,
  { message: 'At least one language (et or en) must be provided' }
);

const articleSchema = z.object({
  title: z.string().min(1),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().regex(/^\d{4}-\d{2}$/),
    z.string().regex(/^\d{4}$/),
  ]),
  type: z.enum(['article', 'review', 'interview', 'preview', 'news', 'radio-interview', 'radio', 'television-program', 'television']),
  language: z.enum(['en', 'et']),
  source_url: z.string().url(),
  source_type: z.enum(['article', 'press_release', 'interview', 'review', 'preview', 'news', 'photo', 'video', 'social_media', 'radio', 'television', 'podcast']),
  source_publication: z.string().min(1),
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Optional fields
  source_language: z.enum(['en', 'et', 'other']).optional(),
  source_author: z.string().optional(),
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),
  archive_location: z.string().optional(),
  publication: z.string().optional(),
  author: z.string().optional(),
  url: z.string().url().optional(),
  source: z.string().optional(),
  tags: z.array(z.union([z.string(), z.number()]).transform(val => String(val))).optional(),
  related_performances: z.array(z.string()).optional(),
  performance_date: z.string().optional(),
  venue: z.string().optional(),
  program: z.string().optional(),
  host: z.string().optional(),
  hosts: z.array(z.string()).optional(),
  interviewees: z.array(z.string()).optional(),
  guests: z.array(z.string()).optional(),
  director: z.string().optional(),
  awards: z.array(z.string()).optional(),
  used_in_pages: z.array(z.string()).optional(),
  related_knb: z.object({
    performances: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    articles: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),
  status: z.enum(['active', 'archived', 'review-pending', 'ready-to-publish']).optional(),
});

const personSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  source_url: z.string().url(),
  source_type: z.enum(['bio', 'press_release', 'article', 'interview', 'website']),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),
  member_since: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d{4}$/),
  ]).optional(),
  founding_member: z.boolean().optional(),
  used_in_pages: z.array(z.string()).optional(),
  related_knb: z.object({
    performances: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    articles: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'former', 'current_collaborator', 'regular_collaborator', 'collaborator', 'former_member', 'international_collaborator', 'photographer', 'guest_artist', 'founding_member']).optional(),
});

const pressSchema = z.object({
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().regex(/^\d{4}-\d{2}$/),
    z.string().regex(/^\d{4}$/),
  ]),
  type: z.enum(['press-release', 'announcement', 'media-kit', 'promotional']),
  language: z.enum(['en', 'et']),
  source_type: z.enum(['press_release', 'announcement', 'media_kit', 'promotional']),
  issued_by: z.string().min(1),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_url: z.string().url().optional(),
  distribution: z.enum(['public', 'media_only', 'internal']).optional(),
  source: z.string().optional(),
  publication: z.string().optional(),
  performance: z.string().optional(),
  related_performances: z.array(z.string()).optional(),
  tags: z.array(z.union([z.string(), z.number()]).transform(val => String(val))).optional(),
  used_in_pages: z.array(z.string()).optional(),
  related_knb: z.object({
    performances: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    articles: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),
  status: z.enum(['active', 'archived', 'upcoming', 'draft']).optional(),
});

const researchSchema = z.object({
  type: z.enum(['award', 'research-notes', 'interview', 'production-notes', 'background']),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().regex(/^\d{4}-\d{2}$/),
    z.string().regex(/^\d{4}$/),
    z.number().int().positive(), // Allow year as number
  ]).optional(),
  source_url: z.string().url(),
  source_type: z.enum(['award_announcement', 'grant_info', 'production_notes', 'interview', 'article', 'document']),
  archived_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source_publication: z.string().optional(),
  retrieved_via: z.enum(['web', 'email', 'pdf', 'screenshot', 'physical_copy']).optional(),
  award: z.string().optional(),
  awarded_by: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  organization: z.string().optional(),
  performance: z.string().optional(),
  year: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d{4}$/),
  ]).optional(),
  source: z.string().url().optional(),
  used_in_pages: z.array(z.string()).optional(),
  related_knb: z.object({
    performances: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    articles: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

const venueSchema = z.object({
  id: z.string().min(1),
  name: z.object({
    et: z.string().min(1),
    en: z.string().optional(),
  }),
  short_name: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().optional(),
    country: z.string().default('Estonia'),
  }),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  capacity: z.number().positive().optional(),
  accessibility: z.object({
    wheelchair: z.boolean().optional(),
    elevator: z.boolean().optional(),
    hearing_loop: z.boolean().optional(),
  }).optional(),
  parking: z.object({
    available: z.boolean(),
    details: z.string().optional(),
  }).optional(),
  transit: z.object({
    tram: z.array(z.string()).optional(),
    bus: z.array(z.string()).optional(),
    nearest_stop: z.string().optional(),
  }).optional(),
  website: z.string().url().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'temporary']).default('active'),
});

// Web content schema (simplified - full schema is in apps/web/src/content/config.ts)
const webPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  language: z.enum(['en', 'et']),
  type: z.enum(['home', 'section', 'detail']),
  category: z.enum(['etendused', 'workshopid', 'about', 'gallery', 'contact', 'news']),
  subcategory: z.string().optional(),
  status: z.enum(['published', 'draft']),
  description: z.string().optional(),
  page_type: z.string().optional(),
  original_url: z.string().url().optional(),
  order: z.number().optional(),
  hero_image: z.string().optional(),
  background_color: z.string().optional(),
  gallery: z.array(z.object({
    url: z.string(),
    width: z.number().positive().optional(),
    description: z.string().optional(),
  })).optional(),
  videos: z.array(z.object({
    platform: z.enum(['youtube', 'vimeo', 'err']),
    video_id: z.string().min(1).optional(),
    title: z.string().optional(),
    url: z.string().url(),
    source: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  audio: z.array(z.object({
    platform: z.enum(['soundcloud', 'err', 'custom']),
    track_id: z.string().min(1).optional(),
    title: z.string().optional(),
    url: z.string().url(),
    source: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  translated: z.array(z.object({
    language: z.string(),
    slug: z.string(),
  })).optional(),
  knowledge_base_sources: z.object({
    articles: z.array(z.string()).optional(),
    persons: z.array(z.string()).optional(),
    press: z.array(z.string()).optional(),
    research: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Validate KnB files
 */
function validateKnBFiles() {
  console.log('\n📚 Validating KnB files...\n');

  const collections = {
    articles: { schema: articleSchema, dir: path.join(knowledgeBasePath, 'articles') },
    persons: { schema: personSchema, dir: path.join(knowledgeBasePath, 'persons') },
    press: { schema: pressSchema, dir: path.join(knowledgeBasePath, 'press') },
    research: { schema: researchSchema, dir: path.join(knowledgeBasePath, 'research') },
    venues: { schema: venueSchema, dir: path.join(knowledgeBasePath, 'venues') },
  };

  let totalErrors = 0;
  let totalFiles = 0;

  for (const [collectionName, { schema, dir }] of Object.entries(collections)) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));

    totalFiles += files.length;

    for (const filePath of files) {
      const { data, error: parseError } = parseFrontmatter(filePath);

      if (parseError) {
        console.error(`❌ ${path.relative(process.cwd(), filePath)}: ${parseError}`);
        totalErrors++;
        continue;
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        console.error(`❌ ${path.relative(process.cwd(), filePath)}:`);
        if (VERBOSE) {
          result.error.errors.forEach((err) => {
            console.error(`   - ${err.path.join('.')}: ${err.message}`);
          });
        } else {
          console.error(`   ${result.error.errors[0].path.join('.')}: ${result.error.errors[0].message}`);
        }
        totalErrors++;
      } else if (VERBOSE) {
        console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      }
    }
  }

  console.log(`\n📊 KnB Validation: ${totalFiles} files checked, ${totalErrors} errors`);
  return { errors: totalErrors, files: totalFiles };
}

/**
 * Validate web content files
 */
function validateWebFiles() {
  console.log('\n🌐 Validating web content files...\n');

  const webContentDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'content', 'pages');

  if (!fs.existsSync(webContentDir)) {
    console.error(`❌ Web content directory not found: ${webContentDir}`);
    return { errors: 1, files: 0 };
  }

  const files = [];
  function collectFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  collectFiles(webContentDir);

  let totalErrors = 0;

  for (const filePath of files) {
    const { data, error: parseError } = parseFrontmatter(filePath);

    if (parseError) {
      console.error(`❌ ${path.relative(process.cwd(), filePath)}: ${parseError}`);
      totalErrors++;
      continue;
    }

    const result = webPageSchema.safeParse(data);

    if (!result.success) {
      console.error(`❌ ${path.relative(process.cwd(), filePath)}:`);
      if (VERBOSE) {
        result.error.errors.forEach((err) => {
          console.error(`   - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        console.error(`   ${result.error.errors[0].path.join('.')}: ${result.error.errors[0].message}`);
      }
      totalErrors++;
    } else if (VERBOSE) {
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
    }
  }

  console.log(`\n📊 Web Content Validation: ${files.length} files checked, ${totalErrors} errors`);
  return { errors: totalErrors, files: files.length };
}

/**
 * Validate registry files
 */
function validateRegistry() {
  console.log('\n📋 Validating registry files...\n');

  // Reuse existing registry validation script
  const { execSync } = require('child_process');
  try {
    const output = execSync('node scripts/validate-registry.js', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    // Only show output if verbose or if there are errors
    if (VERBOSE) {
      console.log(output);
    }
    return { errors: 0 };
  } catch (error) {
    const errorOutput = error.stdout || error.message;
    if (VERBOSE || error.code !== 0) {
      console.error(errorOutput);
    }
    return { errors: 1 };
  }
}

/**
 * Check bidirectional linking integrity
 */
function checkLinkingIntegrity() {
  console.log('\n🔗 Checking linking integrity...\n');

  const webContentDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'content', 'pages');
  const knbDirs = {
    articles: path.join(knowledgeBasePath, 'articles'),
    persons: path.join(knowledgeBasePath, 'persons'),
    press: path.join(knowledgeBasePath, 'press'),
    research: path.join(knowledgeBasePath, 'research'),
  };

  // Collect all web pages
  const webPages = new Map();
  function collectWebPages(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      if (entry.isDirectory()) {
        collectWebPages(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const { data } = parseFrontmatter(fullPath);
        if (data && data.knowledge_base_sources) {
          webPages.set(relativePath, data.knowledge_base_sources);
        }
      }
    }
  }

  if (fs.existsSync(webContentDir)) {
    collectWebPages(webContentDir);
  }

  // Collect all KnB files with used_in_pages
  const knbFiles = new Map();
  for (const [type, dir] of Object.entries(knbDirs)) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const { data } = parseFrontmatter(filePath);
      if (data && data.used_in_pages) {
        const knbPath = `${type}/${file}`;
        knbFiles.set(knbPath, data.used_in_pages);
      }
    }
  }

  let errors = 0;

  // Check: If web page references KnB file, does KnB file reference back?
  for (const [webPath, sources] of webPages.entries()) {
    // Normalize web path (ensure it has .md extension for comparison)
    const normalizedWebPath = webPath.endsWith('.md') ? webPath : `${webPath}.md`;

    for (const [type, paths] of Object.entries(sources)) {
      if (!paths) continue;
      for (const knbPath of paths) {
        // Normalize KnB path (remove leading slash if present)
        const normalizedKnbPath = knbPath.startsWith('/') ? knbPath.slice(1) : knbPath;
        const knbFile = knbFiles.get(normalizedKnbPath);

        if (knbFile && !knbFile.includes(normalizedWebPath)) {
          console.error(`⚠️  Bidirectional link missing: ${normalizedWebPath} references ${normalizedKnbPath}, but ${normalizedKnbPath} doesn't reference back`);
          errors++;
        }
        // Check if KnB file exists
        const fullKnbPath = path.join(knowledgeBasePath, normalizedKnbPath);
        if (!fs.existsSync(fullKnbPath)) {
          console.error(`❌ Web page ${normalizedWebPath} references non-existent KnB file: ${normalizedKnbPath}`);
          errors++;
        }
      }
    }
  }

  // Check: If KnB file references web page, does web page reference back?
  for (const [knbPath, webPaths] of knbFiles.entries()) {
    // Normalize KnB path
    const normalizedKnbPath = knbPath.startsWith('/') ? knbPath.slice(1) : knbPath;
    const knbType = normalizedKnbPath.split('/')[0];

    for (const webPath of webPaths) {
      // Normalize web path
      const normalizedWebPath = webPath.endsWith('.md') ? webPath : `${webPath}.md`;
      const sources = webPages.get(normalizedWebPath);

      // Check if web page references this KnB file
      // sources[knbType] contains full paths like "articles/file.md"
      const knbFileInSources = sources && sources[knbType] &&
        sources[knbType].some(p => {
          const normalized = p.startsWith('/') ? p.slice(1) : p;
          return normalized === normalizedKnbPath;
        });

      if (!knbFileInSources) {
        console.error(`⚠️  Bidirectional link missing: ${normalizedKnbPath} references ${normalizedWebPath}, but ${normalizedWebPath} doesn't reference back`);
        errors++;
      }

      // Check if web page exists
      const fullWebPath = path.join(webContentDir, normalizedWebPath);
      if (!fs.existsSync(fullWebPath)) {
        console.error(`❌ KnB file ${normalizedKnbPath} references non-existent web page: ${normalizedWebPath}`);
        errors++;
      }
    }
  }

  console.log(`\n📊 Linking Integrity: ${errors} issues found`);
  return { errors };
}

/**
 * Check for orphaned KnB content
 */
function checkOrphanedKnB() {
  console.log('\n🔍 Checking for orphaned KnB content...\n');

  const webContentDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'content', 'pages');
  const knbDirs = {
    articles: path.join(knowledgeBasePath, 'articles'),
    persons: path.join(knowledgeBasePath, 'persons'),
    press: path.join(knowledgeBasePath, 'press'),
    research: path.join(knowledgeBasePath, 'research'),
  };

  // Collect all KnB files
  const allKnbFiles = [];
  for (const [type, dir] of Object.entries(knbDirs)) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      allKnbFiles.push({ type, file, path: path.join(dir, file) });
    }
  }

  // Collect all web pages that reference KnB files
  const referencedKnbFiles = new Set();
  function collectReferences(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectReferences(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const { data } = parseFrontmatter(fullPath);
        if (data && data.knowledge_base_sources) {
          for (const [type, paths] of Object.entries(data.knowledge_base_sources)) {
            if (paths) {
              for (const knbPath of paths) {
                referencedKnbFiles.add(knbPath);
              }
            }
          }
        }
      }
    }
  }

  if (fs.existsSync(webContentDir)) {
    collectReferences(webContentDir);
  }

  // Find orphaned files
  const orphaned = [];
  for (const { type, file } of allKnbFiles) {
    const knbPath = `${type}/${file}`;
    if (!referencedKnbFiles.has(knbPath)) {
      orphaned.push(knbPath);
    }
  }

  if (orphaned.length > 0) {
    console.log(`⚠️  Found ${orphaned.length} orphaned KnB files (not referenced by any web page):`);
    orphaned.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log('✅ No orphaned KnB files found');
  }

  return { orphaned: orphaned.length };
}

/**
 * Check for unsupported web claims
 */
function checkUnsupportedClaims() {
  console.log('\n⚠️  Checking for unsupported web claims...\n');

  const webContentDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'content', 'pages');

  if (!fs.existsSync(webContentDir)) {
    return { unsupported: 0 };
  }

  const unsupported = [];
  function checkPages(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkPages(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const { data } = parseFrontmatter(fullPath);
        if (data && data.type === 'detail' && (!data.knowledge_base_sources || Object.keys(data.knowledge_base_sources).length === 0)) {
          const relativePath = path.relative(webContentDir, fullPath);
          unsupported.push(relativePath);
        }
      }
    }
  }

  checkPages(webContentDir);

  if (unsupported.length > 0) {
    console.log(`⚠️  Found ${unsupported.length} detail pages without KnB sources:`);
    unsupported.forEach(file => console.log(`   - ${file}`));
    console.log('   Note: These pages may contain claims that cannot be traced to KnB sources.');
  } else {
    console.log('✅ All detail pages have KnB sources');
  }

  return { unsupported: unsupported.length };
}

/**
 * Main validation function
 */
function main() {
  console.log('='.repeat(60));
  console.log('ZUGA Content Architecture Validation');
  console.log('='.repeat(60));

  let totalErrors = 0;
  const results = {};

  if (RUN_ALL || REGISTRY_ONLY) {
    const registryResult = validateRegistry();
    results.registry = registryResult;
    totalErrors += registryResult.errors || 0;
  }

  if (RUN_ALL || KNB_ONLY) {
    const knbResult = validateKnBFiles();
    results.knb = knbResult;
    totalErrors += knbResult.errors || 0;
  }

  if (RUN_ALL || WEB_ONLY) {
    const webResult = validateWebFiles();
    results.web = webResult;
    totalErrors += webResult.errors || 0;
  }

  if (RUN_ALL || LINKS_ONLY) {
    const linksResult = checkLinkingIntegrity();
    results.links = linksResult;
    totalErrors += linksResult.errors || 0;
  }

  if (RUN_ALL || LINKS_ONLY) {
    const orphanedResult = checkOrphanedKnB();
    results.orphaned = orphanedResult;
  }

  if (RUN_ALL || LINKS_ONLY) {
    const unsupportedResult = checkUnsupportedClaims();
    results.unsupported = unsupportedResult;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Validation Summary');
  console.log('='.repeat(60));

  if (results.registry !== undefined) {
    console.log(`Registry: ${results.registry.errors === 0 ? '✅' : '❌'} ${results.registry.errors || 0} errors`);
  }
  if (results.knb !== undefined) {
    console.log(`KnB Files: ${results.knb.errors === 0 ? '✅' : '❌'} ${results.knb.errors} errors (${results.knb.files} files)`);
  }
  if (results.web !== undefined) {
    console.log(`Web Content: ${results.web.errors === 0 ? '✅' : '❌'} ${results.web.errors} errors (${results.web.files} files)`);
  }
  if (results.links !== undefined) {
    console.log(`Linking Integrity: ${results.links.errors === 0 ? '✅' : '❌'} ${results.links.errors} issues`);
  }
  if (results.orphaned !== undefined) {
    console.log(`Orphaned KnB: ${results.orphaned.orphaned === 0 ? '✅' : '⚠️'} ${results.orphaned.orphaned} files`);
  }
  if (results.unsupported !== undefined) {
    console.log(`Unsupported Claims: ${results.unsupported.unsupported === 0 ? '✅' : '⚠️'} ${results.unsupported.unsupported} pages`);
  }

  console.log('='.repeat(60));

  if (totalErrors === 0) {
    console.log('✅ All validations passed!');
    process.exit(0);
  } else {
    console.log(`❌ Validation failed with ${totalErrors} error(s)`);
    if (!VERBOSE) {
      console.log('\nRun with --verbose for detailed error messages');
    }
    process.exit(1);
  }
}

// Run validation
main();
