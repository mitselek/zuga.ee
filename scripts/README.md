# Scripts

Content processing and transformation scripts.

## Available Modules

- `content_organizer.py` - Generate frontmatter and organize content by type/language
- `markdown_converter.py` - Convert parsed HTML data to Markdown format
- `media_downloader.py` - Download and optimize images from extracted content
- `frontmatter_models.py` - Pydantic models for YAML frontmatter validation

## Usage

```bash
# Set up Python environment
cd /path/to/zuga.ee
source .venv/bin/activate

# Run content organization
python -m scripts.content_organizer input.json

# Run tests
pytest scripts/tests/ -v
```
