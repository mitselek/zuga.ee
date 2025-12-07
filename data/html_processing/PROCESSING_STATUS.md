# HTML Processing Status

**Date**: December 7, 2025

## Current State

### Files
- **Source Directory**: `data/html_processing/2_beautified_all/`
- **Total Files**: 35 unique HTML files (after deduplication)
- **Removed Duplicates**: 34 files (kept only `folder/index.html` versions)

### File Details
- **Size**: ~19KB each
- **Lines**: 72 lines per file (98.2% reduction from 1,246 lines)
- **Structure**: Minimal HTML + 1 content `<section>` + images
- **Cleaned**: All Google Sites boilerplate removed

### Previous Work
- **Original files**: 69 files in `1_originals/` (90KB each, minified)
- **Beautified**: Created in `2_beautified_all/` (109KB each, unminified)
- **Diff analysis**: Completed on beautified files (found 461 common boilerplate lines)
- **Duplicate removal**: 34 files removed (12 root-level + 22 subfolder)
- **Final cleaning**: Extracted only content sections (98.2% size reduction)

### Manual Extractions (Old Source)
- **Count**: 15 files extracted from `archive/zuga/` directory
- **Method**: Manual extraction using Kaia methodology
- **Status**: ✅ Complete (documented in EXTRACTION_REGISTRY.md)
- **Note**: These were from OLD unminified source, NOT from cleaned `2_beautified_all/`

## Next Steps

### Validation Needed
1. Extract 1-3 sample files from NEW cleaned source (`2_beautified_all/`)
2. Compare with previous extractions from `archive/zuga/`
3. Verify content preservation after cleaning
4. Confirm images are still accessible

### Then: Batch Processing
- Extract all 35 unique files from cleaned source
- Generate JSON for comprehensive site content
- Create navigation structure with bilingual linking
- Build complete performance catalog

## File Inventory

### By Category
- Homepage: 1 file
- English pages: 10 files (landing + performances)
- Estonian performances (young): 7 files
- Estonian performances (adult): 4 files
- Workshops: 6 files
- Other (awards, gallery, contact, press, team, news, works): 7 files

### Extraction Status
- ✅ Previously extracted (from archive): 15 files
- ⚠️ Need re-extraction (from cleaned source): 35 files (including the 15 already done)
- 📊 Coverage: Can now process all unique pages efficiently

## Technical Details

### Cleaning Process
1. Started with 69 minified HTML files (90KB each, 31 lines)
2. Beautified to 1,246 lines each (109KB)
3. Identified 34 duplicate pairs via filename analysis
4. Removed duplicates → 35 unique files
5. Extracted only `<section>` content → 72 lines each (19KB)

### Quality Metrics
- Boilerplate removal: 98.2%
- File size reduction: 79% (90KB → 19KB)
- Duplicate elimination: 49% (69 → 35 files)
- Content sections per file: 1 (consistent)
