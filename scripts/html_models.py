"""Pydantic models for HTML parsing and content extraction.

This module defines the data structures used to represent parsed HTML content
from Wayback Machine archives. Models are designed for clean separation between
raw HTML extraction and markdown conversion.
"""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


class ImageReference(BaseModel):
    """Reference to an image found in parsed HTML content."""

    src: str = Field(..., description="Image source URL (unwrapped from archive)")
    alt: Optional[str] = Field(None, description="Alternative text for accessibility")
    caption: Optional[str] = Field(None, description="Image caption if present")


class ContentSection(BaseModel):
    """A section of content from the parsed page.

    Sections are typed to allow different rendering strategies during
    markdown conversion (e.g., images, videos, lists, paragraphs).
    """

    heading: Optional[str] = Field(None, description="Section heading if present")
    content: str = Field(..., description="HTML fragment for this section")
    section_type: Literal["text", "image", "video", "list"] = Field(
        ..., description="Type of content in this section"
    )


class ParsedPage(BaseModel):
    """Complete representation of a parsed HTML page.

    Contains all extracted metadata and structured content sections,
    ready for markdown conversion or further processing.
    """

    title: str = Field(..., description="Page title from <title> or main heading")
    slug: str = Field(..., description="URL-friendly identifier derived from URL")
    language: Literal["et", "en"] = Field(..., description="Content language")
    original_url: str = Field(..., description="Full canonical URL (unwrapped from archive)")
    description: Optional[str] = Field(
        None, description="Meta description if available"
    )
    # Pylance can't infer types through Pydantic's Field descriptor (false positive)
    sections: list["ContentSection"] = Field(  # pyright: ignore[reportUnknownVariableType]
        default_factory=list, description="Structured content sections"
    )
    images: list["ImageReference"] = Field(  # pyright: ignore[reportUnknownVariableType]
        default_factory=list, description="All images found in content"
    )
    links: list[str] = Field(
        default_factory=list, description="All links found in content (unwrapped)"
    )
