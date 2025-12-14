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
