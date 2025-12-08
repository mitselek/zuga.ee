---
description: Systematically extract all beautified HTML files into canonical JSON format
---

# Systematic Content Extraction

**Last updated**: 2025-12-08

## User Input Processing

**CRITICAL FIRST STEP**: Check if `$ARGUMENTS` contains user input.

User input:

$ARGUMENTS

**Decision logic**:
- **If $ARGUMENTS is empty or whitespace**: Proceed with normal self-executing workflow from current state
- **If $ARGUMENTS contains instructions**: Parse and apply those instructions before proceeding (e.g., "skip validation", "start from file X", "batch process")

## Purpose and Role

You are an expert data extraction specialist. Your task is to systematically convert all HTML files from the Zuga.ee archive into a canonical JSON format that serves as the single source of truth for the website.

**Extraction goals**:
1. Transform `packages/content/source_zuga_ee/beautified/*.html` → `packages/content/source_zuga_ee/extracted_v2/*.json`
2. Follow schema defined in `docs/DATA_MODEL.md` (Pydantic models in `scripts/extraction_models.py`)
3. Extract ONLY content present in HTML - never invent or assume content
4. Process files alphabetically until all 35 files are complete

**Self-executing workflow**: After each successful extraction and validation, automatically proceed to the next file. Do NOT wait for user confirmation between files.

## Prerequisites - Execute Before First Extraction

Before starting extraction work, complete these steps in order:

**Step 1: Verify Python environment**
```bash
# Check if Python virtual environment is configured
# If not, run: configure_python_environment
# Ensure Pydantic v2 is installed
```

**Step 2: Load canonical schema knowledge**
- Read `docs/DATA_MODEL.md` (complete specification)
- Understand Pydantic models in `scripts/extraction_models.py`
- Review validation function: `validate_json_file(filepath)`

**Step 3: Assess current progress**
```bash
# Count total HTML files
find beautified/ -name "index.html" | wc -l

# Count completed JSON files
ls extracted_v2/ | wc -l

# Calculate: remaining = total - completed
```

**Step 4: Identify next file to process**
```bash
# List all HTML files alphabetically
find beautified/ -name "index.html" | sort

# Compare with extracted_v2/ to find first unprocessed file
```

**Checkpoint**: Only proceed to extraction workflow once all prerequisites are met.

## Extraction Workflow - Four-Phase Process

Execute these phases sequentially for each file. Use explicit step-by-step reasoning.

### Phase 1: Initialize and Assess

**Objective**: Determine what work remains and identify next file to process.

**Step 1-1: Count files**
```bash
# Total HTML files to process
find /path/to/beautified -name "index.html" | sort | wc -l

# Already extracted JSON files
ls /path/to/extracted_v2/ | wc -l
```

**Step 1-2: Calculate progress**
- Remaining files = Total HTML files - Completed JSON files
- Progress percentage = (Completed / Total) × 100

**Step 1-3: Decision point**

**IF remaining files = 0**:
- Report: "All [X] files extracted successfully"
- Run final validation: `python scripts/extraction_models.py`
- Display validation summary (valid count, warnings, errors)
- Output: "Extraction batch complete. Ready for markdown conversion."
- **STOP workflow** - Do not continue

**IF remaining files > 0**:
- Report: "[X] of [Y] files extracted ([Z]% complete)"
- List all HTML files alphabetically
- Identify first unprocessed file (compare with extracted_v2/)
- Output: "Next file: [path/to/file.html]"
- **PROCEED to Phase 2**

### Phase 2: Extract File Content

**Objective**: Read HTML, analyze structure, infer metadata, create canonical JSON.

**Step 2-1: Read HTML source**
```bash
# Load HTML file content
read_file: beautified/[section]/[subsection]/index.html
```

**Step 2-2: Analyze HTML structure** (Use step-by-step reasoning)

Identify these elements by searching for specific HTML patterns:

**Hero background image**:
- Pattern: `<div class="IFuOkc" jsname="LQX2Vd" style="background-image: url(...)">`
- Extract: URL from `background-image: url(https://...)`
- Common format: `https://lh[3-6].googleusercontent.com/[ID]=w16383`

**Site logo** (1-2 instances):
- Pattern: `<img aria-label="Site home" class="r9CsCb" src="...">`
- Extract: URL from `src` attribute
- Note: Desktop and mobile logos may differ

**Gallery images** (typically 4-7 images):
- Pattern: `<img class="CENy8b" role="img" src="...">`
- Extract: URL from `src` attribute
- Extract: Optional `style` attribute for inline CSS
- Standard width: `1280` (from URLs ending in `w1280`)

**YouTube video embed**:
- Pattern: `<div src="https://www.youtube.com/embed/[VIDEO_ID]?embed_config=...">`
- Extract: `VIDEO_ID` from URL
- Extract: `embed_config` parameter (URL-decoded, extract `"enc"` value from JSON)

**Navigation links**:
- Pattern: `<a ... href="/uudised">` (home link)
- Common pattern: All pages link to `/uudised` as home

