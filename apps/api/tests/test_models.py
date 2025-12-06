"""Tests for Pydantic models."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.models import (
    ContentDocument,
    ContentFrontmatter,
    ContentStatus,
    LLMProvider,
    User,
    UserRole,
)


def test_user_model_valid() -> None:
    """Test valid user creation."""
    user = User(
        id="user123",
        email="test@example.com",
        role=UserRole.ADMIN,
        llm_provider=LLMProvider.OPENAI,
        llm_api_key="sk-test",
    )
    assert user.email == "test@example.com"
    assert user.role == UserRole.ADMIN
    assert isinstance(user.created_at, datetime)


def test_user_invalid_email() -> None:
    """Test user creation with invalid email fails."""
    with pytest.raises(ValidationError):
        User(id="user123", email="not-an-email", role=UserRole.VIEWER)


def test_content_frontmatter_defaults() -> None:
    """Test content frontmatter default values."""
    fm = ContentFrontmatter(title="Test", slug="test")
    assert fm.status == ContentStatus.DRAFT
    assert fm.language == "et"
    assert fm.translated == []
    assert fm.tags == []


def test_content_frontmatter_invalid_language() -> None:
    """Test content frontmatter with invalid language fails."""
    with pytest.raises(ValidationError):
        ContentFrontmatter(title="Test", slug="test", language="fr")


def test_content_document_structure() -> None:
    """Test content document structure."""
    frontmatter = ContentFrontmatter(title="Test Post", slug="test-post", language="en")
    doc = ContentDocument(
        frontmatter=frontmatter, body="# Test\n\nContent here.", path="/content/test.md"
    )
    assert doc.frontmatter.title == "Test Post"
    assert doc.frontmatter.language == "en"
    assert "Content here" in doc.body
