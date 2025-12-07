"""Quick manual test of strip_wayback_wrapper function."""

from pathlib import Path
import sys

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from html_parser import strip_wayback_wrapper

# Load test file
html_file = Path(__file__).parent.parent / "data" / "test_scrape" / "english" / "about-us-1.html"
html = html_file.read_text(encoding="utf-8")

print("Original HTML size:", len(html), "bytes")
print("\nChecking for Wayback elements in original:")
print("  - web-static.archive.org:", "web-static.archive.org" in html)
print("  - __wm.init:", "__wm.init" in html)
print("  - banner-styles.css:", "banner-styles.css" in html)
print("  - End Wayback comment:", "End Wayback" in html)

# Clean it
cleaned = strip_wayback_wrapper(html)

print("\nCleaned HTML size:", len(cleaned), "bytes")
print("\nChecking for Wayback elements in cleaned:")
print("  - web-static.archive.org:", "web-static.archive.org" in cleaned)
print("  - __wm.init:", "__wm.init" in cleaned)
print("  - banner-styles.css:", "banner-styles.css" in cleaned)
print("  - End Wayback comment:", "End Wayback" in cleaned)

print("\nChecking for Google Sites content preserved:")
print("  - role='main':", 'role="main"' in cleaned)
print("  - 'about us':", "about us" in cleaned.lower())
print("  - 'Zuga United Dancers':", "Zuga United Dancers" in cleaned)

print("\n✓ Manual test complete!")
