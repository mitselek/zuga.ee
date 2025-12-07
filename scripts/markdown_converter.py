"""Markdown converter for parsed HTML content.

Converts ParsedPage objects (from html_parser) into clean, well-formatted
Markdown files suitable for content management systems.
"""

from __future__ import annotations

from typing import Any


def convert_to_markdown(parsed_page: dict[str, Any]) -> str:
    """Convert ParsedPage dict to Markdown format.

    Args:
        parsed_page: Dictionary with title, sections, etc. from HTML parser
                    Can be either direct format (title, description, sections),
                    nested format (metadata.title, sections),
                    or extracted format (metadata.title, content_sections)

    Returns:
        Clean Markdown string

    Example:
        >>> page = {"title": "About", "sections": [], ...}
        >>> md = convert_to_markdown(page)
        >>> md.startswith("# About")
        True
    """
    lines: list[str] = []

    # Handle multiple formats
    if "metadata" in parsed_page:
        # Check if it's extracted format or html_parser format
        metadata = parsed_page["metadata"]
        title = metadata.get("title", "Untitled")
        description = metadata.get("description")

        # Use content_sections for extracted format, sections for html_parser
        sections = parsed_page.get("content_sections") or parsed_page.get("sections", [])
    elif "page_metadata" in parsed_page:
        # Extracted format with page_metadata
        page_meta = parsed_page["page_metadata"]
        title = page_meta.get("title", "Untitled")
        description = page_meta.get("description")
        sections = parsed_page.get("content", {}).get("sections", [])
    else:
        # Direct format from test data
        title = parsed_page.get("title", "Untitled")
        description = parsed_page.get("description")
        sections = parsed_page.get("sections", [])

    # Add title as H1
    lines.append(f"# {title}")
    lines.append("")

    # Add description if present
    if description:
        lines.append(description)
        lines.append("")

    # Process sections
    for section in sections:
        # Handle both old format (heading, section_type, content) and new format (type, heading, content)
        section_type = section.get("type") or section.get("section_type", "text")
        heading = section.get("heading")
        content = section.get("content", "")

        # Add section heading if present
        if heading:
            lines.append(f"## {heading}")
            lines.append("")

        # Add section content based on type
        if section_type in ("text", "announcement"):
            if content and content != "Performance-specific hero image":
                lines.append(content)
                lines.append("")
        elif section_type == "list" or section_type == "news":
            # Handle news items
            if section_type == "news" and "items" in section:
                for item in section["items"]:
                    # Handle both string items and dict items
                    if isinstance(item, str):
                        text = item
                    else:
                        text = item.get("text", "")
                    if text:
                        lines.append(f"- {text}")
                lines.append("")
            else:
                # Convert newline-separated items to bullet list
                items = content.strip().split("\n") if content else []
                for item in items:
                    if item.strip():
                        lines.append(f"- {item.strip()}")
                lines.append("")
        elif section_type == "image" or section_type == "hero":
            # Skip hero placeholders
            if content and "hero" not in content.lower() and "|" in content:
                # Extract src and alt from "src|alt" format
                parts = content.split("|", 1)
                src = parts[0]
                alt = parts[1] if len(parts) > 1 else ""
                lines.append(f"![{alt}]({src})")
                lines.append("")
        elif section_type == "video":
            # YouTube embed as markdown link
            if content:
                lines.append(f"[YouTube Video]({content})")
                lines.append("")
        elif section_type == "image_gallery":
            # Note about gallery
            lines.append("*[Image gallery]*")
            lines.append("")

    # Join and clean up excessive blank lines
    markdown = "\n".join(lines)
    # Replace 3+ consecutive newlines with 2 (one blank line)
    while "\n\n\n" in markdown:
        markdown = markdown.replace("\n\n\n", "\n\n")

    return markdown.strip() + "\n"


def main() -> None:
    """CLI interface for markdown conversion.

    Usage: python -m scripts.markdown_converter <input.json> [output.md]
    """
    import json
    import sys
    from pathlib import Path

    if len(sys.argv) < 2:
        print("Usage: python -m scripts.markdown_converter <input.json> [output.md]")
        print()
        print("Converts parsed HTML JSON to Markdown.")
        print("If output file not specified, writes to <input-stem>.md")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    # Determine output file
    if len(sys.argv) >= 3:
        output_file = Path(sys.argv[2])
    else:
        output_file = input_file.with_suffix(".md")

    # Read and convert
    parsed_page = json.loads(input_file.read_text())
    markdown = convert_to_markdown(parsed_page)

    # Write output
    output_file.write_text(markdown)
    print(f"✓ Converted {input_file.name} → {output_file.name}")


if __name__ == "__main__":
    main()
