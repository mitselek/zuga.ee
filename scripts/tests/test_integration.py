"""Integration test for full HTML → Markdown pipeline.

Tests the complete workflow: parse HTML → convert to Markdown → validate output.
"""

# pyright: reportUnknownArgumentType=false, reportUnknownVariableType=false
# Integration tests use dynamic data structures


def test_full_pipeline() -> None:
    """Should handle complete HTML→JSON→Markdown conversion."""
    from scripts.markdown_converter import convert_to_markdown

    # Use realistic parsed data structure (like from html_parser)
    realistic_data = {
        "metadata": {
            "title": "About Zuga Dancers",
            "slug": "about-us",
            "language": "en",
            "original_url": "https://example.com/about-us",
            "description": "Zuga is a dance collective.",
        },
        "sections": [
            {
                "heading": None,
                "content": "First\nSecond\nThird",
                "section_type": "list",
            },
            {
                "heading": "Our Story",
                "content": "We started in 1999.\n\nWe love dancing.",
                "section_type": "text",
            },
            {
                "heading": None,
                "content": "https://example.com/photo.jpg|Team photo",
                "section_type": "image",
            },
        ],
    }

    # Convert to Markdown
    markdown = convert_to_markdown(realistic_data)

    # Validate structure
    assert markdown.startswith("# About Zuga Dancers")
    assert "Zuga is a dance collective." in markdown
    assert "- First" in markdown
    assert "## Our Story" in markdown
    assert "![Team photo](https://example.com/photo.jpg)" in markdown
    assert "\n\n" in markdown  # Has paragraph breaks
    assert len(markdown) > 100  # Non-trivial content


def test_nested_format_from_cli() -> None:
    """Should handle nested metadata format from CLI output."""
    from scripts.markdown_converter import convert_to_markdown

    # Simulate CLI output format
    nested_data = {
        "metadata": {
            "title": "Test Page",
            "slug": "test-page",
            "language": "en",
            "original_url": "https://example.com/test",
            "description": "A test page description",
        },
        "sections": [
            {
                "heading": "Introduction",
                "content": "This is intro text.",
                "section_type": "text",
            }
        ],
    }

    markdown = convert_to_markdown(nested_data)

    assert "# Test Page" in markdown
    assert "A test page description" in markdown
    assert "## Introduction" in markdown
    assert "This is intro text." in markdown


def test_direct_format_from_tests() -> None:
    """Should handle direct format used in unit tests."""
    from scripts.markdown_converter import convert_to_markdown

    direct_data = {
        "title": "Direct Format",
        "slug": "direct",
        "language": "en",
        "original_url": "https://example.com",
        "description": "Direct description",
        "sections": [
            {
                "heading": "Section One",
                "content": "Section content.",
                "section_type": "text",
            }
        ],
    }

    markdown = convert_to_markdown(direct_data)

    assert "# Direct Format" in markdown
    assert "Direct description" in markdown
    assert "## Section One" in markdown


def test_mixed_section_types() -> None:
    """Should handle documents with multiple section types."""
    from scripts.markdown_converter import convert_to_markdown

    mixed_data = {
        "title": "Mixed Content",
        "description": None,
        "sections": [
            {
                "heading": "Text Section",
                "content": "Some text here.",
                "section_type": "text",
            },
            {
                "heading": "List Section",
                "content": "Item A\\nItem B\\nItem C",
                "section_type": "list",
            },
            {
                "heading": None,
                "content": "https://example.com/img.jpg|An image",
                "section_type": "image",
            },
            {
                "heading": None,
                "content": "https://youtube.com/embed/xyz",
                "section_type": "video",
            },
        ],
    }

    markdown = convert_to_markdown(mixed_data)

    # Check all types present
    assert "## Text Section" in markdown
    assert "## List Section" in markdown
    assert "- Item A" in markdown
    assert "![An image](https://example.com/img.jpg)" in markdown
    assert "[YouTube Video](https://youtube.com/embed/xyz)" in markdown
