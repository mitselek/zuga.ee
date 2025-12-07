"""Content organization and frontmatter generation.

Converts Phase 2a JSON metadata + Phase 2b markdown into organized content
with YAML frontmatter for the zuga.ee content management system.

Phase 2c.1 scope (per Morgan's decisions):
- Basic frontmatter: title, slug, language, original_url, status, type
- URL-based content classification (page vs performance)
- Minimal tags from URL patterns
- No bilingual linking (empty translated field)
- No date field (omitted entirely)
- Fail loudly on slug collisions

Example:
    from scripts.content_organizer import process_content_file

    result_path = process_content_file(
        json_file="data/about-us-1.json",
        markdown_file="data/about-us-1.md",
        output_dir="packages/content"
    )
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Literal

import frontmatter  # type: ignore[import-untyped]

from scripts.frontmatter_models import ContentFrontmatter


def generate_frontmatter(metadata: dict[str, Any], fallback_slug: str | None = None) -> ContentFrontmatter:
    """Generate ContentFrontmatter from Phase 2a JSON metadata.

    Args:
        metadata: Dictionary with title, slug, language, original_url
                  Can be from html_parser or extracted format
        fallback_slug: Slug to use if not in metadata (e.g., from filename)

    Returns:
        ContentFrontmatter model with all required fields

    Example:
        >>> meta = {
        ...     "title": "About Us",
        ...     "slug": "about-us-1",
        ...     "language": "en",
        ...     "original_url": "https://www.zuga.ee/english/about-us-1"
        ... }
        >>> fm = generate_frontmatter(meta)
        >>> fm.status
        'published'
    """
    # Extract fields - handle both formats
    title = metadata.get("title", "Untitled")
    slug = metadata.get("slug") or fallback_slug or "unknown"
    language = metadata.get("language", "en")

    # Build original_url if not present
    if "original_url" in metadata:
        original_url = metadata["original_url"]
    else:
        # Reconstruct from url_path if available
        url_path = metadata.get("url_path", f"/{slug}")
        original_url = f"https://www.zuga.ee{url_path}"

    content_type = classify_content_type(original_url)
    tags = generate_tags(original_url, content_type)

    return ContentFrontmatter(
        title=title,
        slug=slug,
        language=language,
        original_url=original_url,
        status="published",  # Default per Morgan
        type=content_type,
        description=metadata.get("description"),
        tags=tags,
        translated=[],  # Empty per Phase 2c.1
    )


def classify_content_type(url: str) -> Literal["page", "performance", "news"]:
    """Classify content type based on URL pattern.

    Per Morgan's decisions:
    - noise, shame, 2-2-22, etc. → performance
    - /english/ pages → page
    - Unknown → page (default)

    Args:
        url: Full URL from original_url field

    Returns:
        Content type: 'page', 'performance', or 'news'

    Example:
        >>> classify_content_type("https://www.zuga.ee/english/noise")
        'performance'
        >>> classify_content_type("https://www.zuga.ee/english/about-us-1")
        'page'
    """
    # Known performance slugs (per Morgan's comment)
    performance_slugs = [
        "noise",
        "shame",
        "2-2-22",
        "inthemood",
        "magicstuff",
        "oldallies",
        "oldmuckers",
    ]

    url_lower = url.lower()

    # Check for performance slugs
    for perf_slug in performance_slugs:
        if perf_slug in url_lower:
            return "performance"

    # Default to page
    return "page"


def generate_tags(url: str, content_type: str) -> list[str]:
    """Generate minimal tags from URL pattern.

    Per Morgan: URL-based only, minimal tagging.

    Args:
        url: Original URL
        content_type: Content classification (page/performance/news)

    Returns:
        List of tags (may be empty for minimal tagging)

    Example:
        >>> generate_tags("https://www.zuga.ee/english/noise", "performance")
        ['performance']
    """
    tags: list[str] = []

    # Add content type as tag for performances
    if content_type == "performance":
        tags.append("performance")

    # Minimal tagging: could add more logic here later
    # For now, keeping it simple per Phase 2c.1

    return tags


def generate_output_path(slug: str, content_type: str, language: str) -> str:
    """Generate output file path in packages/content/ structure.

    Args:
        slug: URL-friendly identifier
        content_type: page/performance/news
        language: et or en

    Returns:
        Relative path from project root

    Example:
        >>> generate_output_path("noise", "performance", "en")
        'packages/content/performances/en/noise.md'
    """
    type_dir = f"{content_type}s" if content_type != "news" else "news"
    return f"packages/content/{type_dir}/{language}/{slug}.md"


def validate_unique_slug(
    slug: str,
    content_type: str,
    language: str,
    existing_slugs: dict[tuple[str, str], list[str]],
) -> None:
    """Validate slug is unique within its category.

    Per Morgan: Fail loudly on collisions (Option D).

    Args:
        slug: Slug to validate
        content_type: Content classification
        language: Content language
        existing_slugs: Dict of (type, lang) → [slugs]

    Raises:
        ValueError: If slug collision detected in same category

    Example:
        >>> existing = {("page", "en"): ["about-us"]}
        >>> validate_unique_slug("press", "page", "en", existing)  # OK
        >>> validate_unique_slug("about-us", "page", "en", existing)  # Raises
        Traceback (most recent call last):
        ...
        ValueError: Slug collision: 'about-us' already exists in page/en
    """
    key = (content_type, language)
    if key in existing_slugs and slug in existing_slugs[key]:
        raise ValueError(
            f"Slug collision: '{slug}' already exists in {content_type}/{language}. "
            f"Each slug must be unique within its content type and language."
        )


def save_content_file(
    frontmatter_data: ContentFrontmatter, markdown_body: str, output_path: str
) -> None:
    """Save markdown file with YAML frontmatter.

    Creates directory structure if missing.

    Args:
        frontmatter_data: Pydantic model with metadata
        markdown_body: Markdown content without frontmatter
        output_path: Target file path

    Example:
        >>> fm = ContentFrontmatter(...)
        >>> save_content_file(fm, "# Content", "packages/content/pages/en/test.md")
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Create frontmatter post
    post = frontmatter.Post(markdown_body)
    post.metadata = frontmatter_data.model_dump(exclude_none=True, by_alias=False)

    # Write to file
    output_file.write_text(frontmatter.dumps(post), encoding="utf-8")


