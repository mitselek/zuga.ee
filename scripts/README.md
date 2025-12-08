# Scripts

Content transformation pipeline for Zuga.ee migration to Obsidian.

## Current Pipeline

**Source**: 35 validated JSON files in `packages/content/source_zuga_ee/extracted_v2/`

**Workflow**:

1. **JSON → Markdown conversion** (next step)
2. **Content organization** by language and type
3. **Bilingual linking** (Estonian ↔ English)
4. **Media download** from Google Photos

## Active Scripts

### Core Models

- `extraction_models.py` - Pydantic schema for extracted JSON (ExtractedPage)
- `frontmatter_models.py` - Pydantic schema for YAML frontmatter

### Pipeline Scripts

- `convert_json_to_markdown.py` - Convert JSON → Markdown with frontmatter
- `markdown_converter.py` - Markdown formatting utilities
- `content_organizer.py` - Organize content by type/language
- `link_bilingual_pages.py` - Link bilingual page pairs
- `media_downloader.py` - Download and optimize images

## Usage

```bash
# Set up Python environment
cd /path/to/zuga.ee
source .venv/bin/activate

# Step 1: Convert JSON to Markdown
python scripts/convert_json_to_markdown.py

# Step 2: Organize content
python -m scripts.content_organizer

# Step 3: Link bilingual pages
python scripts/link_bilingual_pages.py

# Step 4: Download media
python scripts/media_downloader.py

# Run tests
pytest scripts/tests/ -v
```

## Archived Scripts

Extraction phase scripts (no longer needed) are in `archive/extraction_phase/`:

- `html_beautifier.py` - Formatted HTML for analysis
- `html_cleaner.py` - Stripped Google Sites boilerplate
- `analyze_boilerplate.py` - Analyzed HTML patterns
- `build_image_mapping.py` - Built image coordination table
- `analyze_image_mapping.py` - Analyzed image stats
- `use_image_placeholders.py` - Added image placeholders

These scripts were used during the manual extraction phase from Google Sites HTML exports.
The extraction is now complete, and all content exists as validated JSON.
