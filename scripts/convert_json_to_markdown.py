#!/usr/bin/env python3
"""
Batch convert validated JSON files to markdown.

Converts all 35 JSON files from packages/content/source_zuga_ee/extracted_v2/
to Obsidian-compatible markdown following MARKDOWN_FORMAT_SPEC.md.

Features:
- Clean slate: Overwrites existing markdown files
- Option A format: Media in frontmatter arrays
- Type-safe YAML frontmatter
- Semantic markdown body

Usage:
    python scripts/convert_json_to_markdown.py
    python scripts/convert_json_to_markdown.py --dry-run  # Preview only
"""

import argparse
import sys
from pathlib import Path
from typing import TypedDict, Optional

from extraction_models import ExtractedPage


class ConversionResult(TypedDict):
    """Result of converting a single JSON file."""

    file: str
    status: str
    output_path: Optional[str]
    error: Optional[str]


def convert_file(json_path: Path, output_dir: Path, dry_run: bool = False) -> ConversionResult:
    """
    Convert single JSON file to markdown.

    Args:
        json_path: Path to input JSON file
        output_dir: Base output directory (packages/content/pages/)
        dry_run: If True, don't write files

    Returns:
        Dict with conversion stats
    """
    result: ConversionResult = {
        "file": json_path.name,
        "status": "success",
        "output_path": None,
        "error": None,
    }

    try:
        # Load and validate JSON
        with open(json_path) as f:
            page = ExtractedPage.model_validate_json(f.read())

        # Convert to markdown
        markdown_content = page.to_markdown()

        # Determine output path
        lang_dir = output_dir / page.metadata.language.value
        output_path = lang_dir / f"{page.metadata.slug}.md"

        result["output_path"] = str(output_path)

        if not dry_run:
            # Create directory if needed
            lang_dir.mkdir(parents=True, exist_ok=True)

            # Write markdown file
            output_path.write_text(markdown_content, encoding="utf-8")

            result["status"] = "written"
        else:
            result["status"] = "dry_run"

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Convert validated JSON files to markdown")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview conversion without writing files",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("packages/content/source_zuga_ee/extracted_v2"),
        help="Input directory with JSON files",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("packages/content/pages"),
        help="Output directory for markdown files",
    )

    args = parser.parse_args()

    # Validate input directory
    if not args.input_dir.exists():
        print(f"❌ Input directory not found: {args.input_dir}", file=sys.stderr)
        return 1

    # Find all JSON files
    json_files = sorted(args.input_dir.glob("*.json"))
    if not json_files:
        print(f"❌ No JSON files found in {args.input_dir}", file=sys.stderr)
        return 1

    print(f"🔍 Found {len(json_files)} JSON files")
    print(f"📁 Output directory: {args.output_dir}")
    if args.dry_run:
        print("🔬 DRY RUN MODE - no files will be written")
    print()

    # Convert all files
    results: list[ConversionResult] = []
    for json_path in json_files:
        print(f"Processing {json_path.name}...", end=" ")
        result = convert_file(json_path, args.output_dir, args.dry_run)
        results.append(result)

        if result["status"] == "error":
            print(f"❌ {result['error']}")
        elif result["status"] == "written":
            print(f"✅ → {result['output_path']}")
        else:
            print(f"✓ → {result['output_path']}")

    # Summary
    print()
    print("=" * 60)
    success_count = sum(1 for r in results if r["status"] in ["success", "written"])
    error_count = sum(1 for r in results if r["status"] == "error")

    print(f"✅ Successful: {success_count}/{len(results)}")
    if error_count > 0:
        print(f"❌ Errors: {error_count}")
        print("\nFailed files:")
        for r in results:
            if r["status"] == "error":
                print(f"  - {r['file']}: {r['error']}")

    if args.dry_run:
        print("\n💡 Run without --dry-run to write files")

    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
