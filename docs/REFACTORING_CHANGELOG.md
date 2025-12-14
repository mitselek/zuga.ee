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
