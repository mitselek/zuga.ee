#!/usr/bin/env python3
"""Build googleusercontent URL → local file mapping from zuga2 archive.

The zuga2/dl/assets directory contains files named:
    <googleusercontent_hash>=w<width>_<short_hash>.<ext>

This script extracts that mapping and creates a lookup table.
"""

import json
import re
from pathlib import Path


def extract_mapping_from_zuga2() -> dict[str, str]:
    """Extract googleusercontent hash → short hash mapping from zuga2 filenames.

    Returns:
        Dict mapping full googleusercontent hash to short hash (8 chars)
    """
    mapping: dict[str, str] = {}

    zuga2_assets = Path("archive/zuga2/dl/assets")
    if not zuga2_assets.exists():
        print(f"Warning: {zuga2_assets} not found")
        return mapping

    for file in zuga2_assets.iterdir():
        if not file.is_file():
            continue

        # Pattern: <hash>=w<width>_<short>.<ext>
        match = re.match(r'([A-Za-z0-9_-]+)=w\d+_([a-f0-9]{8})', file.name)
        if match:
            google_hash = match.group(1)
            short_hash = match.group(2)
            mapping[google_hash] = short_hash
            print(f"Mapped: {google_hash[:20]}... → {short_hash}")

    return mapping


def find_local_image(short_hash: str) -> Path | None:
    """Find local image file matching the short hash.

    Args:
        short_hash: 8-character hash prefix

    Returns:
        Path to local file, or None if not found
    """
    zuga_assets = Path("archive/zuga/assets")
    if not zuga_assets.exists():
        return None

    # Look for file starting with short_hash
    for file in zuga_assets.iterdir():
        if file.name.startswith(short_hash):
            return file

    return None


def main() -> None:
    """Build and save image mapping."""
    print("=== Building Image Mapping ===\n")

    # Extract mapping from zuga2
    mapping = extract_mapping_from_zuga2()
    print(f"\nFound {len(mapping)} mappings from zuga2\n")

    # Build full mapping with local file paths
    full_mapping: dict[str, dict[str, str | bool | None]] = {}

    for google_hash, short_hash in mapping.items():
        local_file = find_local_image(short_hash)

        url = f"https://lh3.googleusercontent.com/{google_hash}=w16383"

        full_mapping[url] = {
            "google_hash": google_hash,
            "short_hash": short_hash,
            "local_file": str(local_file) if local_file else None,
            "available": local_file is not None,
        }

        status = "✅" if local_file else "❌"
        print(f"{status} {google_hash[:30]}... → {short_hash} → {local_file.name if local_file else 'NOT FOUND'}")

    # Save mapping
    output_file = Path("data/image_mapping.json")
    output_file.write_text(json.dumps(full_mapping, indent=2))
    print(f"\n✅ Saved mapping to {output_file}")
    print(f"   Total URLs: {len(full_mapping)}")
    print(f"   Available: {sum(1 for v in full_mapping.values() if v['available'])}")
    print(f"   Missing: {sum(1 for v in full_mapping.values() if not v['available'])}")


if __name__ == "__main__":
    main()
