"""Wayback Machine scraper for zuga.ee content recovery."""

import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Any
from urllib.parse import urlparse
import httpx
from pydantic import ValidationError
from scripts.wayback_models import WaybackSnapshot, ScrapeResult, ScraperConfig

logger = logging.getLogger(__name__)

CDX_API_URL = "https://web.archive.org/cdx/search/cdx"


async def query_wayback_cdx(
    url_pattern: str,
    filters: dict[str, str] | None = None,
) -> list[WaybackSnapshot]:
    """
    Query Wayback Machine CDX API for available snapshots.

    Strategy: Get ALL snapshots, filter in Python to select newest with 200 status.
    Why: More control, easier to test, explicit logic.

    Args:
        url_pattern: URL pattern to search (e.g., "zuga.ee/*")
        filters: Additional CDX filters (status, mimetype, etc.)

    Returns:
        List of WaybackSnapshot objects

    Raises:
        httpx.HTTPStatusError: If CDX API returns error status
        ValidationError: If response format is invalid
    """
    params: dict[str, Any] = {
        "url": url_pattern,
        "output": "json",
        "fl": "timestamp,original,statuscode,mimetype",
        "filter": ["statuscode:200", "mimetype:text/html"],
    }

    if filters:
        params.update(filters)

    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info(f"Querying CDX API for {url_pattern}")
        response = await client.get(CDX_API_URL, params=params)
        response.raise_for_status()

        data = response.json()

        # First row is header, skip it
        if len(data) <= 1:
            logger.warning(f"No snapshots found for {url_pattern}")
            return []

        snapshots: list[WaybackSnapshot] = []
        for row in data[1:]:  # Skip header row
            try:
                snapshot = WaybackSnapshot(
                    timestamp=row[0],
                    original_url=row[1],
                    status_code=int(row[2]),
                    mimetype=row[3],
                )
                snapshots.append(snapshot)
            except (IndexError, ValueError, ValidationError) as e:
                logger.warning(f"Skipping malformed row: {row}, error: {e}")
                continue

        logger.info(f"Found {len(snapshots)} snapshots for {url_pattern}")
        return snapshots


async def download_snapshot(
    snapshot: WaybackSnapshot,
    output_dir: Path,
    delay_seconds: float = 1.0,
) -> ScrapeResult:
    """
    Download HTML content from Wayback Machine snapshot.

    Args:
        snapshot: WaybackSnapshot with archive URL
        output_dir: Directory to save HTML files
        delay_seconds: Rate limiting delay in seconds

    Returns:
        ScrapeResult with metadata

    Raises:
        httpx.HTTPStatusError: If download fails
        httpx.TimeoutException: If request times out
    """
    # Create file path based on URL structure
    parsed_url = urlparse(str(snapshot.original_url))
    url_path = parsed_url.path.strip("/")

    # Create filename: use URL path, fallback to "index" for root
    if not url_path:
        file_path = output_dir / "index.html"
    else:
        # Replace slashes with directory separators
        parts = url_path.split("/")
        if len(parts) > 1:
            # Create subdirectory structure
            subdir = output_dir / "/".join(parts[:-1])
            subdir.mkdir(parents=True, exist_ok=True)
            file_path = subdir / f"{parts[-1]}.html"
        else:
            file_path = output_dir / f"{url_path}.html"

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # Download HTML content
    async with httpx.AsyncClient(timeout=30.0) as client:
        logger.info(f"Downloading {snapshot.archive_url}")
        response = await client.get(snapshot.archive_url)
        response.raise_for_status()

        html_content = response.text

        # Save to file
        file_path.write_text(html_content, encoding="utf-8")
        logger.info(f"Saved to {file_path} ({len(html_content)} bytes)")

        # Apply rate limiting delay
        await asyncio.sleep(delay_seconds)

        return ScrapeResult(
            url=snapshot.original_url,
            snapshot_timestamp=snapshot.timestamp,
            content_length=len(html_content),
            saved_to=file_path,
            scraped_at=datetime.now(),
        )


async def scrape_zuga_site(config: ScraperConfig) -> list[ScrapeResult]:
    """
    Scrape all zuga.ee pages from Wayback Machine.

    Strategy:
    1. Query CDX API for all HTML pages
    2. Select newest snapshot per unique URL
    3. Download HTML content (with error handling)
    4. Save to output_dir with organized structure
    5. Return metadata

    Args:
        config: ScraperConfig with scraping options

    Returns:
        List of ScrapeResult for each successfully downloaded page
    """
    logger.info(f"Starting scrape of {config.base_url}")

    # Step 1: Query CDX API for all snapshots
    url_pattern = f"{config.base_url}/*"
    all_snapshots = await query_wayback_cdx(url_pattern)

    if not all_snapshots:
        logger.warning(f"No snapshots found for {url_pattern}")
        return []

    # Step 2: Select newest snapshot per unique URL
    url_to_snapshot: dict[str, WaybackSnapshot] = {}
    for snapshot in all_snapshots:
        url_key = str(snapshot.original_url)
        if url_key not in url_to_snapshot:
            url_to_snapshot[url_key] = snapshot
        else:
            # Compare timestamps, keep newest
            if snapshot.timestamp > url_to_snapshot[url_key].timestamp:
                url_to_snapshot[url_key] = snapshot

    selected_snapshots = list(url_to_snapshot.values())
    logger.info(
        f"Selected {len(selected_snapshots)} unique pages from "
        f"{len(all_snapshots)} total snapshots"
    )

    # Step 3 & 4: Download each snapshot (with error handling)
    results: list[ScrapeResult] = []
    for snapshot in selected_snapshots:
        try:
            result = await download_snapshot(
                snapshot,
                config.output_dir,
                config.delay_seconds,
            )
            results.append(result)
        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            logger.error(
                f"Failed to download {snapshot.original_url}: {e}"
            )
            # Continue with other downloads
            continue

    logger.info(
        f"Scraping complete: {len(results)} pages downloaded, "
        f"{len(selected_snapshots) - len(results)} failed"
    )

    return results


def main() -> None:
    """CLI entry point for the scraper."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape zuga.ee content from Wayback Machine",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/raw_html"),
        help="Output directory for downloaded HTML files",
    )
    parser.add_argument(
        "--url-pattern",
        default="zuga.ee",
        help="Base URL pattern to scrape (without /*)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay in seconds between requests (rate limiting)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Create config
    config = ScraperConfig(
        base_url=args.url_pattern,
        output_dir=args.output,
        delay_seconds=args.delay,
    )

    # Run scraper
    logger.info("Starting Wayback Machine scraper for zuga.ee")
    logger.info(f"Config: {config}")

    results = asyncio.run(scrape_zuga_site(config))

    # Print summary
    print(f"\n{'=' * 60}")
    print(f"Scraping complete!")
    print(f"{'=' * 60}")
    print(f"Total pages downloaded: {len(results)}")
    print(f"Output directory: {config.output_dir}")
    print(f"\nSuccessfully downloaded:")
    for result in results:
        print(f"  - {result.url} ({result.content_length} bytes)")


if __name__ == "__main__":
    main()
