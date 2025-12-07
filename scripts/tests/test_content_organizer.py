"""Tests for content organization and frontmatter generation.

Following TDD approach from Ada workflow. Tests written first, implementation follows.
Focus on generating YAML frontmatter and organizing content by type/language.

Phase 2c.1 scope (per Morgan's decisions):
- Basic frontmatter generation (title, slug, language, original_url, status, type)
- URL-based content classification (page vs performance)
- Minimal tag generation from URL patterns
- No bilingual linking (empty translated field)
- No date field (omitted entirely)
"""

# pyright: reportUnknownArgumentType=false, reportUnknownVariableType=false
# Test dicts are intentionally dynamic for flexibility

import json
from pathlib import Path


class TestFrontmatterGeneration:
    """Test basic frontmatter generation from JSON metadata."""

    def test_generates_frontmatter_from_page_metadata(self, tmp_path: Path) -> None:
        """
        GIVEN: JSON metadata from Phase 2a (page content)
        WHEN: generate_frontmatter is called
        THEN: Returns ContentFrontmatter with correct fields
        """
        from scripts.content_organizer import generate_frontmatter

        metadata = {
            "title": "About Us",
            "slug": "about-us-1",
            "language": "en",
            "original_url": "https://www.zuga.ee/english/about-us-1",
            "description": "Zuga United Dancers collective",
        }

        frontmatter = generate_frontmatter(metadata)

        assert frontmatter.title == "About Us"
        assert frontmatter.slug == "about-us-1"
        assert frontmatter.language == "en"
        assert frontmatter.original_url == "https://www.zuga.ee/english/about-us-1"
        assert frontmatter.status == "published"  # default
        assert frontmatter.translated == []  # empty per Phase 2c.1

    def test_generates_frontmatter_from_performance_metadata(
        self, tmp_path: Path
    ) -> None:
        """
        GIVEN: JSON metadata for performance content
        WHEN: generate_frontmatter is called
        THEN: Returns ContentFrontmatter with type='performance'
        """
        from scripts.content_organizer import generate_frontmatter

        metadata = {
            "title": "Noise",
            "slug": "noise",
            "language": "en",
            "original_url": "https://www.zuga.ee/english/noise",
            "description": "Contemporary dance performance",
        }

        frontmatter = generate_frontmatter(metadata)

        assert frontmatter.title == "Noise"
        assert frontmatter.type == "performance"

    def test_default_status_is_published(self, tmp_path: Path) -> None:
        """
        GIVEN: Metadata without explicit status field
        WHEN: generate_frontmatter is called
        THEN: Status defaults to 'published'
        """
        from scripts.content_organizer import generate_frontmatter

        metadata = {
            "title": "Test Page",
            "slug": "test",
            "language": "en",
            "original_url": "https://www.zuga.ee/english/test",
        }

        frontmatter = generate_frontmatter(metadata)

        assert frontmatter.status == "published"


class TestContentTypeClassification:
    """Test URL-based content type classification."""

    def test_classifies_english_pages_as_page_type(self) -> None:
        """
        GIVEN: URL with /english/ pattern
        WHEN: classify_content_type is called
        THEN: Returns 'page'
        """
        from scripts.content_organizer import classify_content_type

        url = "https://www.zuga.ee/english/about-us-1"

        content_type = classify_content_type(url)

        assert content_type == "page"

    def test_classifies_performance_urls_as_performance_type(self) -> None:
        """
        GIVEN: Performance-related URLs
        WHEN: classify_content_type is called
        THEN: Returns 'performance'
        """
        from scripts.content_organizer import classify_content_type

        test_urls = [
            "https://www.zuga.ee/english/noise",
            "https://www.zuga.ee/english/shame",
            "https://www.zuga.ee/english/2-2-22",
        ]

        for url in test_urls:
            content_type = classify_content_type(url)
            assert content_type == "performance", f"Failed for {url}"

    def test_classifies_unknown_urls_as_page_type(self) -> None:
        """
        GIVEN: URL that doesn't match known patterns
        WHEN: classify_content_type is called
        THEN: Returns 'page' as default
        """
        from scripts.content_organizer import classify_content_type

        url = "https://www.zuga.ee/unknown/path"

        content_type = classify_content_type(url)

        assert content_type == "page"


class TestTagGeneration:
    """Test URL-based tag generation."""

    def test_generates_minimal_tags_from_url(self) -> None:
        """
        GIVEN: URL with known pattern
        WHEN: generate_tags is called
        THEN: Returns minimal tag list based on URL
        """
        from scripts.content_organizer import generate_tags

        url = "https://www.zuga.ee/english/about-us-1"
        content_type = "page"

        tags = generate_tags(url, content_type)

        assert isinstance(tags, list)
        assert "about" in tags or tags == []  # Minimal tagging per Morgan

    def test_generates_performance_tag_for_performances(self) -> None:
        """
        GIVEN: Performance URL
        WHEN: generate_tags is called
        THEN: Returns tag list with 'performance'
        """
        from scripts.content_organizer import generate_tags

        url = "https://www.zuga.ee/english/noise"
        content_type = "performance"

        tags = generate_tags(url, content_type)

        assert "performance" in tags

    def test_returns_empty_list_for_minimal_tagging(self) -> None:
        """
        GIVEN: Generic URL
        WHEN: generate_tags is called with minimal strategy
        THEN: Returns empty list (tags can be added manually later)
        """
        from scripts.content_organizer import generate_tags

        url = "https://www.zuga.ee/english/generic"
        content_type = "page"

        tags = generate_tags(url, content_type)

        assert isinstance(tags, list)
        # Empty or minimal tags OK per Phase 2c.1


