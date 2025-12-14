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
- **status**: active (default), archived, review-pending, ready-to-publish

### Persons

- **name** (required): Person's full name
- **role** (required): Role description
- **member_since**: Year joined (YYYY or number)
- **founding_member**: Boolean for founding members
- **status**: active (default), inactive, former

### Press

- **date** (required): Release date
- **type** (required): press-release, announcement, media-kit, promotional
- **language** (required): en or et
- **source**, **publication**: Source information
- **performance**, **related_performances**: Related content
- **status**: active (default), archived, upcoming, draft

### Research

- **type** (required): award, research-notes, interview, production-notes, background
- **date**: Optional date field
- **award**, **awarded_by**, **recipients**, **organization**, **performance**, **year**: Award-specific fields
- **source**: Source URL
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

## Usage

This knowledge base serves as:

1. **Archive** - Historical record of ZUGA's work and reception
2. **Research** - Background material for website content creation
3. **Future Content** - Materials that may be published later
4. **Context** - Understanding ZUGA's artistic development and philosophy
