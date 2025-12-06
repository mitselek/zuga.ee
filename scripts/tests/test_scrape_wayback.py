"""Tests for Wayback Machine scraper models and functions."""

from pathlib import Path
from datetime import datetime
import pytest
from pydantic import ValidationError, HttpUrl
import httpx
import respx
from respx import MockRouter

from scripts.wayback_models import WaybackSnapshot, ScraperConfig, ScrapeResult
from scripts.scrape_wayback import query_wayback_cdx


class TestWaybackSnapshot:
    """Tests for WaybackSnapshot model."""

    def test_creates_valid_snapshot(self) -> None:
        """Test creating a valid WaybackSnapshot."""
        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/uudised"),
            status_code=200,
            mimetype="text/html",
        )
        assert snapshot.timestamp == "20130303101838"
        assert str(snapshot.original_url) == "http://www.zuga.ee/uudised"
        assert snapshot.status_code == 200
        assert snapshot.mimetype == "text/html"

    def test_archive_url_property(self) -> None:
        """Test archive_url property generates correct URL."""
        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/uudised"),
            status_code=200,
            mimetype="text/html",
        )
        expected = "https://web.archive.org/web/20130303101838/http://www.zuga.ee/uudised"
        assert snapshot.archive_url == expected

    def test_validates_url_format(self) -> None:
        """Test that invalid URLs are rejected."""
        with pytest.raises(ValidationError):
            WaybackSnapshot(
                timestamp="20130303101838",
                original_url=HttpUrl("not-a-valid-url"),  # type: ignore[arg-type]
                status_code=200,
                mimetype="text/html",
            )

    def test_validates_required_fields(self) -> None:
        """Test that missing required fields raise ValidationError."""
        with pytest.raises(ValidationError):
            WaybackSnapshot(timestamp="20130303101838")  # type: ignore[call-arg]


class TestScraperConfig:
    """Tests for ScraperConfig model."""

    def test_creates_config_with_defaults(self) -> None:
        """Test creating ScraperConfig with default values."""
        config = ScraperConfig()
        assert config.base_url == "zuga.ee"
        assert config.output_dir == Path("data/raw_html")
        assert config.max_retries == 3
        assert config.timeout_seconds == 30
        assert config.delay_seconds == 1.0

    def test_creates_config_with_custom_values(self) -> None:
        """Test creating ScraperConfig with custom values."""
        config = ScraperConfig(
            base_url="example.com",
            output_dir=Path("/tmp/test"),
            max_retries=5,
            timeout_seconds=60,
            delay_seconds=2.0,
        )
        assert config.base_url == "example.com"
        assert config.output_dir == Path("/tmp/test")
        assert config.max_retries == 5
        assert config.timeout_seconds == 60
        assert config.delay_seconds == 2.0


class TestScrapeResult:
    """Tests for ScrapeResult model."""

    def test_creates_valid_result(self) -> None:
        """Test creating a valid ScrapeResult."""
        now = datetime.now()
        result = ScrapeResult(
            url=HttpUrl("http://www.zuga.ee/uudised"),
            snapshot_timestamp="20130303101838",
            content_length=12345,
            saved_to=Path("data/raw_html/uudised.html"),
            scraped_at=now,
        )
        assert str(result.url) == "http://www.zuga.ee/uudised"
        assert result.snapshot_timestamp == "20130303101838"
        assert result.content_length == 12345
        assert result.saved_to == Path("data/raw_html/uudised.html")
        assert result.scraped_at == now

    def test_validates_url_format(self) -> None:
        """Test that invalid URLs are rejected."""
        with pytest.raises(ValidationError):
            ScrapeResult(
                url=HttpUrl("invalid-url"),  # type: ignore[arg-type]
                snapshot_timestamp="20130303101838",
                content_length=12345,
                saved_to=Path("data/raw_html/test.html"),
                scraped_at=datetime.now(),
            )

    def test_validates_required_fields(self) -> None:
        """Test that missing required fields raise ValidationError."""
        with pytest.raises(ValidationError):
            ScrapeResult(url=HttpUrl("http://www.zuga.ee/test"))  # type: ignore[call-arg]


