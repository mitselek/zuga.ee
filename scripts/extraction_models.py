"""
Canonical data models for Zuga content extraction.

This module defines the **source of truth** for all extracted content from zuga.ee.
These Pydantic models serve as executable schema that validates JSON structure
and guides conversion to Obsidian-compatible markdown.

Design principles:
- Title and description are REQUIRED for all pages (even gallery-only pages need metadata)
- Media items consolidated into single `media` array (not scattered across top-level keys)
- Content sections use consistent type taxonomy
- All models support validation and type hints for AI assistants
- Schema supports bilingual linking (Estonian ↔ English)

Analysis basis: 35 JSON files in packages/content/source_zuga_ee/extracted/
- 15 files use rich format (metadata + content_sections + media)
- 20 files use minimal format (page_metadata + separate media keys)
- Goal: Migrate all files to canonical format defined here

Related documentation: docs/DATA_MODEL.md
"""

from datetime import datetime
from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class Language(str, Enum):
    """Supported languages for bilingual content."""
    ESTONIAN = "et"
    ENGLISH = "en"


class ContentSectionType(str, Enum):
    """
    Content section types identified across 35 source files.

    Distribution:
    - hero: 15 sections (page hero with background image)
    - news: 15 sections (news feed/updates)
    - announcement: 10 sections (site-wide announcements)
    - video: 10 sections (YouTube embeds)
    - performance_gallery: 9 sections (performance-specific images)
    - image_gallery: 5 sections (general image galleries)
    - text: 5 sections (text blocks)
    - collapsible_gallery: 5 sections (expandable galleries)
    - upcoming_events: 5 sections (event listings)
    - text_content: 5 sections (structured text)
    """
    HERO = "hero"
    TEXT = "text"
    TEXT_CONTENT = "text_content"
    ANNOUNCEMENT = "announcement"
    NEWS = "news"
    VIDEO = "video"
    IMAGE_GALLERY = "image_gallery"
    PERFORMANCE_GALLERY = "performance_gallery"
    COLLAPSIBLE_GALLERY = "collapsible_gallery"
    UPCOMING_EVENTS = "upcoming_events"
    GALLERY = "gallery"  # Generic gallery type


class MediaType(str, Enum):
    """Types of media items found in content."""
    IMAGE = "image"
    BACKGROUND_IMAGE = "background_image"
    GALLERY_ITEM = "gallery_item"
    SITE_LOGO = "site_logo"
    HERO_IMAGE = "hero"
    VIDEO = "video"
    YOUTUBE = "youtube"


# ============================================================================
# COMPONENT MODELS
# ============================================================================

class Link(BaseModel):
    """Hyperlink with text and URL."""
    text: str = Field(..., description="Link display text")
    url: str = Field(..., description="Link target URL (relative or absolute)")


class NewsItem(BaseModel):
    """Individual news item in news feed."""
    text: str = Field(..., description="News text content")
    link: Optional[str] = Field(None, description="Optional URL for full article")
    importance: Optional[Literal["high", "medium", "low"]] = Field(None, description="Editorial importance")
    relevance: Optional[str] = Field(None, description="Context note about relevance")


class MediaItem(BaseModel):
    """
    Unified media item (images, videos, backgrounds).

    Consolidates all media from:
    - Format A: `media` array
    - Format B: `hero_image`, `site_logo`, `performance_images`, `gallery_images`, `workshop_images`
    """
    type: MediaType = Field(..., description="Type of media item")
    url: str = Field(..., description="Media URL (Google Photos, YouTube, etc.)")
    id: Optional[str] = Field(None, description="Unique identifier for cross-referencing")
    description: Optional[str] = Field(None, description="Human-readable description")
    context: Optional[str] = Field(None, description="Usage context or placement notes")

    # Video-specific
    platform: Optional[Literal["youtube", "vimeo"]] = Field(None, description="Video platform")
    video_id: Optional[str] = Field(None, description="Platform-specific video ID")
    title: Optional[str] = Field(None, description="Video title")
    embed_config: Optional[str] = Field(None, description="Embed configuration token")

    # Image-specific
    width: Optional[str] = Field(None, description="Image width (e.g., '1280')")
    styling: Optional[str] = Field(None, description="CSS styling instructions")


class VideoEmbed(BaseModel):
    """YouTube video embed (legacy - migrate to MediaItem)."""
    url: str = Field(..., description="YouTube embed URL")
    platform: Literal["youtube", "vimeo"] = Field("youtube", description="Video platform")
    video_id: str = Field(..., description="Platform-specific video ID")
    title: Optional[str] = Field(None, description="Video title")
    embed_config: Optional[str] = Field(None, description="Embed configuration token")


