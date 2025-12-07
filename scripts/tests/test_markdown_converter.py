"""Tests for Markdown conversion functionality.

Following TDD approach from issue #6. Tests written first, implementation follows.
Focus on converting ParsedPage objects to clean, readable Markdown.
"""

# pyright: reportUnknownArgumentType=false, reportUnknownVariableType=false
# Test dicts are intentionally dynamic for flexibility


class TestBasicConversion:
    """Test conversion of ParsedPage with basic text to markdown."""

    def test_converts_title_to_h1(self) -> None:
        """Should convert page title to H1 heading."""
        from scripts.markdown_converter import convert_to_markdown

        # Minimal ParsedPage-like dict
        parsed_page = {
            "title": "About Us",
            "slug": "about-us",
            "language": "en",
            "original_url": "https://www.zuga.ee/english/about-us",
            "description": None,
            "sections": [],
        }

        markdown = convert_to_markdown(parsed_page)

        assert markdown.startswith("# About Us\n")

    def test_converts_sections_to_h2(self) -> None:
        """Should convert section headings to H2."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "About Us",
            "slug": "about-us",
            "language": "en",
            "original_url": "https://www.zuga.ee/english/about-us",
            "description": None,
            "sections": [
                {
                    "heading": "Our Mission",
                    "content": "We create dance.",
                    "section_type": "text",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "## Our Mission\n" in markdown
        assert "We create dance." in markdown

    def test_preserves_paragraph_breaks(self) -> None:
        """Should maintain paragraph separation with blank lines."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": None,
                    "content": "First paragraph.\n\nSecond paragraph.",
                    "section_type": "text",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "First paragraph.\n\nSecond paragraph." in markdown


class TestListConversion:
    """Test conversion of bullet and numbered lists."""

    def test_converts_bullet_lists(self) -> None:
        """Should convert list sections to markdown bullet lists."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": "Features",
                    "content": "Feature one\nFeature two\nFeature three",
                    "section_type": "list",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "- Feature one" in markdown
        assert "- Feature two" in markdown
        assert "- Feature three" in markdown

    def test_preserves_list_items(self) -> None:
        """Should maintain all list items with proper formatting."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": None,
                    "content": "Item 1\nItem 2",
                    "section_type": "list",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)
        lines = markdown.split("\n")
        list_items = [line for line in lines if line.startswith("- ")]

        assert len(list_items) == 2


class TestImageConversion:
    """Test conversion of image references."""

    def test_converts_images_with_alt_text(self) -> None:
        """Should convert images to markdown image syntax."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Gallery",
            "slug": "gallery",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": None,
                    "content": "https://example.com/image.jpg|A beautiful photo",
                    "section_type": "image",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "![A beautiful photo](https://example.com/image.jpg)" in markdown

    def test_handles_images_without_alt_text(self) -> None:
        """Should handle images with empty alt text gracefully."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Gallery",
            "slug": "gallery",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": None,
                    "content": "https://example.com/image.jpg|",
                    "section_type": "image",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "![](https://example.com/image.jpg)" in markdown


class TestVideoConversion:
    """Test conversion of YouTube embeds."""

    def test_converts_youtube_to_link(self) -> None:
        """Should convert YouTube embeds to markdown links."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Videos",
            "slug": "videos",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {
                    "heading": None,
                    "content": "https://www.youtube.com/embed/abc123",
                    "section_type": "video",
                }
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        assert "[YouTube Video](https://www.youtube.com/embed/abc123)" in markdown


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_handles_empty_sections(self) -> None:
        """Should skip sections with no content."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {"heading": None, "content": "", "section_type": "text"},
                {"heading": "Real Content", "content": "Text here", "section_type": "text"},
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        # Should not have excessive blank lines from empty section
        assert "\n\n\n" not in markdown
        assert "Real Content" in markdown

    def test_handles_missing_description(self) -> None:
        """Should handle pages without description gracefully."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [],
        }

        markdown = convert_to_markdown(parsed_page)

        assert markdown.startswith("# Test\n")
        assert "None" not in markdown

    def test_removes_excessive_blank_lines(self) -> None:
        """Should collapse multiple blank lines to single blank line."""
        from scripts.markdown_converter import convert_to_markdown

        parsed_page = {
            "title": "Test",
            "slug": "test",
            "language": "en",
            "original_url": "https://example.com",
            "description": None,
            "sections": [
                {"heading": None, "content": "Para 1", "section_type": "text"},
                {"heading": None, "content": "Para 2", "section_type": "text"},
            ],
        }

        markdown = convert_to_markdown(parsed_page)

        # Should never have 3+ consecutive newlines
        assert "\n\n\n" not in markdown
