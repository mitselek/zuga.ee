# Content Architecture Refactoring - Tracking

## Quick Links

- 🎯 **Milestone**: https://github.com/mitselek/zuga.ee/milestone/1
- 📋 **Epic Issue**: https://github.com/mitselek/zuga.ee/issues/29
- 📖 **Full Plan**: [docs/REFACTORING_PLAN.md](../docs/REFACTORING_PLAN.md)
- 🌳 **Branch**: `refactor/content-architecture`

## Timeline

- **Created**: 2025-12-14
- **Due Date**: 2026-01-15
- **Estimated Effort**: 42-58 hours
- **Status**: Ready for Implementation

## Issues by Phase

### Phase 1: Schema & Compliance (P0 Critical)

- ~~#30 - Add bidirectional KnB linking schema fields (4-6h)~~ ✅
- ~~#31 - KnB compliance migration - automated (8-12h)~~ (superseded by #42, #43, #44)
  - ~~#42 - [#31a] Migrate articles collection (14 files, 4-5h)~~ ✅
  - #43 - [#31b] Migrate press collection (2 files, 1-2h)
  - #44 - [#31c] Migrate research collection (1 file, 30min)
- #32 - Add source attribution to person profiles (4-6h)

### Phase 2: File Organization (P1 High)

- #33 - Standardize EN file naming (6-8h)
- #34 - Implement folder-based organization (10-12h)
- #35 - Create performance & workshop registry (4-6h)

### Phase 3: Bidirectional Linking (P2 Medium)

- #36 - Implement KnB → Web linking (6-8h)
- #37 - Implement Web → KnB linking (6-8h)
- #38 - Consolidate duplicate files (4-6h)
- #39 - Enforce YYYY-MM-DD in KnB filenames (3-4h)

### Phase 4: Integration (P1 High)

- #40 - Update prompts for new schema (4-6h)
- #41 - Create validation scripts & docs (4-6h)

## Labels Used

- `epic` - Epic/parent issue
- `p0-critical` - Critical priority (blocks other work)
- `p1-high` - High priority (important but not blocking)
- `p2-medium` - Medium priority
- `schema` - Schema/type definition changes
- `migration` - Data/file migration tasks
- `knb` - Knowledge Base related
- `web-content` - Web content pages related
- `enhancement` - New features
- `cleanup` - Cleanup/consolidation
- `prompts` - AI prompt updates
- `documentation` - Documentation updates
- `tooling` - Development tools

## Progress Tracking

Check milestone for real-time progress: https://github.com/mitselek/zuga.ee/milestone/1
