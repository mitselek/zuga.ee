#!/usr/bin/env python3
"""
HTML Cleaner - Strips Google Sites boilerplate, keeps only unique content
"""

from pathlib import Path
from bs4 import BeautifulSoup
import re
import json


def extract_clean_sections(html_content: str) -> tuple[list, dict]:
    """
    Extract only the <section> content blocks from Google Sites HTML.

    Args:
        html_content: Full HTML content

    Returns:
        Tuple of (section_elements, metadata)
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract metadata from head
    metadata = {}

    # Get page title
    title_tag = soup.find('title')
    if title_tag:
        metadata['title'] = title_tag.get_text(strip=True)

    # Get meta description
    meta_desc = soup.find('meta', {'property': 'og:description'})
    if meta_desc:
        metadata['description'] = meta_desc.get('content', '')

    # Get hero image from first section
    first_section = soup.find('section')
    if first_section:
        hero_img = first_section.find('div', class_='IFuOkc')
        if hero_img and 'style' in hero_img.attrs:
            style = hero_img['style']
            img_match = re.search(r'background-image:\s*url\(([^)]+)\)', style)
            if img_match:
                metadata['hero_image_url'] = img_match.group(1)

    # Find all main content sections
    main_div = soup.find('div', {'role': 'main'})
    if not main_div:
        return [], metadata

    sections = main_div.find_all('section', recursive=False)

    return sections, metadata


def clean_html_file(input_file: Path, output_file: Path) -> dict:
    """
    Clean a single HTML file by extracting only unique content.

    Args:
        input_file: Path to original HTML
        output_file: Path to write cleaned HTML

    Returns:
        Dict with statistics
    """
    # Read original HTML
    with open(input_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Extract clean sections
    sections, metadata = extract_clean_sections(html_content)

    # Build minimal clean HTML
    clean_html = []
    clean_html.append('<!DOCTYPE html>')
    clean_html.append('<html lang="et">')
    clean_html.append('<head>')
    clean_html.append('  <meta charset="utf-8">')
    clean_html.append(f'  <title>{metadata.get("title", "Zuga")}</title>')
    if metadata.get('description'):
        clean_html.append(f'  <meta name="description" content="{metadata["description"]}">')
    clean_html.append('</head>')
    clean_html.append('<body>')
    clean_html.append('  <!-- Extracted from Google Sites export -->')
    clean_html.append(f'  <!-- Original source: {input_file.name} -->')

    if metadata.get('hero_image_url'):
        clean_html.append(f'  <!-- Hero image: {metadata["hero_image_url"]} -->')

    clean_html.append('')

    # Add each section
    for i, section in enumerate(sections, 1):
        clean_html.append(f'  <!-- Section {i} -->')
        # Get section as string and indent properly
        section_html = str(section)
        for line in section_html.split('\n'):
            clean_html.append(f'  {line}' if line.strip() else '')
        clean_html.append('')

    clean_html.append('</body>')
    clean_html.append('</html>')

    # Write cleaned HTML
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(clean_html))

    # Calculate statistics
    original_size = len(html_content)
    cleaned_size = len('\n'.join(clean_html))
    reduction_pct = ((original_size - cleaned_size) / original_size) * 100

    return {
        'sections_count': len(sections),
        'original_size': original_size,
        'cleaned_size': cleaned_size,
        'reduction_percent': reduction_pct,
        'metadata': metadata
    }


def main():
    """Clean all HTML files by removing Google Sites boilerplate."""

    # Paths
    base_dir = Path(__file__).parent.parent
    originals_dir = base_dir / "data" / "html_processing" / "1_originals"
    cleaned_dir = base_dir / "data" / "html_processing" / "3_cleaned"
    stats_file = base_dir / "data" / "html_processing" / "2_analysis" / "cleaning_stats.json"

    # Find all HTML files
    html_files = sorted(originals_dir.glob("**/*.html"))

    print("=" * 60)
    print("HTML CLEANER - Removing Google Sites boilerplate")
    print("=" * 60)
    print(f"Processing {len(html_files)} files...")
    print()

    all_stats = []
    total_original = 0
    total_cleaned = 0

    for html_file in html_files:
        # Preserve relative path structure
        rel_path = html_file.relative_to(originals_dir)
        output_file = cleaned_dir / rel_path

        try:
            stats = clean_html_file(html_file, output_file)
            stats['file'] = str(rel_path)
            all_stats.append(stats)

            total_original += stats['original_size']
            total_cleaned += stats['cleaned_size']

            print(f"✅ {rel_path}")
            print(f"   Sections: {stats['sections_count']} | "
                  f"Size: {stats['original_size']:,} → {stats['cleaned_size']:,} bytes | "
                  f"Reduced: {stats['reduction_percent']:.1f}%")

        except Exception as e:
            print(f"❌ {rel_path}: {e}")
            continue

    # Overall statistics
    overall_reduction = ((total_original - total_cleaned) / total_original) * 100

    print()
    print("=" * 60)
    print("CLEANING SUMMARY")
    print("=" * 60)
    print(f"Files processed: {len(all_stats)}/{len(html_files)}")
    print(f"Total original size: {total_original:,} bytes ({total_original/1024:.1f} KB)")
    print(f"Total cleaned size: {total_cleaned:,} bytes ({total_cleaned/1024:.1f} KB)")
    print(f"Overall reduction: {overall_reduction:.1f}%")
    print()

    # Save statistics
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'files_processed': len(all_stats),
                'total_files': len(html_files),
                'total_original_bytes': total_original,
                'total_cleaned_bytes': total_cleaned,
                'overall_reduction_percent': overall_reduction
            },
            'per_file': all_stats
        }, f, indent=2)

    print(f"📊 Statistics saved: {stats_file}")
    print(f"📁 Cleaned files: {cleaned_dir}")
    print()
    print("Next steps:")
    print("  1. Review cleaned HTML files in 3_cleaned/")
    print("  2. Compare to existing JSON extractions")
    print("  3. Build new extraction pipeline on cleaned HTML")


if __name__ == "__main__":
    main()