**Text content** (rare):
- Patterns: `<p>`, `<h1>`, `<h2>`, `<h3>` tags
- Most performance gallery pages have NO text content
- Extract only if present - do not invent

**Step 2-3: Infer metadata** (Use explicit reasoning)

Work out metadata from file path and context:

**Example reasoning for `beautified/english/shame/index.html`**:
1. Directory name: `shame` → Title: "Shame" (capitalize first letter)
2. Parent directory: `english/` → Language: `"en"`
3. Full path components: `english` + `shame` → Slug: `"english-shame"`
4. Section: `english/` → Page type: `"performance"`
5. Generate description: `"Zuga performance 'Shame' photo gallery"`
6. Check bilingual pairs table → Bilingual link: `"etendused-suurtele-habi"`

**Language mapping rules**:
- `english/` → `"en"`
- All other directories → `"et"` (Estonian)

**Page type inference**:
- `english/`, `etendused-noorele-publikule/`, `etendused-suurtele/` → `"performance"`
- `workshopid/` → `"workshop"`
- `uudised/` → `"news"`
- `galerii/`, `galerii-gallery/` → `"gallery"`
- `tegijad/`, `kontakt-2/`, `press-zugast/` → `"about"`
- Root `index.html` or section `index.html` → `"landing"`

**Step 2-4: Build canonical JSON structure**

Use this exact template (replace placeholders with extracted values):

```json
{
  "metadata": {
    "title": "[Inferred title]",
    "language": "en" | "et",
    "slug": "[inferred-slug]",
    "description": "[Generated description]",
    "page_type": "performance" | "gallery" | "workshop" | "about" | "news" | "landing"
  },
  "content_sections": [
    {
      "type": "hero",
      "content": "[Language: 'Performance page with photo gallery' (EN) or 'Etenduse leht fotogaleriiga' (ET)]",
      "media_ref": "hero_background"
    },
    {
      "type": "performance_gallery",
      "content": "[Language: 'Photo gallery from [Title] performance' (EN) or 'Fotogalerii etendusest [Title]' (ET)]"
    },
    {
      "type": "video",
      "content": "[Language: 'ZUGA video greeting' (EN) or 'ZUGA video tervitus' (ET)]",
      "media_ref": "video_greeting"
    }
  ],
  "media": [
    {
      "type": "hero",
      "id": "hero_background",
      "url": "[Extracted hero background URL]",
      "description": "[Language: 'Hero background image' (EN) or 'Tagapildi pilt' (ET)]"
    },
    {
      "type": "site_logo",
      "url": "[Extracted logo URL]",
      "description": "[Language: 'Zuga site logo' (EN) or 'Zuga logo' (ET)]"
    },
    {
      "type": "gallery_item",
      "url": "[Gallery image URL 1]",
      "width": "1280",
      "context": "[Language: 'Performance photo' (EN) or 'Etenduse foto' (ET)]"
    },
    ... (repeat for each gallery image),
    {
      "type": "youtube",
      "id": "video_greeting",
      "url": "https://www.youtube.com/embed/[VIDEO_ID]",
      "platform": "youtube",
      "video_id": "[VIDEO_ID]",
      "title": "[Language: 'ZUGA video greeting' (EN) or 'ZUGA video tervitus' (ET)]",
      "embed_config": "[Extracted embed_config enc value]"
    }
  ],
  "bilingual_link": "[paired-slug-if-exists or omit]",
  "navigation": {
    "home_link": "/uudised",
    "logo_links_to": "/uudised"
  },
  "extraction_notes": "Manually extracted from beautified HTML. [Add notes about structure, special cases, or deviations]"
}
```

**Step 2-5: Create JSON file**
- Filename: `extracted_v2/[slug].json`
- Ensure valid JSON syntax (proper escaping, no trailing commas)
- Use consistent formatting (2-space indentation)

**PROCEED to Phase 3 immediately after file creation**

### Phase 3: Validate Extraction

**Objective**: Verify JSON conforms to Pydantic schema before continuing.

**Step 3-1: Run Pydantic validation**

Execute this exact command (replace [FILENAME] with actual filename):

```bash
cd /home/michelek/Documents/github/zuga.ee && \
/home/michelek/Documents/github/zuga.ee/.venv/bin/python -c "
from scripts.extraction_models import validate_json_file
import sys

file = 'packages/content/source_zuga_ee/extracted_v2/[FILENAME].json'
is_valid, page, warnings = validate_json_file(file)

print(f'{file.split(\"/\")[-1]}:')
if is_valid:
    print(f'  ✅ Valid - {page.metadata.title}')
    if warnings:
        for w in warnings:
            print(f'  ⚠️  {w}')
else:
    print(f'  ❌ Invalid')
    sys.exit(1)
"
```

**Step 3-2: Interpret validation results**

**IF validation FAILS (exit code 1)**:
- Read error messages from Pydantic
- Identify issue (missing field, wrong type, invalid value, etc.)
- Fix JSON structure
- Re-run validation (go back to Step 3-1)
- **DO NOT proceed to Phase 4 until valid**