class TestQueryWaybackCDX:
    """Tests for query_wayback_cdx function."""

    @pytest.mark.asyncio
    @respx.mock
    async def test_query_wayback_cdx_returns_snapshots(self, respx_mock: MockRouter) -> None:
        """Test that query returns list of WaybackSnapshot objects."""
        # Mock CDX API response
        cdx_response = [
            ["timestamp", "original", "statuscode", "mimetype"],
            ["20130303101838", "http://www.zuga.ee/uudised", "200", "text/html"],
            ["20140101120000", "http://www.zuga.ee/galerii", "200", "text/html"],
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        snapshots = await query_wayback_cdx("zuga.ee/*")

        assert len(snapshots) == 2
        assert isinstance(snapshots[0], WaybackSnapshot)
        assert snapshots[0].timestamp == "20130303101838"
        assert str(snapshots[0].original_url) == "http://www.zuga.ee/uudised"
        assert snapshots[0].status_code == 200
        assert snapshots[0].mimetype == "text/html"

    @pytest.mark.asyncio
    @respx.mock
    async def test_query_wayback_cdx_filters_by_status(self, respx_mock: MockRouter) -> None:
        """Test that query sends correct filter parameters."""
        cdx_response = [
            ["timestamp", "original", "statuscode", "mimetype"],
            ["20130303101838", "http://www.zuga.ee/uudised", "200", "text/html"],
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        await query_wayback_cdx("zuga.ee/*")

        # Verify the request was made with correct params (URL encoded)
        request = respx_mock.calls.last.request  # type: ignore[attr-defined]
        url_str = str(request.url)  # type: ignore[attr-defined]
        assert "filter=statuscode%3A200" in url_str  # URL encoded :
        assert "filter=mimetype%3Atext%2Fhtml" in url_str  # URL encoded :
        assert "output=json" in url_str

    @pytest.mark.asyncio
    @respx.mock
    async def test_query_wayback_cdx_handles_api_error(self, respx_mock: MockRouter) -> None:
        """Test that API errors are handled gracefully."""
        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(500, text="Internal Server Error")
        )

        with pytest.raises(httpx.HTTPStatusError):
            await query_wayback_cdx("zuga.ee/*")

    @pytest.mark.asyncio
    @respx.mock
    async def test_query_wayback_cdx_validates_response_format(self, respx_mock: MockRouter) -> None:
        """Test that malformed responses are handled gracefully."""
        # Response missing required fields
        cdx_response = [
            ["timestamp", "original"],  # Missing statuscode, mimetype
            ["20130303101838", "http://www.zuga.ee/uudised"],
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        # Should not raise, but skip malformed rows
        snapshots = await query_wayback_cdx("zuga.ee/*")
        assert len(snapshots) == 0  # Malformed row was skipped

    @pytest.mark.asyncio
    @respx.mock
    async def test_query_wayback_cdx_empty_results(self, respx_mock: MockRouter) -> None:
        """Test handling of empty results from CDX API."""
        cdx_response = [["timestamp", "original", "statuscode", "mimetype"]]  # Only header

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        snapshots = await query_wayback_cdx("nonexistent.site/*")

        assert len(snapshots) == 0
        assert isinstance(snapshots, list)


class TestDownloadSnapshot:
    """Tests for download_snapshot function."""

    @pytest.mark.asyncio
    @respx.mock
    async def test_download_snapshot_saves_html(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that HTML content is downloaded and saved to file."""
        html_content = "<html><body>Test content</body></html>"
        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/uudised"),
            status_code=200,
            mimetype="text/html",
        )

        respx_mock.get(snapshot.archive_url).mock(
            return_value=httpx.Response(200, text=html_content)
        )

        from scripts.scrape_wayback import download_snapshot
        result = await download_snapshot(snapshot, tmp_path, delay_seconds=0.0)

        assert result.url == snapshot.original_url
        assert result.snapshot_timestamp == snapshot.timestamp
        assert result.content_length == len(html_content)
        assert result.saved_to.exists()
        assert result.saved_to.read_text() == html_content

    @pytest.mark.asyncio
    @respx.mock
    async def test_download_snapshot_creates_directories(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that nested directories are created automatically."""
        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/english/about-us"),
            status_code=200,
            mimetype="text/html",
        )

        respx_mock.get(snapshot.archive_url).mock(
            return_value=httpx.Response(200, text="<html>Test</html>")
        )

        from scripts.scrape_wayback import download_snapshot
        result = await download_snapshot(snapshot, tmp_path, delay_seconds=0.0)

        # Should create nested directories based on URL path
        assert result.saved_to.parent.exists()
        assert result.saved_to.exists()

    @pytest.mark.asyncio
    @respx.mock
    async def test_download_snapshot_handles_timeout(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that timeouts are handled gracefully."""
        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/uudised"),
            status_code=200,
            mimetype="text/html",
        )

        respx_mock.get(snapshot.archive_url).mock(side_effect=httpx.TimeoutException("Timeout"))

        from scripts.scrape_wayback import download_snapshot
        with pytest.raises(httpx.TimeoutException):
            await download_snapshot(snapshot, tmp_path, delay_seconds=0.0)

    @pytest.mark.asyncio
    async def test_download_snapshot_rate_limiting(self, tmp_path: Path) -> None:
        """Test that rate limiting delay is applied."""
        import time
        from scripts.scrape_wayback import download_snapshot

        snapshot = WaybackSnapshot(
            timestamp="20130303101838",
            original_url=HttpUrl("http://www.zuga.ee/uudised"),
            status_code=200,
            mimetype="text/html",
        )

        # Mock the HTTP request to avoid actual network call
        with respx.mock:
            respx.get(snapshot.archive_url).mock(
                return_value=httpx.Response(200, text="<html>Test</html>")
            )

            start_time = time.time()
            await download_snapshot(snapshot, tmp_path, delay_seconds=0.1)
            elapsed = time.time() - start_time

            # Should take at least 0.1 seconds due to delay
            assert elapsed >= 0.1


class TestScrapZugaSite:
    """Tests for scrape_zuga_site orchestration function."""

    @pytest.mark.asyncio
    @respx.mock
    async def test_scrape_zuga_site_downloads_all_pages(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that all pages are downloaded."""
        from scripts.scrape_wayback import scrape_zuga_site
        from scripts.wayback_models import ScraperConfig

        # Mock CDX API response with 2 pages
        cdx_response = [
            ["timestamp", "original", "statuscode", "mimetype"],
            ["20130303101838", "http://www.zuga.ee/uudised", "200", "text/html"],
            ["20140101120000", "http://www.zuga.ee/galerii", "200", "text/html"],
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        # Mock download responses
        respx_mock.get("https://web.archive.org/web/20130303101838/http://www.zuga.ee/uudised").mock(
            return_value=httpx.Response(200, text="<html>Uudised</html>")
        )
        respx_mock.get("https://web.archive.org/web/20140101120000/http://www.zuga.ee/galerii").mock(
            return_value=httpx.Response(200, text="<html>Galerii</html>")
        )

        config = ScraperConfig(output_dir=tmp_path, delay_seconds=0.0)
        results = await scrape_zuga_site(config)

        assert len(results) == 2
        assert all(isinstance(r, ScrapeResult) for r in results)
        assert all(r.saved_to.exists() for r in results)

    @pytest.mark.asyncio
    @respx.mock
    async def test_scrape_zuga_site_selects_newest_snapshot(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that the newest snapshot is selected for each unique URL."""
        from scripts.scrape_wayback import scrape_zuga_site
        from scripts.wayback_models import ScraperConfig

        # Mock CDX API with multiple snapshots of same URL
        cdx_response = [
            ["timestamp", "original", "statuscode", "mimetype"],
            ["20130303101838", "http://www.zuga.ee/uudised", "200", "text/html"],
            ["20150101120000", "http://www.zuga.ee/uudised", "200", "text/html"],  # Newer
            ["20140601080000", "http://www.zuga.ee/uudised", "200", "text/html"],  # Middle
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        # Mock only the newest snapshot
        respx_mock.get("https://web.archive.org/web/20150101120000/http://www.zuga.ee/uudised").mock(
            return_value=httpx.Response(200, text="<html>Newest</html>")
        )

        config = ScraperConfig(output_dir=tmp_path, delay_seconds=0.0)
        results = await scrape_zuga_site(config)

        # Should only download 1 page (the newest)
        assert len(results) == 1
        assert results[0].snapshot_timestamp == "20150101120000"

    @pytest.mark.asyncio
    @respx.mock
    async def test_scrape_zuga_site_handles_partial_failure(self, respx_mock: MockRouter, tmp_path: Path) -> None:
        """Test that scraper continues even if some downloads fail."""
        from scripts.scrape_wayback import scrape_zuga_site
        from scripts.wayback_models import ScraperConfig

        cdx_response = [
            ["timestamp", "original", "statuscode", "mimetype"],
            ["20130303101838", "http://www.zuga.ee/uudised", "200", "text/html"],
            ["20140101120000", "http://www.zuga.ee/galerii", "200", "text/html"],
        ]

        respx_mock.get("https://web.archive.org/cdx/search/cdx").mock(
            return_value=httpx.Response(200, json=cdx_response)
        )

        # First download succeeds, second fails
        respx_mock.get("https://web.archive.org/web/20130303101838/http://www.zuga.ee/uudised").mock(
            return_value=httpx.Response(200, text="<html>Success</html>")
        )
        respx_mock.get("https://web.archive.org/web/20140101120000/http://www.zuga.ee/galerii").mock(
            return_value=httpx.Response(500, text="Server Error")
        )

        config = ScraperConfig(output_dir=tmp_path, delay_seconds=0.0)
        results = await scrape_zuga_site(config)

        # Should have 1 successful result despite 1 failure
        assert len(results) == 1
        assert results[0].saved_to.exists()
