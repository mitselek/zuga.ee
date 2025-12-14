# ZUGA Knowledge Base

This directory contains archived materials about ZUGA that may not be published on the website immediately but are worth preserving for historical and reference purposes.

## ⚠️ IMPORTANT: Content Standards

**All content in the Knowledge Base MUST adhere to strict factual standards.**

See **[CONTENT_STANDARDS.md](./CONTENT_STANDARDS.md)** for complete rules.

**Key principles**:

1. **Verbatim text only** - Copy exactly from source, no paraphrasing
2. **No translation** - Preserve original language
3. **No gap filling** - Leave missing information empty
4. **Source attribution required** - Every file must include `source_url` and source metadata
5. **One source per file** - Don't combine multiple sources

The Knowledge Base is a **factual archive**, not curated content. Homepage content is created FROM KnB sources using the `/add-content` prompt.

## Structure

### `/articles`

Press articles, reviews, and features about ZUGA performances and work. Organized by year and publication.

### `/press`

Press releases, media kits, and promotional materials created by ZUGA.

### `/research`

Background research, interviews, production notes, and other reference materials.

### `/registry`

Canonical registry files for performances and workshops. These YAML files serve as the single source of truth for performance/workshop metadata, enabling validation and cross-referencing across the Knowledge Base.

**Files**:

- `performances.yaml` - All ZUGA performances (historical and current)
- `workshops.yaml` - All ZUGA workshops

