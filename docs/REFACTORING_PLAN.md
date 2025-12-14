# ZUGA Content Architecture: Refactoring Plan & System Analysis

**Planning Session Date**: 2025-12-14
**Participants**: Strategic Planning Session
**Scope**: Knowledge Base, Content Architecture, File Organization, Data Integrity

---

## Executive Summary

This document identifies structural shortcomings in the current ZUGA content system and proposes a comprehensive refactoring plan. The analysis reveals **7 critical areas** requiring attention, affecting **97+ content files** across Knowledge Base and web content.

**Priority Level**: 🔴 **HIGH** - Current inconsistencies block scalability, AI prompt effectiveness, and content maintenance.

**Estimated Effort**: 40-60 hours over 3-4 weeks

**Risk**: Medium - Involves moving files and schema changes, but can be done incrementally

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Identified Problems](#identified-problems)
3. [Proposed Solutions](#proposed-solutions)
4. [Migration Strategy](#migration-strategy)
5. [GitHub Issues Breakdown](#github-issues-breakdown)
6. [Success Criteria](#success-criteria)

---

## Current State Analysis

### Content Inventory

| Collection           | Location                         | Files  | Status                   |
| -------------------- | -------------------------------- | ------ | ------------------------ |
| **Knowledge Base**   | `knowledge-base/`                | 39     | ❌ Non-compliant         |
| **Web Content (ET)** | `apps/web/src/content/pages/et/` | 37     | ⚠️ Inconsistent naming   |
| **Web Content (EN)** | `apps/web/src/content/pages/en/` | 23     | ⚠️ Inconsistent naming   |
| **Total**            |                                  | **99** | **Requires refactoring** |

### Schema Status

| Schema           | Location                         | Status     | Issues                         |
| ---------------- | -------------------------------- | ---------- | ------------------------------ |
| **KnB Articles** | `knowledge-base/config.ts`       | ✅ Defined | ❌ Missing `sources` field     |
| **KnB Persons**  | `knowledge-base/config.ts`       | ✅ Defined | ❌ Missing source attribution  |
| **KnB Press**    | `knowledge-base/config.ts`       | ✅ Defined | ⚠️ Date format issues          |
| **KnB Research** | `knowledge-base/config.ts`       | ✅ Defined | ⚠️ Limited                     |
| **Web Pages**    | `apps/web/src/content/config.ts` | ✅ Defined | ❌ Missing KnB reference field |

---

## Identified Problems

### PROBLEM 1: Missing KnB Reference System ⭐⭐⭐⭐⭐

**Severity**: 🔴 CRITICAL
**Impact**: Content traceability, legal compliance, AI prompt effectiveness

**Current State**:

- KnB files have `source_url` pointing to external sources
- KnB files do NOT have field to list WHERE they've been used (homepage, articles referencing them)
- Web content files do NOT have field linking to KnB sources
- **No bidirectional linking** between KnB (source of truth) and web content (presentation)

**Problems**:

1. **Traceability Gap**: Cannot determine which KnB articles support which web pages
2. **Update Cascade**: When KnB article is updated, cannot find all pages that need review
3. **AI Prompt Limitation**: `/add-content` prompt can't verify KnB backing
4. **Content Audit**: Impossible to find orphaned KnB content or unsupported web claims

**Example**:

Current KnB article:

```yaml
---
title: "ERR review of Ilma"
source_url: https://err.ee/article-123
# ❌ MISSING: Which web pages use this article?
---
```

Current web page:

```yaml
---
title: "Ilma"
category: etendused
# ❌ MISSING: Which KnB articles support this page?
---
Content mentions ERR review but no link to KnB source.
```

**What We Need**:

KnB article with usage tracking:

```yaml
---
title: "ERR review of Ilma"
source_url: https://err.ee/article-123
source_type: review
# ✅ NEW: Track where this KnB content is referenced
used_in_pages:
  - et/etendused-noorele-publikule-ilma.md
  - en/english-weather-or-not.md
---
```

Web page with KnB attribution:

```yaml
---
title: "Ilma"
category: etendused
# ✅ NEW: Link to supporting KnB sources
knowledge_base_sources:
  - knowledge-base/articles/2024-10-err-kultuur-paar-parenson-ilma.md
  - knowledge-base/articles/2024-11-epl-eleriin-miilman-ilma-arvustus.md
  - knowledge-base/persons/paar-parenson.md
---
Content supported by [ERR review](link-to-knb-article).
```

**Blocked Workflows**:

- ❌ Cannot generate "Press Coverage" section automatically
- ❌ Cannot validate `/add-content` prompt compliance
- ❌ Cannot audit content accuracy
- ❌ Cannot track KnB usage statistics

---

### PROBLEM 2: Inconsistent File Naming ⭐⭐⭐⭐

**Severity**: 🟠 HIGH
**Impact**: Discoverability, maintainability, automation

**Current State - Web Content**:

ET files (logical):

```text
✅ etendused-suurtele-habi.md
✅ etendused-noorele-publikule-ilma.md
✅ workshopid-meelekolu-mangud-mindstuff-games.md
```

EN files (inconsistent):

```text
❌ english-shame.md              # Should be: performances-for-adults-shame.md
❌ english-weather-or-not.md     # Should be: performances-for-young-audiences-weather-or-not.md
❌ english-future-movers.md      # Should be: workshops-future-movers.md
```

**Problems**:

1. **Language prefix inconsistency**: ET uses category prefix, EN uses `english-` prefix
2. **Category ambiguity**: Can't determine category from EN filenames
3. **Search difficulties**: Hard to find related files across languages
4. **Automation blocked**: Scripts can't predict EN filenames from ET filenames
5. **Mental overhead**: Developers need to remember two naming systems

**Example of inconsistency**:

| ET File                                          | EN File                                             | Expected EN File                                     |
| ------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------- |
| `etendused-suurtele-habi.md`                     | `english-shame.md`                                  | `performances-for-adults-shame.md`                   |
| `etendused-noorele-publikule-ilma.md`            | `english-weather-or-not.md`                         | `performances-for-young-audiences-weather-or-not.md` |
| `workshopid-meelekolu-mangud-mindstuff-games.md` | `workshopid-meelekolu-mangud-mindstuff-games-en.md` | `workshops-mindstuff-games.md`                       |

**Pattern that SHOULD exist**:

```text
Category-based prefixes (both languages):
- ET: etendused-suurtele-{performance}.md
- EN: performances-for-adults-{performance}.md

- ET: etendused-noorele-publikule-{performance}.md
- EN: performances-for-young-audiences-{performance}.md

- ET: workshopid-{workshop}.md
- EN: workshops-{workshop}.md
```

---

### PROBLEM 3: Lack of Logical Folder Structure ⭐⭐⭐⭐

**Severity**: 🟠 HIGH
**Impact**: Organization, scalability, navigation

**Current State**:

```text
apps/web/src/content/pages/
  ├── en/
  │   └── [60+ files all in flat directory]
  └── et/
      └── [60+ files all in flat directory]
```

**Problems**:

1. **Flat hierarchy**: All 60+ files in each language folder
2. **No category grouping**: Performances, workshops, about pages all mixed
3. **Hard to navigate**: Finding specific content type requires scanning all files
4. **Scalability issues**: Will become unmanageable as content grows
5. **Deployment confusion**: No clear separation of content types

**What We Need**:

```text
apps/web/src/content/pages/
  ├── en/
  │   ├── index.md                    # Homepage
  │   ├── performances/               # Category folder
  │   │   ├── index.md                # Section landing
  │   │   ├── for-adults/             # Subcategory folder
  │   │   │   ├── index.md            # Subcategory landing
  │   │   │   ├── shame.md            # Detail page
  │   │   │   ├── care.md
  │   │   │   └── noise.md
  │   │   └── for-young-audiences/    # Subcategory folder
  │   │       ├── index.md
  │   │       ├── weather-or-not.md
  │   │       ├── meelekolu.md
  │   │       └── magic-stuff.md
  │   ├── workshops/                  # Category folder
  │   │   ├── index.md
  │   │   ├── mindstuff-games.md
  │   │   └── future-movers.md
  │   ├── about/                      # Category folder
  │   │   ├── index.md
  │   │   ├── team.md
  │   │   └── awards.md
  │   ├── gallery/                    # Category folder
  │   │   └── index.md
  │   └── contact/                    # Category folder
  │       └── index.md
  └── et/
      └── [same structure in Estonian]
```

**Benefits**:

- ✅ **Visual organization**: Clear category grouping
- ✅ **Scalability**: Easy to add more performances without clutter
- ✅ **Navigation**: Folder structure mirrors website structure
- ✅ **IDE support**: Better autocomplete and file navigation
- ✅ **Deployment**: Clear boundaries for category-based deploys

---

### PROBLEM 4: KnB Naming Convention Ambiguity ⭐⭐⭐

**Severity**: 🟡 MEDIUM
**Impact**: Consistency, predictability

**Current State**:

```text
knowledge-base/articles/
  ✅ 2024-10-err-kultuur-paar-parenson-ilma.md     # Good: YYYY-MM-DD-source-slug
  ⚠️ 2006-02-epl-tiiu-laks-naine-ja-hunt.md       # OK: YYYY-MM-DD-source-slug
  ❌ 2015-01-tantsukuukiri-zuga-lasteteater.md     # Missing DD (01 assumed?)
  ❌ 2025-04-criticaldance-ilma-review.md          # Missing DD
```

**Current Documented Standard** (from COMPLIANCE_ASSESSMENT.md):

- Articles: `YYYY-MM-publication-slug.md` (allows YYYY-MM)
- But schema requires: `YYYY-MM-DD` for `source_date`

**Problems**:

1. **Format ambiguity**: Some files have DD, some don't
2. **Schema mismatch**: Files allow YYYY-MM, schema requires YYYY-MM-DD
3. **Sorting issues**: YYYY-MM files sort incorrectly
4. **Automation blocked**: Scripts can't reliably parse dates

**Proposed Standard**:

```text
knowledge-base/articles/
  Format: YYYY-MM-DD-publication-performance-slug.md

  Examples:
  ✅ 2024-10-24-err-ilma-review.md
  ✅ 2024-11-05-criticaldance-ilma-review.md
  ✅ 2006-02-26-epl-naine-ja-hunt-review.md

  Rules:
  - Always include DD (use 01 if day unknown)
  - Publication: err, epl, postimees, criticaldance, etc
  - Performance: ilma, habi, mura, etc
  - Type suffix optional: -review, -preview, -interview
```

---

### PROBLEM 5: Missing Performance/Workshop Master Registry ⭐⭐⭐

**Severity**: 🟡 MEDIUM
**Impact**: Content consistency, cross-referencing

**Current State**:

- Performance names scattered across multiple files
- No single source of truth for:
  - Performance canonical names ("Ilma" vs "Weather or Not")
  - Premiere dates
  - Production years
  - Target audiences (adults vs young audiences)
  - Active status (archived, active, upcoming)

**Problems**:

1. **Inconsistent references**: Articles use different spellings/translations
2. **No slug registry**: Can't validate `related_performances` slugs
3. **Duplicate risk**: Might create duplicate pages for same performance
4. **Cross-language linking**: Hard to match ET/EN performance names

**Example of current inconsistency**:

```text
Articles use various names:
- "Ilma"
- "ILMA"
- "Weather or Not"
- "Ilma / Weather or Not"

Files use different slugs:
- et: etendused-noorele-publikule-ilma
- en: english-weather-or-not

No single registry to validate these are the same performance.
```

**What We Need**:

```yaml
# knowledge-base/registry/performances.yaml

performances:
  - id: ilma
    title:
      et: Ilma
      en: Weather or Not
    slug:
      et: etendused-noorele-publikule-ilma
      en: performances-for-young-audiences-weather-or-not
    premiere: 2024-10-15
    target_audience: young_audiences
    status: active

  - id: habi
    title:
      et: Häbi
      en: Shame
    slug:
      et: etendused-suurtele-habi
      en: performances-for-adults-shame
    premiere: 2019-03-15
    target_audience: adults
    status: active
```

**Benefits**:

- ✅ Validate performance references in articles
- ✅ Auto-generate performance navigation
- ✅ Ensure consistent naming across content
- ✅ Support AI prompts with canonical data

---

### PROBLEM 6: Duplicate/Redundant Content Files ⭐⭐

**Severity**: 🟡 MEDIUM
**Impact**: Maintenance burden, confusion

**Current State - Identified Duplicates**:

```text
ET:
  - galerii.md
  - galerii-et.md
  - galerii-section.md
  ❓ Which is canonical?

  - kontakt.md
  - kontakt-2.md
  ❓ Why two contact pages?

  - tegijad.md (team)
  - meist.md (about)
  - auhinnad.md (awards)
  ❓ Should these be organized under /about/?

EN:
  - gallery-section.md (exists)
  - No galerii.md equivalent?

  - english-about-us-1.md
  ❓ Is there an english-about-us-2.md?
```

**Problems**:

1. **Unclear canonical version**: Which file is the "real" one?
2. **Update inconsistency**: Updates might go to wrong file
3. **Content drift**: Duplicate files diverge over time
4. **Confusing for maintainers**: Which file should I edit?

---

### PROBLEM 7: Missing KnB Source Attribution (Compliance Issue) ⭐⭐⭐⭐⭐

**Severity**: 🔴 CRITICAL (Already documented in COMPLIANCE_ASSESSMENT.md)
**Impact**: Legal, integrity, automation

**Current State**: Covered in existing COMPLIANCE_ASSESSMENT.md

**Key Issues**:

1. Articles missing `source_url`, `source_type`, `source_date`, `archived_date`
2. Persons missing any source attribution
3. Press releases missing `issued_by`, `issued_date`
4. Research missing `source_type`

**Action**: Covered in separate GitHub issues (see Issues Breakdown section)

---

## Proposed Solutions

### SOLUTION 1: Implement Bidirectional KnB Linking System

**Add to KnB Schemas** (`knowledge-base/config.ts`):

```typescript
// Add to articleSchema, personSchema, pressSchema, researchSchema
export const articleSchema = z.object({
  // ... existing fields ...

  // NEW: Track where this KnB content is referenced
  used_in_pages: z
    .array(z.string())
    .optional()
    .describe(
      "List of web content pages referencing this KnB article. " +
        'Format: "et/etendused-noorele-publikule-ilma.md" or ' +
        '"en/performances-for-young-audiences-weather-or-not.md"'
    ),

  // NEW: Related KnB content
  related_knb: z
    .object({
      performances: z.array(z.string()).optional(), // Performance IDs from registry
      persons: z.array(z.string()).optional(), // Person file slugs
      articles: z.array(z.string()).optional(), // Related article file slugs
    })
    .optional(),
});
```

**Add to Web Content Schema** (`apps/web/src/content/config.ts`):

```typescript
const pagesCollection = defineCollection({
  schema: z.object({
    // ... existing fields ...

    // NEW: Link to supporting KnB sources
    knowledge_base_sources: z
      .object({
        articles: z
          .array(z.string())
          .optional()
          .describe(
            "KnB articles supporting this page. " +
              'Format: "knowledge-base/articles/2024-10-err-ilma-review.md"'
          ),
        persons: z
          .array(z.string())
          .optional()
          .describe(
            "KnB person profiles referenced. " +
              'Format: "knowledge-base/persons/paar-parenson.md"'
          ),
        press: z.array(z.string()).optional(),
        research: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});
```

**Update Prompts**:

- `/harvest-content`: Auto-populate `used_in_pages` when adding KnB content
- `/add-content`: Require `knowledge_base_sources` field, validate KnB backing

---

### SOLUTION 2: Standardize File Naming (Web Content)

**Target State**:

```text
ET files:
  etendused-suurtele-{slug}.md
  etendused-noorele-publikule-{slug}.md
  workshopid-{slug}.md
  about-{slug}.md (instead of meist-, tegijad-)
  gallery-{slug}.md (instead of galerii-)

EN files:
  performances-for-adults-{slug}.md
  performances-for-young-audiences-{slug}.md
  workshops-{slug}.md
  about-{slug}.md
  gallery-{slug}.md
```

**Translation Map**:

| ET Prefix                      | EN Prefix                           | Category                    |
| ------------------------------ | ----------------------------------- | --------------------------- |
| `etendused-suurtele-`          | `performances-for-adults-`          | etendused/suurtele          |
| `etendused-noorele-publikule-` | `performances-for-young-audiences-` | etendused/noorele-publikule |
| `workshopid-`                  | `workshops-`                        | workshopid                  |
| `meist-` or `tegijad-`         | `about-`                            | about                       |
| `galerii-`                     | `gallery-`                          | gallery                     |
| `kontakt-`                     | `contact-`                          | contact                     |

**Rename Script** (see GitHub Issues section):

- Map current EN files to new names
- Update internal `slug` field
- Update `translated` links in both languages
- Update any KnB `used_in_pages` references

---

### SOLUTION 3: Implement Folder-Based Organization

**Migration Strategy**:

```text
Phase 1: Create folder structure (new files use folders)
Phase 2: Move existing files to folders (batch migration)
Phase 3: Update all internal references
Phase 4: Update build/deploy scripts
```

**New Structure**:

```text
apps/web/src/content/pages/
  ├── {language}/
  │   ├── index.md                         # type: home
  │   ├── {category}/                      # type: section
  │   │   ├── index.md
  │   │   └── {detail-slug}.md             # type: detail
  │   └── {category}/
  │       ├── {subcategory}/
  │       │   ├── index.md                 # type: section
  │       │   └── {detail-slug}.md         # type: detail
```

**Benefits**:

- Mirror website URL structure: `/et/etendused/suurtele/habi`
- Logical grouping in IDE
- Easier to find and manage related content
- Scalable for 100+ performances

---

### SOLUTION 4: Enforce YYYY-MM-DD for All KnB Files

**Standard**:

```text
knowledge-base/articles/
  YYYY-MM-DD-publication-performance-type.md

  Examples:
  2024-10-24-err-ilma-review.md
  2024-11-05-criticaldance-ilma-review.md
  2024-10-15-epl-ilma-preview.md
```

**Migration**:

- Files with YYYY-MM format: Convert to YYYY-MM-01
- Update `source_date` field to match filename
- Update all references in `related_performances` or `used_in_pages`

---

### SOLUTION 5: Create Performance/Workshop Registry

**New File**: `knowledge-base/registry/performances.yaml`

```yaml
version: 1.0
last_updated: 2025-12-14

performances:
  - id: ilma
    title:
      et: Ilma
      en: Weather or Not
    slug:
      et: ilma
      en: weather-or-not
    full_slug:
      et: etendused-noorele-publikule-ilma
      en: performances-for-young-audiences-weather-or-not
    premiere: 2024-10-15
    venue: Sõltumatu Tantsu Lava
    duration: 45
    target_audience: young_audiences
    age_recommendation: 12+
    status: active
    categories:
      - etendused
      - noorele-publikule

  - id: habi
    title:
      et: Häbi
      en: Shame
    slug:
      et: habi
      en: shame
    full_slug:
      et: etendused-suurtele-habi
      en: performances-for-adults-shame
    premiere: 2019-03-15
    target_audience: adults
    status: active
    categories:
      - etendused
      - suurtele

workshops:
  - id: meelekolu-mangud
    title:
      et: meeleKolu mängud
      en: Mindstuff Games
    slug:
      et: meelekolu-mangud
      en: mindstuff-games
    full_slug:
      et: workshopid-meelekolu-mangud
      en: workshops-mindstuff-games
    target_audience: families
    status: active
    categories:
      - workshopid
```

**Benefits**:

- Single source of truth for canonical names
- Validate `related_performances` in KnB articles
- Auto-generate navigation menus
- Support AI prompts with structured data

---

### SOLUTION 6: Consolidate Duplicate Files

**Action Plan**:

1. **Audit duplicates**: Create comprehensive list
2. **Determine canonical**: Choose which file is official
3. **Merge content**: Combine unique content from duplicates
4. **Archive old files**: Move to `archive/` with redirect metadata
5. **Update references**: Fix any internal links

**Example**:

```text
Current:
  - galerii.md (old, partial content)
  - galerii-et.md (newer, more complete)
  - galerii-section.md (landing page)

Action:
  - Keep: gallery/index.md (rename galerii-section.md)
  - Merge: galerii.md + galerii-et.md content → gallery/archive-photos.md
  - Delete: galerii.md, galerii-et.md after merge
```

---

### SOLUTION 7: KnB Compliance Migration

**Action**: Covered in existing COMPLIANCE_ASSESSMENT.md

**Quick Summary**:

- Phase 1: Automated field mapping (rename legacy fields)
- Phase 2: Add source attribution to persons
- Phase 3: Validate with Zod schemas
- Phase 4: Content quality audit

---

## Migration Strategy

### Overall Approach

**Principle**: Incremental, testable, reversible

**Phases**:

1. ✅ **Phase 0**: Planning (this document)
2. 🔄 **Phase 1**: Schema Updates (non-breaking additions)
3. 🔄 **Phase 2**: KnB Compliance (existing files)
4. 🔄 **Phase 3**: File Renaming (web content)
5. 🔄 **Phase 4**: Folder Restructuring (web content)
6. 🔄 **Phase 5**: Registry Implementation (performances/workshops)
7. 🔄 **Phase 6**: Bidirectional Linking (KnB ↔ web content)
8. ✅ **Phase 7**: Validation & Testing

**Timeline**: 3-4 weeks (assuming 10-15 hours/week)

| Phase     | Duration       | Effort          | Risk       |
| --------- | -------------- | --------------- | ---------- |
| Phase 1   | 2-3 days       | 4-6 hours       | Low        |
| Phase 2   | 3-5 days       | 8-12 hours      | Medium     |
| Phase 3   | 2-3 days       | 6-8 hours       | Low        |
| Phase 4   | 4-5 days       | 10-12 hours     | Medium     |
| Phase 5   | 2-3 days       | 4-6 hours       | Low        |
| Phase 6   | 3-4 days       | 6-8 hours       | Medium     |
| Phase 7   | 2-3 days       | 4-6 hours       | Low        |
| **Total** | **18-26 days** | **42-58 hours** | **Medium** |

---

## GitHub Issues Breakdown

### Epic: Content Architecture Refactoring

**Epic ID**: `epic-content-refactoring`
**Priority**: P0 (Critical)
**Affects**: Knowledge Base, Web Content, AI Prompts
**Estimated Effort**: 42-58 hours

---

### Issue 1: Add Bidirectional KnB Linking Schema Fields

**Title**: Add `used_in_pages` and `knowledge_base_sources` schema fields
**Labels**: `schema`, `enhancement`, `p0-critical`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: None

**Description**:
Implement bidirectional linking between Knowledge Base and web content to enable traceability and validation.

**Tasks**:

- [ ] Add `used_in_pages` array to all KnB schemas (articles, persons, press, research)
- [ ] Add `related_knb` object to all KnB schemas
- [ ] Add `knowledge_base_sources` object to web pages schema
- [ ] Update schema TypeScript types
- [ ] Write Zod validation tests
- [ ] Update schema documentation in README
- [ ] Update CONTENT_STANDARDS.md with new field requirements

**Acceptance Criteria**:

- [ ] Schema validation passes for new fields
- [ ] TypeScript types generated correctly
- [ ] Example files validate successfully
- [ ] Documentation updated

**Files Changed**:

- `knowledge-base/config.ts`
- `apps/web/src/content/config.ts`
- `knowledge-base/CONTENT_STANDARDS.md`
- `knowledge-base/README.md`

---

### Issue 2: KnB Compliance Migration - Automated Field Mapping

**Title**: Migrate existing KnB files to new schema (Phase 1: Automated)
**Labels**: `migration`, `knb`, `p0-critical`
**Epic**: `epic-content-refactoring`
**Effort**: 8-12 hours
**Dependencies**: None (can run parallel with Issue 1)

**Description**:
Automated migration of existing KnB files to comply with new source attribution requirements.

**Tasks**:

- [ ] Create migration script `scripts/migrate-knb-sources.sh`
- [ ] Test on sample files (5-10 files)
- [ ] Backup all KnB files before migration
- [ ] Run automated field mapping:
  - [ ] Rename `url`/`source` → `source_url`
  - [ ] Rename `publication` → `source_publication`
  - [ ] Rename `author` → `source_author`
  - [ ] Add `archived_date: 2025-12-14`
  - [ ] Fix type enums (`preview-article` → `preview`)
- [ ] Add `issued_by: ZUGA` to press releases
- [ ] Fix date formats (YYYY-MM → YYYY-MM-01)
- [ ] Validate all files with Zod
- [ ] Commit changes: "feat(knb): Migrate to new source attribution schema"

**Acceptance Criteria**:

- [ ] All 39 KnB files validate against schema
- [ ] No data loss (all original data preserved)
- [ ] Git history clean (single commit per collection)
- [ ] Rollback script created for safety

**Files Changed**:

- All 39 files in `knowledge-base/`
- New: `scripts/migrate-knb-sources.sh`
- New: `scripts/rollback-knb-migration.sh`

---

### Issue 3: KnB Person Profiles - Source Attribution

**Title**: Add source attribution to person profiles
**Labels**: `migration`, `knb`, `p0-critical`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: Issue 2

**Description**:
Manually add source attribution to 22 person profile files, determining appropriate source policy.

**Tasks**:

- [ ] Decide person bio source policy:
  - [ ] Option A: Internal docs (`source_url: internal://zuga-team-bios`)
  - [ ] Option B: Website (`source_url: https://zuga.ee/meist/team`)
  - [ ] Option C: Compiled records (`retrieved_via: physical_copy`)
- [ ] Document decision in `knowledge-base/README.md`
- [ ] Create template for person profiles
- [ ] Apply source attribution to all 22 person files:
  - [ ] Add `source_url`
  - [ ] Add `source_type: bio`
  - [ ] Add `archived_date`
  - [ ] Add `retrieved_via` if applicable
- [ ] Validate all person files
- [ ] Commit: "feat(knb): Add source attribution to person profiles"

**Acceptance Criteria**:

- [ ] All 22 person files have complete source attribution
- [ ] Source policy documented
- [ ] All files validate
- [ ] Consistent format across all profiles

**Files Changed**:

- All 22 files in `knowledge-base/persons/`
- `knowledge-base/README.md`

---

### Issue 4: Standardize Web Content File Naming (EN)

**Title**: Rename English web content files to match category-based convention
**Labels**: `migration`, `web-content`, `p1-high`
**Epic**: `epic-content-refactoring`
**Effort**: 6-8 hours
**Dependencies**: None

**Description**:
Rename English content files from `english-*` pattern to category-based pattern matching Estonian files.

**Tasks**:

- [ ] Create file rename mapping script `scripts/rename-en-files.js`
- [ ] Generate rename map (23 files):

    ```text
    english-shame.md → performances-for-adults-shame.md
    english-weather-or-not.md → performances-for-young-audiences-weather-or-not.md
    english-future-movers.md → workshops-future-movers.md
    [... full list]
    ```

- [ ] Test rename on copy of files
- [ ] Backup original files
- [ ] Execute rename
- [ ] Update internal `slug` field in each file
- [ ] Update `translated` field in ET files
- [ ] Update `translated` field in EN files (bidirectional)
- [ ] Update any KnB `used_in_pages` references (if exist)
- [ ] Validate all renamed files
- [ ] Test build: `npm run build`
- [ ] Commit: "refactor(web): Standardize EN file naming to category-based convention"

**Acceptance Criteria**:

- [ ] All 23 EN files renamed
- [ ] Slug fields updated
- [ ] Translated links bidirectional
- [ ] Build passes
- [ ] No broken internal links

**Files Changed**:

- 23 files in `apps/web/src/content/pages/en/`
- Related ET files (update `translated` field)
- `scripts/rename-en-files.js`

---

### Issue 5: Implement Folder-Based Organization

**Title**: Restructure web content into category/subcategory folders
**Labels**: `migration`, `web-content`, `p1-high`
**Epic**: `epic-content-refactoring`
**Effort**: 10-12 hours
**Dependencies**: Issue 4 (file naming)

**Description**:
Move web content files from flat language directories into hierarchical folder structure.

**Tasks**:

- [ ] Create folder structure script `scripts/create-folder-structure.js`
- [ ] Create new folder hierarchy:

  ```text
  en/
    index.md
    performances/
      index.md
      for-adults/
        index.md
        shame.md
        care.md
        ...
      for-young-audiences/
        index.md
        weather-or-not.md
        ...
    workshops/
      index.md
      mindstuff-games.md
      ...
    about/
      index.md
      team.md
      awards.md
    gallery/
      index.md
    contact/
      index.md
  ```

- [ ] Copy files to new structure (don't delete originals yet)
- [ ] Update Astro content collection config if needed
- [ ] Update internal file paths in `translated` fields
- [ ] Update KnB `used_in_pages` paths (if exist)
- [ ] Test build with new structure
- [ ] Verify URLs still work correctly
- [ ] Delete original flat files once validated
- [ ] Commit: "refactor(web): Organize content into category folders"

**Acceptance Criteria**:

- [ ] All files in logical folder structure
- [ ] Build passes
- [ ] URLs remain stable
- [ ] No broken links
- [ ] Folder structure mirrors website navigation

**Files Changed**:

- All 60 files in `apps/web/src/content/pages/`
- Possibly `apps/web/src/content/config.ts`
- `scripts/create-folder-structure.js`

---

### Issue 6: Create Performance & Workshop Registry

**Title**: Implement master registry for performances and workshops
**Labels**: `enhancement`, `schema`, `p1-high`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: None

**Description**:
Create YAML registry files for canonical performance and workshop data.

**Tasks**:

- [ ] Create `knowledge-base/registry/` directory
- [ ] Create `knowledge-base/registry/performances.yaml`:
  - [ ] List all performances (historical and current)
  - [ ] Include bilingual titles
  - [ ] Add premiere dates, venues, target audiences
  - [ ] Add status (active, archived, upcoming)
- [ ] Create `knowledge-base/registry/workshops.yaml`:
  - [ ] List all workshops
  - [ ] Include bilingual titles
  - [ ] Add target audiences
- [ ] Create Zod schema for registry validation
- [ ] Write validation script `scripts/validate-registry.js`
- [ ] Document registry format in README
- [ ] Update prompts to reference registry
- [ ] Commit: "feat(knb): Add performance and workshop registry"

**Acceptance Criteria**:

- [ ] Registry files created with all known performances/workshops
- [ ] Schema validation passes
- [ ] Documentation complete
- [ ] Can be used for slug validation

**Files Changed**:

- New: `knowledge-base/registry/performances.yaml`
- New: `knowledge-base/registry/workshops.yaml`
- New: `knowledge-base/registry/schema.ts`
- New: `scripts/validate-registry.js`
- `knowledge-base/README.md`

---

### Issue 7: Implement Bidirectional Linking (KnB → Web)

**Title**: Add `used_in_pages` tracking to KnB files
**Labels**: `enhancement`, `knb`, `p2-medium`
**Epic**: `epic-content-refactoring`
**Effort**: 6-8 hours
**Dependencies**: Issue 1 (schema), Issue 5 (folder structure)

**Description**:
Populate `used_in_pages` field in KnB files by analyzing web content references.

**Tasks**:

- [ ] Create linking script `scripts/link-knb-to-pages.js`
- [ ] Scan all web content files for KnB references:
  - [ ] Check body text for KnB article mentions
  - [ ] Check performance names matching KnB articles
  - [ ] Check person names matching KnB persons
- [ ] Auto-populate `used_in_pages` in KnB files
- [ ] Add `related_knb.performances` using registry IDs
- [ ] Add `related_knb.persons` using person slugs
- [ ] Validate updated KnB files
- [ ] Generate linking report
- [ ] Commit: "feat(knb): Add bidirectional linking to web pages"

**Acceptance Criteria**:

- [ ] KnB articles list pages that reference them
- [ ] Related KnB content cross-linked
- [ ] Linking report shows coverage statistics
- [ ] All updates validate

**Files Changed**:

- KnB files with references (estimated 20-30 files)
- New: `scripts/link-knb-to-pages.js`

---

### Issue 8: Implement Bidirectional Linking (Web → KnB)

**Title**: Add `knowledge_base_sources` to web content pages
**Labels**: `enhancement`, `web-content`, `p2-medium`
**Epic**: `epic-content-refactoring`
**Effort**: 6-8 hours
**Dependencies**: Issue 1 (schema), Issue 7 (KnB linking)

**Description**:
Populate `knowledge_base_sources` field in web content files.

**Tasks**:

- [ ] Create reverse linking script `scripts/link-pages-to-knb.js`
- [ ] For each web content file:
  - [ ] Identify mentioned performances → find related KnB articles
  - [ ] Identify mentioned persons → link to KnB persons
  - [ ] Add press coverage → link to KnB press/articles
- [ ] Add `knowledge_base_sources` to frontmatter
- [ ] Validate updated web content files
- [ ] Generate coverage report (% of pages with KnB backing)
- [ ] Commit: "feat(web): Add KnB source attribution to pages"

**Acceptance Criteria**:

- [ ] Web pages list supporting KnB sources
- [ ] Coverage report shows traceability
- [ ] Validation passes
- [ ] Pages without KnB backing identified for follow-up

**Files Changed**:

- Web content files (estimated 40-50 files)
- New: `scripts/link-pages-to-knb.js`

---

### Issue 9: Consolidate Duplicate Content Files

**Title**: Audit and merge duplicate web content files
**Labels**: `cleanup`, `web-content`, `p2-medium`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: Issue 5 (folder structure)

**Description**:
Identify and consolidate duplicate/redundant content files.

**Tasks**:

- [ ] Audit for duplicates:
  - [ ] galerii\*.md files (3 files)
  - [ ] kontakt\*.md files (2 files)
  - [ ] about/team files (tegijad vs meist)
- [ ] For each duplicate set:
  - [ ] Determine canonical file
  - [ ] Merge unique content
  - [ ] Update references
  - [ ] Archive old files with redirect metadata
- [ ] Document merge decisions
- [ ] Commit: "refactor(web): Consolidate duplicate content files"

**Acceptance Criteria**:

- [ ] Only one canonical file per content piece
- [ ] All unique content preserved
- [ ] Redirects documented
- [ ] No broken links

**Files Changed**:

- Duplicate files (move to archive/)
- Canonical files (merge content)
- Documentation of merges

---

### Issue 10: Enforce YYYY-MM-DD in KnB Filenames

**Title**: Standardize KnB article filenames to YYYY-MM-DD format
**Labels**: `migration`, `knb`, `p2-medium`
**Epic**: `epic-content-refactoring`
**Effort**: 3-4 hours
**Dependencies**: Issue 2 (KnB migration)

**Description**:
Rename KnB article files to enforce YYYY-MM-DD date format.

**Tasks**:

- [ ] Identify files with YYYY-MM format (missing DD)
- [ ] Create rename mapping:

  ```text
  2015-01-tantsukuukiri-zuga-lasteteater.md
  → 2015-01-01-tantsukuukiri-zuga-lasteteater.md
  ```

- [ ] Update `source_date` field to match filename
- [ ] Update any `related_performances` or `used_in_pages` references
- [ ] Validate renamed files
- [ ] Commit: "refactor(knb): Standardize article filenames to YYYY-MM-DD"

**Acceptance Criteria**:

- [ ] All KnB article filenames have YYYY-MM-DD format
- [ ] `source_date` matches filename
- [ ] All references updated
- [ ] Validation passes

**Files Changed**:

- KnB articles with YYYY-MM format (estimated 5-8 files)
- Files referencing renamed articles

---

### Issue 11: Update Prompts for New Schema Fields

**Title**: Update `/harvest-content` and `/add-content` prompts for new fields
**Labels**: `prompts`, `enhancement`, `p1-high`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: Issue 1 (schema), Issue 6 (registry)

**Description**:
Update AI prompts to use new schema fields and enforce new standards.

**Tasks**:

- [ ] Update `/harvest-content` prompt:
  - [ ] Require `used_in_pages` field explanation
  - [ ] Auto-populate `related_knb` using registry
  - [ ] Validate against registry for performance names
  - [ ] Update examples with new fields
- [ ] Update `/add-content` prompt:
  - [ ] Require `knowledge_base_sources` field
  - [ ] Validate KnB backing before creating pages
  - [ ] Use registry for canonical performance names
  - [ ] Update examples with new fields
- [ ] Update `.cursor/commands/` shortcuts
- [ ] Test prompts with sample content
- [ ] Commit: "feat(prompts): Update for bidirectional KnB linking"

**Acceptance Criteria**:

- [ ] Prompts enforce new field requirements
- [ ] Registry integration works
- [ ] Examples updated
- [ ] Validation catches non-compliant content

**Files Changed**:

- `.github/prompts/harvest-content.prompt.md`
- `.github/prompts/add-content.prompt.md`
- `.cursor/commands/harvest.md`
- `.cursor/commands/add-content.md`

---

### Issue 12: Documentation & Validation Scripts

**Title**: Create validation scripts and update documentation
**Labels**: `documentation`, `tooling`, `p1-high`
**Epic**: `epic-content-refactoring`
**Effort**: 4-6 hours
**Dependencies**: All previous issues

**Description**:
Create comprehensive validation tools and update all documentation.

**Tasks**:

- [ ] Create `scripts/validate-all.js`:
  - [ ] Validate all KnB files against schema
  - [ ] Validate all web content files against schema
  - [ ] Check bidirectional linking integrity
  - [ ] Validate performance/workshop registry
  - [ ] Check for orphaned KnB content
  - [ ] Check for unsupported web claims
- [ ] Update `knowledge-base/README.md`:
  - [ ] Document new schema fields
  - [ ] Document registry usage
  - [ ] Document linking system
- [ ] Update `knowledge-base/CONTENT_STANDARDS.md`:
  - [ ] Add bidirectional linking requirements
  - [ ] Add registry validation rules
- [ ] Update `apps/web/README.md`:
  - [ ] Document folder structure
  - [ ] Document KnB source attribution
- [ ] Create `REFACTORING_CHANGELOG.md`:
  - [ ] Document all changes made
  - [ ] Migration notes
  - [ ] Breaking changes
- [ ] Commit: "docs: Update documentation for refactored architecture"

**Acceptance Criteria**:

- [ ] Validation script catches all compliance issues
- [ ] Documentation comprehensive and accurate
- [ ] Examples updated
- [ ] Changelog complete

**Files Changed**:

- New: `scripts/validate-all.js`
- `knowledge-base/README.md`
- `knowledge-base/CONTENT_STANDARDS.md`
- `apps/web/README.md`
- New: `REFACTORING_CHANGELOG.md`

---

## Success Criteria

### Phase Completion Criteria

**Phase 1: Schema Updates** ✅

- [ ] New schema fields defined
- [ ] TypeScript types generated
- [ ] Documentation updated
- [ ] Validation tests pass

**Phase 2: KnB Compliance** ✅

- [ ] All 39 KnB files have source attribution
- [ ] All files validate against schema
- [ ] No data loss
- [ ] Rollback script available

**Phase 3: File Renaming** ✅

- [ ] All EN files use category-based naming
- [ ] Translated links bidirectional
- [ ] Build passes
- [ ] No broken links

**Phase 4: Folder Restructuring** ✅

- [ ] Files organized in logical folders
- [ ] URLs stable
- [ ] Build passes
- [ ] Navigation reflects structure

**Phase 5: Registry Implementation** ✅

- [ ] Performance/workshop registry complete
- [ ] Schema validation passes
- [ ] Can validate references

**Phase 6: Bidirectional Linking (KnB)** ✅

- [ ] KnB files list pages using them
- [ ] Related KnB content cross-linked
- [ ] Coverage report generated

**Phase 7: Bidirectional Linking (Web)** ✅

- [ ] Web pages list KnB sources
- [ ] Coverage report shows traceability
- [ ] Unsupported claims identified

**Phase 8: Validation & Testing** ✅

- [ ] All validation scripts pass
- [ ] Documentation complete
- [ ] Prompts updated
- [ ] Changelog documented

### Overall Success Metrics

**Content Quality**:

- [ ] 100% of KnB files have source attribution
- [ ] 90%+ of web pages have KnB source links
- [ ] 0 schema validation errors
- [ ] 0 broken internal links

**Organization**:

- [ ] Logical folder structure in place
- [ ] Consistent naming convention (ET and EN)
- [ ] No duplicate files
- [ ] Clear category grouping

**Traceability**:

- [ ] Bidirectional links functional
- [ ] Can trace any fact to KnB source
- [ ] Can find all uses of any KnB content
- [ ] Registry validates all references

**Maintainability**:

- [ ] Clear documentation
- [ ] Validation scripts in place
- [ ] Prompts enforce standards
- [ ] Easy to add new content

---

## Risk Assessment

### High Risks 🔴

1. **File Move Breaking URLs**

   - Mitigation: Test URL stability before deleting originals
   - Rollback: Keep original files until validation complete

2. **Lost Content During Merge**
   - Mitigation: Always create backups before merging
   - Rollback: Git history preserves all versions

### Medium Risks 🟡

3. **Schema Changes Breaking Build**

   - Mitigation: Add fields as optional first, make required later
   - Rollback: Git revert schema changes

4. **Inconsistent Linking After Migration**
   - Mitigation: Comprehensive validation script
   - Rollback: Can regenerate links from backups

### Low Risks 🟢

5. **Confusion During Transition**

   - Mitigation: Clear documentation and changelog
   - Rollback: N/A (documentation issue)

6. **Increased Complexity**
   - Mitigation: Validation tools reduce burden
   - Rollback: N/A (architectural decision)

---

## Next Steps

1. ✅ **Review this planning document** with team
2. ✅ **Prioritize GitHub issues** based on business needs
3. 🔄 **Create GitHub issues** from this document
4. 🔄 **Start Phase 1** (Schema Updates) - non-breaking
5. 🔄 **Execute migration** following phase order
6. ✅ **Validate** each phase before proceeding
7. ✅ **Document** changes in changelog
8. ✅ **Update prompts** for new architecture

---

## Appendix: File Counts & Estimates

### Current State

| Collection       | Files  | Non-Compliant | Needs Renaming | Needs Folder Move |
| ---------------- | ------ | ------------- | -------------- | ----------------- |
| KnB Articles     | 14     | 14            | 5-8            | 0                 |
| KnB Persons      | 22     | 22            | 0              | 0                 |
| KnB Press        | 2      | 2             | 0              | 0                 |
| KnB Research     | 1      | 1             | 0              | 0                 |
| Web Content (ET) | 37     | 0             | 0              | 37                |
| Web Content (EN) | 23     | 0             | 23             | 23                |
| **Total**        | **99** | **39**        | **28-31**      | **60**            |

### Effort Estimates by Phase

| Phase                  | Files Affected    | Automated % | Manual % | Hours     |
| ---------------------- | ----------------- | ----------- | -------- | --------- |
| Phase 1: Schema        | 5 files           | 100%        | 0%       | 4-6       |
| Phase 2: KnB Migration | 39 files          | 70%         | 30%      | 8-12      |
| Phase 3: EN Rename     | 23 files          | 90%         | 10%      | 6-8       |
| Phase 4: Folders       | 60 files          | 80%         | 20%      | 10-12     |
| Phase 5: Registry      | 2 files           | 50%         | 50%      | 4-6       |
| Phase 6: KnB Links     | 30 files          | 70%         | 30%      | 6-8       |
| Phase 7: Web Links     | 50 files          | 70%         | 30%      | 6-8       |
| Phase 8: Docs          | 10 files          | 20%         | 80%      | 4-6       |
| **Total**              | **~180 file ops** | **70%**     | **30%**  | **48-66** |

---

_Document Version_: 1.0
_Last Updated_: 2025-12-14
_Next Review_: After Phase 1 completion
_Status_: 📋 **Ready for Implementation**