**IF validation SUCCEEDS (exit code 0)**:
- Report: "✅ [filename].json validated successfully"
- Note any warnings (missing bilingual_link is acceptable for unpaired pages)
- **PROCEED to Phase 4 immediately**

### Phase 4: Continue to Next File (Self-Execution)

**Objective**: Report progress and automatically process next file.

**Step 4-1: Report completion**
```
[COMPLETE] [filename].json ([X] of [Y] files, [Z]% complete)
```

**Step 4-2: Check for remaining files**
- Re-count: Total HTML files vs Completed JSON files
- If remaining files > 0: **AUTOMATICALLY GO TO PHASE 1** (no user confirmation needed)
- If remaining files = 0: Report final completion and **STOP**

**Step 4-3: Automatic continuation**

**CRITICAL RULES**:
- Do NOT wait for user input between files
- Do NOT ask "Should I continue?" or "Ready to proceed?"
- AUTOMATICALLY loop back to Phase 1
- Continue until all 35 files are extracted
- Only stop when remaining files = 0

**Progress output format**:
```
[INFO] Continuing to next file...
[INFO] Progress: [X]/35 files extracted ([Z]% complete)
[INFO] Next file: beautified/[path]/index.html
```

**LOOP**: Return to Phase 1, Step 1-1

## Reference: Extraction Patterns and Examples

Use these patterns as templates when processing files. Match the file structure to the appropriate pattern.

### Pattern 1: Performance Gallery (Most Common - ~80% of files)

**Recognition criteria**:
- Directory: `english/`, `etendused-noorele-publikule/`, `etendused-suurtele/`
- Structure: Hero background + Logo + 4-7 gallery images + 1 YouTube video
- Text content: None (pure visual gallery)

**Example files**: `english-shame`, `english-thepassage`, `etendused-noorele-publikule-ilma`

**Template**:
- Content sections: `["hero", "performance_gallery", "video"]`
- Media items: 10 total (1 hero + 1 logo + 7 gallery + 1 youtube)
- Bilingual link: Check mapping table for pair

### Pattern 2: Landing Page (~5% of files)

**Recognition criteria**:
- Directory: Root `index.html` or section `index.html` (e.g., `english/index.html`)
- Structure: Hero + Logo + Gallery + Possible announcements/news
- Text content: May have introductory text

**Example files**: `english-landing`, root `index.html`

**Template**:
- Content sections: `["hero", "announcement", "image_gallery", "video"]`
- Page type: `"landing"`
- Bilingual link: Often missing (acceptable warning)

### Pattern 3: News/Updates Page (~3% of files)

**Recognition criteria**:
- Directory: `uudised/`
- Structure: News items with text, dates, links
- Text content: Multiple news entries

**Example files**: `uudised/index.html`

**Template**:
- Content sections: `["hero", "announcement", "news"]`
- Page type: `"news"`
- Media: May have fewer gallery images

### Pattern 4: Workshop Page (~8% of files)

**Recognition criteria**:
- Directory: `workshopid/`
- Structure: Similar to performance gallery but may have workshop descriptions
- Text content: Workshop details (if present)

**Example files**: `workshopid/meelekolu-mängud-mindstuff-games/`

**Template**:
- Content sections: `["hero", "image_gallery", "video"]`
- Page type: `"workshop"`
- Similar to Pattern 1 structure

### Pattern 5: About/Info Page (~4% of files)

**Recognition criteria**:
- Directory: `tegijad/`, `kontakt-2/`, `press-zugast/`
- Structure: Text content + Photos of people/space
- Text content: Substantial descriptive text

**Example files**: `tegijad/`, `kontakt-2/`

**Template**:
- Content sections: `["hero", "text", "image_gallery"]`
- Page type: `"about"`
- May not have YouTube video

**Decision tree for pattern selection**:
1. Check directory name → Determines initial pattern guess
2. Count images → Performance galleries have 4-7, others vary
3. Check for YouTube video → Most performance galleries have one
4. Check for text content → About pages have substantial text
5. Match to closest pattern → Use that template

## Reference: Special Cases and Edge Cases

Handle these specific scenarios when encountered during extraction.

### Case 1: Index Files (Section Landing Pages)

**Scenario**: HTML file is `beautified/[section]/index.html`

**Special rules**:
- **Slug**: Use section name only (NOT `section-index`)
  - Example: `etendused-suurtele/index.html` → slug: `"etendused-suurtele"`
  - NOT: `"etendused-suurtele-index"`
- **Title**: Use section title
  - Example: `etendused-suurtele/index.html` → title: `"Etendused Suurtele"`
- **Page type**: Usually `"landing"` unless it's clearly a gallery or performance list

### Case 2: Shared Hero Backgrounds (Expected Duplication)

**Scenario**: Multiple files use identical hero background URL

**Reason**: This is intentional design - reuse is correct

**Action**: Extract URL as-is, do not flag as error

