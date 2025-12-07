# Markdown Converter

Converts parsed HTML (JSON format from `html_parser.py`) into clean, well-formatted Markdown files.

## Features

- **CommonMark Compliant**: Generates standard Markdown syntax
- **Preserves Structure**: Maintains headings, paragraphs, lists, images, videos
- **Flexible Input**: Handles both direct and nested JSON formats
- **Clean Output**: Removes excessive blank lines, ensures proper formatting

## Usage

### As a Module

```python
from scripts.markdown_converter import convert_to_markdown
import json

# Read parsed HTML
with open("parsed-page.json") as f:
    parsed_page = json.load(f)

# Convert to Markdown
markdown = convert_to_markdown(parsed_page)

# Save result
with open("output.md", "w") as f:
    f.write(markdown)
```

### Command Line

```bash
# Convert JSON to Markdown (auto-generates output filename)
python -m scripts.markdown_converter input.json

# Specify output filename
python -m scripts.markdown_converter input.json output.md

# Full pipeline: HTML → JSON → Markdown
python -m scripts.html_parser -i page.html -u "https://example.com" -o page.json
python -m scripts.markdown_converter page.json
```

## Input Format

Accepts JSON from `html_parser.py` in either format:

### Direct Format

```json
{
  "title": "Page Title",
  "description": "Optional description",
  "sections": [...]
}
```

### Nested Format (from CLI)

```json
{
  "metadata": {
    "title": "Page Title",
    "description": "Optional description"
  },
  "sections": [...]
}
```

## Section Types

### Text Sections

```json
{
  "heading": "Optional Heading",
  "content": "Paragraph text...",
  "section_type": "text"
}
```

Converts to:

```markdown
## Optional Heading

Paragraph text...
```

### List Sections

```json
{
  "heading": "Features",
  "content": "Item one\nItem two\nItem three",
  "section_type": "list"
}
```

Converts to:

```markdown
## Features

- Item one
- Item two
- Item three
```

### Image Sections

```json
{
  "heading": null,
  "content": "https://example.com/image.jpg|Alt text",
  "section_type": "image"
}
```

Converts to:

```markdown
![Alt text](https://example.com/image.jpg)
```

### Video Sections

```json
{
  "heading": null,
  "content": "https://www.youtube.com/embed/abc123",
  "section_type": "video"
}
```

Converts to:

```markdown
[YouTube Video](https://www.youtube.com/embed/abc123)
```

## Output Format

- Title converted to H1 (`# Title`)
- Description added below title (if present)
- Section headings converted to H2 (`## Heading`)
- Paragraph breaks preserved with blank lines
- Excessive blank lines collapsed to single blank line
- Trailing newline added to end of file

## Testing

```bash
# Run all tests
python -m pytest scripts/tests/test_markdown_converter.py -v

# Check coverage
python -m pytest scripts/tests/test_markdown_converter.py --cov=scripts.markdown_converter --cov-report=term-missing

# Type checking
python -m mypy --strict scripts/markdown_converter.py
```

Test coverage: **61%** (core conversion logic fully tested, CLI not covered)

## Design Decisions

1. **YouTube Format**: Videos converted to simple markdown links `[YouTube Video](url)` rather than HTML embeds
2. **URL Handling**: URLs kept as-is (absolute or relative) - Phase 2c will handle relativization
3. **Frontmatter**: Not included in this phase - Phase 2c will handle YAML frontmatter
4. **Validation**: Trust conversion - comprehensive test suite ensures correctness

## Implementation Details

- **Language**: Pure Python (stdlib only)
- **Lines of Code**: ~130
- **Tests**: 11 test cases covering all section types and edge cases
- **Type Safety**: Full mypy --strict compliance
- **Standards**: CommonMark Markdown specification

## Error Handling

- Missing title: Uses "Untitled"
- Missing description: Skips gracefully
- Empty sections: Skipped without extra blank lines
- Invalid section types: Defaults to text format
- Missing content: Handled with empty string

## Next Steps (Phase 2c)

1. Add YAML frontmatter with metadata
2. Implement URL relativization for internal links
3. Add content organization (tags, categories)
4. Batch processing with directory support
5. Integration tests with full HTML→Markdown pipeline

## Related Files

- `html_parser.py`: Generates input JSON from HTML
- `test_markdown_converter.py`: Comprehensive test suite
- Issue #6: Full implementation specification
