"""Tests for main application endpoints."""

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    """Test root endpoint returns status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data


def test_health_endpoint() -> None:
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_cors_headers() -> None:
    """Test CORS headers are set correctly."""
    response = client.options("/", headers={"Origin": "http://localhost:3000"})
    assert "access-control-allow-origin" in response.headers