**Common shared backgrounds**:
- `DBxwueB6fPHRnLW2vhLTuUXqMXwXCvMQW-AliKEHn5c6X1O7ismAvtROvjQkbwGfsZsyzGcdc_-6lU_Ipmo1jg4` (used by most English pages)
- `PXSN6CJeVTYvu_x98JfAS3NBScOCkqV2WJW0HXxDJZWAA5pu8fyh7o59Y-BweUELFvpWPqx55G_kz-QCKDI1Y9Y` (used by some English pages)
- `YmL-ZKflrTu0uUJnzvcMQ9812g16lIXAfb2u1wmCWwluKk_RwjfjV3T_td4mMmiTLHIhYBvy3l7we3cFw39C0c0` (used by thepassage and ilma)
- `E9JYoSPVzSgdMHpLR4QymETWN3X-hwdxc-RtIBeIi1INrt0NvMIhRxaMfroLu-gtHmOHs1PYHjAuoY1cMuF7HYI` (used by Estonian performance pages)

### Case 3: Multiple Logo Images (Desktop + Mobile)

**Scenario**: HTML contains 2 logo images with `aria-label="Site home"`

**Reason**: Responsive design - different logos for desktop/mobile

**Action**: Extract both as separate media items

**Structure**:
```json
{
  "type": "site_logo",
  "url": "[first logo URL]",
  "description": "Zuga logo (desktop navigation)"
},
{
  "type": "site_logo",
  "url": "[second logo URL]",
  "description": "Zuga logo (mobile navigation)"
}
```

### Case 4: YouTube Embed Config Extraction

**Scenario**: YouTube URL contains URL-encoded `embed_config` parameter

**Example raw URL**:
```
https://www.youtube.com/embed/qp22v58UQnw?embed_config=%7B%22enc%22:%22AVPnqKtsr9f2eo-TlL3L9_z9LCPNRBmVm3arSLJnD2NNiz91foF0nKb-Zihb9pi8FQSagVH81rxQJJCjzeFPinsTlbx17tzJeb3mX0H1bSz8J3pI6hH-5bsx4EIudNTTB5ksxbTf4kGusT00f4as-SJh-6y57Wm_mRqZSTio4JIqKfhB%22%7D&errorlinks=1
```

**Extraction steps**:
1. URL-decode the `embed_config` parameter value
2. Parse as JSON: `{"enc": "AVPnqKtsr..."}`
3. Extract the `"enc"` value
4. Store in media item's `embed_config` field

**Result**:
```json
{
  "type": "youtube",
  "embed_config": "AVPnqKtsr9f2eo-TlL3L9_z9LCPNRBmVm3arSLJnD2NNiz91foF0nKb-Zihb9pi8FQSagVH81rxQJJCjzeFPinsTlbx17tzJeb3mX0H1bSz8J3pI6hH-5bsx4EIudNTTB5ksxbTf4kGusT00f4as-SJh-6y57Wm_mRqZSTio4JIqKfhB"
}
```

### Case 5: Images with Inline Styles

**Scenario**: Gallery image has `style="width: 100%; margin: 0% 0 0% 0%"` attribute

**Reason**: Custom layout/positioning for specific images

**Action**: Capture `style` attribute in `styling` field

**Structure**:
```json
{
  "type": "gallery_item",
  "url": "https://lh3.googleusercontent.com/...",
  "width": "1280",
  "styling": "width: 100%; margin: 0% 0 0% 0%",
  "context": "Performance photo"
}
```

**Note**: Most images do NOT have inline styles - only add `styling` field when present in HTML

### Case 6: Missing or Incomplete Data

**Scenario**: HTML file lacks expected elements (e.g., no hero background, no video)

**Action**: Use fallback values

**Fallback rules**:
- **Missing hero background**: Omit `hero` section from `content_sections`, omit hero from `media`
- **Missing video**: Omit `video` section from `content_sections`, omit youtube from `media`
- **Missing gallery images**: Create `image_gallery` section with whatever images are present
- **Cannot determine title**: Use filename with hyphens → spaces, title-cased (e.g., `the-great-unknown` → `"The Great Unknown"`)
- **Cannot determine description**: Use generic: `"Zuga content page"`
- **Cannot determine page type**: Use `"gallery"`
- **No bilingual pair**: Omit `bilingual_link` field (validation will warn, which is acceptable)

## Language Detection Rules

Use the following decision tree to determine the `language` field.

### Detection Steps

**Step 1: Check parent directory name**

```
IF path contains "beautified/english/" → language: "en"
IF path contains "beautified/etendused-" → language: "et"
IF path contains "beautified/workshopid/" → language: "et"
IF path contains "beautified/galerii" → language: "et"
IF path contains "beautified/kontakt" → language: "et"
IF path contains "beautified/press" → language: "et"
IF path contains "beautified/tegijad" → language: "et"
IF path contains "beautified/uudised" → language: "et"
IF path contains "beautified/zuga-toeoed" → language: "et"
IF path contains "beautified/auhinnad" → language: "et"
```

**Step 2: Check for explicit language indicators**

IF directory name starts with "english-" → language: "en"

**Step 3: Default rule**

IF no match found → language: "et" (most files are Estonian)

### Language-Specific Conventions

**English pages** (`language: "en"`):

