#!/usr/bin/env python3
"""Analyze image URL to local file mapping.

Extracts googleusercontent URLs from JSON files and maps them to local
image files in the archive directories.
"""

import hashlib
import json
import re
from pathlib import Path


def extract_image_urls(json_file: Path) -> list[str]:
    """Extract all googleusercontent image URLs from a JSON file."""
    data = json.loads(json_file.read_text())

    # Convert to string and extract URLs
    json_str = json.dumps(data)
    pattern = r'https://lh[0-9]+\.googleusercontent\.com/([A-Za-z0-9_-]+)=w\d+'
    matches = re.findall(pattern, json_str)

    # Return unique URLs
    urls_set: set[str] = set()
    for match in matches:
        # Extract just the hash part
        urls_set.add(match)

    return [f"https://lh3.googleusercontent.com/{match}=w16383" for match in sorted(urls_set)]


def hash_url_to_short(url: str) -> str:
    """Generate short hash from URL (first 8 chars of MD5)."""
    return hashlib.md5(url.encode()).hexdigest()[:8]


def find_local_images() -> dict[str, Path]:
    """Find all local image files with their hashes."""
    images: dict[str, Path] = {}

    # Check zuga/assets
    zuga_assets = Path("archive/zuga/assets")
    if zuga_assets.exists():
        for f in zuga_assets.iterdir():
            if f.is_file():
                # Extract hash from filename
                name = f.name
                # Remove extension if present
                hash_part = name.split('.')[0]
                # Take first 8 chars as short hash
                if len(hash_part) >= 8:
                    images[hash_part[:8]] = f

    # Check zuga2/dl/assets
    zuga2_assets = Path("archive/zuga2/dl/assets")
    if zuga2_assets.exists():
        for f in zuga2_assets.iterdir():
            if f.is_file():
                # Extract short hash after underscore
                match = re.search(r'_([a-f0-9]{8})', f.name)
                if match:
                    images[match.group(1)] = f

    return images


def main() -> None:
    """Analyze and report image mapping."""
    # Find all JSON files
    json_dir = Path("data/manual_extraction_samples")
    json_files = list(json_dir.glob("*.json"))

    print(f"Found {len(json_files)} JSON files")

    # Find local images
    local_images = find_local_images()
    print(f"Found {len(local_images)} local image files")
    print(f"Short hashes: {sorted(local_images.keys())}")

    # Extract all unique URLs
    all_urls: set[str] = set()
    url_to_file: dict[str, list[str]] = {}

    for json_file in json_files:
        urls = extract_image_urls(json_file)
        for url in urls:
            all_urls.add(url)
            if url not in url_to_file:
                url_to_file[url] = []
            url_to_file[url].append(json_file.name)

    print(f"\nFound {len(all_urls)} unique image URLs")

    # Try to map URLs to local files
    mapped = 0
    unmapped = 0

    print("\n=== IMAGE MAPPING ===\n")

    for url in sorted(all_urls):
        short_hash = hash_url_to_short(url)

        if short_hash in local_images:
            local_file = local_images[short_hash]
            print(f"✅ MAPPED: {short_hash}")
            print(f"   URL: {url[:80]}...")
            print(f"   Local: {local_file}")
            print(f"   Used in: {', '.join(url_to_file[url][:3])}")
            print()
            mapped += 1
        else:
            print(f"❌ UNMAPPED: {short_hash}")
            print(f"   URL: {url[:80]}...")
            print(f"   Used in: {', '.join(url_to_file[url][:3])}")
            print()
            unmapped += 1

    print(f"\n=== SUMMARY ===")
    print(f"Total URLs: {len(all_urls)}")
    print(f"Mapped: {mapped}")
    print(f"Unmapped: {unmapped}")
    print(f"Coverage: {mapped / len(all_urls) * 100:.1f}%")


if __name__ == "__main__":
    main()
