# Markdown Format Specification

**Status**: Approved v1.0
**Last Updated**: 2025-01-08
**Purpose**: Define canonical markdown output format for JSON→Markdown conversion
**Decision**: Option A (Media in Frontmatter) - Approved

---

## Overview

This document establishes the **single source of truth** for markdown file structure used in the Zuga content system. All 35 JSON files from `packages/content/source_zuga_ee/extracted_v2/` will be converted according to these specifications.

### Design Goals

1. **Obsidian Compatible**: Full support for Obsidian vault features (wikilinks, frontmatter, backlinks)
2. **Next.js Ready**: Structured for static site generation (SSG) with type-safe parsing
3. **Bilingual Support**: Seamless Estonian ↔ English content linking
4. **Media Rich**: Gallery images, hero backgrounds, videos represented in markdown-friendly format
5. **Human Readable**: Clean, editable markdown that content editors can maintain

---

## File Structure

### Directory Organization

```text
packages/content/
└── pages/
    ├── en/                    # English content
    │   ├── shame.md
    │   ├── the-great-unknown.md
    │   └── about-us.md
    └── et/                    # Estonian content
        ├── habi.md
        ├── suur-teadmatus.md
        └── meist.md
```

**Naming Convention**: `{slug}.md` where slug comes from `metadata.slug` in source JSON.

---

## YAML Frontmatter Schema

### Required Fields

```yaml
---
title: string                  # Page title (REQUIRED)
slug: string                   # URL-friendly identifier (REQUIRED)
language: "en" | "et"          # Content language (REQUIRED)
description: string            # Page description for SEO (REQUIRED)
type: string                   # Content type (REQUIRED)
status: "published" | "draft"  # Publication status (REQUIRED)
---
```

### Optional Fields

```yaml
translated: string[] # Array of translated page slugs
page_type: string # Category: performance | gallery | workshop | about | news | landing
tags: string[] # Content tags for filtering
original_url: string # Original zuga.ee URL (for reference)
hero_image: string # Hero background URL
images_unavailable: boolean # Flag if Google Photos images are lost
```

### Media Arrays

For pages with rich media content (galleries, videos):

```yaml
gallery:
  - url: string
    width: number
    description: string

videos:
  - platform: "youtube" | "vimeo"
    video_id: string
    title: string
    url: string
```

---

## Frontmatter Examples

### Example 1: Performance Page (Rich Media)

```yaml
---
title: Shame
slug: shame
language: en
description: Zuga performance 'Shame' photo gallery
type: performance
status: published
page_type: performance
translated:
  - habi
hero_image: https://lh5.googleusercontent.com/PXSN6CJeVTYvu_x98JfAS3NBScOCkqV2WJW0HXxDJZWAA5pu8fyh7o59Y-BweUELFvpWPqx55G_kz-QCKDI1Y9Y=w16383
gallery:
  - url: https://lh4.googleusercontent.com/zAG_7dQ9ctOWgapMIimu30Tjrugto9ndwjDyxOaacOQKB4vH3EwnXEsJd1k6zS0puQEuYYBLtBvUa8yd01YSh8VTXwlkKAza5qe4OJZTBVo_CMg1t1jFku0MSUk8kBOfkA=w1280
    width: 1280
    description: Performance photo
  - url: https://lh6.googleusercontent.com/0UudcK9OYV1xEpBfZP4vHrKIOA86t0Bx50THPQ1mmPKR9S4Jgj7GSINKPTQXwBC674Kbr3e94sk_zSt0nHpmdf8HmlM0AofYMepNpPW5rx73tD1ZcDO8bwdAs72sw2ay6Q=w1280
    width: 1280
    description: Performance photo
videos:
  - platform: youtube
    video_id: qp22v58UQnw
    title: ZUGA video greeting
    url: https://www.youtube.com/embed/qp22v58UQnw
---
```

### Example 2: Text Page (Minimal Media)

```yaml
---
title: About Us
slug: about-us
language: en
description: Learn about Zuga contemporary dance company
type: page
status: published
page_type: about
translated:
  - meist
tags:
  - about
  - company-info
---
```

### Example 3: News/Landing Page

```yaml
---
title: Latest News
slug: news
language: et
description: Zuga uudised ja teated
type: page
status: published
page_type: news
translated:
  - news-en
---
```

---

## Markdown Body Format

### Content Structure

The markdown body follows **semantic sections** corresponding to `content_sections` in source JSON:

```markdown
# Page Title

## Hero Section

[Hero content if applicable]

## Main Content

[Primary text content]

## Gallery

[Images rendered as markdown or references]

## Video

[YouTube embeds as links or iframe syntax]

## Additional Sections

[Lists, text blocks, external links]
```

### Media Representation Strategy

**Decision: Option A - Media in Frontmatter Only**