- **Description pattern**: `"Zuga performance '[Title]' photo gallery"`
- **Hero description**: `"Hero background for [Title]"`
- **Gallery context**: `"Performance photo"`
- **Logo description**: `"Zuga logo (desktop navigation)"`

**Estonian pages** (`language: "et"`):

- **Description pattern**: `"Zuga etenduse '[Title]' fotogalerii"`
- **Hero description**: `"Kangelasetaust [Title]'ile"`
- **Gallery context**: `"Etenduse foto"`
- **Logo description**: `"Zuga logo (töölaua navigeerimine)"`

### Example Language Inference

**Path**: `beautified/english/shame/index.html`

**Reasoning**:
1. Contains `"beautified/english/"` → language: `"en"`
2. Use English conventions for descriptions
3. Result: `"language": "en"`

**Path**: `beautified/etendused-noorele-publikule/ilma/index.html`

**Reasoning**:
1. Contains `"beautified/etendused-"` → language: `"et"`
2. Use Estonian conventions for descriptions
3. Result: `"language": "et"`

**Path**: `beautified/workshopid/voitlemine/index.html`

**Reasoning**:
1. Contains `"beautified/workshopid/"` → language: `"et"`
2. Directory name `"workshopid"` is Estonian
3. Use Estonian conventions for descriptions
4. Result: `"language": "et"`

## Bilingual Link Mapping

**Known pairs**:

| English Slug | Estonian Slug |
|-------------|---------------|
| `english-shame` | `etendused-suurtele-habi` |
| `english-thepassage` | `etendused-noorele-publikule-kaeik` |
| `english-weather-or-not` | `etendused-noorele-publikule-ilma` |
| `english-inthemood` | `etendused-suurtele-meelekolu` |
| `english-noise` | `etendused-suurtele-mura` |
| `english-2-2-22` | `etendused-noorele-publikule-2-2-22` |
| `english-the-great-unknown` | `etendused-suurtele-suur-teadmatus` |

**No pairs** (single-language pages):

- `auhinnad-awards` (Estonian awards page, no English equivalent)
- `english-about-us-1` (English about page, no Estonian equivalent)
- `english-landing` (English landing, root index.html is Estonian landing)

## Quality Checks

Before marking extraction complete, perform these verification steps.

### Checkpoint 1: Individual File Validation

**After each extraction**:

```bash
python scripts/extraction_models.py
```

**Expected output**:
```
[filename].json:
  ✅ Valid - [Title]
```

**IF validation fails**:
1. Review error message
2. Check which field caused failure (e.g., missing required field, invalid type)
3. Re-read HTML file for that specific field
4. Correct JSON file
5. Re-run validation
6. Do NOT proceed to next file until validation succeeds

### Checkpoint 2: Batch Validation

**After every 5 files**:

```bash
ls packages/content/source_zuga_ee/extracted_v2/ | wc -l
```

**Expected**: Count should match number of files processed

**Verify**: All recent files validated successfully

### Checkpoint 3: Progress Tracking

**After each file**:

Calculate completion percentage:
- Files processed / 35 total * 100 = X%

**Report format**:
```
[INFO] Progress: [X]/35 files extracted ([Y]% complete)
[INFO] Next file: beautified/[path]/index.html
```

### Checkpoint 4: Bilingual Link Verification

**After all extractions complete**:

1. **Check known pairs**: All 7 known pairs should have bidirectional links
   - English page has `"bilingual_link": "estonian-slug"`
   - Estonian page has `"bilingual_link": "english-slug"`

2. **Acceptable warnings**: Pages without pairs will show warning:
   ```
   ⚠️ Warning: Missing bilingual_link (acceptable for unpaired pages)
   ```

3. **Verify unpaired pages**: These should NOT have bilingual_link field:
   - `auhinnad-awards`
   - `english-about-us-1`
   - `english-landing`
   - Root `index.html`

### Checkpoint 5: Media URL Completeness

**Sample check** (select 3-5 random files):

1. Open JSON file
2. For each `media` item:
   - **Hero background**: URL should start with `https://lh3.googleusercontent.com/`
   - **Site logo**: URL should start with `https://lh3.googleusercontent.com/`
   - **Gallery images**: URL should start with `https://lh3.googleusercontent.com/`
   - **YouTube video**: `embed_config` should be 100+ character string
3. No partial URLs or missing protocols

### Checkpoint 6: Final Validation

**After all 35 files extracted**:

```bash
python scripts/extraction_models.py
```

**Expected output**:
- 35+ files validated (some sections may have index files)
- 0 errors
- 3-5 warnings (missing bilingual_link for unpaired pages)

**Success criteria**:
- ✅ All files valid
- ✅ No missing required fields
- ✅ All media URLs complete
- ✅ Bilingual pairs correctly linked
- ✅ Ready for markdown conversion

### Troubleshooting Common Issues

**Issue**: `ValidationError: missing required field 'title'`
- **Fix**: Check HTML for page title, infer from directory name if missing
- **Re-validate**: After adding title field

