"""Pydantic models for frontmatter generation and content organization.

This module defines the data structures for YAML frontmatter that will be
added to markdown files. Models enforce validation and type safety.
"""

# pyright: reportUnknownVariableType=false, reportUnknownArgumentType=false
# Pydantic Field descriptors confuse Pylance (false positives)

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class TranslationReference(BaseModel):
    """Reference to a translated version of content.

    Used in the `translated` field to link bilingual content pairs.
    Example: English "noise" ↔ Estonian "kahin"
    """

    language: Literal["et", "en"] = Field(..., description="Target language code")
    slug: str = Field(..., description="Slug of translated content")


class ContentFrontmatter(BaseModel):
    """YAML frontmatter for markdown content files.

    This model defines the metadata that appears at the top of each
    markdown file in the packages/content/ directory.

    Example:
        >>> frontmatter = ContentFrontmatter(
        ...     title="Noise",
        ...     slug="noise",
        ...     language="en",
        ...     original_url="https://www.zuga.ee/english/noise",
        ...     status="published",
        ...     type="performance"
        ... )
        >>> frontmatter.type
        'performance'
    """

    # Required fields
    title: str = Field(..., description="Content title", min_length=1)
    slug: str = Field(..., description="URL-friendly identifier", min_length=1)
    language: Literal["et", "en"] = Field(..., description="Content language")
    original_url: str = Field(..., description="Full canonical URL")
    status: Literal["published", "draft"] = Field(
        default="published", description="Publication status"
    )

    # Optional fields
    type: Optional[Literal["page", "performance", "news"]] = Field(
        None, description="Content classification"
    )
    description: Optional[str] = Field(None, description="Meta description")
    tags: list[str] = Field(default_factory=list, description="Content tags")
    translated: list[TranslationReference] = Field(
        default_factory=list, description="Links to translations"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Noise",
                "slug": "noise",
                "language": "en",
                "original_url": "https://www.zuga.ee/english/noise",
                "status": "published",
                "type": "performance",
                "tags": ["performance"],
                "translated": [],
            }
        }
    )
