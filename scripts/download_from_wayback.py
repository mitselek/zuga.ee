#!/usr/bin/env python3
"""
Download images from Internet Archive snapshots of zuga.ee.

Strategy:
1. Use the CDX API to find all archived zuga.ee pages
2. For each archived page, extract googleusercontent image URLs
3. Try to download images through Wayback's rewrite system
4. Save images with mapping to original googleusercontent URLs
"""

import hashlib
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import urlparse

import requests


def get_wayback_snapshots(from_year: str = "2023") -> List[Dict]:
    """Get all Wayback Machine snapshots of zuga.ee since a given year."""
    cdx_url = f"http://web.archive.org/cdx/search/cdx?url=zuga.ee/*&from={from_year}&output=json"

    try:
        response = requests.get(cdx_url, timeout=30)
        response.raise_for_status()
        data = response.json()

        # Skip header row
        snapshots = []
        for row in data[1:]:
            snapshots.append({
                'timestamp': row[1],
                'original_url': row[2],
                'mimetype': row[3],
                'status': row[4]
            })

        return snapshots
    except Exception as e:
        print(f"Error fetching snapshots: {e}")
        return []


def extract_googleusercontent_urls(wayback_url: str) -> Set[str]:
    """Extract all googleusercontent URLs from an archived page."""
    try:
        response = requests.get(wayback_url, timeout=15)
        response.raise_for_status()
        content = response.text

        # Pattern for googleusercontent URLs (with or without =w suffix)
        pattern = r'https://lh[0-9]\.googleusercontent\.com/[A-Za-z0-9_-]+(?:=[wh]\d+)?'
        matches = re.findall(pattern, content)

        # Normalize URLs - remove =w suffix for comparison
        normalized = set()
        for url in matches:
            base_url = url.split('=')[0] if '=' in url else url
            normalized.add(base_url)

        return normalized
    except Exception as e:
        print(f"  Error fetching {wayback_url}: {e}")
        return set()


def download_image_via_wayback(google_url: str, timestamp: str, output_dir: Path) -> bool:
    """
    Try to download an image via Wayback Machine.
    Uses the timestamp from when the page was archived.
    """
    # Try different size suffixes
    suffixes = ['=w2000', '=w1280', '=w800', '']

    for suffix in suffixes:
        test_url = f"{google_url}{suffix}"
        wayback_url = f"http://web.archive.org/web/{timestamp}if_/{test_url}"

        try:
            response = requests.get(wayback_url, timeout=20, allow_redirects=True)

            if response.status_code == 200 and len(response.content) > 1000:
                # Determine file extension
                content_type = response.headers.get('content-type', '').lower()
                ext_map = {
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif',
                    'image/webp': '.webp'
                }

                for mime, ext in ext_map.items():
                    if mime in content_type:
                        break
                else:
                    ext = '.jpg'  # default

                # Create filename from URL hash
                url_hash = hashlib.md5(google_url.encode()).hexdigest()[:12]
                filename = f"wayback_{url_hash}{ext}"
                output_path = output_dir / filename

                output_path.write_bytes(response.content)
                size_kb = len(response.content) / 1024
                print(f"    ✓ Downloaded: {filename} ({size_kb:.1f} KB) via {suffix or 'no suffix'}")
                return True

        except Exception as e:
            continue

    return False


def main():
    """Main recovery process."""
    print("=== Recovering Images from Wayback Machine ===\n")

    # Setup
    base_dir = Path(__file__).parent.parent
    output_dir = base_dir / "data" / "recovered_images"
    output_dir.mkdir(exist_ok=True)

    # Track what we find
    mapping_file = base_dir / "data" / "wayback_image_mapping.json"
    mapping = {}

    print("[1] Fetching Wayback Machine snapshots...")
    snapshots = get_wayback_snapshots(from_year="2023")
    print(f"    Found {len(snapshots)} snapshots since 2023\n")

    # Focus on HTML pages only
    html_snapshots = [s for s in snapshots if s['mimetype'] == 'text/html' and s['status'] == '200']
    print(f"[2] Filtering to {len(html_snapshots)} HTML pages\n")

    # Sample recent snapshots (don't need to check all 300+)
    sample_snapshots = html_snapshots[-20:]  # Last 20 snapshots
    print(f"[3] Scanning {len(sample_snapshots)} recent snapshots for images...\n")

    all_image_urls = set()
    snapshot_to_images = {}

    for i, snapshot in enumerate(sample_snapshots, 1):
        timestamp = snapshot['timestamp']
        original_url = snapshot['original_url']
        wayback_url = f"http://web.archive.org/web/{timestamp}/{original_url}"

        print(f"  [{i}/{len(sample_snapshots)}] Scanning: {original_url[:50]}...")

        image_urls = extract_googleusercontent_urls(wayback_url)
        if image_urls:
            print(f"      Found {len(image_urls)} unique images")
            all_image_urls.update(image_urls)
            snapshot_to_images[timestamp] = {
                'url': original_url,
                'images': list(image_urls)
            }

        time.sleep(0.5)  # Rate limiting

    print(f"\n[4] Total unique images found: {len(all_image_urls)}\n")

    # Now try to download images using the timestamps
    print("[5] Attempting to download images...\n")

    downloaded = []
    failed = []

    for url in sorted(all_image_urls)[:30]:  # Limit to first 30 for testing
        # Find a timestamp where this URL appeared
        timestamp = None
        for ts, data in snapshot_to_images.items():
            if url in data['images']:
                timestamp = ts
                break

        if not timestamp:
            continue

        print(f"  Downloading: {url[:60]}...")
        if download_image_via_wayback(url, timestamp, output_dir):
            downloaded.append(url)
            mapping[url] = {
                'timestamp': timestamp,
                'local_file': f"data/recovered_images/wayback_{hashlib.md5(url.encode()).hexdigest()[:12]}.jpg"
            }
        else:
            print(f"    ✗ Failed to download")
            failed.append(url)

        time.sleep(1)  # Be nice to Archive.org

    # Save mapping
    if mapping:
        with open(mapping_file, 'w') as f:
            json.dump(mapping, f, indent=2)

    print(f"\n=== SUMMARY ===")
    print(f"Snapshots scanned: {len(sample_snapshots)}")
    print(f"Unique images found: {len(all_image_urls)}")
    print(f"Download attempts: {len(downloaded) + len(failed)}")
    print(f"Successfully downloaded: {len(downloaded)}")
    print(f"Failed: {len(failed)}")
    print(f"\nImages saved to: {output_dir}")
    print(f"Mapping saved to: {mapping_file}")

    if downloaded:
        print(f"\n✓ Successfully recovered {len(downloaded)} images!")
    else:
        print("\n✗ Could not recover images via Wayback Machine")
        print("  Reason: Google's image hosting may block Wayback crawler")


if __name__ == "__main__":
    main()