All media (galleries, videos, hero images) will be stored in structured YAML frontmatter arrays. The markdown body will reference media semantically without embedding URLs directly.

**Rationale**:

- ✅ **Type-safe parsing**: Next.js can deserialize YAML into typed objects
- ✅ **Clean markdown body**: Readable text without URL clutter
- ✅ **Structured metadata**: Easy to maintain width, descriptions, platform info
- ✅ **Single source of truth**: All media data in frontmatter
- ✅ **Programmatic access**: Simple queries for rendering galleries/videos

**Implementation**:

```yaml
---
# Hero background
hero_image: https://lh5.googleusercontent.com/...

# Gallery images with metadata
gallery:
  - url: https://lh4.googleusercontent.com/...
    width: 1280
    description: Performance photo
  - url: https://lh6.googleusercontent.com/...
    width: 1280
    description: Performance photo

# Videos with platform info
videos:
  - platform: youtube
    video_id: qp22v58UQnw
    title: ZUGA video greeting
    url: https://www.youtube.com/embed/qp22v58UQnw
---
```

```markdown
# Shame

Performance gallery showcasing movement and emotion through contemporary dance.

## Gallery

This performance features 7 gallery images capturing key moments.

## Video

Watch the full performance and behind-the-scenes footage.
```

**Note**: The markdown body provides context and descriptions, while Next.js components will read frontmatter arrays to render actual media.

---

## Content Section Mapping

Map JSON `content_sections` → Markdown structure:

| JSON Section Type     | Markdown Output                            |
| --------------------- | ------------------------------------------ |
| `hero`                | Hero metadata in frontmatter + optional H2 |
| `text`                | Paragraph(s) under relevant H2             |
| `list`                | Bulleted list (`- item`)                   |
| `performance_gallery` | H2 "Gallery" + images per chosen strategy  |
| `video`               | H2 "Video" + YouTube link/embed            |
| `news`                | H2 "News" + list items                     |
| `external_links`      | H2 "Links" + markdown links                |
| `text_with_links`     | Paragraph with inline `[text](url)` links  |
| `structured_text`     | Multiple paragraphs/headings as needed     |
| `workshop_info`       | Custom section with workshop details       |

---

## Bilingual Linking

### Frontmatter Field: `translated`

```yaml
# English page (shame.md)
translated:
  - habi              # Estonian equivalent slug

# Estonian page (habi.md)
translated:
  - shame             # English equivalent slug
```

### Wikilink Support (Optional)

For Obsidian vaults, support `[[page]]` syntax:

```markdown
Read this page in [[habi|Estonian]].
```

---

## Validation Rules

### Frontmatter Validation

1. **Required Fields**: All 6 required fields must be present
2. **Language Values**: Must be exactly `"en"` or `"et"`
3. **Status Values**: Must be `"published"` or `"draft"`
4. **Slug Format**: Lowercase, hyphens only, no special characters
5. **Translated Array**: Slugs must reference existing files

### Content Validation

1. **Title Consistency**: H1 in body should match frontmatter `title`
2. **URL Validity**: All media URLs should be valid HTTP(S) URLs
3. **Link Integrity**: Internal links/wikilinks should resolve
4. **YAML Syntax**: Frontmatter must parse without errors

### Quality Checks

- **Markdown Lint**: Pass CommonMark linting
- **Frontmatter Parse**: YAML must deserialize correctly
- **Image Accessibility**: Media URLs return HTTP 200 (optional)
- **Bilingual Pairs**: All `translated` references are bidirectional

---

## Conversion Rules Matrix

| Source JSON Field             | Target Markdown Location   | Transformation                     |
| ----------------------------- | -------------------------- | ---------------------------------- |
| `metadata.title`              | Frontmatter `title`        | Direct copy                        |
| `metadata.slug`               | Frontmatter `slug`         | Direct copy                        |
| `metadata.language`           | Frontmatter `language`     | Direct copy                        |
| `metadata.description`        | Frontmatter `description`  | Direct copy                        |
| `metadata.page_type`          | Frontmatter `page_type`    | Direct copy                        |
| `bilingual_link`              | Frontmatter `translated[]` | Convert to array `[slug]`          |
| `media[type=hero]`            | Frontmatter `hero_image`   | Extract first hero URL             |
| `media[type=gallery_item]`    | Frontmatter `gallery[]`    | Array of {url, width, description} |
| `media[type=youtube]`         | Frontmatter `videos[]`     | Array of {platform, video_id, url} |
| `content_sections[type=text]` | Body paragraphs            | Convert to markdown paragraphs     |
| `content_sections[type=list]` | Body bulleted list         | Convert to `- item` format         |
| `content_sections[type=hero]` | Body H2 heading (optional) | Optional hero section              |
| `navigation.home_link`        | _(Ignored for now)_        | Not included in markdown output    |

---

## Implementation Guidelines

### Converter Function Signature

