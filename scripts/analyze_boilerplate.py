#!/usr/bin/env python3
"""
Boilerplate Analyzer - Identifies common Google Sites code across pages
"""

from pathlib import Path
from difflib import unified_diff, SequenceMatcher
from collections import Counter
import re


def calculate_similarity(file1_lines: list[str], file2_lines: list[str]) -> float:
    """Calculate similarity ratio between two files."""
    matcher = SequenceMatcher(None, file1_lines, file2_lines)
    return matcher.ratio()


def find_common_prefix(files: list[Path]) -> tuple[int, list[str]]:
    """
    Find common prefix lines across all files.

    Returns:
        Tuple of (line_count, common_lines)
    """
    # Read all files
    all_lines = []
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            all_lines.append(f.readlines())

    # Find common prefix
    common_prefix = []
    min_length = min(len(lines) for lines in all_lines)

    for i in range(min_length):
        # Get line i from all files
        lines_at_i = [lines[i] for lines in all_lines]

        # Check if all are similar (allowing for nonce differences)
        first_line = lines_at_i[0]
        first_normalized = re.sub(r'nonce="[^"]*"', 'nonce="NONCE"', first_line)
        first_normalized = re.sub(r'timestamp=\d+', 'timestamp=TIME', first_normalized)

        all_match = True
        for line in lines_at_i[1:]:
            line_normalized = re.sub(r'nonce="[^"]*"', 'nonce="NONCE"', line)
            line_normalized = re.sub(r'timestamp=\d+', 'timestamp=TIME', line_normalized)
            if line_normalized != first_normalized:
                all_match = False
                break

        if all_match:
            common_prefix.append(first_line)
        else:
            break

    return len(common_prefix), common_prefix


def find_common_suffix(files: list[Path]) -> tuple[int, list[str]]:
    """
    Find common suffix lines across all files.

    Returns:
        Tuple of (line_count, common_lines)
    """
    # Read all files
    all_lines = []
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            all_lines.append(f.readlines())

    # Find common suffix
    common_suffix = []
    min_length = min(len(lines) for lines in all_lines)

    for i in range(1, min_length + 1):
        # Get line -i from all files
        lines_at_i = [lines[-i] for lines in all_lines]

        # Check if all are identical
        first_line = lines_at_i[0]
        if all(line == first_line for line in lines_at_i):
            common_suffix.insert(0, first_line)
        else:
            break

    return len(common_suffix), common_suffix


def analyze_section_tags(files: list[Path]) -> dict:
    """Analyze <section> tags to understand content structure."""

    section_counts = Counter()
    section_ids = Counter()

    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Count sections
        sections = re.findall(r'<section[^>]*>', content)
        section_counts[len(sections)] += 1

        # Extract section IDs
        ids = re.findall(r'<section[^>]*id="([^"]+)"', content)
        for id_val in ids:
            section_ids[id_val] += 1

    return {
        'section_counts': dict(section_counts),
        'common_section_ids': section_ids.most_common(10),
    }