**Usage**: Reference performance/workshop IDs in `related_knb.performances` fields. See [Registry Documentation](#registry) below.

## Registry

The registry provides canonical data for all ZUGA performances and workshops, enabling:

- **Slug validation**: Validate performance references in articles and web content
- **Cross-referencing**: Use registry IDs in `related_knb.performances` fields
- **Consistency**: Single source of truth for bilingual titles and metadata
- **Automation**: Support AI prompts and content generation with structured data

### Registry Structure

Each registry file contains:

- **version**: Registry format version (e.g., `"1.0"`)
- **last_updated**: Date when registry was last updated (YYYY-MM-DD format)
- **performances** or **workshops**: Array of entries

### Performance Entry

```yaml
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
  premiere: "2024-10-26"
  venue: Sõltumatu Tantsu Lava
  duration: 60
  target_audience: young_audiences
  age_recommendation: "10+"
  status: active
  categories:
    - etendused
    - noorele-publikule
```

**Fields**:

- **id** (required): Unique identifier (used in `related_knb.performances`)
- **title** (required): Bilingual titles (`et`, `en` - at least one required)
- **slug** (required): Short slugs (`et`, `en` - at least one required)
- **full_slug** (required): Full web content slugs (`et`, `en` - at least one required)
- **premiere** (optional): Premiere date (YYYY-MM-DD format)
- **venue** (optional): Premiere venue
- **duration** (optional): Duration in minutes
- **target_audience** (required): `adults`, `young_audiences`, `families`, or `children`
- **age_recommendation** (optional): Age recommendation string
- **status** (required): `active`, `archived`, or `upcoming`
- **categories** (required): Array of category strings

### Workshop Entry

```yaml
- id: meelekolu-mangud
  title:
    et: meeleKolu mängud
    en: mindStuff games
  slug:
    et: meelekolu-mangud
    en: mindstuff-games
  full_slug:
    et: workshopid-meelekolu-mangud-mindstuff-games
    en: workshopid-meelekolu-mangud-mindstuff-games-en
  target_audience: children
  age_recommendation: "6-13"
  duration: 45
  venue: null
  status: active
  categories:
    - workshopid
```

**Fields**: Similar to performance, but without `premiere` field. May include `dates` (date range string) and `collaboration` fields.

### Validation

Validate registry files using the validation script:

```bash
node scripts/validate-registry.js [--verbose]
```

The script validates:

- YAML syntax
- Schema compliance (Zod schemas in `registry/schema.ts`)
- Required fields
- Data types and formats
- Bilingual field requirements

### Using Registry IDs

Reference performances in KnB files using registry IDs:

```yaml
---
related_knb:
  performances:
    - ilma
    - habi
    - "2-2-22"
---
```

**Note**: Use the `id` field from the registry, not the slug or full_slug.

## Naming Convention

Files should follow this pattern:

- Articles: `YYYY-MM-publication-slug.md`
- Press: `YYYY-MM-performance-slug.md`
- Research: `performance-slug-topic.md`

## Metadata

Each file should include YAML frontmatter with validated fields. See `config.ts` for complete schema definitions:

### Articles

- **title** (required): Article title
- **date** (required): Publication date (YYYY-MM-DD, YYYY-MM, or YYYY)
- **type** (required): article, review, interview, preview, news, radio-interview, radio, television-program
- **language** (required): en or et
- **publication**, **author**, **url**: Publication metadata
- **tags**, **related_performances**: Content categorization
- **program**, **host**, **hosts**, **interviewees**, **guests**: For radio/TV content
- **used_in_pages** (optional): List of web content pages referencing this article. Format: `"et/etendused-noorele-publikule-ilma.md"` or `"en/performances-for-young-audiences-weather-or-not.md"`
- **related_knb** (optional): Cross-references to related KnB content (performances, persons, articles, press, research)
- **status**: active (default), archived, review-pending, ready-to-publish

### Persons

- **name** (required): Person's full name
- **role** (required): Role description
- **member_since**: Year joined (YYYY or number)
- **founding_member**: Boolean for founding members
- **source_url** (required): Source of bio information. For team member bios, use `internal://zuga-team-bios`
- **source_type** (required): Type of source - `bio`, `press_release`, `article`, `interview`, or `website`
- **archived_date** (required): Date when bio was added to knowledge base (YYYY-MM-DD format)
- **retrieved_via** (optional): How information was obtained - `web`, `email`, `pdf`, `screenshot`, or `physical_copy`
- **used_in_pages** (optional): List of web content pages referencing this person profile
- **related_knb** (optional): Cross-references to related KnB content (performances, persons, articles, press, research)
- **status**: active (default), inactive, former

**Source Attribution Policy**: Person profiles use `source_url: internal://zuga-team-bios` to indicate that bios are compiled from internal ZUGA team records and documentation. If a bio was retrieved from a website, add `retrieved_via: web` as well.

### Press

- **date** (required): Release date
- **type** (required): press-release, announcement, media-kit, promotional
- **language** (required): en or et
- **source**, **publication**: Source information
- **performance**, **related_performances**: Related content
- **used_in_pages** (optional): List of web content pages referencing this press release
- **related_knb** (optional): Cross-references to related KnB content (performances, persons, articles, press, research)
- **status**: active (default), archived, upcoming, draft

### Research

- **type** (required): award, research-notes, interview, production-notes, background
- **date**: Optional date field
- **award**, **awarded_by**, **recipients**, **organization**, **performance**, **year**: Award-specific fields
- **source**: Source URL
- **used_in_pages** (optional): List of web content pages referencing this research document
- **related_knb** (optional): Cross-references to related KnB content (performances, persons, articles, press, research)
- **status**: active (default), archived

## Type-Safe Configuration

This knowledge base uses Zod schemas for type-safe validation, similar to the web app's content collections (`apps/web/src/content/config.ts`).

### Setup

```bash
cd knowledge-base
npm install
```

### Schema Definitions

The `config.ts` file defines Zod schemas for each collection type:

- **Articles** (`articleSchema`) - Press articles, reviews, interviews
- **Persons** (`personSchema`) - Member and collaborator profiles
- **Press** (`pressSchema`) - Press releases and announcements
- **Research** (`researchSchema`) - Awards, research notes, background materials

### Usage

Import and use the schemas for validation:

```typescript
import {
  articleSchema,
  personSchema,
  pressSchema,
  researchSchema,
} from "./config";

// Validate frontmatter data
const result = articleSchema.safeParse(frontmatterData);
if (!result.success) {
  console.error(result.error);
}
```

### TypeScript Types

TypeScript types are automatically inferred from the schemas:

```typescript
import type { Article, Person, Press, Research } from "./config";
```

## Bidirectional Linking

The Knowledge Base supports bidirectional linking with web content pages to enable traceability and validation.

### KnB → Web Pages (`used_in_pages`)

Track which web pages reference each KnB file:

```yaml
---
used_in_pages:
  - et/etendused-noorele-publikule-ilma.md
  - en/performances-for-young-audiences-weather-or-not.md
---
```

**Format**: Relative paths from `apps/web/src/content/pages/` directory, including language prefix.

### KnB → KnB (`related_knb`)

Cross-reference related content within the Knowledge Base:

```yaml
---
related_knb:
  performances:
    - ilma
    - habi
  persons:
    - paar-parenson
    - kart-tonisson
  articles:
    - 2024-10-err-kultuur-ilma-review
  press:
    - 2024-10-ilma-announcement
  research:
    - awards-tantsuauhind
---
```

**Format**:

- **performances**: Performance IDs from registry (e.g., `"ilma"`, `"habi"`)
- **persons**: Person file slugs (e.g., `"paar-parenson"`)
- **articles**: Article file slugs without extension (e.g., `"2024-10-err-kultuur-ilma-review"`)
- **press**: Press release file slugs
- **research**: Research file slugs

### Web Pages → KnB (`knowledge_base_sources`)

Web content pages can reference their KnB sources (see `apps/web/src/content/config.ts`):

```yaml
---
knowledge_base_sources:
  articles:
    - articles/2024-10-err-kultuur-ilma-review.md
  persons:
    - persons/paar-parenson.md
  press:
    - press/2024-10-ilma-announcement.md
  research:
    - research/awards-tantsuauhind.md
---
```

**Format**: Relative paths from `knowledge-base/` root directory.

## Usage

This knowledge base serves as:

1. **Archive** - Historical record of ZUGA's work and reception
2. **Research** - Background material for website content creation
3. **Future Content** - Materials that may be published later
4. **Context** - Understanding ZUGA's artistic development and philosophy
5. **Traceability** - Bidirectional links enable validation of web content claims against KnB sources
