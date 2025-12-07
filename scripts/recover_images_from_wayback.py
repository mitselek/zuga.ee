#!/usr/bin/env python3
"""
Attempt to recover images from Internet Archive's Wayback Machine.

Since googleusercontent URLs are returning 403, we'll try to:
1. Find archived versions of zuga.ee pages
2. Extract image URLs from those archives
3. Download images from the archived versions
"""

import json
import re
import time
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import urljoin, urlparse

import requests


def extract_image_urls_from_json(json_file: Path) -> List[Dict]:
    """Extract all googleusercontent image URLs from a JSON file."""
    with open(json_file) as f:
        data = json.load(f)

    images = []
    content = json.dumps(data)

    # Find all googleusercontent URLs
    pattern = r'https://lh[0-9]\.googleusercontent\.com/[A-Za-z0-9_-]+'
    for match in re.finditer(pattern, content):
        url = match.group(0)
        images.append({
            'url': url,
            'source_file': json_file.name,
            'server': urlparse(url).netloc
        })

    return images


def get_original_url(json_file: Path) -> str:
    """Extract the original zuga.ee URL from JSON metadata."""
    with open(json_file) as f:
        data = json.load(f)

    # Try multiple possible locations
    if 'metadata' in data and 'url_path' in data['metadata']:
        path = data['metadata']['url_path']
        return f"https://www.zuga.ee{path}"

    # Try to construct from filename
    slug = json_file.stem.replace('english-', '').replace('etendused-', '').replace('noorele-publikule-', '').replace('suurtele-', '')
    return f"https://www.zuga.ee/{slug}"


def check_wayback_availability(url: str) -> List[str]:
    """Check if URL is available in Wayback Machine and return snapshot URLs."""
    api_url = f"http://archive.org/wayback/available?url={url}"

    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('archived_snapshots', {}).get('closest', {}).get('available'):
            snapshot_url = data['archived_snapshots']['closest']['url']
            timestamp = data['archived_snapshots']['closest']['timestamp']
            print(f"  ✓ Found snapshot from {timestamp}: {snapshot_url}")
            return [snapshot_url]
        else:
            print(f"  ✗ No snapshots found")
            return []

    except Exception as e:
        print(f"  ✗ Error checking Wayback: {e}")
        return []


def extract_images_from_wayback_snapshot(snapshot_url: str) -> List[str]:
    """Extract image URLs from a Wayback Machine snapshot."""
    try:
        response = requests.get(snapshot_url, timeout=15)
        response.raise_for_status()

        # Find all image URLs in the HTML
        # Look for both direct URLs and googleusercontent URLs
        content = response.text

        # Pattern for googleusercontent URLs in the archived page
        pattern = r'https?://(?:web\.archive\.org/web/\d+/)?https://lh[0-9]\.googleusercontent\.com/[A-Za-z0-9_=-]+'
        matches = re.findall(pattern, content)

        # Also look for direct image references
        img_pattern = r'<img[^>]+src="([^"]+)"'
        img_matches = re.findall(img_pattern, content)

        all_urls = set(matches)
        for img in img_matches:
            if 'googleusercontent' in img:
                all_urls.add(img)

        return list(all_urls)

    except Exception as e:
        print(f"  ✗ Error fetching snapshot: {e}")
        return []


def download_image_from_wayback(wayback_url: str, output_dir: Path, index: int) -> bool:
    """Download an image from Wayback Machine."""
    try:
        response = requests.get(wayback_url, timeout=20)
        response.raise_for_status()

        # Determine file extension from content type
        content_type = response.headers.get('content-type', '')
        ext_map = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp'
        }
        ext = ext_map.get(content_type.split(';')[0], '.jpg')

        # Extract hash from URL for filename
        if 'googleusercontent.com/' in wayback_url:
            hash_part = wayback_url.split('googleusercontent.com/')[-1].split('=')[0][:16]
            filename = f"wayback_{hash_part}{ext}"
        else:
            filename = f"wayback_image_{index:03d}{ext}"

        output_path = output_dir / filename
        output_path.write_bytes(response.content)

        print(f"    ✓ Downloaded: {filename} ({len(response.content)} bytes)")
        return True

    except Exception as e:
        print(f"    ✗ Download failed: {e}")
        return False


def main():
    """Main recovery process."""
    print("=== Image Recovery from Internet Archive ===\n")

    # Setup
    base_dir = Path(__file__).parent.parent
    json_dir = base_dir / "data" / "manual_extraction_samples"
    output_dir = base_dir / "data" / "recovered_images"
    output_dir.mkdir(exist_ok=True)

    # Extract all unique image URLs
    print("[1] Extracting image URLs from JSON files...")
    all_images = []
    json_files = sorted(json_dir.glob("*.json"))

    for json_file in json_files:
        images = extract_image_urls_from_json(json_file)
        all_images.extend(images)

    unique_urls = list({img['url'] for img in all_images})
    print(f"    Found {len(unique_urls)} unique image URLs across {len(json_files)} files\n")

    # Group by source file to check Wayback for each page
    print("[2] Checking Wayback Machine for archived pages...")
    files_with_images = list(set(img['source_file'] for img in all_images))

    snapshot_mapping = {}
    for filename in sorted(files_with_images)[:5]:  # Start with first 5 files
        json_file = json_dir / filename
        original_url = get_original_url(json_file)

        print(f"\n  Checking: {original_url}")
        snapshots = check_wayback_availability(original_url)

        if snapshots:
            snapshot_mapping[filename] = snapshots

        time.sleep(1)  # Be nice to Archive.org API

    print(f"\n[3] Found {len(snapshot_mapping)} pages with Wayback snapshots\n")

    # Try to extract and download images from snapshots
    print("[4] Attempting to extract images from snapshots...")
    downloaded_count = 0

    for filename, snapshots in snapshot_mapping.items():
        print(f"\n  Processing {filename}...")
        for snapshot_url in snapshots:
            image_urls = extract_images_from_wayback_snapshot(snapshot_url)
            print(f"    Found {len(image_urls)} image URLs in snapshot")

            for i, img_url in enumerate(image_urls[:3], 1):  # Limit to 3 per snapshot
                if download_image_from_wayback(img_url, output_dir, downloaded_count + i):
                    downloaded_count += 1
                time.sleep(0.5)  # Rate limiting

    print(f"\n=== SUMMARY ===")
    print(f"Total unique images in JSONs: {len(unique_urls)}")
    print(f"Pages with Wayback snapshots: {len(snapshot_mapping)}")
    print(f"Images downloaded: {downloaded_count}")
    print(f"\nImages saved to: {output_dir}")

    if downloaded_count > 0:
        print("\n✓ Successfully recovered some images from Internet Archive!")
        print("  Next steps:")
        print("  1. Review downloaded images")
        print("  2. Map them to googleusercontent URLs")
        print("  3. Update image_mapping.json")
    else:
        print("\n✗ No images could be recovered from Wayback Machine")
        print("  Possible reasons:")
        print("  - Google Sites images may not be archived")
        print("  - Images hosted externally from main pages")
        print("  - Need to check individual image URLs in Wayback")


if __name__ == "__main__":
    main()