**Issue**: `ValidationError: expected type 'array', got 'dict'`
- **Fix**: Check that `content_sections` and `media` are arrays, not objects
- **Structure**: Should be `[]` not `{}`

**Issue**: `ValidationError: invalid URL format`
- **Fix**: Ensure URLs start with `https://` or other valid protocol
- **Check**: No partial URLs like `//lh3.googleusercontent.com/`

## Output Format and Reporting

Use the following structured reporting format to maintain visibility throughout extraction.

### Progress Report Template

**At start of session**:

```
[INFO] Starting extraction batch
[INFO] Current progress: [X]/35 files extracted ([Y]% complete)
[INFO] Remaining files: [Z]
[INFO] Next file: beautified/[path]/index.html
```

### Per-File Extraction Report

**For each file processed**:

```
[EXTRACT] Reading HTML: [relative-path]/index.html
[EXTRACT] Detected: Hero background, [N] logo(s), [M] gallery images, [P] YouTube video(s)
[EXTRACT] Metadata: Language=[lang], PageType=[type], Slug=[slug]
[EXTRACT] Creating: extracted_v2/[filename].json

[VALIDATE] Running Pydantic validation...
[filename].json:
  ✅ Valid - [Title]

[COMPLETE] [filename].json ([X]/35 files, [Y]% complete)

[INFO] Continuing to next file...
```

### Validation Failure Report

**IF validation fails**:

```
[VALIDATE] Running Pydantic validation...
[filename].json:
  ❌ Error: [error message]

[DEBUG] Field causing error: [field_name]
[DEBUG] Expected type: [expected]
[DEBUG] Received: [actual]

[FIX] Re-reading HTML for [field_name]...
[FIX] Correcting JSON file...
[FIX] Re-validating...

[VALIDATE] Running Pydantic validation...
[filename].json:
  ✅ Valid - [Title]

[COMPLETE] [filename].json ([X]/35 files, [Y]% complete)
```

### Batch Milestone Report

**After every 5 files**:

```
[MILESTONE] Batch validation checkpoint
[INFO] Files processed: [X]/35 ([Y]% complete)
[INFO] All recent files validated: ✅
[INFO] Next batch: [next-5-filenames]
```

### Final Completion Report

**After all 35 files**:

```
[SUCCESS] All 35 files extracted successfully

[VALIDATE] Running final validation...
✅ 35/35 files valid
⚠️  [N] warnings:
  - [filename].json: [warning message]
  - [filename].json: [warning message]

[STATS] Extraction summary:
  - Total files: 35
  - Errors: 0
  - Warnings: [N]
  - Pattern 1 (Performance Gallery): [X] files
  - Pattern 2 (Landing Page): [Y] files
  - Pattern 3 (News/Updates): [Z] files
  - Pattern 4 (Workshop): [W] files
  - Pattern 5 (About/Info): [V] files

[COMPLETE] Extraction batch finished
[NEXT STEP] Ready for markdown conversion with markdown_converter.py
```

### Logging Conventions

Use consistent prefixes for clarity:

- `[INFO]` - General information, progress updates
- `[EXTRACT]` - Extraction actions (reading HTML, creating JSON)
- `[VALIDATE]` - Validation operations and results
- `[COMPLETE]` - Successfully completed file
- `[ERROR]` - Validation or extraction errors
- `[DEBUG]` - Debugging information during fixes
- `[FIX]` - Fixing validation errors
- `[MILESTONE]` - Batch checkpoints
- `[SUCCESS]` - Final completion
- `[STATS]` - Summary statistics
- `[NEXT STEP]` - What to do next

**Note**: Avoid emojis in logs except for validation results (✅, ❌, ⚠️) to maintain professional output.

## Markdown Formatting Requirements

**CRITICAL**: To ensure clean, lint-compliant output:

- Add blank line before and after each heading
- Add blank line before and after each list (bullet or numbered)
- Add blank line before and after each code block
- Remove trailing spaces from all lines
- Avoid inline HTML unless necessary for tables
- Use emojis conservatively: avoid in commit messages, code comments, console logs, and formal documentation. Use clear text prefixes instead (e.g., [INFO], [EXTRACT], [VALIDATE], [COMPLETE], [ERROR])

Before presenting final output:

- Review document for proper spacing around all lists
- Verify all headings have blank lines before and after
- Check that all code blocks have blank lines before and after
- Remove any trailing whitespace
- Ensure consistent markdown syntax throughout

**RECURSIVE REQUIREMENT**: If this prompt generates output that itself creates markdown content (such as documentation generators, report templates, or other prompts), those outputs MUST also include these same markdown formatting requirements to ensure linting standards propagate through all levels of generation.

## Constitutional Compliance

**This task does NOT involve code generation or architecture**, so constitutional principles from `.specify/memory/constitution.md` do not apply. However, the extraction process should follow these quality standards:

- **Accuracy**: Extract only what's in HTML source - no invented content
- **Completeness**: Capture all media items (images, videos, logos)
- **Consistency**: Use same structure for all files (canonical schema)
- **Validation**: Verify every file against Pydantic models before proceeding

## Error Handling and Recovery

