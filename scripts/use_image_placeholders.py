#!/usr/bin/env python3
"""
Update markdown files to use placeholder images for missing googleusercontent URLs.

Since all 134 production images are permanently lost, this script:
1. Finds all googleusercontent URLs in markdown files
2. Replaces them with placeholder image reference
3. Adds frontmatter flag: images_unavailable: true
4. Preserves original URLs in HTML comments for reference
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

import yaml


def extract_frontmatter(content: str) -> Tuple[Dict, str]:
    """Extract YAML frontmatter and remaining content."""
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    try:
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2]
        return frontmatter or {}, body
    except yaml.YAMLError:
        return {}, content


def update_frontmatter(frontmatter: Dict) -> Dict:
    """Add images_unavailable flag to frontmatter."""
    frontmatter['images_unavailable'] = True
    return frontmatter


def replace_googleusercontent_images(content: str) -> Tuple[str, int]:
    """Replace googleusercontent URLs with placeholders and preserve originals in comments."""
    # Pattern for markdown images with googleusercontent URLs
    pattern = r'!\[([^\]]*)\]\((https://lh[0-9]\.googleusercontent\.com/[^\)]+)\)'

    count = 0

    def replacer(match):
        nonlocal count
        count += 1
        alt_text = match.group(1) or "Image unavailable"
        original_url = match.group(2)

        # Create replacement with original URL preserved in HTML comment
        replacement = f'<!-- Original: {original_url} -->\n![{alt_text}](../assets/images/placeholder.svg "Image unavailable - original lost when site deleted")'
        return replacement

    updated_content = re.sub(pattern, replacer, content)
    return updated_content, count


def process_markdown_file(file_path: Path) -> Dict:
    """Process a single markdown file."""
    content = file_path.read_text(encoding='utf-8')

    # Extract frontmatter
    frontmatter, body = extract_frontmatter(content)

    # Replace images
    updated_body, image_count = replace_googleusercontent_images(body)

    if image_count > 0:
        # Update frontmatter
        updated_frontmatter = update_frontmatter(frontmatter)

        # Reconstruct file
        yaml_str = yaml.dump(updated_frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
        new_content = f'---\n{yaml_str}---{updated_body}'

        file_path.write_text(new_content, encoding='utf-8')

        return {
            'file': file_path.name,
            'images_replaced': image_count,
            'status': 'updated'
        }

    return {
        'file': file_path.name,
        'images_replaced': 0,
        'status': 'no_changes'
    }


def main():
    """Process all markdown files in packages/content/."""
    print("=== Replacing Lost Images with Placeholders ===\n")

    base_dir = Path(__file__).parent.parent
    content_dir = base_dir / "packages" / "content"

    # Find all markdown files (except README)
    md_files = [
        f for f in content_dir.rglob("*.md")
        if f.name.lower() != "readme.md"
    ]

    print(f"Found {len(md_files)} markdown files to process\n")

    results = []
    for md_file in sorted(md_files):
        result = process_markdown_file(md_file)
        results.append(result)

        if result['status'] == 'updated':
            print(f"  ✓ {result['file']}: {result['images_replaced']} image(s) replaced")
        else:
            print(f"  - {result['file']}: no googleusercontent images")

    # Summary
    updated_files = [r for r in results if r['status'] == 'updated']
    total_images = sum(r['images_replaced'] for r in results)

    print(f"\n=== SUMMARY ===")
    print(f"Files processed: {len(results)}")
    print(f"Files updated: {len(updated_files)}")
    print(f"Images replaced with placeholders: {total_images}")

    if updated_files:
        print(f"\n✓ Successfully replaced {total_images} lost images with placeholders")
        print(f"  - Original URLs preserved in HTML comments")
        print(f"  - Frontmatter updated with images_unavailable: true")
        print(f"  - Using: ../assets/images/placeholder.svg")
    else:
        print("\n✓ No googleusercontent URLs found in markdown files")


if __name__ == "__main__":
    main()