class TestFileOrganization:
    """Test directory structure and file path generation."""

    def test_generates_correct_path_for_english_page(self) -> None:
        """
        GIVEN: English page metadata
        WHEN: generate_output_path is called
        THEN: Returns path in packages/content/pages/en/
        """
        from scripts.content_organizer import generate_output_path

        slug = "about-us-1"
        content_type = "page"
        language = "en"

        output_path = generate_output_path(slug, content_type, language)

        assert output_path == "packages/content/pages/en/about-us-1.md"

    def test_generates_correct_path_for_performance(self) -> None:
        """
        GIVEN: Performance metadata
        WHEN: generate_output_path is called
        THEN: Returns path in packages/content/performances/{language}/
        """
        from scripts.content_organizer import generate_output_path

        slug = "noise"
        content_type = "performance"
        language = "en"

        output_path = generate_output_path(slug, content_type, language)

        assert output_path == "packages/content/performances/en/noise.md"

    def test_creates_directory_structure_if_missing(self, tmp_path: Path) -> None:
        """
        GIVEN: Output directory doesn't exist
        WHEN: save_content_file is called
        THEN: Creates directory structure and saves file
        """
        from scripts.content_organizer import save_content_file
        from scripts.frontmatter_models import ContentFrontmatter

        frontmatter = ContentFrontmatter(
            title="Test",
            slug="test",
            language="en",
            original_url="https://example.com",
            type="page",
            description="Test description",
        )
        markdown_body = "# Test\n\nContent here."
        output_path = tmp_path / "packages/content/pages/en/test.md"

        save_content_file(frontmatter, markdown_body, str(output_path))

        assert output_path.exists()
        content = output_path.read_text()
        assert "title: Test" in content
        assert "# Test" in content


class TestSlugCollisionDetection:
    """Test slug uniqueness validation (fail loudly per Morgan's decision)."""

    def test_detects_slug_collision_in_same_category(self) -> None:
        """
        GIVEN: Two files with same slug in same content type/language
        WHEN: validate_unique_slug is called
        THEN: Raises ValueError with clear error message
        """
        from scripts.content_organizer import validate_unique_slug

        existing_slugs = {("page", "en"): ["about-us", "press"]}
        new_slug = "about-us"
        content_type = "page"
        language = "en"

        try:
            validate_unique_slug(new_slug, content_type, language, existing_slugs)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "about-us" in str(e)
            assert "collision" in str(e).lower()

    def test_allows_same_slug_in_different_categories(self) -> None:
        """
        GIVEN: Same slug in different content type or language
        WHEN: validate_unique_slug is called
        THEN: Validation passes (no collision)
        """
        from scripts.content_organizer import validate_unique_slug

        existing_slugs = {("page", "en"): ["about-us"]}
        new_slug = "about-us"
        content_type = "performance"  # Different type
        language = "en"

        # Should not raise
        validate_unique_slug(new_slug, content_type, language, existing_slugs)


class TestIntegration:
    """Integration tests for full pipeline: JSON → frontmatter → file."""

    def test_full_pipeline_processes_json_to_markdown(self, tmp_path: Path) -> None:
        """
        GIVEN: JSON metadata file and markdown content
        WHEN: process_content_file is called
        THEN: Generates markdown with frontmatter and saves to correct location
        """
        from scripts.content_organizer import process_content_file

        # Setup input files
        json_file = tmp_path / "about-us-1.json"
        json_data = {
            "metadata": {
                "title": "About Us",
                "slug": "about-us-1",
                "language": "en",
                "original_url": "https://www.zuga.ee/english/about-us-1",
            },
            "sections": [],
        }
        json_file.write_text(json.dumps(json_data))

        markdown_file = tmp_path / "about-us-1.md"
        markdown_file.write_text("# About Us\n\nWe are a dance company.")

        output_dir = tmp_path / "output"

        # Process
        result_path = process_content_file(
            str(json_file), str(markdown_file), str(output_dir)
        )

        # Verify
        assert Path(result_path).exists()
        content = Path(result_path).read_text()
        assert "---" in content  # YAML frontmatter delimiters
        assert "title: About Us" in content
        assert "slug: about-us-1" in content


class TestCLI:
    """Tests for CLI interface."""

    def test_cli_main_success(self, tmp_path: Path) -> None:
        """GIVEN valid JSON and markdown files, WHEN CLI main() is called, THEN content is organized."""
        import sys
        from io import StringIO

        from scripts.content_organizer import main

        # Setup test files
        json_file = tmp_path / "test.json"
        json_file.write_text(
            json.dumps(
                {
                    "title": "Test CLI",
                    "slug": "test-cli",
                    "language": "en",
                    "original_url": "https://example.com/test",
                }
            )
        )

        markdown_file = tmp_path / "test.md"
        markdown_file.write_text("# Test Content")

        output_dir = tmp_path / "output"

        # Mock sys.argv
        original_argv = sys.argv
        sys.argv = [
            "content_organizer.py",
            str(json_file),
            str(markdown_file),
            "-o",
            str(output_dir),
        ]

        try:
            # Capture stdout
            captured = StringIO()
            original_stdout = sys.stdout
            sys.stdout = captured

            # Run CLI
            main()

            # Restore stdout and check output
            sys.stdout = original_stdout
            output = captured.getvalue()
            assert "✅ Content organized:" in output
            assert "pages/en/test-cli.md" in output

            # Verify file was created
            expected_file = output_dir / "pages/en/test-cli.md"
            assert expected_file.exists()

        finally:
            sys.argv = original_argv