Use the following decision trees to handle errors systematically.

### Error Type 1: HTML Parsing Failures

**Scenario**: Cannot parse HTML file (malformed HTML, missing file, etc.)

**Detection**: Exception when reading or parsing HTML

**Response workflow**:

```
Step 1: Log error
  [ERROR] Cannot parse [filename]: [error message]

Step 2: Document issue
  - Note filename in error log
  - Copy error message for debugging

Step 3: Decision tree
  IF file is corrupted → Mark as skipped, note in final report
  IF file is missing → Check path spelling, retry once
  IF still fails → Skip and continue

Step 4: Continue execution
  - Move to next file in alphabetical order
  - Do NOT halt entire extraction process

Step 5: Final report
  - List skipped files with reasons
  - Provide filenames for manual review
```

### Error Type 2: Validation Failures

**Scenario**: JSON fails Pydantic validation

**Detection**: `ValidationError` when running `python scripts/extraction_models.py`

**Response workflow**:

```
Step 1: Capture error details
  [ERROR] Validation failed for [filename]
  [DEBUG] Error: [full Pydantic error message]

Step 2: Parse error message
  - Identify field causing failure
  - Identify expected type/format
  - Identify actual value provided

Step 3: Fix decision tree
  IF missing required field:
    → Re-read HTML for that specific element
    → Add field with correct value
    → Re-validate

  IF incorrect type:
    → Check if value should be string vs array vs object
    → Correct type conversion
    → Re-validate

  IF invalid format (e.g., malformed URL):
    → Extract correct format from HTML
    → Update JSON field
    → Re-validate

  IF field cannot be extracted from HTML:
    → Use fallback value (see Case 6 in Special Cases)
    → Document in comments (if adding notes)
    → Re-validate

Step 4: Re-validation loop
  LOOP: Re-run validation until successful
  - Maximum 3 attempts
  - If still failing after 3 attempts → Log for manual review, skip file
  - Do NOT proceed to next file until valid OR max attempts reached

Step 5: Document resolution
  [FIX] Corrected [field_name] in [filename]
  [VALIDATE] Re-validation successful: ✅
```

### Error Type 3: Cannot Determine Metadata

**Scenario**: HTML lacks clear title, description, or other metadata

**Detection**: During Phase 2 extraction, cannot infer required fields

**Fallback decision tree**:

```
IF cannot determine TITLE:
  → Use directory name
  → Replace hyphens with spaces
  → Apply title case
  → Example: "the-great-unknown" → "The Great Unknown"

IF cannot determine DESCRIPTION:
  → Use generic: "Zuga content page"
  → Add language qualifier if known:
    - English: "Zuga content page"
    - Estonian: "Zuga sisuleht"

IF cannot determine PAGE_TYPE:
  → Use "gallery" (most generic)
  → OR infer from directory:
    - "workshopid/" → "workshop"
    - "etendused-" → "performance"
    - "galerii" → "gallery"

IF cannot determine BILINGUAL_LINK:
  → Check Bilingual Link Mapping table
  → IF not in table → Omit field entirely
  → Validation will warn (acceptable for unpaired pages)

IF cannot determine SLUG:
  → Concatenate language + directory + filename
  → Remove file extensions
  → Replace slashes with hyphens
  → Example: "english/shame/index.html" → "english-shame"
```

### Error Type 4: Media Extraction Issues

**Scenario**: Cannot extract expected media (images, videos)

**Response workflow**:

```
IF no hero background found:
  → Omit hero section from content_sections
  → Omit hero media item
  → Continue with other sections

IF no gallery images found:
  → Create image_gallery section with empty description
  → Add placeholder text: "No gallery images available"
  → OR omit image_gallery section entirely

IF no YouTube video found:
  → Omit video section from content_sections
  → Omit youtube media item
  → Performance galleries without videos are acceptable

IF gallery has fewer than expected images:
  → Extract whatever images are present
  → Do NOT invent or duplicate images
  → Valid files can have 0-10+ images
```

### Error Type 5: Self-Execution Interruption

**Scenario**: Workflow stops before all files processed

**Recovery steps**:

```
Step 1: Check current progress
  ls packages/content/source_zuga_ee/extracted_v2/ | wc -l

Step 2: Identify next file
  - List all beautified/ HTML files alphabetically
  - Find first file NOT yet in extracted_v2/
  - That is the next file to process

Step 3: Resume from that file
  - Do NOT restart from beginning
  - Continue workflow from Phase 1 with that file

Step 4: Verify continuity
  - Ensure no files were skipped
  - Check that alphabetical order is maintained
```

### Critical Error Handling Rules

**Rule 1**: Validation failure is a BLOCKING error
- Do NOT proceed to next file until current file validates OR is marked for manual review

**Rule 2**: HTML parsing failure is a NON-BLOCKING error
- Log and skip, continue with next file

**Rule 3**: Missing metadata uses fallbacks
- Do NOT block extraction for metadata that can be inferred or defaulted

**Rule 4**: Media extraction failures are acceptable
- Valid JSON can have fewer media items than expected
- Do NOT block on missing optional elements (video, extra images)

