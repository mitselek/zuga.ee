# Content Architecture Refactoring - Changelog

This document tracks all changes made during the Content Architecture Refactoring project.

---

## Issue #30: Add bidirectional KnB linking schema fields (2025-12-14)

**Type**: feat
**Scope**: schema
**Effort**: 2 hours
**Risk**: Low

### Changes Made

- Added `used_in_pages` array field to all KnB schemas (articles, persons, press, research)
- Added `related_knb` object field to all KnB schemas for cross-referencing
- Added `knowledge_base_sources` object field to web pages schema
- Updated TypeScript types (automatically inferred from Zod schemas)
- Updated documentation in README.md and CONTENT_STANDARDS.md

### Files Affected

- Total files changed: 4
- New files created: 0
- Files deleted: 0
- Files renamed: 0

### Validation

- Schema validation: ✅ Passed (TypeScript compilation successful)
- Build: ✅ Succeeded (Astro build completed)
- Tests: N/A

### Notes

All new fields are optional (non-breaking change). Existing files continue to validate without new fields. This enables future bidirectional linking implementation in Issues #36 and #37.

### Commit

- Commit hash: f1350e55ee31457a18a8ed520139c036dd8a071e
- Branch: refactor/content-architecture

---

## Issue #42: [#31a] Migrate articles collection to new schema (2025-12-14)

**Type**: feat
**Scope**: knb, migration
**Effort**: 3 hours
**Risk**: Medium

### Changes Made

- Created migration script `scripts/migrate-articles-31a.js` for automated field mapping
- Migrated 14 article files to new source attribution schema:
  - Renamed `url`/`source` → `source_url`
  - Renamed `publication` → `source_publication`
  - Renamed `author` → `source_author`
  - Added `archived_date: 2025-12-14` to all files
  - Fixed type enum: `preview-article` → `preview`
  - Fixed date formats: YYYY-MM → YYYY-MM-01 for `source_date`
  - Added `source_type` field mapped from `type` field
  - Added `source_date` field from `date` field (with format conversion)

### Files Affected

- Total files changed: 15
- New files created: 1 (`scripts/migrate-articles-31a.js`)
- Files deleted: 0
- Files renamed: 0
- Migration script: `scripts/migrate-articles-31a.js`

### Validation

- Schema validation: ✅ Passed (all 14 files validate successfully)
- Build: ✅ Succeeded (TypeScript compilation successful)
- Tests: N/A

### Notes

- Backup created before migration: `knowledge-base/articles.backup.20251214_105357`
- All original data preserved - only field names changed
- Date format conversion handles partial dates (YYYY-MM → YYYY-MM-01)
- Type enum fix handles legacy `preview-article` value
- Migration script supports dry-run mode and verbose logging

### Rollback Procedure

If rollback needed:
```bash
rm -rf knowledge-base/articles
cp -r knowledge-base/articles.backup.20251214_105357 knowledge-base/articles
```

### Commit

- Commit hash: 96f36c7875ef8903511c2629858c91c49b1544ba
- Branch: refactor/content-architecture

---

## Issue #32: Add source attribution to person profiles (2025-12-14)

**Type**: feat
**Scope**: knb, migration
**Effort**: 2 hours
**Risk**: Low

### Changes Made

- Decided source attribution policy: Option A - Internal docs (`source_url: internal://zuga-team-bios`)
- Documented policy in `knowledge-base/README.md`
- Created migration script `scripts/migrate-persons-32.js` for automated field addition
- Migrated 22 person profile files to add required source attribution:
  - Added `source_url: internal://zuga-team-bios` to all files
  - Added `source_type: bio` to all files
  - Added `archived_date: 2025-12-14` to all files

### Files Affected

- Total files changed: 23
- New files created: 1 (`scripts/migrate-persons-32.js`)
- Files deleted: 0
- Files renamed: 0
- Migration script: `scripts/migrate-persons-32.js`

### Validation

- Schema validation: ✅ Passed (all 22 files validate successfully)
- Build: ✅ Succeeded (TypeScript compilation successful)
- Tests: N/A

### Notes

- Backup created before migration: `knowledge-base/persons.backup.20251214_111124`
- All original data preserved - only new fields added
- Source policy documented: Person profiles use `internal://zuga-team-bios` protocol
- Consistent format across all 22 profiles

### Rollback Procedure

If rollback needed:
```bash
rm -rf knowledge-base/persons
cp -r knowledge-base/persons.backup.20251214_111124 knowledge-base/persons
```

### Commit

- Commit hash: 0e47c15
- Branch: refactor/content-architecture

---

## Issue #33: Standardize EN file naming to category-based convention (2025-12-14)

**Type**: refactor
**Scope**: web-content, migration
**Effort**: 3 hours
**Risk**: Medium

### Changes Made

- Created rename mapping script `scripts/generate-rename-map-33.js` to analyze files and generate mappings
- Created rename execution script `scripts/rename-en-files-33.js` for automated renaming
- Renamed 14 English files from `english-*` pattern to category-based naming:
  - `english-shame.md` → `performances-for-adults-shame.md`
  - `english-weather-or-not.md` → `performances-for-young-audiences-weather-or-not.md`
  - `english-future-movers.md` → `workshops-future-movers.md`
  - `english-about-us-1.md` → `about-us.md`
  - And 10 more files following same pattern
