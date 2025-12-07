"""HTML parser for extracting clean content from archived Google Sites pages.

Extracts structured content from Wayback Machine archived HTML, removing
archive wrappers and parsing Google Sites structure into clean data models.
"""

from bs4 import BeautifulSoup
from bs4.element import Tag


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
        if script.string and ("__wm.init" in script.string or "__wm.wombat" in script.string):
            script.decompose()

    # Remove Wayback CSS stylesheets
    for link in soup.find_all("link", rel="stylesheet"):
        if link.get("href") and "web-static.archive.org" in link["href"]:
            link.decompose()

    # Remove <!-- End Wayback Rewrite JS Include --> comment
    for comment in soup.find_all(string=lambda text: isinstance(text, str) and "End Wayback" in text):
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