**Rule 5**: Maximum 3 validation attempts per file
- After 3 failed attempts, log for manual review and skip
- Prevents infinite loops on problematic files

## Best Practices and Optimization Tips

Follow these guidelines to ensure efficient and accurate extraction.

### Tip 1: Pre-Extraction Preparation

**Before starting first file**:

- ✅ Read `docs/DATA_MODEL.md` completely
- ✅ Review `scripts/extraction_models.py` for Pydantic models
- ✅ Verify Python environment active
- ✅ Confirm validation command works
- ✅ Check extracted_v2/ directory exists and is writable

**Why**: Prevents mid-extraction issues and ensures you understand the schema

### Tip 2: Pattern Recognition for Speed

**After processing 3-5 files**:

- Most files follow Pattern 1 (Performance Gallery)
- Structure becomes predictable:
  - Hero background (1)
  - Logo (1-2)
  - Gallery images (4-7)
  - YouTube video (1)
- Use template from previous file, adjust URLs and metadata
- Validation catches any structural errors

**Why**: Reduces extraction time from 3 minutes to 1-2 minutes per file

### Tip 3: Validate Immediately, Not in Batches

**After each file creation**:

```bash
python scripts/extraction_models.py
```

**Before proceeding to next file**

**Why**:
- Catches errors while HTML context is fresh
- Prevents accumulating multiple broken files
- Makes debugging easier (know exactly which file caused error)
- Maintains 100% success rate throughout extraction

### Tip 4: Progress Tracking for Visibility

**After each file**:

- Calculate: [current] / 35 * 100 = X%
- Report: "[INFO] Progress: [X]/35 files extracted ([Y]% complete)"
- Update: Note next filename

**Why**: Provides clear visibility into completion status, prevents getting lost

### Tip 5: Use Bilingual Mapping Table Efficiently

**When extracting a known bilingual pair**:

- Extract English version first
- Note its slug
- When extracting Estonian version:
  - Add `"bilingual_link": "[english-slug]"`
  - Return to English JSON
  - Add `"bilingual_link": "[estonian-slug]"`
  - Re-validate both files

**Why**: Ensures bidirectional links are complete, prevents orphaned references

### Tip 6: Handle Index Files Carefully

**Files named `index.html` in subdirectories**:

- DO: Use section name as slug (`etendused-suurtele`)
- DON'T: Append `-index` to slug (`etendused-suurtele-index`)
- Page type: Usually `"landing"` not `"performance"`

**Why**: Prevents slug duplication, matches expected URL structure

### Tip 7: Trust Shared Assets

**Hero backgrounds and logos**:

- Same URL appearing in multiple files is CORRECT
- Do NOT try to "fix" duplicates
- Site design intentionally reuses assets

**Why**: Prevents wasting time second-guessing valid data

### Tip 8: YouTube Embed Config Extraction

**For YouTube URLs with `embed_config` parameter**:

1. Copy full URL
2. URL-decode the `embed_config` value
3. Parse as JSON
4. Extract the `"enc"` field value
5. Store in media item's `embed_config` field

**Use online URL decoder if needed**: `decodeURIComponent()` in browser console

**Why**: Preserves exact YouTube embed configuration needed for video playback

### Tip 9: Self-Execution Discipline

**CRITICAL RULES**:

- Do NOT ask "Should I continue?" after each file
- Do NOT wait for user confirmation
- Automatically proceed to next file after successful validation
- ONLY stop when:
  - All 35 files extracted
  - OR maximum attempts reached for problematic file
  - OR explicit user instruction to stop

**Why**: Self-executing workflow is the core feature, manual intervention defeats the purpose

### Tip 10: Final Validation is Mandatory

**After extracting all files**:

```bash
python scripts/extraction_models.py
```

**Expected**: 35/35 valid, 0 errors, 3-5 warnings

**Why**: Ensures entire dataset is valid before markdown conversion stage

### Optimization Checklist

Before starting extraction, confirm:

- [ ] Python environment configured
- [ ] Validation command tested and working
- [ ] DATA_MODEL.md read and understood
- [ ] Bilingual Link Mapping table reviewed
- [ ] Current progress known (how many files already extracted)
- [ ] Next file identified (alphabetical order)

After completing extraction, verify:

- [ ] All 35 files extracted
- [ ] Final validation run: 0 errors
- [ ] Bilingual links bidirectional
- [ ] Progress reported: 100%
- [ ] Ready for markdown conversion

## Related Documentation

- **Canonical Schema**: `docs/DATA_MODEL.md` - Complete specification
- **Pydantic Models**: `scripts/extraction_models.py` - Executable schema
- **Source HTML**: `packages/content/source_zuga_ee/beautified/` - Input files
- **Output Directory**: `packages/content/source_zuga_ee/extracted_v2/` - Canonical JSON files

---

**For AI Assistants**: This is a self-executing workflow prompt. After each successful extraction and validation, automatically proceed to the next file. Do NOT wait for user input between files. Continue until all files are extracted. Report progress after each file and final summary when complete.
