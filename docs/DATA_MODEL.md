# Zuga Content Data Model

**Status**: Canonical schema defined ✓ | Migration needed (35/35 files)
**Version**: 1.0.0
**Last Updated**: 2025-01-08
**Authority**: `scripts/extraction_models.py` (Pydantic models)

## Executive Summary

This document defines the **canonical data model** for all Zuga.ee content. It serves as the source of truth for:

- Content extraction from archive sources
- JSON structure validation
- Obsidian-compatible markdown generation
- Website content management

**Goal**: Build crosslinked markdown files (Obsidian format) that serve as source of truth for website generation.

**Current State**: 35 JSON files extracted, split between two incompatible formats

- **Format A** (15 files): Rich `metadata` + `content_sections` + `media` structure
- **Format B** (20 files): Minimal `page_metadata` + scattered media keys

**Target State**: All files conform to canonical `ExtractedPage` model defined in `scripts/extraction_models.py`

## Table of Contents

1. [Core Principles](#core-principles)
2. [Schema Overview](#schema-overview)
3. [Field Specifications](#field-specifications)
4. [Content Section Types](#content-section-types)
5. [Media Item Structure](#media-item-structure)
6. [Validation Rules](#validation-rules)
7. [Migration Guide](#migration-guide)
8. [Examples](#examples)

---

## Core Principles

### 1. Required Metadata

**Every page MUST have:**

- `title` - Even gallery-only pages need descriptive titles
- `description` - Explain page purpose even if minimal text content
- `language` - Estonian (`et`) or English (`en`)
- `slug` - URL path for routing

**Rationale**: Obsidian linking requires titles, SEO needs descriptions, bilingual site needs explicit language tags.

### 2. Unified Media Structure

All media items (images, videos, backgrounds, logos) go in single `media` array.

**Anti-pattern**:

```json
{
  "hero_image": {...},
  "site_logo": {...},
  "performance_images": [...]
}
```

**Canonical**:

```json
{
  "media": [
    {"type": "hero", "url": "...", ...},
    {"type": "site_logo", "url": "...", ...},
    {"type": "gallery_item", "url": "...", ...}
  ]
}
```

**Rationale**: Single location for all media simplifies queries, deduplication, and markdown conversion.

### 3. Consistent Content Sections

Content sections follow strict taxonomy (see [Content Section Types](#content-section-types)).

Each section has:

- **Required**: `type` (from enum)
- **Optional**: `content`, `heading`, `media_ref`, `links`, `items`, `note`

### 4. Bilingual Linking

Pages in Estonian and English are linked via `bilingual_link` field containing the slug of the paired page.

```json
{
  "metadata": {
    "language": "et",
    "slug": "auhinnad"
  },
  "bilingual_link": "english-the-awards"
}
```

---

## Schema Overview

### Root Model: `ExtractedPage`

```python
class ExtractedPage(BaseModel):
    # REQUIRED
    metadata: PageMetadata              # Core page metadata
    content_sections: list[ContentSection]  # Ordered content blocks
    media: list[MediaItem]              # All media items

    # OPTIONAL
    bilingual_link: Optional[str]       # Slug of paired language page
    navigation: Optional[Navigation]    # Site navigation structure
    extraction_notes: Optional[str]     # Process notes

    # DEPRECATED (Format B legacy - migrate these)
    page_metadata: Optional[ExtractionMetadata]
    hero_image: Optional[MediaItem]
    site_logo: Optional[MediaItem]
    video_embed: Optional[VideoEmbed]
    performance_images: Optional[list[MediaItem]]
    gallery_images: Optional[list[MediaItem]]
    workshop_images: Optional[list[MediaItem]]
    external_links: Optional[list[Link]]
```

---

## Field Specifications

### PageMetadata (REQUIRED)

| Field         | Type   | Required | Description                                                                | Example                         |
| ------------- | ------ | -------- | -------------------------------------------------------------------------- | ------------------------------- |
| `title`       | string | ✓        | Page title                                                                 | `"Zuga - Tunnustus"`            |
| `language`    | enum   | ✓        | Content language: `et` or `en`                                             | `"et"`                          |
| `slug`        | string | ✓        | URL slug                                                                   | `"auhinnad"`                    |
| `description` | string | ✓        | Page description                                                           | `"Zuga awards and recognition"` |
| `page_type`   | enum   | ✗        | Category: `performance`, `gallery`, `workshop`, `about`, `news`, `landing` | `"performance"`                 |

**Validation Notes**:

- `title` cannot be empty or generic ("Untitled")
- `slug` must be lowercase, hyphenated
- `description` should be substantive (min 10 chars)
- `page_type` lowercase, matches enum exactly

### ContentSection

| Field       | Type               | Required | Description                       |
| ----------- | ------------------ | -------- | --------------------------------- |
| `type`      | ContentSectionType | ✓        | Section type (see taxonomy below) |
| `content`   | string             | ✗        | Primary text content              |
| `heading`   | string             | ✗        | Section heading                   |
| `media_ref` | string             | ✗        | ID referencing MediaItem          |
| `links`     | list[Link]         | ✗        | Hyperlinks (for announcements)    |
| `items`     | list[NewsItem]     | ✗        | News items (for news sections)    |
| `note`      | string             | ✗        | Editorial note                    |

### MediaItem

| Field         | Type      | Required | Description                                                                                      |
| ------------- | --------- | -------- | ------------------------------------------------------------------------------------------------ |
| `type`        | MediaType | ✓        | Media type: `image`, `background_image`, `gallery_item`, `site_logo`, `hero`, `video`, `youtube` |
| `url`         | string    | ✓        | Media URL (Google Photos, YouTube, etc.)                                                         |
| `id`          | string    | ✗        | Unique identifier for cross-referencing                                                          |
| `description` | string    | ✗        | Human-readable description                                                                       |
| `context`     | string    | ✗        | Usage context or placement notes                                                                 |
| `platform`    | enum      | ✗        | Video platform: `youtube`, `vimeo`                                                               |
| `video_id`    | string    | ✗        | Platform-specific video ID                                                                       |
| `title`       | string    | ✗        | Video title                                                                                      |
| `width`       | string    | ✗        | Image width (e.g., `"1280"`)                                                                     |
| `styling`     | string    | ✗        | CSS styling instructions                                                                         |

**Common Media Types**:

- `hero` - Page hero background image
- `background_image` - Any background image
- `gallery_item` - Image in gallery (performance, workshop, general)
- `site_logo` - Zuga logo in navigation
- `video` / `youtube` - Video embed

### NewsItem

| Field        | Type   | Required | Description             |
| ------------ | ------ | -------- | ----------------------- |
| `text`       | string | ✓        | News text content       |
| `link`       | string | ✗        | URL for full article    |
| `importance` | enum   | ✗        | `high`, `medium`, `low` |
| `relevance`  | string | ✗        | Context note            |

**Example**:

```json
{
  "text": "Zuga pälvis Hea Teatri Auhinna 2021 - täname!!!",
  "importance": "high",
  "relevance": "Highly relevant to awards page context"
}
```

---

## Content Section Types

Based on analysis of 35 source files:

| Type                  | Count  | Usage                                |
| --------------------- | ------ | ------------------------------------ |
| `hero`                | 15     | Page hero with background image      |
| `news`                | 15     | News feed/updates section            |
| `announcement`        | 10     | Site-wide announcements              |
| `video`               | 10     | YouTube video embeds                 |
| `performance_gallery` | 9      | Performance-specific image galleries |
| `image_gallery`       | 5      | General image galleries              |
| `text`                | 5      | Plain text blocks                    |
| `text_content`        | 5      | Structured text content              |
| `collapsible_gallery` | 5      | Expandable galleries                 |
| `upcoming_events`     | 5      | Event listings                       |
| `gallery`             | varies | Generic gallery type                 |

**Section Type Guidelines**:

### `hero`

Page hero section, typically with background image.

```json
{
  "type": "hero",
  "content": "Awards page hero image",
  "media_ref": "hero_awards"
}
```

### `announcement`

Site-wide announcements (e.g., upcoming performances).

```json
{
  "type": "announcement",
  "heading": "Tulekul / Coming:",
  "content": "Zuga Ühendatud Tantsijate uuslavastus...",
  "links": [{ "text": "Ilma", "url": "/etendused-noorele-publikule/ilma" }],
  "note": "Site-wide announcement"
}
```

### `news`

News feed with multiple items.

```json
{
  "type": "news",
  "heading": "uudised:",
  "items": [
    {
      "text": "Zuga pälvis Hea Teatri Auhinna 2021",
      "importance": "high"
    }
  ]
}
```

### `video`

YouTube embed.

```json
{
  "type": "video",
  "content": "ZUGA video greeting",
  "media_ref": "youtube_greeting"
}
```

### `performance_gallery` / `image_gallery`

Image galleries.

```json
{
  "type": "performance_gallery",
  "content": "Performance and award photos"
}
```

---

## Media Item Structure

### Media Type Mapping

**Format B → Canonical mapping**:

| Format B                                              | Canonical `type`     | Notes               |
| ----------------------------------------------------- | -------------------- | ------------------- |
| `hero_image` with `type: "background"`                | `hero`               | Hero background     |
| `site_logo` (no type field)                           | `site_logo`          | Navigation logo     |
| `performance_images` with `type: "performance_photo"` | `gallery_item`       | Performance gallery |
| `gallery_images` with `type: "about_image"`           | `gallery_item`       | About page gallery  |
| `gallery_images` with `type: "landing_gallery"`       | `gallery_item`       | Landing gallery     |
| `workshop_images` (no type field)                     | `gallery_item`       | Workshop gallery    |
| `video_embed`                                         | `video` or `youtube` | Video embed         |

### Consolidation Example

**Before (Format B)**:

```json
{
  "hero_image": {
    "url": "https://...",
    "type": "background",
    "description": "Hero background"
  },
  "site_logo": {
    "url": "https://...",
    "description": "Zuga logo"
  },
  "performance_images": [
    { "url": "https://...", "type": "performance_photo" },
    { "url": "https://...", "type": "performance_photo" }
  ]
}
```

**After (Canonical)**:

```json
{
  "media": [
    {
      "type": "hero",
      "url": "https://...",
      "description": "Hero background"
    },
    {
      "type": "site_logo",
      "url": "https://...",
      "description": "Zuga logo"
    },
    {
      "type": "gallery_item",
      "url": "https://...",
      "context": "Performance gallery"
    },
    {
      "type": "gallery_item",
      "url": "https://...",
      "context": "Performance gallery"
    }
  ]
}
```

---

## Validation Rules

### Automated Validation

Run: `python scripts/extraction_models.py`

This validates all JSON files in `packages/content/source_zuga_ee/extracted/` against the canonical schema.

**Exit codes**:

- `0` - All files valid
- `1` - Validation errors found

### Common Validation Errors

#### 1. Missing `metadata` field

```text
metadata: Field required
```

**Fix**: Migrate `page_metadata` → `metadata`, adding `title`/`description`

#### 2. Wrong media type enum

```text
hero_image.type: Input should be 'image', 'background_image', ... [got 'background']
```

**Fix**: Change `type: "background"` → `type: "hero"`

#### 3. Missing required `type` field

```text
site_logo.type: Field required
```

**Fix**: Add `type: "site_logo"`

#### 4. News items as strings

```text
content_sections.4.items.0: Input should be a valid dictionary or instance of NewsItem
```

**Fix**: Convert string to `NewsItem` object:

```json
// Before
"items": ["Zuga pälvis..."]

// After
"items": [{"text": "Zuga pälvis..."}]
```

#### 5. Structured field should be string

```text
bilingual_link: Input should be a valid string [got dict]
```

**Fix**: Extract slug from dict:

```json
// Before
"bilingual_link": {"language": "en", "url": "/english/shame"}

// After
"bilingual_link": "english-shame"
```

---

## Migration Guide

### Step 1: Run Validation

```bash
python scripts/extraction_models.py
```

### Step 2: Create Migration Script

See `scripts/migrate_to_canonical.py` (to be created):

```python
from pathlib import Path
import json
from extraction_models import ExtractedPage, PageMetadata, MediaItem

def migrate_format_b_to_canonical(filepath: Path):
    """Migrate Format B file to canonical schema."""

    data = json.load(filepath.open())

    # Extract metadata
    page_meta = data.get("page_metadata", {})

    # Create canonical metadata
    canonical_meta = PageMetadata(
        title=infer_title_from_filename(filepath.name),
        language=page_meta.get("language", "et"),
        slug=filepath.stem,
        description=page_meta.get("notes", "Page description"),
        page_type=normalize_page_type(page_meta.get("page_type"))
    )

    # Consolidate media
    media = []

    if "hero_image" in data:
        hero = data["hero_image"]
        media.append(MediaItem(
            type="hero",
            url=hero["url"],
            description=hero.get("description")
        ))

    if "site_logo" in data:
        logo = data["site_logo"]
        media.append(MediaItem(
            type="site_logo",
            url=logo["url"],
            description=logo.get("description")
        ))

    # Add performance/gallery/workshop images
    for key in ["performance_images", "gallery_images", "workshop_images"]:
        if key in data:
            for img in data[key]:
                media.append(MediaItem(
                    type="gallery_item",
                    url=img["url"],
                    context=f"{key.replace('_', ' ')}",
                    width=img.get("width"),
                    styling=img.get("styling")
                ))

    # Create canonical page
    canonical = ExtractedPage(
        metadata=canonical_meta,
        content_sections=data.get("content", {}).get("sections", []),
        media=media,
        navigation=data.get("navigation"),
        extraction_notes=page_meta.get("notes")
    )

    return canonical

def infer_title_from_filename(filename: str) -> str:
    """Generate descriptive title from filename."""
    # Remove .json extension
    name = filename.replace(".json", "")

    # Handle special cases
    if "landing" in name:
        return f"{name.split('-')[0].title()} Landing Page"
    if "galerii" in name or "gallery" in name:
        return "Gallery Archive"
    if "uudised" in name or "news" in name:
        return "News / Uudised"

    # Default: titlecase with spaces
    return name.replace("-", " ").title()
```

### Step 3: Run Migration

```bash
python scripts/migrate_to_canonical.py --dry-run  # Check changes
python scripts/migrate_to_canonical.py --execute  # Apply changes
```

### Step 4: Verify

```bash
python scripts/extraction_models.py  # Should show 0 errors
```

---

## Examples

### Complete Canonical Page

```json
{
  "metadata": {
    "title": "Zuga - Tunnustus",
    "language": "et",
    "slug": "auhinnad",
    "description": "Zuga Ühendatud Tantsijate tunnustused ja auhinnad",
    "page_type": "about"
  },
  "content_sections": [
    {
      "type": "hero",
      "content": "Awards page hero image",
      "media_ref": "hero_awards"
    },
    {
      "type": "announcement",
      "heading": "Tulekul / Coming:",
      "content": "Zuga Ühendatud Tantsijate uuslavastus \"Ilma\"",
      "links": [{ "text": "Ilma", "url": "/etendused-noorele-publikule/ilma" }]
    },
    {
      "type": "news",
      "heading": "uudised:",
      "items": [
        {
          "text": "Zuga pälvis Hea Teatri Auhinna 2021 - täname!!!",
          "importance": "high"
        }
      ]
    }
  ],
  "media": [
    {
      "type": "hero",
      "id": "hero_awards",
      "url": "https://lh4.googleusercontent.com/...",
      "context": "Awards page hero background"
    },
    {
      "type": "gallery_item",
      "url": "https://lh5.googleusercontent.com/...",
      "context": "Performance photo"
    }
  ],
  "bilingual_link": "english-the-awards",
  "navigation": {
    "home_link": "/uudised",
    "logo_links_to": "/uudised"
  },
  "extraction_notes": "Manually extracted, all content preserved"
}
```

### Gallery-Only Page

Even pages with no text content need metadata:

```json
{
  "metadata": {
    "title": "Gallery Archive (1998-2013)",
    "language": "et",
    "slug": "galerii-archive",
    "description": "Historical performance photos from Zuga's early years",
    "page_type": "gallery"
  },
  "content_sections": [
    {
      "type": "hero",
      "media_ref": "hero_gallery"
    },
    {
      "type": "gallery",
      "content": "Archive photos 1998-2013"
    }
  ],
  "media": [
    {
      "type": "hero",
      "id": "hero_gallery",
      "url": "https://..."
    },
    {
      "type": "gallery_item",
      "url": "https://...",
      "context": "1998 performance"
    }
  ],
  "extraction_notes": "Gallery archive page, no text content preserved"
}
```

---

## Related Documentation

- **Implementation**: `scripts/extraction_models.py` - Pydantic models (executable schema)
- **Migration Tool**: `scripts/migrate_to_canonical.py` - Automated migration (to be created)
- **Conversion**: `scripts/markdown_converter.py` - JSON → Markdown conversion (needs rewrite)
- **Content Organization**: `docs/CONTENT_RECOVERY.md` - Overall recovery process

---

## Changelog

### v1.0.0 (2025-01-08)

- Initial schema definition based on 35 extracted files
- Defined canonical `ExtractedPage` structure
- Documented Format A (rich) and Format B (minimal) differences
- Created validation tooling in `extraction_models.py`
- Identified migration requirements for all 35 files

### Next Steps

1. Create `migrate_to_canonical.py` script
2. Migrate all 35 files to canonical format
3. Rewrite `markdown_converter.py` to use Pydantic models
4. Generate Obsidian-compatible markdown for all pages
5. Validate bilingual linking (18 page pairs)

---

**For AI Assistants**: This document defines the single source of truth for Zuga content structure. Always validate JSON against `scripts/extraction_models.py` Pydantic models before processing. When in doubt, refer to canonical `ExtractedPage` model definition.