class ContentSection(BaseModel):
    """
    Individual content section within a page.

    Sections are the building blocks of page content.
    Each section has a type and optional content/metadata.
    """
    type: ContentSectionType = Field(..., description="Section type")
    content: Optional[str] = Field(None, description="Primary text content")
    heading: Optional[str] = Field(None, description="Section heading")
    media_ref: Optional[str] = Field(None, description="Reference to MediaItem.id")

    # Section-specific fields
    links: Optional[list[Link]] = Field(None, description="Hyperlinks (for announcements)")
    items: Optional[list[NewsItem]] = Field(None, description="News items (for news sections)")
    note: Optional[str] = Field(None, description="Editorial note")

    # Legacy structure preservation
    id: Optional[str] = Field(None, description="HTML element ID (from Format B)")
    classes: Optional[str] = Field(None, description="CSS classes (from Format B)")


class Navigation(BaseModel):
    """Site navigation structure."""
    home_link: str = Field("/uudised", description="Homepage URL path")
    logo_links_to: str = Field("/uudised", description="Logo click destination")


# ============================================================================
# METADATA MODELS
# ============================================================================

class PageMetadata(BaseModel):
    """
    REQUIRED metadata for all pages.

    Every page MUST have title and description, even gallery-only pages.
    These fields are essential for:
    - Obsidian note linking
    - SEO and social sharing
    - Navigation and site structure
    """
    title: str = Field(..., description="Page title (REQUIRED - use page type if no natural title)")
    language: Language = Field(..., description="Content language")
    slug: str = Field(..., description="URL slug for routing")
    description: str = Field(
        ...,
        description="Page description (REQUIRED - describe purpose even if no text content)"
    )

    # Optional page categorization
    page_type: Optional[Literal["performance", "gallery", "workshop", "about", "news", "landing"]] = Field(
        None,
        description="Page category for organization"
    )


class ExtractionMetadata(BaseModel):
    """
    Technical metadata about extraction process.

    Preserved from Format B for traceability.
    """
    source_file: str = Field(..., description="Path to source HTML file")
    extraction_date: datetime = Field(..., description="When content was extracted")
    extraction_method: Literal["manual", "automated"] = Field("manual", description="Extraction approach")
    notes: Optional[str] = Field(None, description="Extraction notes or warnings")


# ============================================================================
# ROOT MODEL (CANONICAL FORMAT)
# ============================================================================

class ExtractedPage(BaseModel):
    """
    **CANONICAL FORMAT** for all extracted Zuga content.

    This is the source of truth. All 35 JSON files should conform to this structure.

    Migration path:
    - Format A files (15): Already mostly compatible
    - Format B files (20): Need migration:
      * page_metadata → metadata (add title/description)
      * Consolidate hero_image, site_logo, *_images → media array
      * Minimal content.sections → content_sections
      * Add video_embed → media array

    Usage:
    ```python
    # Validate existing JSON
    with open("page.json") as f:
        page = ExtractedPage.model_validate_json(f.read())

    # Convert to Obsidian markdown
    markdown = page.to_markdown()
    ```
    """

    # REQUIRED: Core page metadata
    metadata: PageMetadata = Field(
        ...,
        description="Page metadata (title, language, slug, description)"
    )

    # REQUIRED: Content structure
    content_sections: list[ContentSection] = Field(
        ...,
        description="Ordered list of content sections (can be empty for media-only pages)"
    )

    # REQUIRED: Media library
    media: list[MediaItem] = Field(
        default_factory=list,
        description="All media items (images, videos, backgrounds)"
    )

    # OPTIONAL: Additional metadata
    bilingual_link: Optional[str] = Field(
        None,
        description="Slug of paired page in other language (for et/en linking)"
    )

    navigation: Optional[Navigation] = Field(
        None,
        description="Navigation structure (usually site-wide)"
    )

    extraction_notes: Optional[str] = Field(
        None,
        description="Notes from extraction process"
    )

    # LEGACY: Fields from Format B (migrate to standard fields)
    page_metadata: Optional[ExtractionMetadata] = Field(
        None,
        description="DEPRECATED: Technical extraction metadata (migrate to extraction_notes)"
    )

    hero_image: Optional[MediaItem] = Field(
        None,
        description="DEPRECATED: Migrate to media array with type='hero'"
    )

    site_logo: Optional[MediaItem] = Field(
        None,
        description="DEPRECATED: Migrate to media array with type='site_logo'"
    )

    video_embed: Optional[VideoEmbed] = Field(
        None,
        description="DEPRECATED: Migrate to media array with type='video'"
    )

    performance_images: Optional[list[MediaItem]] = Field(
        None,
        description="DEPRECATED: Migrate to media array"
    )

    gallery_images: Optional[list[MediaItem]] = Field(
        None,
        description="DEPRECATED: Migrate to media array"
    )

    workshop_images: Optional[list[MediaItem]] = Field(
        None,
        description="DEPRECATED: Migrate to media array"
    )

    external_links: Optional[list[Link]] = Field(
        None,
        description="External hyperlinks (consider moving to content_sections)"
    )

    def to_markdown(self) -> str:
        """
        Convert to Obsidian-compatible markdown.

        Returns:
            Markdown string with YAML frontmatter
        """
        # TODO: Implement markdown conversion
        # This replaces scripts/markdown_converter.py logic
        raise NotImplementedError("Markdown conversion will be implemented after schema migration")

    def validate_completeness(self) -> list[str]:
        """
        Validate page completeness and return warnings.

        Returns:
            List of validation warnings (empty if page is complete)
        """
        warnings = []

        # Check for legacy fields that need migration
        if self.page_metadata:
            warnings.append("page_metadata present - should be migrated to metadata")
        if self.hero_image:
            warnings.append("hero_image present - should be migrated to media array")
        if self.site_logo:
            warnings.append("site_logo present - should be migrated to media array")
        if self.video_embed:
            warnings.append("video_embed present - should be migrated to media array")
        if self.performance_images:
            warnings.append(f"performance_images ({len(self.performance_images)} items) - migrate to media array")
        if self.gallery_images:
            warnings.append(f"gallery_images ({len(self.gallery_images)} items) - migrate to media array")
        if self.workshop_images:
            warnings.append(f"workshop_images ({len(self.workshop_images)} items) - migrate to media array")

        # Check for empty content
        if not self.content_sections and not self.media:
            warnings.append("Page has no content_sections and no media - is this intentional?")

        # Check bilingual linking
        if self.metadata.language == Language.ENGLISH and not self.bilingual_link:
            warnings.append("English page has no bilingual_link - Estonian equivalent missing?")

        return warnings


