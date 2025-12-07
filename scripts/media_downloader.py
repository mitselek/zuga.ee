"""Media download and optimization for recovered content.

Downloads images from archived content, optimizes them, and updates markdown
files to reference local copies. Follows Phase 3 approved decisions.

Phase 3 scope:
- Extract image URLs from JSON metadata (ImageReference data)
- Download with retry: try direct CDN, fallback to Archive.org
- Optimize images >200KB (1920px max, JPEG quality 85)
- Generate content-based filenames (slug-description-hash.jpg)
- Organize by content type (performances/pages)
- Update markdown files with relative local paths
- Fail loudly on filename collisions
"""

from __future__ import annotations

import hashlib
import json
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Any

import httpx
from PIL import Image
from PIL.Image import Image as PILImage


def extract_image_urls(json_file: str) -> list[str]:
    """Extract image URLs from JSON metadata file.

    Args:
        json_file: Path to JSON file with ImageReference data

    Returns:
        List of image URLs found in sections
    """
    with open(json_file, encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    urls: list[str] = []
    sections: list[dict[str, Any]] = data.get("sections", [])

    for section in sections:
        if section.get("section_type") == "image":
            content = section.get("content", "")
            # Image content format: "URL|alt|caption"
            # Extract URL (first part before |)
            if "|" in content:
                url = content.split("|")[0].strip()
                if url:
                    urls.append(url)

    return urls


def unwrap_archive_url(url: str) -> str:
    """Unwrap Archive.org wrapped URL to get direct CDN URL.

    Args:
        url: Archive.org wrapped URL or direct URL

    Returns:
        Direct URL (unwrapped if needed)
    """
    # Archive.org pattern: https://web.archive.org/web/TIMESTAMP/ORIGINAL_URL
    archive_pattern = r"https?://web\.archive\.org/web/[^/]+/(.+)"
    match = re.match(archive_pattern, url)

    if match:
        return match.group(1)

    return url


def download_image(url: str, max_retries: int = 3, timeout: int = 30) -> bytes | None:
    """Download image from URL with retry logic.

    Args:
        url: Image URL to download
        max_retries: Maximum number of retry attempts
        timeout: Timeout in seconds per request

    Returns:
        Image bytes if successful, None if failed
    """
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                response = client.get(url)
                if response.status_code == 200:
                    return response.content
                elif response.status_code == 404:
                    return None  # Don't retry 404s

        except (httpx.TimeoutException, httpx.ConnectError):
            if attempt < max_retries - 1:
                # Exponential backoff: 1s, 2s, 4s
                time.sleep(2**attempt)
            continue
        except Exception:
            return None

    return None


def download_with_fallback(direct_url: str, archive_url: str) -> bytes | None:
    """Try downloading from direct URL, fallback to Archive.org.

    Args:
        direct_url: Direct CDN URL (unwrapped)
        archive_url: Archive.org wrapped URL

    Returns:
        Image bytes if successful, None if both failed
    """
    # Try direct URL first
    result = download_image(direct_url, max_retries=1, timeout=15)
    if result:
        return result

    # Fallback to Archive.org
    return download_image(archive_url, max_retries=2, timeout=30)


def generate_filename(slug: str, alt_text: str, url: str) -> str:
    """Generate content-based filename with hash fallback.

    Args:
        slug: Content slug (e.g., "noise")
        alt_text: Image alt text for description
        url: Image URL for hash generation

    Returns:
        Filename like "noise-stage-photo-a3f8.jpg" or "noise-a3f8b2c1.jpg"
    """
    # Generate hash from URL
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

    # Determine file extension
    ext = ".jpg"  # Default
    if ".png" in url.lower():
        ext = ".png"
    elif ".gif" in url.lower():
        ext = ".gif"

    # Sanitize alt text
    if alt_text and alt_text.strip():
        # Remove special characters, keep letters/numbers/spaces
        clean_alt = re.sub(r"[^a-z0-9\s]+", "", alt_text.lower())
        # Convert spaces to hyphens, collapse multiple hyphens
        clean_alt = re.sub(r"\s+", "-", clean_alt.strip())
        clean_alt = re.sub(r"-+", "-", clean_alt)

        # Limit description length
        words = clean_alt.split("-")
        description = "-".join(words[:4])  # Max 4 words

        if description:
            return f"{slug}-{description}-{url_hash}{ext}"

    # Fallback to hash-based naming
    return f"{slug}-{url_hash}{ext}"


def validate_unique_filename(filename: str, existing_files: set[str]) -> None:
    """Validate filename doesn't collide with existing files.

    Args:
        filename: Proposed filename
        existing_files: Set of existing filenames

    Raises:
        ValueError: If filename collision detected (fail loudly)
    """
    if filename in existing_files:
        raise ValueError(
            f"Filename collision detected: {filename} already exists. "
            "Manual resolution required to avoid data loss."
        )


def optimize_image(image_data: bytes, filename: str) -> bytes:
    """Optimize image if >200KB threshold.

    Args:
        image_data: Original image bytes
        filename: Filename (for format detection)

    Returns:
        Optimized image bytes (or original if <200KB)
    """
    # Check size threshold
    size_kb = len(image_data) / 1024
    if size_kb < 200:
        return image_data

    try:
        img: PILImage = Image.open(BytesIO(image_data))

        # Resize if larger than 1920px
        max_dimension = 1920
        if img.width > max_dimension or img.height > max_dimension:
            # Preserve aspect ratio
            ratio = min(max_dimension / img.width, max_dimension / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        # Save optimized
        output = BytesIO()
        if filename.lower().endswith(".png"):
            # PNG: preserve transparency, optimize
            img.save(output, format="PNG", optimize=True)
        else:
            # JPEG: quality 85, convert RGBA to RGB if needed
            if img.mode == "RGBA":
                # Create white background
                background: PILImage = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # Alpha channel as mask
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            img.save(output, format="JPEG", quality=85, optimize=True)

        return output.getvalue()

    except Exception:
        # If optimization fails, return original
        return image_data


def get_media_path(content_type: str, filename: str) -> str:
    """Generate media path organized by content type.

    Args:
        content_type: Content type (page/performance)
        filename: Image filename

    Returns:
        Path like "packages/content/media/performances/filename.jpg"
    """
    # Pluralize content type for directory name
    type_dir = f"{content_type}s" if not content_type.endswith("s") else content_type
    return f"packages/content/media/{type_dir}/{filename}"


def save_media_file(image_data: bytes, output_path: str) -> None:
    """Save media file, creating directory structure if needed.

    Args:
        image_data: Image bytes to save
        output_path: Full output path
    """
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(image_data)


def update_markdown_image_refs(markdown_file: str, url_map: dict[str, str]) -> None:
    """Update markdown file to reference local image paths.

    Args:
        markdown_file: Path to markdown file
        url_map: Mapping of external URL → relative local path
    """
    if not url_map:
        return  # No updates needed

    md_path = Path(markdown_file)
    content = md_path.read_text(encoding="utf-8")

    # Replace each URL in the mapping
    for external_url, local_path in url_map.items():
        # Find markdown image syntax: ![alt](url)
        # Preserve alt text while replacing URL
        pattern = re.escape(external_url)
        content = re.sub(
            rf"(!\[[^\]]*\])\({pattern}\)",
            rf"\1({local_path})",
            content,
        )

    md_path.write_text(content, encoding="utf-8")


def process_media_for_content(
    json_file: str,
    markdown_file: str,
    output_dir: str,
    content_type: str,
) -> dict[str, Any]:
    """Process all media for a content file.

    Args:
        json_file: Path to JSON metadata
        markdown_file: Path to markdown content
        output_dir: Output directory for media
        content_type: Content type for organization

    Returns:
        Dictionary with download results and errors
    """
    # Extract metadata
    with open(json_file, encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    metadata = data.get("metadata", {})
    slug = metadata.get("slug", "unknown")

    # Extract image URLs
    urls = extract_image_urls(json_file)

    results: dict[str, Any] = {
        "downloaded": [],
        "failed": [],
        "skipped": [],
    }

    existing_files: set[str] = set()
    url_map: dict[str, str] = {}

    for url in urls:
        # Unwrap Archive.org URL
        direct_url = unwrap_archive_url(url)

        # Extract alt text from sections (if available)
        alt_text = ""
        for section in data.get("sections", []):
            if section.get("section_type") == "image":
                content = section.get("content", "")
                if url in content:
                    parts = content.split("|")
                    if len(parts) > 1:
                        alt_text = parts[1].strip()
                    break

        # Generate filename
        filename = generate_filename(slug, alt_text, url)

        try:
            # Validate uniqueness
            validate_unique_filename(filename, existing_files)
            existing_files.add(filename)

            # Download with fallback
            image_data = download_with_fallback(direct_url, url)

            if image_data:
                # Optimize
                optimized = optimize_image(image_data, filename)

                # Save
                media_path = get_media_path(content_type, filename)
                full_path = Path(output_dir) / media_path
                save_media_file(optimized, str(full_path))

                # Calculate relative path from markdown to media
                relative_path = f"../../media/{content_type}s/{filename}"
                url_map[url] = relative_path
                url_map[direct_url] = relative_path  # Map both URLs

                results["downloaded"].append(filename)
            else:
                results["failed"].append({"url": url, "error": "Download failed"})

        except ValueError as e:
            results["failed"].append({"url": url, "error": str(e)})
        except Exception as e:
            results["failed"].append({"url": url, "error": str(e)})

    # Update markdown file
    update_markdown_image_refs(markdown_file, url_map)

    return results


def main() -> None:
    """CLI entry point for media downloader."""
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Download and optimize images from recovered content."
    )
    parser.add_argument(
        "content_dir",
        help="Directory containing organized content (e.g., packages/content)",
    )
    parser.add_argument(
        "--content-type",
        choices=["performance", "page", "all"],
        default="all",
        help="Content type to process (default: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without downloading or modifying files",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip files that already have local images",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Show detailed progress information",
    )

    args = parser.parse_args()

    content_dir = Path(args.content_dir)
    if not content_dir.exists():
        print(f"Error: Content directory not found: {content_dir}", file=sys.stderr)
        sys.exit(1)

    # Find content files to process
    if args.content_type == "all":
        pattern = "**/*.md"
    else:
        pattern = f"{args.content_type}s/**/*.md"

    md_files = list(content_dir.glob(pattern))
    # Exclude README files
    md_files = [f for f in md_files if f.name != "README.md"]

    if not md_files:
        print(f"No content files found in {content_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(md_files)} content files to process")

    total_downloaded = 0
    total_failed = 0
    total_skipped = 0

    for md_file in md_files:
        # Find corresponding JSON file
        # Pattern: packages/content/{type}/en/slug.md → data/test_parsed/slug.json
        slug = md_file.stem
        json_file = Path(f"data/test_parsed/{slug}.json")

        if not json_file.exists():
            if args.verbose:
                print(f"⚠️  No JSON metadata for {md_file.name}, skipping")
            total_skipped += 1
            continue

        # Determine content type from path
        if "/performances/" in str(md_file):
            content_type = "performance"
        elif "/pages/" in str(md_file):
            content_type = "page"
        else:
            content_type = "unknown"

        if args.dry_run:
            print(f"[DRY RUN] Would process: {md_file.name} ({content_type})")
            continue

        if args.verbose:
            print(f"Processing: {md_file.name} ({content_type})")

        try:
            result = process_media_for_content(
                str(json_file),
                str(md_file),
                str(content_dir.parent.parent),  # Output to workspace root
                content_type=content_type,
            )

            downloaded_count = len(result["downloaded"])
            failed_count = len(result["failed"])

            total_downloaded += downloaded_count
            total_failed += failed_count

            if args.verbose:
                if downloaded_count > 0:
                    print(f"  ✓ Downloaded {downloaded_count} images")
                if failed_count > 0:
                    print(f"  ✗ Failed {failed_count} images")
                    for failure in result["failed"]:
                        print(f"    - {failure['url']}: {failure['error']}")

        except Exception as e:
            if args.verbose:
                print(f"  ✗ Error processing {md_file.name}: {e}")
            total_failed += 1

    # Summary
    print(f"\n=== Summary ===")
    print(f"Total images downloaded: {total_downloaded}")
    print(f"Total failed: {total_failed}")
    print(f"Total skipped files: {total_skipped}")

    if total_failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
