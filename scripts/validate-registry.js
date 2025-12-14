#!/usr/bin/env node

/**
 * Registry Validation Script
 *
 * Validates performance and workshop registry YAML files against Zod schemas.
 *
 * Usage:
 *   node scripts/validate-registry.js [--verbose]
 *
 * Options:
 *   --verbose: Print detailed validation output
 *
 * Exit codes:
 *   0: All registries valid
 *   1: Validation errors found
 */

const fs = require('fs');
const path = require('path');

// Try to load dependencies from knowledge-base/node_modules
const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base');
const nodeModulesPath = path.join(knowledgeBasePath, 'node_modules');

let yaml, z;
try {
  // Try knowledge-base/node_modules first, then fall back to global
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
  // Try knowledge-base/node_modules first, then fall back to global
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

// Import schemas (we'll need to compile TypeScript first, or use a different approach)
// For now, we'll define the schemas inline since this is a Node.js script

const VERBOSE = process.argv.includes('--verbose');

/**
 * Bilingual title/slug schema
 */
const bilingualSchema = z.object({
  et: z.string().nullable().optional(),
  en: z.string().nullable().optional(),
}).refine(
  (data) => data.et !== null || data.en !== null,
  { message: 'At least one language (et or en) must be provided' }
);

/**
 * Performance schema
 */
const performanceSchema = z.object({
  id: z.string().min(1),
  title: bilingualSchema,
  slug: bilingualSchema,
  full_slug: bilingualSchema,
  premiere: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  venue: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  target_audience: z.enum(['adults', 'young_audiences', 'families', 'children']),
  age_recommendation: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'upcoming']),
  categories: z.array(z.string()).min(1),
});

/**
 * Workshop schema
 */
const workshopSchema = z.object({
  id: z.string().min(1),
  title: bilingualSchema,
  slug: bilingualSchema,
  full_slug: bilingualSchema,
  target_audience: z.enum(['adults', 'young_audiences', 'families', 'children']).nullable().optional(),
  age_recommendation: z.string().nullable().optional(),
  duration: z.union([
    z.number().int().positive(),
    z.string(),
  ]).nullable().optional(),
  venue: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'upcoming']),
  dates: z.string().nullable().optional(),
  collaboration: z.string().nullable().optional(),
  categories: z.array(z.string()).min(1),
});

/**
 * Performances registry schema
 */
const performancesRegistrySchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  performances: z.array(performanceSchema).min(1),
});

/**
 * Workshops registry schema
 */
const workshopsRegistrySchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workshops: z.array(workshopSchema).min(1),
});

/**
 * Validate a YAML file against a schema
 */
function validateYaml(filePath, schema, type) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);

    const result = schema.safeParse(data);

    if (!result.success) {
      console.error(`❌ ${type} registry validation failed: ${filePath}`);
      if (VERBOSE) {
        console.error('\nErrors:');
        result.error.errors.forEach((error) => {
          console.error(`  - ${error.path.join('.')}: ${error.message}`);
        });
      }
      return { valid: false, errors: result.error.errors };
    }

    console.log(`✅ ${type} registry valid: ${filePath}`);
    if (VERBOSE) {
      const count = type === 'Performance' ? data.performances?.length : data.workshops?.length;
      console.log(`   Found ${count} ${type.toLowerCase()}${count !== 1 ? 's' : ''}`);
    }
    return { valid: true, data: result.data };
  } catch (error) {
    console.error(`❌ Error reading ${filePath}: ${error.message}`);
    return { valid: false, errors: [{ message: error.message }] };
  }
}

/**
 * Main validation function
 */
function main() {
  const registryDir = path.join(__dirname, '..', 'knowledge-base', 'registry');
  const performancesPath = path.join(registryDir, 'performances.yaml');
  const workshopsPath = path.join(registryDir, 'workshops.yaml');

  let allValid = true;
  const errors = [];

  // Validate performances registry
  const performancesResult = validateYaml(performancesPath, performancesRegistrySchema, 'Performance');
  if (!performancesResult.valid) {
    allValid = false;
    errors.push(...performancesResult.errors || []);
  }

  // Validate workshops registry
  const workshopsResult = validateYaml(workshopsPath, workshopsRegistrySchema, 'Workshop');
  if (!workshopsResult.valid) {
    allValid = false;
    errors.push(...workshopsResult.errors || []);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allValid) {
    console.log('✅ All registries are valid!');
    process.exit(0);
  } else {
    console.log('❌ Validation failed');
    if (!VERBOSE && errors.length > 0) {
      console.log('\nRun with --verbose for detailed error messages');
    }
    process.exit(1);
  }
}

// Run validation
main();
