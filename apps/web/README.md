# ZUGA Website - Web Content

This directory contains the Astro-based website for ZUGA theatre.

## 📁 Content Structure

Content files are organized in `src/content/pages/` with a hierarchical folder structure:

```
src/content/pages/
├── et/                    # Estonian content
│   ├── performances/       # Performance pages
│   │   ├── for-adults/     # Adult performances
│   │   └── for-young-audiences/  # Young audience performances
│   ├── workshopid/         # Workshop pages
│   ├── about/              # About/team pages
│   ├── gallery/            # Photo galleries
│   ├── contact/            # Contact pages
│   └── news/               # News/press pages
└── en/                    # English content (same structure)
```

### Content Types

Each page has a `type` field in frontmatter:

- **`home`**: Homepage (index.md)
- **`section`**: Category/section pages (e.g., `etendused-suurtele.md`)
- **`detail`**: Individual detail pages (e.g., performance pages)

### Categories

Content is categorized using the `category` field:

- **`etendused`**: Performances
- **`workshopid`**: Workshops
- **`about`**: About/team pages
- **`gallery`**: Photo galleries
- **`contact`**: Contact pages
- **`news`**: News/press pages

## 🔗 Knowledge Base Source Attribution

Web pages should reference their Knowledge Base (KnB) sources using the `knowledge_base_sources` field:

```yaml
---
title: "Ilma"
type: detail
category: etendused
language: et
knowledge_base_sources:
  articles:
    - articles/2024-10-err-kultuur-paar-parenson-ilma.md
    - articles/2024-11-epl-eleriin-miilman-ilma-arvustus.md
  persons:
    - persons/paar-parenson.md
    - persons/kart-tonisson.md
  press:
    - press/2024-10-ilma-announcement.md
  research:
    - research/awards-tantsuauhind.md
---
```

**Why this matters**:
- **Traceability**: Every claim on the website can be traced back to a KnB source
- **Validation**: Validation scripts can verify that web content is backed by factual sources
- **Updates**: When KnB content is updated, we can identify which web pages need review

**Best practices**:
- Link to ALL KnB sources that support claims on the page
- For performance pages: include press coverage, reviews, team member profiles
- Keep links bidirectional (KnB files should list web pages in `used_in_pages`)

## ✅ Validation

Validate web content against schema:

```bash
# From project root
node scripts/validate-all.js --web-only

# Or validate everything
node scripts/validate-all.js
```

The validation script checks:
- ✅ Schema compliance (required fields, correct types)
- ✅ Bidirectional linking integrity
- ⚠️ Unsupported claims (pages without KnB sources)

## 🚀 Development

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site
npm run preview      # Preview production build
```

### Content Schema

Content schema is defined in `src/content/config.ts` using Zod. All frontmatter must comply with the schema.

### Routing

Astro automatically generates routes from the file structure:
- `et/performances/for-adults/habi.md` → `/et/etendused/habi`
- `en/performances/for-young-audiences/ilma.md` → `/en/performances-for-young-audiences/ilma`

URLs are determined by the `category` and `slug` fields in frontmatter, maintaining stable URLs even when files are reorganized.

## 📚 Related Documentation

- **Knowledge Base**: See `knowledge-base/README.md` for KnB structure and standards
- **Content Standards**: See `knowledge-base/CONTENT_STANDARDS.md` for content quality rules
- **Refactoring Plan**: See `docs/REFACTORING_PLAN.md` for architecture details
