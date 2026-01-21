# ZUGA.ee AI Coding Agent Instructions

## Project Overview

ZUGA.ee is a bilingual (Estonian/English) portfolio website for Zuga Theatre, built as a monorepo with Astro SSG. The project emphasizes type safety, content validation, and a strict separation between the **Knowledge Base** (factual archive) and **Web Content** (curated pages).

## Architecture

### Monorepo Structure

```
zuga.ee/
├── apps/web/                    # Astro static site (main deliverable)
│   ├── src/content/pages/       # Website content (performances, about, etc.)
│   ├── src/content/config.ts    # Zod schemas (§1: Type Safety First)
│   ├── src/components/          # Reusable Astro components
│   ├── src/layouts/             # Page layouts (BaseLayout.astro)
│   └── src/utils/               # Helper functions (venues.ts)
├── knowledge-base/              # Factual archive (DO NOT edit casually)
│   ├── articles/                # Press articles (verbatim)
│   ├── press/                   # Press releases
│   ├── persons/                 # Team member profiles
│   ├── research/                # Background research
│   ├── venues/                  # Venue information
│   ├── registry/                # Canonical performance/workshop data
│   │   ├── performances.yaml    # Performance registry
│   │   └── workshops.yaml       # Workshop registry
│   └── CONTENT_STANDARDS.md     # MUST READ before editing KnB
├── scripts/                     # Migration & validation scripts (Node.js)
└── docs/                        # Architecture & migration documentation
```

### Key Concepts

- **Knowledge Base (KnB)**: Factual archive with strict attribution standards. Content is **verbatim-only** (no paraphrasing, translation, or gap-filling). See `knowledge-base/CONTENT_STANDARDS.md`.
- **Web Content**: Curated pages in `apps/web/src/content/pages/` that reference KnB sources via `knowledge_base_sources` field.
- **Registry**: Canonical performance/workshop data in `knowledge-base/registry/*.yaml`. Used for cross-referencing and validation.
- **Hierarchical Pages**: Pages use `type` (home/section/detail), `category` (etendused/workshopid/about/etc.), and optional `subcategory` (suurtele/noorele-publikule).

## Constitutional Principles

The project follows 5 core principles defined in `.cursor/rules/rules-for-zuga.mdc`:

1. **§1: Type Safety First** - Strict TypeScript/Zod validation. All web content must pass Zod schema validation in `apps/web/src/content/config.ts`.
2. **§2: Test-First Development** - Write tests before implementation (90% coverage target).
3. **§3: Composable-First Architecture** - Small, reusable components (<150 lines for Astro components).
4. **§4: Observable Development** - Explicit error messages and validation logs.
5. **§5: Pragmatic Simplicity** - Boring technology, YAGNI enforcement.

## Critical Workflows

### Running the Site

```bash
cd apps/web
npm install
npm run dev          # Dev server at http://localhost:4321
npm run build        # Production build (validates all content)
npm run preview      # Preview production build
```

### Content Validation

Always validate before committing:

```bash
# Validate all content (KnB + web + registry + links)
node scripts/validate-all.js --verbose

# Validate specific subsets
node scripts/validate-all.js --knb-only      # Knowledge Base only
node scripts/validate-all.js --web-only      # Web content only
node scripts/validate-all.js --registry-only # Registry only
node scripts/validate-all.js --links-only    # Link integrity
```

### Creating/Editing Content

#### Web Pages (`apps/web/src/content/pages/`)

Pages use a hierarchical schema with **required fields**:

```yaml
---
title: "Performance Title"
slug: "performance-slug"
language: et                           # Required: 'et' or 'en'
type: detail                           # Required: 'home', 'section', 'detail'
category: etendused                    # Required: content category
subcategory: suurtele                  # Optional: grouping
status: published                      # Required: 'published' or 'draft'
description: "Brief description"

# Event scheduling (new system, see config.ts lines 160-215)
premiere:
  date: "2026-03-20"                   # Required: YYYY-MM-DD
  time: "19:00"                        # Optional: HH:MM
  venue_id: stl                        # Optional: ID from knowledge-base/venues/

showings:                              # Optional: multiple performance dates
  - date: "2026-03-21"
    time: "19:00"
    venue_id: stl                      # Optional: overrides premiere venue
    status: scheduled                  # Optional: 'scheduled', 'sold-out', 'cancelled'
    notes: "Esietendus"                # Optional: additional notes

# Link to Knowledge Base sources (bidirectional traceability)
knowledge_base_sources:
  articles:
    - "articles/2024-10-err-kultuur-ilma.md"
  persons:
    - "persons/paar-parenson.md"

# Media
hero_image: /images/performances/...
videos:
  - platform: youtube
    url: "https://www.youtube.com/watch?v=VIDEO_ID"  # URL required, ID extracted automatically
    title: "Optional video title"
gallery:
  - url: /images/gallery/image1.jpg
    description: "Photo caption"

# Bilingual linking
translated:
  - language: en
    slug: english-slug
---

Content goes here (markdown)
```

