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
                    Can be either direct format (title, description, sections)
                    or nested format (metadata.title, sections)

    Returns:
        Clean Markdown string

    Example:
        >>> page = {"title": "About", "sections": [], ...}
        >>> md = convert_to_markdown(page)
        >>> md.startswith("# About")
        True
    """
    lines: list[str] = []

    # Handle both direct and nested format
    if "metadata" in parsed_page:
        # Nested format from html_parser CLI output
        metadata = parsed_page["metadata"]
        title = metadata.get("title", "Untitled")
        description = metadata.get("description")
    else:
        # Direct format from test data
        title = parsed_page.get("title", "Untitled")
        description = parsed_page.get("description")

    # Add title as H1
    lines.append(f"# {title}")
    lines.append("")

    # Add description if present
    if description:
        lines.append(description)
        lines.append("")

    # Process sections
    for section in parsed_page.get("sections", []):
        # Add section heading if present
        if section.get("heading"):
            lines.append(f"## {section['heading']}")
            lines.append("")

        # Add section content based on type
        section_type = section.get("section_type", "text")
        content = section.get("content", "")

        if section_type == "text":
            lines.append(content)
            lines.append("")
        elif section_type == "list":
            # Convert newline-separated items to bullet list
            items = content.strip().split("\n")
            for item in items:
                if item.strip():
                    lines.append(f"- {item.strip()}")
            lines.append("")
        elif section_type == "image":
            # Extract src and alt from "src|alt" format
            parts = content.split("|", 1)
            src = parts[0]
            alt = parts[1] if len(parts) > 1 else ""
            lines.append(f"![{alt}]({src})")
            lines.append("")
        elif section_type == "video":
            # YouTube embed as markdown link
            lines.append(f"[YouTube Video]({content})")
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
