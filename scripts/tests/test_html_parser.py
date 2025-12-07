"""Tests for HTML parsing functionality.

Following TDD approach from issue #5 (formerly #4). Tests written first,
implementation follows. Focus on extracting clean content from archived
Google Sites HTML pages.
"""

from pathlib import Path

import pytest

# Sample HTML files from data/test_scrape directory
TEST_DATA_DIR = Path(__file__).parent.parent.parent / "data" / "test_scrape" / "english"


@pytest.fixture
def about_us_html() -> str:
    """Load simple text page with bullet lists (Phase 1 target)."""
    html_file = TEST_DATA_DIR / "about-us-1.html"
    return html_file.read_text(encoding="utf-8")


@pytest.fixture
def noise_html() -> str:
    """Load performance page with images and YouTube video (Phase 2 target)."""
    html_file = TEST_DATA_DIR / "noise.html"
    return html_file.read_text(encoding="utf-8")


@pytest.fixture
def inthemood_html() -> str:
    """Load complex performance page (Phase 3 target)."""
    html_file = TEST_DATA_DIR / "inthemood.html"
    return html_file.read_text(encoding="utf-8")


class TestWaybackWrapperRemoval:
    """Test removal of Wayback Machine wrapper HTML."""

    def test_removes_wayback_scripts(self, about_us_html: str) -> None:
        """Should remove Archive.org JavaScript includes."""
        from scripts.html_parser import strip_wayback_wrapper

        cleaned = strip_wayback_wrapper(about_us_html)

        # Should not contain any archive.org script references
        assert "web-static.archive.org" not in cleaned
        assert "bundle-playback.js" not in cleaned
        assert "wombat.js" not in cleaned
        assert "ruffle.js" not in cleaned

    def test_removes_wayback_init_scripts(self, about_us_html: str) -> None:
        """Should remove __wm.init and __wm.wombat inline scripts."""
        from scripts.html_parser import strip_wayback_wrapper

        cleaned = strip_wayback_wrapper(about_us_html)

        # Should not contain Wayback Machine initialization code
        assert "__wm.init" not in cleaned
        assert "__wm.wombat" not in cleaned

    def test_removes_wayback_banner_styles(self, about_us_html: str) -> None:
        """Should remove Wayback Machine banner CSS."""
        from scripts.html_parser import strip_wayback_wrapper

        cleaned = strip_wayback_wrapper(about_us_html)

        # Should not contain Wayback CSS references
        assert "banner-styles.css" not in cleaned
        assert "iconochive.css" not in cleaned

    def test_removes_wayback_comment_markers(self, about_us_html: str) -> None:
        """Should remove <!-- End Wayback Rewrite JS Include --> markers."""
        from scripts.html_parser import strip_wayback_wrapper

        cleaned = strip_wayback_wrapper(about_us_html)

        # Should not contain comment markers
        assert "End Wayback" not in cleaned

    def test_preserves_google_sites_content(self, about_us_html: str) -> None:
        """Should keep all Google Sites div structure intact."""
        from scripts.html_parser import strip_wayback_wrapper

        cleaned = strip_wayback_wrapper(about_us_html)

        # Should still contain Google Sites structure
        assert 'role="main"' in cleaned
        assert "about us" in cleaned.lower()
        assert "Zuga United Dancers" in cleaned


class TestMainContentExtraction:
    """Test extraction of main content area from Google Sites structure."""

    def test_extracts_role_main_div(self, about_us_html: str) -> None:
        """Should find and extract <div role='main'> content."""
        from scripts.html_parser import extract_main_content

        result = extract_main_content(about_us_html)

        # Should return a BeautifulSoup Tag with role="main"
        assert result is not None
        assert result.get("role") == "main"
        # Should contain actual content
        assert "about us" in result.get_text().lower()

    def test_removes_navigation_sections(self, about_us_html: str) -> None:
        """Should strip JzO0Vc navigation sidebar."""
        from scripts.html_parser import extract_main_content

        result = extract_main_content(about_us_html)

        # Should not contain navigation elements
        nav_elements = result.find_all("nav", class_="JzO0Vc")
        assert len(nav_elements) == 0

    def test_removes_footer_sections(self, about_us_html: str) -> None:
        """Should strip dZA9kd footer elements."""
        from scripts.html_parser import extract_main_content

        result = extract_main_content(about_us_html)

        # Should not contain footer elements
        # Check if any div has "dZA9kd" in its class list
        has_footer = False
        for div in result.find_all("div"):
            classes = div.get("class", [])
            if isinstance(classes, list):
                for cls in classes:  # type: ignore[misc]
                    if isinstance(cls, str) and "dZA9kd" in cls:
                        has_footer = True
                        break
            if has_footer:
                break
        assert not has_footer