**IMPORTANT**: Use `premiere.date` and `premiere.venue_id`, NOT legacy `premiere_date` and `venue` fields.

#### Knowledge Base Content

**READ `knowledge-base/CONTENT_STANDARDS.md` BEFORE EDITING.**

Rules:
- **Verbatim text only** - Copy exactly from source, no paraphrasing
- **No translation** - Keep original language
- **No gap filling** - Leave missing info empty with `[not mentioned in source]`
- **Source attribution required** - Every file needs `source_url`, `source_type`, `source_publication`, `source_date`

### Migration Scripts

Scripts in `scripts/` handle bulk content migrations. Always use `--dry-run` first:

```bash
# Example: Migrate articles with new schema
node scripts/migrate-articles-31a.js --dry-run --verbose
node scripts/migrate-articles-31a.js  # Apply changes

# Validate after migration
node scripts/validate-all.js --verbose
```

See `scripts/README.md` for script documentation.

## Project-Specific Patterns

### Venue References

Use venue IDs from `knowledge-base/venues/` registry:
- `stl` → Sõltumatu Tantsu Lava
- `kanuti-gildi-saal` → Kanuti Gildi SAAL

Venue IDs are validated against registry at build time.

### Video/Audio Embedding

Video/audio URLs are automatically parsed to extract IDs:

```yaml
videos:
  - platform: youtube
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # ID extracted automatically
    title: "Video Title"
  - platform: vimeo
    url: "https://vimeo.com/123456789"

audio:
  - platform: soundcloud
    url: "https://soundcloud.com/artist/track-name"
    title: "Track Title"
```

**DON'T** use deprecated `video_id` or `track_id` fields.

### Page Hierarchy

- `type: home` → Homepage (`index.md`)
- `type: section` → Category page (e.g., `etendused-suurtele.md`)
- `type: detail` → Individual page (e.g., `etendused-suurtele-habi.md`)

Categories: `etendused`, `workshopid`, `about`, `gallery`, `contact`, `news`, `kalender`

### Language Handling

- Estonian files: `apps/web/src/content/pages/et/`
- English files: `apps/web/src/content/pages/en/`
- Link bilingual pages with `translated` field in frontmatter

## Common Pitfalls

1. **Editing KnB without reading CONTENT_STANDARDS.md** - KnB is verbatim-only archive
2. **Using legacy `premiere_date` field** - Use `premiere.date` instead
3. **Forgetting `venue_id`** - Use registry IDs, not free-text venue names
4. **Not validating before commit** - Run `node scripts/validate-all.js`
5. **Translating KnB content** - Keep original language always
6. **Using `video_id` instead of `url`** - URLs are now required, IDs extracted automatically
7. **Violating type system** - All content must pass Zod validation (§1)

## Key Files to Reference

- `apps/web/src/content/config.ts` - Zod schemas (lines 1-301, see event scheduling at 160-215)
- `knowledge-base/CONTENT_STANDARDS.md` - KnB content rules
- `knowledge-base/registry/performances.yaml` - Performance registry
- `.cursor/rules/rules-for-zuga.mdc` - Constitutional principles (§1-§5)
- `docs/SITE_STRUCTURE.md` - Site architecture and navigation
- `scripts/README.md` - Migration script documentation
- `scripts/validate-all.js` - Validation script (896 lines)

## Documentation

- Architecture: `docs/SITE_STRUCTURE.md`, `README.md`
- Migration guide: `docs/CONTENT_MIGRATION.md`
- Content standards: `knowledge-base/CONTENT_STANDARDS.md`
- Registry docs: `knowledge-base/README.md` (lines 52-100)

## Quick Reference Commands

```bash
# Start development
cd apps/web && npm run dev

# Validate all content
node scripts/validate-all.js --verbose

# Build for production (validates all content at build time)
cd apps/web && npm run build

# Kill stuck dev server
cd apps/web && npm run kill_port

# Dry-run migration script
node scripts/migrate-articles-31a.js --dry-run --verbose
```

---

**Last Updated**: 2026-01-21
