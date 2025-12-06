"""Pydantic models - single source of truth for data structures."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    """User permission roles."""

    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    CUSTOM = "custom"


class ContentStatus(str, Enum):
    """Content publication status."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class User(BaseModel):
    """User model with authentication and LLM configuration."""

    id: str
    email: EmailStr
    role: UserRole = UserRole.VIEWER
    llm_provider: LLMProvider | None = None
    llm_api_key: str | None = None
    secondary_llm_provider: LLMProvider | None = None
    secondary_llm_api_key: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ContentFrontmatter(BaseModel):
    """Markdown frontmatter structure."""

    title: str
    slug: str
    status: ContentStatus = ContentStatus.DRAFT
    language: str = "et"  # Estonian default
    translated: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language code."""
        allowed = ["et", "en"]
        if v not in allowed:
            raise ValueError(f"Language must be one of {allowed}")
        return v


class ContentDocument(BaseModel):
    """Complete content document with frontmatter and body."""

    frontmatter: ContentFrontmatter
    body: str
    path: str


class NewsDigestItem(BaseModel):
    """Single news item for digest."""

    title: str
    url: str
    source: str
    summary: str
    published_at: datetime | None = None
    relevance_score: float = Field(ge=0.0, le=1.0)


class NewsDigest(BaseModel):
    """Curated news digest."""

    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    items: list[NewsDigestItem]
    status: ContentStatus = ContentStatus.DRAFT