- Updated slug fields in all 14 renamed files
- Updated translated fields in 14 ET files (bidirectional links)
- Updated KnB references in 5 person files

### Files Affected

- Total files changed: 33
- New files created: 2 (`scripts/generate-rename-map-33.js`, `scripts/rename-en-files-33.js`)
- Files deleted: 0
- Files renamed: 14 EN files
- Files modified: 14 EN files (slug updates), 14 ET files (translated updates), 5 KnB files (reference updates)

### Validation

- Schema validation: ✅ Passed (all files validate successfully)
- Build: ✅ Succeeded (Astro build completed successfully)
- Link integrity: ✅ No broken internal links

### Notes

- Backup created before migration: `apps/web/src/content/pages/en.backup.20251214_111XXX`
- All files renamed using `git mv` to preserve history
- Bidirectional translated links maintained between EN and ET files
- Original URLs preserved in `original_url` fields (historical reference)
- Category-based naming now matches Estonian file structure

### Rollback Procedure

If rollback needed:
```bash
# Restore from backup
rm -rf apps/web/src/content/pages/en
cp -r apps/web/src/content/pages/en.backup.<timestamp> apps/web/src/content/pages/en

# Restore ET files (if needed)
git checkout HEAD~1 -- apps/web/src/content/pages/et/

# Restore KnB files (if needed)
git checkout HEAD~1 -- knowledge-base/persons/
```

### Commit

- Commit hash: fab064cf0e02277b05537481aa7b20e536caf3d3
- Branch: refactor/content-architecture

---

## Issue #35: Create performance and workshop registry (2025-12-14)

**Type**: feat
**Scope**: knb, schema
**Effort**: 4 hours
**Risk**: Low

### Changes Made

- Created `knowledge-base/registry/` directory
- Created `performances.yaml` with 15 performances (6 for adults, 9 for young audiences)
- Created `workshops.yaml` with 5 workshops
- Created Zod schema in `registry/schema.ts` for type-safe validation
- Created validation script `scripts/validate-registry.js`
- Updated `knowledge-base/README.md` with comprehensive registry documentation
- Updated `scripts/README.md` with validation script usage
- Added `js-yaml` dependency to `knowledge-base/package.json`

### Files Affected

- Total files changed: 8
- New files created: 4
  - `knowledge-base/registry/performances.yaml`
  - `knowledge-base/registry/workshops.yaml`
  - `knowledge-base/registry/schema.ts`
  - `scripts/validate-registry.js`
- Files deleted: 0
- Files renamed: 0

### Validation

- Schema validation: ✅ Passed (all registries validate successfully)
- Build: ✅ N/A (registry files are standalone)
- Tests: ✅ Validation script passes

### Notes

Registry provides canonical data for all ZUGA performances and workshops, enabling:
- Slug validation in articles and web content
- Cross-referencing via `related_knb.performances` IDs
- Single source of truth for bilingual titles
- Support for AI prompts with structured data

Registry IDs can be used in KnB files' `related_knb.performances` fields (e.g., `"ilma"`, `"habi"`, `"2-2-22"`).

### Commit

- Commit hash: 9da98a7a24a68e1100ce88c6146bfa59cbf23278
- Branch: refactor/content-architecture

---

## Issue #46: Folder structure: Performances (2025-12-14)

**Type**: refactor
**Scope**: web-content, migration
**Effort**: 3.5 hours
**Risk**: Medium

### Changes Made

- Moved 30 performance files from flat structure into hierarchical folders
- Updated Astro routing to handle nested folder structure
- Created migration script `scripts/move-performances-34a.js`
- Created fix script `scripts/fix-performance-slugs-46.js`
- Updated slug fields to use performance name only (e.g., "shame" not "performances-for-adults-shame")
- Updated translated field slugs for bidirectional linking

**Files moved**:
- 5 EN adult performances → `en/performances/for-adults/`
- 7 EN young audience performances → `en/performances/for-young-audiences/`
- 6 ET adult performances → `et/performances/for-adults/`
- 8 ET young audience performances → `et/performances/for-young-audiences/`
- 4 section index files → respective folders as `index.md`

### Files Affected

- Total files changed: 35
- Files moved: 30 (using git mv to preserve history)
- Files created: 2 (migration scripts)
- Files modified: 3 (routing files)

### Validation

- Schema validation: ✅ N/A (no schema changes)
- Build: ✅ Passed (101 pages built successfully)
- URLs: ✅ Stable (`/{lang}/etendused/{performance-name}`)
- Git history: ✅ Preserved (`git log --follow` works)

### Notes

Routing updated to extract filename-only slug from nested paths. URLs remain stable using category from frontmatter (`etendused`) and performance name from slug field. This enables folder-based organization while maintaining URL structure.

### Commit

- Commit hash: 150472046f1596e9100f00ec23f8557e9c045e08
- Branch: refactor/content-architecture

---