def process_content_file(json_file: str, markdown_file: str, output_dir: str) -> str:
    """Process single content file: JSON + markdown → organized content with frontmatter.

    This is the main integration function for Phase 2c.1.

    Args:
        json_file: Path to Phase 2a JSON metadata file
        markdown_file: Path to Phase 2b markdown file
        output_dir: Base output directory (e.g., "packages/content")

    Returns:
        Path to generated file

    Raises:
        ValueError: If slug collision detected

    Example:
        >>> result = process_content_file(
        ...     "data/about-us-1.json",
        ...     "data/about-us-1.md",
        ...     "packages/content"
        ... )
        >>> Path(result).exists()
        True
    """
    # Read inputs
    with open(json_file, encoding="utf-8") as f:
        json_data = json.load(f)

    markdown_body = Path(markdown_file).read_text(encoding="utf-8")

    # Extract metadata (handle multiple formats)
    if "metadata" in json_data:
        # html_parser format with metadata key
        metadata = json_data["metadata"]
    elif "page_metadata" in json_data:
        # Extracted format with page_metadata key
        metadata = json_data["page_metadata"]
        # Ensure we have title and slug from page_metadata or fallback
        if "title" not in metadata:
            metadata["title"] = "Untitled"
    else:
        # Direct format
        metadata = json_data

    # Generate slug from filename if not in metadata
    fallback_slug = Path(json_file).stem  # e.g., "english-about-us-1"

    # Generate frontmatter
    fm = generate_frontmatter(metadata, fallback_slug=fallback_slug)

    # Generate output path
    rel_path = generate_output_path(fm.slug, fm.type or "page", fm.language)
    full_path = str(Path(output_dir) / rel_path.replace("packages/content/", ""))

    # Save file
    save_content_file(fm, markdown_body, full_path)

    return full_path


def main() -> None:
    """CLI entry point for content organization."""
    parser = argparse.ArgumentParser(
        description="Organize content: JSON + markdown → structured content with frontmatter"
    )
    parser.add_argument("json_file", help="Path to JSON metadata file")
    parser.add_argument("markdown_file", help="Path to markdown content file")
    parser.add_argument(
        "-o",
        "--output-dir",
        default="packages/content",
        help="Output directory (default: packages/content)",
    )

    args = parser.parse_args()

    try:
        result_path = process_content_file(
            args.json_file, args.markdown_file, args.output_dir
        )
        print(f"✅ Content organized: {result_path}")
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
