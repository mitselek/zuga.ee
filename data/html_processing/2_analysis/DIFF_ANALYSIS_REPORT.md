# HTML Preprocessing Analysis Report

## Date: December 7, 2025

## Analysis Method

### Phase 1: Diff Analysis of 12 Random Pairs

- Selected 24 random files from originals
- Compared 12 pairs using `diff` command
- Goal: Find lines that are EXACTLY identical across different pages

### Phase 2: HTML Structure Analysis

- Analyzed 10 random files using BeautifulSoup
- Parsed HTML structure to count elements
- Identified Google Sites framework components

## Findings

### Diff Analysis Results

**Key Discovery**: Files have almost NO identical lines.

- 12 pairs analyzed
- Each pair showed only **2 identical lines**:
  - `<!DOCTYPE html>` (file start)
  - `\ No newline at end of file` (file end marker)

**Why so few matches?**

- Files are heavily minified (31 lines for 90KB)
- Each file has unique:
  - Security nonces (e.g., `nonce="h7FefL277wEKqtDSkKIbhg"`)
  - Session IDs
  - Timestamps
  - Experiment IDs
  - Page-specific content
  - Image URLs

### HTML Structure Analysis

**Consistent structure across ALL 10 samples:**

| Element Type     | Count per File | Purpose                                        |
| ---------------- | -------------- | ---------------------------------------------- |
| `<script>` tags  | 13             | Google tracking, Sites framework, analytics    |
| `<style>` tags   | 2              | Inline CSS for Google Sites theme              |
| `<link>` tags    | 4              | External Google resources (fonts, stylesheets) |
| `<meta>` tags    | 15             | SEO, OpenGraph, Google Sites metadata          |
| `<section>` tags | 7 (avg)        | **ACTUAL PAGE CONTENT**                        |

**Universal markers:**

- `apis.google.com` - Present in 10/10 files
- `gstatic.com` - Present in 10/10 files
- `atari` framework - Present in 10/10 files

## What Can Be Safely Removed?

### Remove by TAG TYPE (not by exact match)

Since each file has unique content in boilerplate (nonces, IDs, timestamps), we CANNOT use string matching. Instead, remove entire categories:

#### 1. All `<script>` Tags (13 per file)

**Contains:**

- Google Analytics tracking
- Google Sites "atari" framework JavaScript
- Session/experiment configuration
- User tracking and logging

**Why safe to remove:**

- Pure presentation/tracking code
- Not needed for content extraction
- Contains no page-specific content

#### 2. All `<style>` Tags in `<head>` (2 per file)

**Contains:**

- Google Sites theme CSS
- Dynamic color/font styling

**Why safe to remove:**

- Presentation only
- Not needed for content extraction

#### 3. All `<link>` Tags (4 per file)

**Contains:**

- External Google Fonts
- Google Sites stylesheets from `gstatic.com`

**Why safe to remove:**

- External resources
- Presentation only

#### 4. Most `<meta>` Tags (keep only 2-3 of 15)

**Remove:**

- OpenGraph meta tags (og:\*)
- Google Sites specific metadata
- Viewport settings
- Tracking configuration

**Keep:**

- `<meta charset="utf-8">` - Essential for text encoding
- `<meta name="description">` - Might contain content summary
- Maybe `<title>` - Contains page title

## Preservation Strategy

### KEEP These Elements:

1. **`<section>` tags and ALL children**

   - This is where actual page content lives
   - Contains text, images, videos, links
   - Structure: ~7 sections per page with unique content

2. **Basic HTML structure**

   ```html
   <!DOCTYPE html>
   <html lang="et">
     <head>
       <meta charset="utf-8" />
       <title>Page Title</title>
     </head>
     <body>
       <!-- ALL SECTION CONTENT HERE -->
     </body>
   </html>
   ```

## Expected Results

### File Size Reduction:

- **Before**: ~90 KB per file (heavily minified)
- **After**: ~5-20 KB per file (depending on content)
- **Reduction**: ~80-90%

### Content Preservation:

- 100% of actual page content preserved
- 0% of Google tracking/framework code preserved
- Clean HTML suitable for content extraction

## Why Previous Attempt Failed

The previous cleaning script had a critical bug:

- It extracted sections from a SINGLE file
- Then replicated those same sections to ALL 69 output files
- Result: All 69 files became identical (homepage content)

## Correct Approach

For each input file:

1. Parse HTML with BeautifulSoup
2. Extract ALL `<section>` tags from THAT file
3. Build new minimal HTML with THAT file's sections
4. Save to corresponding output file

Key: Process each file INDEPENDENTLY, don't share data between files.

## Technical Notes

### Why String Matching Fails:

```html
<!-- File 1 has: -->
<script>
  window['ppConfig'] = {...}
</script>

<!-- File 2 has: -->
<script>
  window['ppConfig'] = {...}
</script>
```

Same purpose, different nonce → Not identical as strings.

### Why Tag-Based Removal Works:

```python
# Remove ALL scripts regardless of content
for script in soup.find_all('script'):
    script.decompose()
```

## Recommended Cleaning Algorithm

```python
from bs4 import BeautifulSoup

def clean_google_sites_html(input_html):
    soup = BeautifulSoup(input_html, 'html.parser')

    # Extract content sections
    sections = soup.find_all('section')

    # Build clean HTML
    new_soup = BeautifulSoup('''<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="utf-8">
  <title>Zuga</title>
</head>
<body>
</body>
</html>''', 'html.parser')

    # Add all sections to body
    body = new_soup.find('body')
    for section in sections:
        body.append(section)

    return str(new_soup.prettify())
```

## Summary

**What diff analysis revealed:**

- Files are 99.99% unique (only DOCTYPE identical)
- Cannot use string matching for boilerplate removal
- Must use structural/tag-based approach

**What structure analysis revealed:**

- Every file has exactly the same TAG structure
- 13 scripts + 2 styles + 4 links + 15 metas + ~7 sections
- Content is in sections, boilerplate is in tags

**Correct strategy:**

- Remove by tag type, not by string content
- Process each file independently
- Extract only `<section>` tags (content)
- Build minimal HTML wrapper

**Expected outcome:**

- 80-90% size reduction
- 100% content preservation
- Clean files ready for extraction
