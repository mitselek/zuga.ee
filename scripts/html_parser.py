"""HTML parser for extracting clean content from archived Google Sites pages.

Extracts structured content from Wayback Machine archived HTML, removing
archive wrappers and parsing Google Sites structure into clean data models.
"""

import re
from typing import TypedDict, Any

from bs4 import BeautifulSoup
from bs4.element import Tag


class MetadataDict(TypedDict):
    """Type definition for metadata extracted from HTML."""

    title: str
    language: str
    slug: str
    description: str | None


def strip_wayback_wrapper(html: str) -> str:
    """Remove Wayback Machine wrapper HTML, scripts, and styles.

    Removes all Archive.org infrastructure:
    - JavaScript from web-static.archive.org
    - CSS banner styles and icons
    - __wm (Wayback Machine) initialization scripts
    - <!-- End Wayback Rewrite JS Include --> comment markers

    Preserves all Google Sites content structure intact.

    Args:
        html: Raw HTML string with Wayback Machine wrapper

    Returns:
        Cleaned HTML with Wayback infrastructure removed

    Example:
        >>> html = '<script src="https://web-static.archive.org/_static/js/..."></script><body>content</body>'
        >>> strip_wayback_wrapper(html)
        '<body>content</body>'
    """
    soup = BeautifulSoup(html, "lxml")

    # Remove all scripts from web-static.archive.org
    for script in soup.find_all("script", src=True):
        if "web-static.archive.org" in script["src"]:
            script.decompose()

    # Remove inline scripts containing __wm.init or __wm.wombat
    for script in soup.find_all("script"):
        if script.string and (
            "__wm.init" in script.string or "__wm.wombat" in script.string
        ):
            script.decompose()

    # Remove Wayback CSS stylesheets
    for link in soup.find_all("link", rel="stylesheet"):
        if link.get("href") and "web-static.archive.org" in link["href"]:
            link.decompose()

    # Remove <!-- End Wayback Rewrite JS Include --> comment
    for comment in soup.find_all(
        string=lambda text: isinstance(text, str) and "End Wayback" in text
    ):
        comment.extract()

    return str(soup)


def extract_main_content(html: str) -> Tag:
    """Extract main content area from Google Sites page structure.

    Finds the <div role="main"> element and removes navigation sidebar
    and footer elements to return only the actual page content.

    Removes:
    - <nav class="JzO0Vc"> - navigation sidebar with site menu
    - <div class="dZA9kd"> - footer elements with report abuse button

    Args:
        html: HTML string (typically after strip_wayback_wrapper)

    Returns:
        BeautifulSoup Tag object containing the <div role="main"> element
        with navigation and footer removed

    Raises:
        ValueError: If <div role="main"> element is not found

    Example:
        >>> html = '<div role="main">content</div><nav class="JzO0Vc">nav</nav>'
        >>> main = extract_main_content(html)
        >>> 'JzO0Vc' in str(main)
        False
    """
    soup = BeautifulSoup(html, "lxml")

    # Find the main content div
    main_div = soup.find("div", role="main")
    if main_div is None or not isinstance(main_div, Tag):
        raise ValueError("Could not find <div role='main'> element in HTML")

    # Remove navigation sidebar from anywhere in the document
    for nav in soup.find_all("nav", class_="JzO0Vc"):
        nav.decompose()

    # Remove footer elements (class contains "dZA9kd")
    FOOTER_CLASS: str = "dZA9kd"
    for div in soup.find_all("div"):
        if not hasattr(div, "attrs") or div.attrs is None:
            continue
        # BeautifulSoup returns class as a list of strings
        class_list = div.get("class")
        if class_list is not None and isinstance(class_list, list):
            # Check if footer class appears in any class name
            for class_item in class_list:  # type: ignore[misc]
                # Convert to string to handle any type from BeautifulSoup
                class_name: str = class_item if isinstance(class_item, str) else str(class_item)  # type: ignore[arg-type]
                if FOOTER_CLASS in class_name:
                    div.decompose()
                    break

    return main_div


