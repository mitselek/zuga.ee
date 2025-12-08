#!/usr/bin/env python3
"""
Connect bilingual page pairs by updating the translated: [] field in frontmatter.

Matches ET <-> EN pages based on:
1. Explicit mappings (known pairs)
2. Title/slug similarity
3. Content comparison
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

import yaml


def load_frontmatter(file_path: Path) -> Tuple[Dict, str]:
    """Load and parse frontmatter from a markdown file."""
    content = file_path.read_text(encoding='utf-8')

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


def save_with_frontmatter(file_path: Path, frontmatter: Dict, body: str):
    """Save markdown file with updated frontmatter."""
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    new_content = f'---\n{yaml_str}---{body}'
    file_path.write_text(new_content, encoding='utf-8')


def get_all_content_files(content_dir: Path) -> List[Path]:
    """Get all markdown files excluding README."""
    return [
        f for f in content_dir.rglob("*.md")
        if f.name.lower() != "readme.md"
    ]


def extract_base_slug(slug: str) -> str:
    """Extract base slug by removing language prefixes."""
    # Remove common prefixes
    base = slug.replace('english-', '').replace('etendused-', '').replace('workshopid-', '')
    base = base.replace('suurtele-', '').replace('noorele-publikule-', '')
    return base


def find_translation_pairs() -> Dict[str, Dict]:
    """Define known translation pairs manually."""
    return {
        # Performances
        'shame': {'et': 'häbi', 'en': 'shame'},
        'häbi': {'et': 'häbi', 'en': 'shame'},
        'english-shame': {'et': 'etendused-suurtele-habi', 'en': 'english-shame'},
        'etendused-suurtele-habi': {'et': 'etendused-suurtele-habi', 'en': 'english-shame'},

        'noise': {'et': 'mura', 'en': 'noise'},
        'mura': {'et': 'mura', 'en': 'noise'},
        'etendused-suurtele-mura': {'et': 'etendused-suurtele-mura', 'en': 'english-noise'},
        'english-noise': {'et': 'etendused-suurtele-mura', 'en': 'english-noise'},

        'inthemood': {'et': 'meelekolu', 'en': 'inthemood'},
        'meelekolu': {'et': 'meelekolu', 'en': 'inthemood'},
        'english-inthemood': {'et': 'etendused-noorele-publikule-meelekolu', 'en': 'english-inthemood'},
        'etendused-noorele-publikule-meelekolu': {'et': 'etendused-noorele-publikule-meelekolu', 'en': 'english-inthemood'},

        '2-2-22': {'et': 'etendused-noorele-publikule-2-2-22', 'en': 'english-2-2-22'},
        'english-2-2-22': {'et': 'etendused-noorele-publikule-2-2-22', 'en': 'english-2-2-22'},
        'etendused-noorele-publikule-2-2-22': {'et': 'etendused-noorele-publikule-2-2-22', 'en': 'english-2-2-22'},

        'weather-or-not': {'et': 'etendused-noorele-publikule-ilma', 'en': 'english-weather-or-not'},
        'ilma': {'et': 'etendused-noorele-publikule-ilma', 'en': 'english-weather-or-not'},
        'english-weather-or-not': {'et': 'etendused-noorele-publikule-ilma', 'en': 'english-weather-or-not'},
        'etendused-noorele-publikule-ilma': {'et': 'etendused-noorele-publikule-ilma', 'en': 'english-weather-or-not'},

        'the-passage': {'et': 'etendused-noorele-publikule-kaeik', 'en': 'english-thepassage'},
        'kaeik': {'et': 'etendused-noorele-publikule-kaeik', 'en': 'english-thepassage'},
        'english-thepassage': {'et': 'etendused-noorele-publikule-kaeik', 'en': 'english-thepassage'},
        'etendused-noorele-publikule-kaeik': {'et': 'etendused-noorele-publikule-kaeik', 'en': 'english-thepassage'},

        'the-great-unknown': {'et': 'etendused-suurtele-suur-teadmatus', 'en': 'english-the-great-unknown'},
        'suur-teadmatus': {'et': 'etendused-suurtele-suur-teadmatus', 'en': 'english-the-great-unknown'},
        'english-the-great-unknown': {'et': 'etendused-suurtele-suur-teadmatus', 'en': 'english-the-great-unknown'},
        'etendused-suurtele-suur-teadmatus': {'et': 'etendused-suurtele-suur-teadmatus', 'en': 'english-the-great-unknown'},

        # Landing pages
        'landing': {'et': 'etendused-noorele-publikule-landing', 'en': 'english-landing'},
        'english-landing': {'et': 'etendused-noorele-publikule-landing', 'en': 'english-landing'},
        'etendused-noorele-publikule-landing': {'et': 'etendused-noorele-publikule-landing', 'en': 'english-landing'},

        # About
        'about-us-1': {'et': 'tegijad', 'en': 'english-about-us-1'},
        'tegijad': {'et': 'tegijad', 'en': 'english-about-us-1'},
        'english-about-us-1': {'et': 'tegijad', 'en': 'english-about-us-1'},

        # Works
        'works': {'et': 'zuga-toeoed-works', 'en': 'zuga-toeoed-works'},
        'zuga-toeoed-works': {'et': 'zuga-toeoed-works', 'en': 'zuga-toeoed-works'},
    }


def build_slug_to_file_map(files: List[Path]) -> Dict[str, Path]:
    """Build a mapping from slug to file path."""
    slug_map = {}
    for file in files:
        frontmatter, _ = load_frontmatter(file)
        slug = frontmatter.get('slug', file.stem)
        slug_map[slug] = file
    return slug_map


def main():
    """Main linking process."""
    print("=== Connecting Bilingual Page Pairs ===\n")

    base_dir = Path(__file__).parent.parent
    content_dir = base_dir / "packages" / "content"

    # Get all files
    all_files = get_all_content_files(content_dir)
    print(f"Found {len(all_files)} content files\n")

    # Build slug -> file mapping
    slug_to_file = build_slug_to_file_map(all_files)
    print(f"Built slug mapping for {len(slug_to_file)} files\n")

    # Get translation pairs
    pairs = find_translation_pairs()

    # Track updates
    updated_files = []

    print("[Processing files...]\n")

    for file in sorted(all_files):
        frontmatter, body = load_frontmatter(file)
        slug = frontmatter.get('slug', file.stem)
        language = frontmatter.get('language', 'et')

        # Check if this slug has translations
        if slug in pairs:
            pair_info = pairs[slug]

            # Find the other language
            other_lang = 'en' if language == 'et' else 'et'
            other_slug = pair_info.get(other_lang)

            if other_slug and other_slug != slug and other_slug in slug_to_file:
                # Update translated field with proper object format
                current_translated = frontmatter.get('translated', [])

                # Check if already in correct format
                needs_update = True
                if isinstance(current_translated, list) and len(current_translated) > 0:
                    if isinstance(current_translated[0], dict):
                        # Already in object format, check if correct
                        if current_translated[0].get('slug') == other_slug and current_translated[0].get('language') == other_lang:
                            needs_update = False

                # Update if needed (either missing, wrong format, or wrong value)
                if needs_update:
                    frontmatter['translated'] = [{'language': other_lang, 'slug': other_slug}]
                    save_with_frontmatter(file, frontmatter, body)
                    updated_files.append({
                        'file': file.name,
                        'slug': slug,
                        'lang': language,
                        'linked_to': other_slug
                    })
                    print(f"  ✓ {slug} ({language}) -> {other_slug} ({other_lang})")

    # Summary
    print(f"\n=== SUMMARY ===")
    print(f"Files scanned: {len(all_files)}")
    print(f"Files updated: {len(updated_files)}")
    print(f"Translation pairs defined: {len(set(pairs.keys()))}")

    if updated_files:
        print(f"\n✓ Successfully linked {len(updated_files)} bilingual page pairs")

        # Group by language
        et_count = len([f for f in updated_files if f['lang'] == 'et'])
        en_count = len([f for f in updated_files if f['lang'] == 'en'])
        print(f"  - Estonian pages: {et_count}")
        print(f"  - English pages: {en_count}")
    else:
        print("\n✓ All pages already linked or no pairs found")


if __name__ == "__main__":
    main()
