#!/usr/bin/env python3
"""
HTML Beautifier - Formats minified Google Sites HTML for analysis
"""

from pathlib import Path
from bs4 import BeautifulSoup
import sys


def beautify_html(input_file: Path, output_file: Path) -> None:
    """
    Beautify a minified HTML file for easier analysis.

    Args:
        input_file: Path to minified HTML file
        output_file: Path to write beautified HTML
    """
    print(f"Beautifying: {input_file.name}")

    # Read minified HTML
    with open(input_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Parse and prettify with BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    beautified = soup.prettify()

    # Write beautified HTML
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(beautified)

    # Print statistics
    orig_lines = html_content.count('\n') + 1
    new_lines = beautified.count('\n') + 1
    print(f"  Original: {orig_lines} lines → Beautified: {new_lines} lines")


def main():
    """Beautify sample HTML files for diff analysis."""

    # Paths
    base_dir = Path(__file__).parent.parent
    originals_dir = base_dir / "data" / "html_processing" / "1_originals"
    analysis_dir = base_dir / "data" / "html_processing" / "2_analysis"
    beautified_dir = analysis_dir / "beautified"

    # Create output directory
    beautified_dir.mkdir(parents=True, exist_ok=True)

    # Select diverse sample files for analysis (5 representative pages)
    sample_files = [
        "index.html",                                          # Homepage
        "english/shame/index.html",                            # English performance
        "etendused-noorele-publikule/meelekolu/index.html",   # Estonian performance (young)
        "kontakt-2/index.html",                               # Contact page
        "workshopid/zuga-liikumispausid/index.html",          # Workshop page
    ]

    print("=" * 60)
    print("HTML BEAUTIFIER - Formatting samples for diff analysis")
    print("=" * 60)
    print()

    for sample_path in sample_files:
        input_file = originals_dir / sample_path

        if not input_file.exists():
            print(f"⚠️  File not found: {sample_path}")
            continue

        # Create output path with safe filename
        safe_name = sample_path.replace('/', '_')
        output_file = beautified_dir / safe_name

        try:
            beautify_html(input_file, output_file)
        except Exception as e:
            print(f"❌ Error processing {sample_path}: {e}")
            continue

    print()
    print("✅ Beautification complete!")
    print(f"📁 Output directory: {beautified_dir}")
    print()
    print("Next steps:")
    print("  1. Run diff analysis: python scripts/analyze_boilerplate.py")
    print("  2. Create cleaning script based on findings")


if __name__ == "__main__":
    main()
