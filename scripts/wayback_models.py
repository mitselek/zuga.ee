"""Pydantic models for Wayback Machine scraper."""

from pathlib import Path
from datetime import datetime
from pydantic import BaseModel, HttpUrl


class WaybackSnapshot(BaseModel):
    """Represents a snapshot from Wayback Machine CDX API."""

    timestamp: str  # YYYYMMDDHHMMSS format
    original_url: HttpUrl
    status_code: int
    mimetype: str

    @property
    def archive_url(self) -> str:
        """Generate Wayback Machine archive URL for this snapshot."""
        return f"https://web.archive.org/web/{self.timestamp}/{self.original_url}"


class ScraperConfig(BaseModel):
    """Configuration for the Wayback Machine scraper."""

    base_url: str = "zuga.ee"
    output_dir: Path = Path("data/raw_html")
    max_retries: int = 3
    timeout_seconds: int = 30
    delay_seconds: float = 1.0  # Rate limiting delay


class ScrapeResult(BaseModel):
    """Result of scraping a single page."""

    url: HttpUrl
    snapshot_timestamp: str
    content_length: int
    saved_to: Path
    scraped_at: datetime
