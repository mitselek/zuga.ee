# Scripts

Content transformation pipeline for Zuga.ee migration to Obsidian.

## Current Pipeline

**Source**: 35 validated JSON files in `packages/content/source_zuga_ee/extracted_v2/`

**Workflow**:

1. **JSON → Markdown conversion** ✅ Complete (35/35 files)
2. **Bilingual linking** (Estonian ↔ English) - next step

**Note**: Images from Google Sites are permanently lost and not recoverable.

## Active Scripts

### Core Models

- `extraction_models.py` - Pydantic schema for extracted JSON (ExtractedPage)
- `frontmatter_models.py` - Pydantic schema for YAML frontmatter

### Pipeline Scripts

- `convert_json_to_markdown.py` - Convert JSON → Markdown with frontmatter
- `markdown_converter.py` - Markdown formatting utilities
- `link_bilingual_pages.py` - Link bilingual page pairs

## Usage

```bash
# Set up Python environment
cd /path/to/zuga.ee
source .venv/bin/activate

# Step 1: Convert JSON to Markdown
python scripts/convert_json_to_markdown.py

# Step 2: Link bilingual pages
python scripts/link_bilingual_pages.py

# Run tests
pytest scripts/tests/ -v
```

## Archived Scripts

### Extraction Phase

In `archive/extraction_phase/` - Scripts used during manual HTML extraction:

- `html_beautifier.py` - Formatted HTML for analysis
- `html_cleaner.py` - Stripped Google Sites boilerplate
- `analyze_boilerplate.py` - Analyzed HTML patterns
- `build_image_mapping.py` - Built image coordination table
- `analyze_image_mapping.py` - Analyzed image stats
- `use_image_placeholders.py` - Added image placeholders

### Media Download Phase

In `archive/media_phase/` - Image download not feasible (images lost):

- `media_downloader.py` - Would have downloaded images from Google Photos
- `test_media_downloader.py` - Test suite for media downloader

**Decision**: Google Sites images are permanently inaccessible and cannot be recovered.