def extract_metadata(html: str) -> MetadataDict:
    """Extract page metadata from HTML.

    Extracts:
    - title: from <title> tag
    - language: 'en' or 'et' from URL path
    - slug: from URL path segment
    - description: from og:description meta tag (cleaned of whitespace)

    Args:
        html: Full HTML string

    Returns:
        Dictionary with title, language, slug, description

    Example:
        >>> html = '<html><head><title>Zuga - about us</title>...</head></html>'
        >>> extract_metadata(html)
        {'title': 'Zuga - about us', 'language': 'en', 'slug': 'about-us-1', 'description': '...'}
    """
    soup = BeautifulSoup(html, "lxml")

    # Extract title
    title_tag = soup.find("title")
    title = title_tag.get_text() if title_tag else ""

    # Extract language from og:url
    url_tag = soup.find("meta", property="og:url")
    url = url_tag["content"] if url_tag and "content" in url_tag.attrs else ""  # type: ignore[index]
    language = "en" if "/english/" in url else "et" if "/estonian/" in url else "en"  # type: ignore[operator]

    # Extract slug from URL (last path segment)
    slug = ""
    if url:
        # Extract last path segment after /english/ or /estonian/
        match = re.search(r"/(?:english|estonian)/([^/]+)(?:\?|$)", str(url))
        slug = match.group(1) if match else ""

    # Extract description from og:description
    desc_tag = soup.find("meta", property="og:description")
    description = None
    if desc_tag and "content" in desc_tag.attrs:  # type: ignore[operator]
        # Clean whitespace from description
        description = " ".join(str(desc_tag["content"]).split())  # type: ignore[index,arg-type]

    return MetadataDict(
        title=title,
        language=language,
        slug=slug,
        description=description,
    )


class SectionDict(TypedDict):
    """Type definition for parsed section data."""

    heading: str | None
    content: str
    section_type: str  # "text", "image", "video", "list"


def parse_sections(main_content: Tag) -> list[SectionDict]:
    """Parse content sections from main div and classify by type.

    Iterates through <section> elements inside main content div, classifying
    each by content type (text/image/video/list) and extracting relevant data.

    Args:
        main_content: BeautifulSoup Tag representing <div role="main">

    Returns:
        List of SectionDict with heading, content, and section_type

    Example:
        >>> main = extract_main_content(html)
        >>> sections = parse_sections(main)
        >>> sections[0]["section_type"]
        'text'
    """
    sections: list[SectionDict] = []

    # Find all section elements
    section_tags = main_content.find_all("section", recursive=False)

    for section_tag in section_tags:
        # Extract heading if present (h1-h6)
        heading_tag = section_tag.find(["h1", "h2", "h3", "h4", "h5", "h6"])
        heading = heading_tag.get_text().strip() if heading_tag else None

        # Check for iframe (video) - highest priority
        iframe = section_tag.find("iframe")
        if iframe:
            src = iframe.get("src", "")
            if src:
                sections.append(
                    SectionDict(
                        heading=heading,
                        content=str(src),
                        section_type="video",
                    )
                )
            continue

        # Check for images - second priority
        img = section_tag.find("img")
        if img:
            src = img.get("src", "")
            alt = img.get("alt", "")
            if src:
                sections.append(
                    SectionDict(
                        heading=heading,
                        content=f"{src}|{alt}",
                        section_type="image",
                    )
                )
            continue

        # Check for lists - create list section
        list_tag = section_tag.find("ul") or section_tag.find("ol")
        if list_tag:
            items = list_tag.find_all("li")
            list_content = "\n".join(
                [item.get_text().strip() for item in items if item.get_text().strip()]
            )
            if list_content:
                sections.append(
                    SectionDict(
                        heading=heading,
                        content=list_content,
                        section_type="list",
                    )
                )
            # Check if there's also text content in this section
            paragraphs = section_tag.find_all("p")
            if paragraphs:
                para_texts = [
                    p.get_text().strip() for p in paragraphs if p.get_text().strip()
                ]
                if para_texts:
                    text_content = "\n\n".join(para_texts)
                    # Add as separate text section (with same heading)
                    sections.append(
                        SectionDict(
                            heading=heading,
                            content=text_content,
                            section_type="text",
                        )
                    )
            continue

        # Default to text content
        text_div = section_tag.find("div", class_="IFuOkc")
        if text_div and text_div.get_text().strip():
            sections.append(
                SectionDict(
                    heading=heading,
                    content=text_div.get_text().strip(),
                    section_type="text",
                )
            )
        else:
            # Fall back to paragraphs
            paragraphs = section_tag.find_all("p")
            if paragraphs:
                para_texts = [
                    p.get_text().strip() for p in paragraphs if p.get_text().strip()
                ]
                if para_texts:
                    sections.append(
                        SectionDict(
                            heading=heading,
                            content="\n\n".join(para_texts),
                            section_type="text",
                        )
                    )

    return sections