```python
def convert_to_markdown(page: ExtractedPage) -> str:
    """
    Convert ExtractedPage Pydantic model to markdown string.

    Args:
        page: Validated ExtractedPage from extraction_models.py

    Returns:
        Markdown string with YAML frontmatter

    Raises:
        ValueError: If required fields missing or invalid
    """
    pass
```

### Processing Pipeline

```python
# 1. Load and validate JSON
with open("page.json") as f:
    page = ExtractedPage.model_validate_json(f.read())

# 2. Convert to markdown
markdown_content = convert_to_markdown(page)

# 3. Write to organized path
output_path = f"packages/content/pages/{page.metadata.language}/{page.metadata.slug}.md"
Path(output_path).write_text(markdown_content)

# 4. Validate output
validate_markdown_file(output_path)
```

### Error Handling

- **Missing Required Fields**: Raise `ValueError` with field name
- **Invalid YAML**: Raise `yaml.YAMLError` with line number
- **Slug Collision**: Fail loudly (don't overwrite existing files)
- **Broken Bilingual Links**: Log warning but proceed

---

## Sample Output Files

### Full Example: Performance Page

**Input**: `packages/content/source_zuga_ee/extracted_v2/english-shame.json`

**Output**: `packages/content/pages/en/shame.md`

```markdown
---
title: Shame
slug: shame
language: en
description: Zuga performance 'Shame' photo gallery
type: performance
status: published
page_type: performance
translated:
  - habi
hero_image: https://lh5.googleusercontent.com/PXSN6CJeVTYvu_x98JfAS3NBScOCkqV2WJW0HXxDJZWAA5pu8fyh7o59Y-BweUELFvpWPqx55G_kz-QCKDI1Y9Y=w16383
gallery:
  - url: https://lh4.googleusercontent.com/zAG_7dQ9ctOWgapMIimu30Tjrugto9ndwjDyxOaacOQKB4vH3EwnXEsJd1k6zS0puQEuYYBLtBvUa8yd01YSh8VTXwlkKAza5qe4OJZTBVo_CMg1t1jFku0MSUk8kBOfkA=w1280
    width: 1280
    description: Performance photo
  - url: https://lh6.googleusercontent.com/0UudcK9OYV1xEpBfZP4vHrKIOA86t0Bx50THPQ1mmPKR9S4Jgj7GSINKPTQXwBC674Kbr3e94sk_zSt0nHpmdf8HmlM0AofYMepNpPW5rx73tD1ZcDO8bwdAs72sw2ay6Q=w1280
    width: 1280
    description: Performance photo
  - url: https://lh3.googleusercontent.com/mOqdQ0QIT2Y0X548qRgBpkBiqmFHYmR9iQ8-jjZLZ38A1bPnvC5juRiqlA4gJbYSURCwXQks7pazjU7mvfPRBHo=w1280
    width: 1280
    description: Performance photo
videos:
  - platform: youtube
    video_id: qp22v58UQnw
    title: ZUGA video greeting
    url: https://www.youtube.com/embed/qp22v58UQnw
---

# Shame

Performance gallery showcasing movement and emotion through contemporary dance.

## Gallery

[Gallery contains 7 performance photos - see frontmatter metadata for URLs]

## Video

[ZUGA video greeting available - see frontmatter metadata]
```

---

## Next Steps

### Phase 1: Implementation

**Decision Made**: Option A (Media in Frontmatter) - approved 2025-01-08

### Phase 2: Development Tasks

1. Update `scripts/extraction_models.py`:

   - Implement `ExtractedPage.to_markdown()` method
   - Add frontmatter generation logic
   - Add media array processing

2. Create `scripts/markdown_generator.py`:

   - Main conversion function
   - Section-to-markdown mapping
   - Bilingual link conversion

3. Create `scripts/validate_markdown.py`:
   - YAML frontmatter validation
   - Markdown linting
   - Link integrity checks

### Phase 3: Batch Conversion

1. Convert all 35 JSON files
2. Validate output (90% success threshold)
3. Manual review of edge cases
4. Commit final markdown files

---

## References

- **Source Schema**: `scripts/extraction_models.py` (ExtractedPage model)
- **Input Files**: `packages/content/source_zuga_ee/extracted_v2/*.json` (35 files)
- **Legacy Converter**: `scripts/markdown_converter.py` (for reference only)
- **Obsidian Docs**: https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax
- **CommonMark Spec**: https://commonmark.org/

---

## Changelog

### v1.0.0 (2025-01-08)

- Initial format specification
- Defined frontmatter schema (6 required + optional fields)
- **DECISION APPROVED**: Option A - Media in Frontmatter Only
- Created conversion rules matrix
- Added validation rules
- Documented sample output structure
- Ready for implementation

---

**Status**: ✅ **APPROVED** - Specification locked. Ready for converter implementation.