class TestMetadataExtraction:
    """Test extraction of page metadata (title, slug, language, description)."""

    def test_extracts_page_title(self, about_us_html: str) -> None:
        """Should extract page title from <title> tag."""
        from scripts.html_parser import extract_metadata

        metadata = extract_metadata(about_us_html)

        assert metadata["title"] == "Zuga - about us"

    def test_detects_english_language_from_url(self, about_us_html: str) -> None:
        """Should detect 'en' from /english/ in URL."""
        from scripts.html_parser import extract_metadata

        metadata = extract_metadata(about_us_html)

        assert metadata["language"] == "en"

    def test_extracts_slug_from_url(self, about_us_html: str) -> None:
        """Should extract 'about-us-1' from URL path."""
        from scripts.html_parser import extract_metadata

        metadata = extract_metadata(about_us_html)

        assert metadata["slug"] == "about-us-1"

    def test_extracts_description_from_meta(self, about_us_html: str) -> None:
        """Should extract og:description meta tag."""
        from scripts.html_parser import extract_metadata

        metadata = extract_metadata(about_us_html)

        # og:description should be cleaned of extra whitespace
        assert metadata["description"] is not None
        assert "Collaboration" in metadata["description"]

    def test_handles_missing_title(self) -> None:
        """Should return empty string when <title> tag is missing."""
        from scripts.html_parser import extract_metadata

        html = "<html><head></head><body></body></html>"
        metadata = extract_metadata(html)

        assert metadata["title"] == ""

    def test_handles_missing_metadata_tags(self) -> None:
        """Should return empty/None values when og: tags are missing."""
        from scripts.html_parser import extract_metadata

        html = "<html><head><title>Test</title></head><body></body></html>"
        metadata = extract_metadata(html)

        assert metadata["title"] == "Test"
        assert metadata["language"] == "en"  # default
        assert metadata["slug"] == ""
        assert metadata["description"] is None

    def test_detects_estonian_language_from_url(self) -> None:
        """Should detect 'et' from /estonian/ in URL."""
        from scripts.html_parser import extract_metadata

        html = '''<html><head>
            <title>Zuga</title>
            <meta property="og:url" content="https://www.zuga.ee/estonian/meist-1">
        </head><body></body></html>'''
        metadata = extract_metadata(html)

        assert metadata["language"] == "et"

    def test_cleans_description_whitespace(self) -> None:
        """Should normalize whitespace in description."""
        from scripts.html_parser import extract_metadata

        html = '''<html><head>
            <title>Test</title>
            <meta property="og:description" content="  Multiple   spaces
            and   newlines  ">
        </head><body></body></html>'''
        metadata = extract_metadata(html)

        assert metadata["description"] == "Multiple spaces and newlines"


class TestSectionParsing:
    """Test parsing of content sections with type classification."""

    def test_identifies_text_sections(self, about_us_html: str) -> None:
        """Should classify paragraph content as 'text' type."""
        pytest.skip("parse_sections() not implemented yet")

    def test_identifies_list_sections(self, about_us_html: str) -> None:
        """Should classify bullet lists as 'list' type."""
        pytest.skip("parse_sections() not implemented yet")

    def test_identifies_image_sections(self, noise_html: str) -> None:
        """Should classify images as 'image' type."""
        pytest.skip("parse_sections() not implemented yet")

    def test_identifies_video_sections(self, noise_html: str) -> None:
        """Should classify YouTube embeds as 'video' type."""
        pytest.skip("parse_sections() not implemented yet")

    def test_extracts_section_headings(self, about_us_html: str) -> None:
        """Should extract heading text when present."""
        pytest.skip("parse_sections() not implemented yet")


class TestURLUnwrapping:
    """Test extraction of canonical URLs from Archive.org wrappers."""

    def test_unwraps_archive_org_urls(self, about_us_html: str) -> None:
        """Should extract https://www.zuga.ee/... from archive.org wrapper."""
        pytest.skip("unwrap_url() not implemented yet")

    def test_unwraps_image_urls(self, noise_html: str) -> None:
        """Should extract original image URLs from archive wrappers."""
        pytest.skip("unwrap_url() not implemented yet")

    def test_handles_already_unwrapped_urls(self) -> None:
        """Should pass through URLs that aren't wrapped."""
        pytest.skip("unwrap_url() not implemented yet")