def unwrap_url(url: str) -> str:
    """Extract canonical URL from Archive.org wrapper.

    Converts URLs like:
    - https://web.archive.org/web/20250324033640/https://www.zuga.ee/...
    - https://web.archive.org/web/20250125115216if_/https://www.youtube.com/...

    To their canonical form:
    - https://www.zuga.ee/...
    - https://www.youtube.com/...

    Args:
        url: URL string (may be wrapped or canonical)

    Returns:
        Canonical URL without Archive.org wrapper

    Example:
        >>> unwrap_url("https://web.archive.org/web/20250324/https://example.com")
        'https://example.com'
    """
    if not url or not url.strip():
        return ""

    # Pattern: https://web.archive.org/web/{timestamp}[if_]/{canonical_url}
    match = re.search(
        r"https://web\.archive\.org/web/\d+(?:if_)?/(https?://[^\s]+)", url
    )

    if match:
        return match.group(1)

    # If no match, return original (already canonical or malformed)
    return url


def parse_html_file(html: str, url: str) -> dict[str, Any]:  # type: ignore[misc]
    """Parse HTML file through complete pipeline.

    Orchestrates the full parsing workflow:
    1. Strip Wayback Machine wrapper
    2. Extract main content div
    3. Extract metadata (title, language, slug, description)
    4. Parse content sections
    5. Unwrap Archive.org URLs in sections

    Args:
        html: Raw HTML string from file
        url: Original URL for metadata extraction

    Returns:
        Dictionary with metadata and parsed sections

    Example:
        >>> html = Path("page.html").read_text()
        >>> result = parse_html_file(html, "https://www.zuga.ee/english/about-us-1")
        >>> result["metadata"]["title"]
        'Zuga - about us'
    """
    # Step 1: Strip Wayback wrapper
    clean_html = strip_wayback_wrapper(html)

    # Step 2: Extract main content
    main_content = extract_main_content(clean_html)

    # Step 3: Extract metadata
    metadata = extract_metadata(clean_html)

    # Step 4: Parse sections
    sections = parse_sections(main_content)

    # Step 5: Unwrap URLs in sections
    for section in sections:
        if section["section_type"] in ("image", "video"):
            section["content"] = unwrap_url(section["content"])

    return {
        "metadata": metadata,
        "sections": sections,
    }


def main() -> None:
    """CLI entry point for HTML parser.

    Usage:
        python html_parser.py --input page.html --url https://www.zuga.ee/english/about-us-1
        python html_parser.py -i page.html -u https://example.com --output result.json
    """
    import argparse
    import json
    import sys
    from pathlib import Path

    parser = argparse.ArgumentParser(
        description="Parse archived Google Sites HTML into structured JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s -i page.html -u https://www.zuga.ee/english/about-us-1
  %(prog)s -i page.html -u https://example.com -o output.json
  %(prog)s --input page.html --url https://example.com --verbose
        """,
    )

    parser.add_argument(
        "-i",
        "--input",
        required=True,
        type=Path,
        help="Input HTML file to parse",
    )

    parser.add_argument(
        "-u",
        "--url",
        required=True,
        type=str,
        help="Original URL of the page (for metadata extraction)",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output JSON file (default: print to stdout)",
    )

    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Print verbose progress messages",
    )

    args = parser.parse_args()

    # Validate input file exists
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Reading HTML from: {args.input}", file=sys.stderr)

    # Read HTML file
    try:
        html = args.input.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Parsing HTML for URL: {args.url}", file=sys.stderr)
        print(f"HTML length: {len(html)} characters", file=sys.stderr)

    # Parse HTML
    try:
        result = parse_html_file(html, args.url)
    except Exception as e:
        print(f"Error parsing HTML: {e}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(
            f"Extracted {len(result['sections'])} sections from page",
            file=sys.stderr,
        )

    # Output JSON
    json_output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        if args.verbose:
            print(f"Writing output to: {args.output}", file=sys.stderr)
        try:
            args.output.write_text(json_output, encoding="utf-8")
        except Exception as e:
            print(f"Error writing output file: {e}", file=sys.stderr)
            sys.exit(1)
        if args.verbose:
            print("Done!", file=sys.stderr)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
