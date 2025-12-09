#!/usr/bin/env python3
"""
Migrate markdown frontmatter to new hierarchical schema.

Usage:
    python migrate_frontmatter.py [--dry-run]
"""
import re
import sys
from pathlib import Path
from typing import Dict, Optional

def extract_subcategory(slug: str, old_type: str) -> Optional[str]:
    """Extract subcategory from slug based on patterns."""
    if 'suurtele' in slug:
        return 'suurtele'
    elif 'noorele-publikule' in slug:
        return 'noorele-publikule'
    return None

def determine_new_fields(slug: str, old_type: str) -> Dict[str, Optional[str]]:
    """
    Determine new type, category, and subcategory based on old values.

    Returns dict with: type, category, subcategory (or None), legacy_type
    """
    # Homepage
    if slug == 'index' or slug == 'english':
        return {
            'type': 'home',
            'category': 'about',
            'subcategory': None,
            'legacy_type': old_type
        }

    # Section pages (landing type)
    if old_type == 'landing':
        if slug.startswith('etendused-'):
            subcategory = extract_subcategory(slug, old_type)
            return {
                'type': 'section',
                'category': 'etendused',
                'subcategory': subcategory,
                'legacy_type': old_type
            }
        elif slug == 'workshopid':
            return {
                'type': 'section',
                'category': 'workshopid',
                'subcategory': None,
                'legacy_type': old_type
            }
        elif 'galerii' in slug:
            return {
                'type': 'section',
                'category': 'gallery',
                'subcategory': None,
                'legacy_type': old_type
            }
        elif slug == 'tegijad' or 'about' in slug:
            return {
                'type': 'section',
                'category': 'about',
                'subcategory': None,
                'legacy_type': old_type
            }
        elif 'kontakt' in slug:
            return {
                'type': 'section',
                'category': 'contact',
                'subcategory': None,
                'legacy_type': old_type
            }
        elif 'uudised' in slug or 'press' in slug or 'auhinnad' in slug:
            return {
                'type': 'section',
                'category': 'news',
                'subcategory': None,
                'legacy_type': old_type
            }
        else:
            # Generic landing becomes section
            return {
                'type': 'section',
                'category': 'about',
                'subcategory': None,
                'legacy_type': old_type
            }

    # Detail pages
    if old_type == 'performance':
        subcategory = extract_subcategory(slug, old_type)
        return {
            'type': 'detail',
            'category': 'etendused',
            'subcategory': subcategory,
            'legacy_type': old_type
        }

    if old_type == 'workshop':
        return {
            'type': 'detail',
            'category': 'workshopid',
            'subcategory': None,
            'legacy_type': old_type
        }

    if old_type == 'about':
        return {
            'type': 'detail',
            'category': 'about',
            'subcategory': None,
            'legacy_type': old_type
        }

    if old_type == 'gallery':
        return {
            'type': 'detail',
            'category': 'gallery',
            'subcategory': None,
            'legacy_type': old_type
        }

    if old_type == 'contact':
        return {
            'type': 'detail',
            'category': 'contact',
            'subcategory': None,
            'legacy_type': old_type
        }

    if old_type == 'news':
        return {
            'type': 'detail',
            'category': 'news',
            'subcategory': None,
            'legacy_type': old_type
        }

    # Fallback
    print(f"⚠️  Unknown pattern: slug={slug}, type={old_type}")
    return {
        'type': 'detail',
        'category': 'about',
        'subcategory': None,
        'legacy_type': old_type
    }

def migrate_file(filepath: Path, dry_run: bool = False) -> bool:
    """
    Migrate a single markdown file.

    Returns True if migration succeeded, False otherwise.
    """
    content = filepath.read_text()

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        print(f"❌ No frontmatter found in {filepath}")
        return False

    frontmatter = match.group(1)
    body = content[match.end():]

    # Extract slug and type
    slug_match = re.search(r'^slug:\s*(.+)$', frontmatter, re.MULTILINE)
    type_match = re.search(r'^type:\s*(.+)$', frontmatter, re.MULTILINE)

    if not type_match:
        print(f"⚠️  No type field in {filepath}, skipping")
        return False

    slug = slug_match.group(1).strip() if slug_match else filepath.stem
    old_type = type_match.group(1).strip()

    # Skip if already migrated
    if old_type in ['home', 'section', 'detail']:
        print(f"✓  Already migrated: {filepath.name}")
        return True

    # Determine new fields
    new_fields = determine_new_fields(slug, old_type)

    # Build new frontmatter
    # Replace type line
    new_frontmatter = re.sub(
        r'^type:\s*.+$',
        f"type: {new_fields['type']}",
        frontmatter,
        flags=re.MULTILINE
    )

    # Add category after type
    new_frontmatter = re.sub(
        r'^(type:.+)$',
        f"\\1\ncategory: {new_fields['category']}",
        new_frontmatter,
        flags=re.MULTILINE
    )

    # Add subcategory if present
    if new_fields['subcategory']:
        new_frontmatter = re.sub(
            r'^(category:.+)$',
            f"\\1\nsubcategory: {new_fields['subcategory']}",
            new_frontmatter,
            flags=re.MULTILINE
        )

    # Add legacy_type after subcategory/category
    if new_fields['subcategory']:
        new_frontmatter = re.sub(
            r'^(subcategory:.+)$',
            f"\\1\nlegacy_type: {new_fields['legacy_type']}",
            new_frontmatter,
            flags=re.MULTILINE
        )
    else:
        new_frontmatter = re.sub(
            r'^(category:.+)$',
            f"\\1\nlegacy_type: {new_fields['legacy_type']}",
            new_frontmatter,
            flags=re.MULTILINE
        )

    new_content = f"---\n{new_frontmatter}\n---\n{body}"

    if dry_run:
        print(f"🔍 DRY RUN: {filepath.name}")
        print(f"   Old: type={old_type}")
        print(f"   New: type={new_fields['type']}, category={new_fields['category']}, subcategory={new_fields['subcategory']}")
        return True

    # Write back
    filepath.write_text(new_content)
    print(f"✅ Migrated: {filepath.name} (type={new_fields['type']}, category={new_fields['category']})")
    return True

def main():
    dry_run = '--dry-run' in sys.argv

    # Find all markdown files
    pages_dir = Path('apps/web/src/content/pages')
    if not pages_dir.exists():
        print(f"❌ Pages directory not found: {pages_dir}")
        sys.exit(1)

    files = list(pages_dir.rglob('*.md'))
    print(f"Found {len(files)} markdown files\n")

    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified\n")

    success_count = 0
    for filepath in sorted(files):
        if migrate_file(filepath, dry_run):
            success_count += 1

    print(f"\n{'✅ DRY RUN' if dry_run else '✅'} Processed: {success_count}/{len(files)} files")

    if not dry_run:
        print("\nNext: Run 'cd apps/web && npm run build' to verify")

if __name__ == '__main__':
    main()