def main():
    """Analyze beautified HTML files to identify boilerplate patterns."""

    # Paths
    base_dir = Path(__file__).parent.parent
    analysis_dir = base_dir / "data" / "html_processing" / "2_analysis"
    beautified_dir = analysis_dir / "beautified"
    report_file = analysis_dir / "boilerplate_analysis.md"

    # Get beautified files
    beautified_files = sorted(beautified_dir.glob("*.html"))

    if not beautified_files:
        print("❌ No beautified files found!")
        print("   Run: python scripts/html_beautifier.py first")
        return

    print("=" * 60)
    print("BOILERPLATE ANALYZER")
    print("=" * 60)
    print(f"Analyzing {len(beautified_files)} files...")
    print()

    # Calculate pairwise similarities
    print("📊 Calculating file similarities...")
    similarities = []
    for i, file1 in enumerate(beautified_files):
        for file2 in beautified_files[i+1:]:
            with open(file1, 'r') as f1, open(file2, 'r') as f2:
                lines1 = f1.readlines()
                lines2 = f2.readlines()

            similarity = calculate_similarity(lines1, lines2)
            similarities.append((file1.name, file2.name, similarity))

    avg_similarity = sum(s[2] for s in similarities) / len(similarities)
    print(f"  Average similarity: {avg_similarity:.1%}")
    print()

    # Find common prefix
    print("🔍 Analyzing common prefix (header/boilerplate)...")
    prefix_count, prefix_lines = find_common_prefix(beautified_files)
    print(f"  Common prefix: {prefix_count} lines")
    print()

    # Find common suffix
    print("🔍 Analyzing common suffix (footer/scripts)...")
    suffix_count, suffix_lines = find_common_suffix(beautified_files)
    print(f"  Common suffix: {suffix_count} lines")
    print()

    # Analyze sections
    print("📄 Analyzing <section> structure...")
    section_analysis = analyze_section_tags(beautified_files)
    print(f"  Section count distribution: {section_analysis['section_counts']}")
    print(f"  Common section IDs: {dict(section_analysis['common_section_ids'][:5])}")
    print()

    # Calculate unique content percentage
    sample_file = beautified_files[0]
    with open(sample_file, 'r') as f:
        total_lines = len(f.readlines())

    unique_lines = total_lines - prefix_count - suffix_count
    unique_pct = (unique_lines / total_lines) * 100

    print("📈 Content breakdown (sample file):")
    print(f"  Total lines: {total_lines}")
    print(f"  Common prefix (boilerplate): {prefix_count} lines ({prefix_count/total_lines*100:.1f}%)")
    print(f"  Unique content: {unique_lines} lines ({unique_pct:.1f}%)")
    print(f"  Common suffix: {suffix_count} lines ({suffix_count/total_lines*100:.1f}%)")
    print()

    # Write detailed report
    print("📝 Writing detailed analysis report...")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# Google Sites Boilerplate Analysis\n\n")
        f.write(f"**Analysis Date:** {Path.cwd()}\n\n")
        f.write(f"**Files Analyzed:** {len(beautified_files)}\n\n")

        f.write("## Key Findings\n\n")
        f.write(f"- **Average file similarity:** {avg_similarity:.1%}\n")
        f.write(f"- **Common prefix (header/scripts):** {prefix_count} lines\n")
        f.write(f"- **Common suffix (footer/tracking):** {suffix_count} lines\n")
        f.write(f"- **Unique content per page:** ~{unique_pct:.1f}%\n\n")

        f.write("## Similarity Matrix\n\n")
        f.write("Top 5 most similar file pairs:\n\n")
        sorted_similarities = sorted(similarities, key=lambda x: x[2], reverse=True)
        for file1, file2, sim in sorted_similarities[:5]:
            f.write(f"- `{file1}` ↔ `{file2}`: {sim:.1%}\n")

        f.write("\n## Section Structure\n\n")
        f.write(f"Section count distribution: {section_analysis['section_counts']}\n\n")
        f.write("Most common section IDs:\n\n")
        for section_id, count in section_analysis['common_section_ids'][:10]:
            f.write(f"- `{section_id}`: appears in {count}/{len(beautified_files)} files\n")

        f.write("\n## Common Prefix Pattern\n\n")
        f.write(f"First {min(10, prefix_count)} lines are identical across all files:\n\n")
        f.write("```html\n")
        f.write("".join(prefix_lines[:10]))
        f.write("```\n\n")

        f.write("## Recommendations\n\n")
        f.write("1. **Strip common prefix/suffix**: Remove ~{:.1f}% of each file\n".format(
            ((prefix_count + suffix_count) / total_lines) * 100
        ))
        f.write("2. **Extract <section> content only**: Focus on unique page content\n")
        f.write("3. **Preserve section IDs**: Keep for content identification\n")
        f.write("4. **Remove Google tracking/analytics**: Not needed for migration\n")

    print(f"✅ Analysis complete!")
    print(f"📁 Report saved: {report_file}")
    print()
    print("Next steps:")
    print("  1. Review the analysis report")
    print("  2. Run: python scripts/html_cleaner.py (to be created)")


if __name__ == "__main__":
    main()