# ============================================================================
# VALIDATION & MIGRATION HELPERS
# ============================================================================

def validate_json_file(filepath: str) -> tuple[bool, ExtractedPage | None, list[str]]:
    """
    Validate a JSON file against canonical schema.

    Args:
        filepath: Path to JSON file

    Returns:
        Tuple of (is_valid, parsed_page, errors)
    """
    import json
    from pathlib import Path

    try:
        with open(filepath) as f:
            data = json.load(f)

        page = ExtractedPage.model_validate(data)
        warnings = page.validate_completeness()

        return (True, page, warnings)

    except Exception as e:
        return (False, None, [str(e)])


def analyze_migration_needs(directory: str) -> dict:
    """
    Analyze all JSON files and report migration requirements.

    Args:
        directory: Path to directory containing JSON files

    Returns:
        Dictionary with migration statistics
    """
    from pathlib import Path

    stats = {
        "total_files": 0,
        "valid_files": 0,
        "invalid_files": 0,
        "needs_migration": 0,
        "files_by_issue": {}
    }

    for filepath in Path(directory).glob("*.json"):
        stats["total_files"] += 1

        is_valid, page, messages = validate_json_file(str(filepath))

        if is_valid:
            stats["valid_files"] += 1
            if messages:
                stats["needs_migration"] += 1
                stats["files_by_issue"][filepath.name] = messages
        else:
            stats["invalid_files"] += 1
            stats["files_by_issue"][filepath.name] = messages

    return stats


if __name__ == "__main__":
    """
    Quick validation check on extracted JSON files.
    """
    import sys
    from pathlib import Path

    # Find extracted JSON directory
    repo_root = Path(__file__).parent.parent
    extracted_dir = repo_root / "packages/content/source_zuga_ee/extracted_v2"

    if not extracted_dir.exists():
        print(f"❌ Extracted directory not found: {extracted_dir}")
        sys.exit(1)

    print("=" * 80)
    print("ZUGA CONTENT SCHEMA VALIDATION")
    print("=" * 80)
    print()

    # Run analysis
    stats = analyze_migration_needs(str(extracted_dir))

    print(f"📊 Analysis Results:")
    print(f"  Total files: {stats['total_files']}")
    print(f"  ✅ Valid (conforms to schema): {stats['valid_files']}")
    print(f"  ❌ Invalid (validation errors): {stats['invalid_files']}")
    print(f"  ⚠️  Needs migration (legacy fields): {stats['needs_migration']}")
    print()

    if stats['files_by_issue']:
        print(f"📋 Issues by file:")
        print()
        for filename, issues in sorted(stats['files_by_issue'].items()):
            print(f"  {filename}:")
            for issue in issues:
                print(f"    - {issue}")
        print()

    # Summary
    if stats['invalid_files'] > 0:
        print("❌ VALIDATION FAILED: Some files do not conform to canonical schema")
        sys.exit(1)
    elif stats['needs_migration'] > 0:
        print("⚠️  MIGRATION NEEDED: Some files use legacy format")
        sys.exit(0)
    else:
        print("✅ ALL FILES VALID: No migration needed")
        sys.exit(0)
