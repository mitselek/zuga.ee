---
description: Create or update structured markdown content for Zuga homepage from unstructured input
---

# Content Creator and Updater for Zuga Homepage

User input:

$ARGUMENTS

## Task

Given user input (text, articles, URLs, pictures, video links) in Estonian or English, create new markdown content files OR update existing files in `apps/web/src/content/pages/` that validate against the Zod schema defined in `apps/web/src/content/config.ts`.

### Determining Create vs Update

**Before starting**, check if this is a create or update operation:

1. **Look for existing file indicators**:
   - User mentions updating/editing/modifying existing content
   - User references a specific page name or slug that exists
   - User says "change", "fix", "update", "edit", "modify", "add to existing"

2. **Search for existing files**:
   - List files in `apps/web/src/content/pages/{detected-language}/`
   - Check for filename matches based on content topic
   - Look for similar titles or slugs

3. **Decide operation mode**:
   - **UPDATE MODE**: If file exists and user intent is modification → Follow "Update Workflow"
   - **CREATE MODE**: If no file exists or user clearly wants new content → Follow "Create Workflow"
   - **ASK USER**: If ambiguous, ask "I found existing page '{title}'. Do you want to update it or create a new page?"

## Schema Reference

Before proceeding, read and understand the content schema:

```typescript
// apps/web/src/content/config.ts - Key requirements:

// Hierarchy levels
type: 'home' | 'section' | 'detail'

// Categories
category: 'etendused' | 'workshopid' | 'about' | 'gallery' | 'contact' | 'news'

// Required fields
title: string (min 1 char)
slug: string (lowercase, alphanumeric, hyphens only)
language: 'en' | 'et'
status: 'published' | 'draft'

// Optional but recommended
description: string
subcategory: string (for grouping within category)
order: number (for manual ordering)
hero_image: string (path like /images/filename.jpg)
background_color: string (CSS color value)
```

## CREATE Workflow

Use this workflow when creating NEW content files.

### Phase 1: Detect Language & Extract Information

1. **Detect input language**:
   - Estonian: Look for õ, ä, ö, ü, typical Estonian words (ja, on, et, ning)
   - English: Default if no Estonian markers found
   - Set `language: 'et'` or `language: 'en'`

2. **Parse input format**:
   - Plain text: Extract title (first sentence/heading), description, body
   - Article/URL: Fetch content, extract metadata (title, description, images)
   - Media links:
     - YouTube: Extract video ID from URL (youtube.com/watch?v=ID or youtu.be/ID)
     - Vimeo: Extract video ID from vimeo.com/ID
     - Images: Note for hero_image field (suggest /images/ path)

3. **Determine content type**:
   - Ask user: "Is this a section page (category landing) or detail page (individual item)?"
   - Guide decision:
     - **Section**: Etendused overview, Workshopid overview, Meist (About) section
     - **Detail**: Individual performance, specific workshop, team member, award page
   - Set `type: 'section'` or `type: 'detail'` (never 'home' unless explicitly homepage)

4. **Choose category**:
   - Ask: "Which category does this belong to?"
   - Options: `etendused`, `workshopid`, `about`, `gallery`, `contact`, `news`
   - Suggest based on content keywords:
     - Performance/show/etendus → etendused
     - Workshop/töötuba → workshopid
     - Team/meist/awards → about
     - Photos/gallery/galerii → gallery

5. **Optional subcategory**:
   - If category is `etendused`, ask: "Is this for 'suurtele' (adults) or 'noorele-publikule' (young audiences)?"
   - Set `subcategory: 'suurtele'` or `subcategory: 'noorele-publikule'` if applicable

### Phase 2: Generate Slug & Validate

1. **Create slug**:
   - Take title, lowercase, replace spaces with hyphens
   - Remove special characters (keep only a-z, 0-9, hyphens)
   - Estonian characters: õ→o, ä→a, ö→o, ü→u, š→s, ž→z
   - Example: "Zuga töötuba" → "zuga-tootuba"
   - For detail pages: `{category}-{subcategory}-{slug}` (e.g., "etendused-suurtele-habi")

2. **Check uniqueness**:
   - List existing files in `apps/web/src/content/pages/{language}/`
   - If slug exists, suggest alternative: `{slug}-2`, `{slug}-uus`, etc.

3. **Validate required fields checklist**:
   ```markdown
   ✓ title: [Value]
   ✓ slug: [Value] (lowercase, alphanumeric, hyphens only)
   ✓ language: [et/en]
   ✓ type: [section/detail]
   ✓ category: [etendused/workshopid/about/gallery/contact/news]
   ✓ status: [published/draft]
   ○ description: [Value or "Not provided - recommend adding"]
   ○ hero_image: [Path or "Not provided"]
   ```

### Phase 3: Build Frontmatter

1. **Construct frontmatter** following this template:

   **For section pages**:
   ```yaml
   ---
   title: [Title in original language]
   slug: [generated-slug]
   language: [et/en]
   description: [One-sentence description]
   type: section
   category: [category-name]
   order: [number for ordering, suggest based on existing sections]
   status: published
   page_type: landing
   hero_image: [/images/filename.jpg if provided]
   background_color: [CSS color if suggested]
   ---
   ```

   **For detail pages**:
   ```yaml
   ---
   title: [Title in original language]
   slug: [generated-slug]
   language: [et/en]
   description: [One-sentence description]
   type: detail
   category: [category-name]
   subcategory: [subcategory if applicable]
   status: published
   original_url: [source URL if provided]
   page_type: [gallery/about/performance/workshop]
   hero_image: [/images/filename.jpg if provided]
   gallery:
   - url: [image URL]
     width: [width in pixels]
     description: [image description]
   videos:
   - platform: [youtube/vimeo]
     video_id: [extracted ID]
     title: [video title]
     url: [embed URL]
   ---
   ```

2. **Add media fields**:
   - If YouTube link found: Add to `videos` array with `platform: youtube`
   - If Vimeo link found: Add to `videos` array with `platform: vimeo`
   - If images mentioned: Add to `gallery` array or set as `hero_image`

3. **Suggest enhancements**:
   - No hero_image? "Recommend adding hero image at `/images/{slug}-bg.jpg`"
   - No description? "Recommend adding one-sentence description for SEO"
   - No order field for section? "Suggest order: [number] based on existing sections"

### Phase 4: Create Markdown File

1. **Determine file path**:
   - Pattern: `apps/web/src/content/pages/{language}/{filename}.md`
   - Filename for sections: `{category}.md` (e.g., `etendused.md`)
   - Filename for details: `{category}-{subcategory}-{slug}.md` (e.g., `etendused-suurtele-habi.md`)

2. **Write file** with structure:
   ```markdown
   ---
   [frontmatter from Phase 3]
   ---

   # [Title]

   [Body content from user input, formatted as markdown]

   ## [Section headings if applicable]

   [Additional content organized by sections]
   ```

3. **Markdown Formatting Requirements** (CRITICAL):

   To ensure clean, lint-compliant output:

   - Add blank line before and after each heading
   - Add blank line before and after each list (bullet or numbered)
   - Add blank line before and after each code block
   - Remove trailing spaces from all lines
   - Avoid inline HTML unless necessary for tables

   Before presenting final output:

   - Review document for proper spacing around all lists
   - Verify all headings have blank lines before and after
   - Check that all code blocks have blank lines before and after
   - Remove any trailing whitespace
   - Ensure consistent markdown syntax throughout

   **RECURSIVE REQUIREMENT**: If this prompt generates output that itself creates markdown content (such as documentation generators, report templates, or other prompts), those outputs MUST also include these same markdown formatting requirements to ensure linting standards propagate through all levels of generation.

4. **Validate file**:
   - Re-read created file
   - Check frontmatter YAML syntax (valid YAML, all quotes closed)
   - Verify all enum values match schema exactly
   - Confirm required fields present
   - Check slug format (lowercase, hyphens only)

### Phase 5: Translation & Linking

1. **Prompt for translation**:
   - If input was Estonian: "Content created in Estonian. Would you like to create English translation?"
   - If input was English: "Content created in English. Would you like to create Estonian translation?"

2. **If user wants translation**:
   - Create second file in opposite language folder
   - Translate title, description, body content
   - Keep same slug (or adjust for language conventions)
   - Link files via `translated` field:
     ```yaml
     translated:
     - language: en
       slug: english-slug
     ```

3. **Link existing content**:
   - If translation already exists, add `translated` field to both files
   - Ensure bidirectional linking (ET file points to EN, EN file points to ET)

### Phase 6: Summary & Next Steps

1. **Report completion**:
   ```markdown
   ✅ Content created successfully!

   **File**: `apps/web/src/content/pages/{language}/{filename}.md`
   **Type**: {section/detail}
   **Category**: {category}
   **Status**: {published/draft}
   **Language**: {et/en}

   **Frontmatter validation**: ✓ All required fields present
   **Schema compliance**: ✓ All values match config.ts enums
   ```

2. **Suggest next steps**:
   - "Add hero image to `/apps/web/public/images/{slug}-bg.jpg`"
   - "Create translation in {opposite language}"
   - "Preview at: http://localhost:4321/{language}/{category}/{slug}"
   - "Run `npm run build` to validate Astro build"

3. **List any warnings**:
   - Missing optional fields (description, hero_image, order)
   - Untranslated content
   - Media links that need manual verification

## Examples

### Example 1: Estonian Performance Description

**Input**:
```
Zuga uus etendus "Häbi" - intensiivne ja liigutav lugu täiskasvanutele.
Lavastaja Mari Mätas uurib häbi ja väärtusetuse teemasid läbi füüsilise teatri.
YouTube: https://youtube.com/watch?v=abc123xyz
Pildid: habi-promo.jpg, habi-rehearsal.jpg
```

**Generated file**: `apps/web/src/content/pages/et/etendused-suurtele-habi.md`

```yaml
---
title: Häbi
slug: etendused-suurtele-habi
language: et
description: Intensiivne ja liigutav lugu täiskasvanutele häbi ja väärtusetuse teemal
type: detail
category: etendused
subcategory: suurtele
status: published
page_type: performance
hero_image: /images/etendused-suurtele-habi-bg.jpg
videos:
- platform: youtube
  video_id: abc123xyz
  title: Zuga etendus "Häbi"
  url: https://www.youtube.com/embed/abc123xyz
gallery:
- url: /images/habi-promo.jpg
  description: Etenduse reklaamfoto
- url: /images/habi-rehearsal.jpg
  description: Proovifoto
---

# Häbi

Zuga uus etendus "Häbi" on intensiivne ja liigutav lugu täiskasvanutele.

Lavastaja Mari Mätas uurib häbi ja väärtusetuse teemasid läbi füüsilise teatri.

## Video

Vaata etenduse treileri videot.

## Galerii

Fotod etendusest ja proovidest.
```

### Example 2: English Workshop Description

**Input**:
```
New workshop: Movement Games for Families
Interactive workshop where families explore movement together through playful exercises.
Suitable for ages 6-12 with parents. Duration: 90 minutes.
Contact: workshops@zuga.ee
```

**Generated file**: `apps/web/src/content/pages/en/workshopid-movement-games-families.md`

```yaml
---
title: Movement Games for Families
slug: workshopid-movement-games-families
language: en
description: Interactive workshop where families explore movement together through playful exercises
type: detail
category: workshopid
status: published
page_type: workshop
hero_image: /images/workshopid-movement-games-families-bg.jpg
---

# Movement Games for Families

Interactive workshop where families explore movement together through playful exercises.

## Details

- **Target audience**: Ages 6-12 with parents
- **Duration**: 90 minutes
- **Contact**: workshops@zuga.ee

## Description

Families will discover new ways to move and play together in this engaging workshop designed for both children and adults.
```

## Usage Instructions

1. **Invoke the prompt** with content input:
   ```
   @workspace /add-content [paste your content here]
   ```

2. **Provide information** when prompted:
   - Answer questions about type (section vs detail)
   - Choose category from the list
   - Confirm or adjust suggested slug
   - Provide translation if requested

3. **Review generated file**:
   - Check frontmatter values
   - Verify markdown formatting
   - Add hero image to `/apps/web/public/images/` if needed
   - Test build with `npm run build`

4. **Create translation** (optional but recommended):
   - Run prompt again with translated content
   - Or let prompt guide translation workflow

## Tips for Best Results

- **Be specific about content type**: "This is a workshop for families" vs "workshop content" helps determine category/subcategory
- **Include media URLs**: Paste full YouTube/Vimeo links, image filenames - prompt will extract IDs and structure correctly
- **Provide context**: Mention target audience, duration, contact info - helps create complete frontmatter
- **Use native language**: Write in Estonian or English naturally - prompt handles language detection
- **Review before committing**: Check that hero_image paths match actual files in `/public/images/`
- **Run build validation**: `npm run build` after creating content to catch schema violations early

---

**Schema validation checkpoint**: Before finalizing, verify:

- ✓ All enum values exactly match config.ts (no typos in type/category/language/status)
- ✓ Required fields present (title, slug, language, type, category, status)
- ✓ Slug format correct (lowercase, hyphens, no special characters)
- ✓ Media URLs properly structured (videos array, gallery array)
- ✓ Bilingual linking if translation exists (translated field)

---

## UPDATE Workflow

Use this workflow when modifying EXISTING content files.

### Phase 1: Locate and Read Existing File

1. **Find the target file**:
   - Search `apps/web/src/content/pages/{language}/` for matching filename
   - If user provided slug or title, search for exact or similar matches
   - Example: User says "update Häbi performance" → Find `etendused-suurtele-habi.md`

2. **Read current file completely**:
   - Load full file contents including frontmatter and body
   - Parse YAML frontmatter to understand current field values
   - Note markdown body structure (headings, sections, lists)

3. **Display current content summary**:
   ```markdown
   📄 Found existing file: `{filename}`

   **Current frontmatter**:
   - Title: {current title}
   - Type: {current type}
   - Category: {current category}
   - Status: {current status}
   - Hero image: {current hero_image or "None"}
   - Description: {current description}
   [... other relevant fields]

   **Current body structure**:
   - {Number} of sections
   - {Heading names if any}
   - {Media count: videos, gallery items}
   ```

### Phase 2: Identify Changes

1. **Parse user's update request**:
   - What fields need to change? (title, description, status, etc.)
   - What content needs to be added/removed from body?
   - What media needs to be added/updated? (videos, gallery images)
   - Should any frontmatter fields be added? (hero_image, order, background_color)

2. **List proposed changes explicitly**:
   ```markdown
   📝 Proposed changes:

   **Frontmatter updates**:
   - description: "{old}" → "{new}"
   - hero_image: Add "/images/{slug}-new-bg.jpg"
   - status: "draft" → "published"

   **Body content updates**:
   - Add new section: "## Performance History"
   - Update "## Video" section with new YouTube link
   - Add 3 new gallery images

   **No changes to**:
   - title, slug, language, type, category (preserved)
   ```

3. **Ask for confirmation**:
   - "These are the changes I'll make. Proceed? (yes/no/modify)"
   - If user says "modify", ask what to adjust
   - If user says "no", stop and clarify requirements

### Phase 3: Apply Updates Carefully

1. **Update frontmatter fields**:
   - Preserve all existing fields unless explicitly changing them
   - Add new optional fields if user provided them
   - Maintain YAML formatting and field order
   - Keep existing `translated` links unless updating both files

2. **Update body content**:
   - **If adding sections**: Insert new markdown sections at appropriate location (end, or before/after specified section)
   - **If updating sections**: Replace specific section content while preserving structure
   - **If removing sections**: Delete specified sections cleanly
   - **If replacing entire body**: Confirm with user first ("Replace entire body content? This will delete current content.")

3. **Update media fields**:
   - **Videos**: Append to existing `videos` array or replace specific video
   - **Gallery**: Append new images to `gallery` array or replace entire gallery
   - **Hero image**: Update `hero_image` field, note if file needs to be added to `/public/images/`

4. **Preserve markdown formatting**:
   - Maintain consistent blank lines around headings, lists, code blocks
   - Keep existing heading level hierarchy
   - Preserve indentation and list formatting
   - Follow same markdown linting requirements as create workflow

### Phase 4: Write Updated File

1. **Construct updated file**:
   ```markdown
   ---
   [Updated frontmatter with preserved + changed fields]
   ---

   # [Title - preserved unless changed]

   [Updated body content with changes applied]
   ```

2. **Validate updated file**:
   - Re-check frontmatter YAML syntax
   - Verify all enum values still valid
   - Confirm required fields still present
   - Check markdown formatting (blank lines, no trailing spaces)
   - Ensure slug hasn't changed (unless explicitly requested)

3. **Write updated file**:
   - Overwrite existing file at same path
   - Preserve file permissions

### Phase 5: Update Linked Translation (if applicable)

1. **Check for translation**:
   - If frontmatter has `translated` field, translation exists
   - Example: ET file has `translated: [{language: en, slug: english-slug}]`

2. **Ask about translation update**:
   - "This page has an {opposite language} translation. Should I update it too?"
   - If yes: Read translation file, apply equivalent changes
   - If no: Proceed to summary

3. **Apply changes to translation**:
   - Translate updated title/description if changed
   - Apply equivalent body content changes (translate new sections)
   - Update media with same URLs (descriptions can be translated)
   - Preserve translation's `translated` field pointing back to original

### Phase 6: Summary & Validation

1. **Report update completion**:
   ```markdown
   ✅ File updated successfully!

   **File**: `apps/web/src/content/pages/{language}/{filename}.md`
   **Operation**: UPDATE
   **Changes applied**:
   - Frontmatter: {list changed fields}
   - Body: {describe content changes}
   - Media: {list media changes}

   **Translation**: {Updated / Not updated / No translation exists}

   **Validation**: ✓ All fields valid, ✓ Markdown formatted correctly
   ```

2. **Suggest next steps**:
   - "Preview updated page at: http://localhost:4321/{language}/{category}/{slug}"
   - "Run `npm run build` to validate changes"
   - If hero_image added: "Add image file to `/apps/web/public/images/{filename}`"
   - If translation not updated: "Consider updating {language} translation for consistency"

3. **Show diff summary** (optional but helpful):
   ```markdown
   **Changed lines**:
   - description: "Old description" → "New description"
   + hero_image: /images/new-bg.jpg
   ~ Body: Added section "Performance History" (15 lines)
   ~ Gallery: Added 3 images
   ```

---

## Decision Tree: Create vs Update

```
User provides content
    ↓
Parse user intent
    ↓
"update", "change", "modify", "edit", "fix"?
    ↓ YES
Search for existing file
    ↓
File found?
    ↓ YES → UPDATE WORKFLOW
    ↓ NO → Ask: "No existing file found. Create new instead?"
        ↓ YES → CREATE WORKFLOW
        ↓ NO → Clarify requirements
    ↓
"create", "new", "add" or ambiguous?
    ↓
Search for similar files
    ↓
Similar file exists?
    ↓ YES → Ask: "Found similar page '{title}'. Update or create new?"
        → Update → UPDATE WORKFLOW
        → Create new → CREATE WORKFLOW
    ↓ NO → CREATE WORKFLOW
```

---

## Best Practices for Updates

1. **Always read entire file first**: Never assume field values, always check current state
2. **Preserve existing structure**: Don't reorganize unless explicitly asked
3. **Be conservative with deletions**: Confirm before removing sections/media
4. **Maintain field order**: Keep frontmatter fields in same order as original
5. **Check for dependencies**: If updating slug, check for internal links that might break
6. **Validate after update**: Re-read file to ensure changes applied correctly
7. **Consider translation impact**: Alert user if changes should propagate to translation
8. **Show before/after**: Help user understand what changed

---

## Examples - Update Scenarios

### Example 1: Update Status and Add Hero Image

**User input**:
```
Update the Häbi performance page - set status to published and add hero image habi-hero.jpg
```

**Process**:
1. Find: `apps/web/src/content/pages/et/etendused-suurtele-habi.md`
2. Read current frontmatter, note `status: draft`, no hero_image
3. Propose changes:
   - status: "draft" → "published"
   - hero_image: Add "/images/habi-hero.jpg"
4. Update frontmatter, preserve all other fields
5. Write updated file
6. Report: "✅ Updated status to published and added hero image"

### Example 2: Add New Section to Body

**User input**:
```
Add a "Cast" section to the Häbi page with the following:
- Director: Mari Mätas
- Performers: Ann Reimann, Tiina Tauraite
```

**Process**:
1. Find and read existing file
2. Identify body structure (existing sections: Video, Gallery)
3. Propose: Add new "## Cast" section before Gallery
4. Insert section:
   ```markdown
   ## Cast

   - **Director**: Mari Mätas
   - **Performers**: Ann Reimann, Tiina Tauraite
   ```
5. Write updated file with new section
6. Report: "✅ Added Cast section with 2 entries"

### Example 3: Update Video Link

**User input**:
```
Change the YouTube video for Häbi to the new trailer: https://youtube.com/watch?v=newtrailer123
```

**Process**:
1. Find and read file
2. Check `videos` array in frontmatter
3. Propose: Replace video_id "abc123xyz" → "newtrailer123"
4. Update frontmatter:
   ```yaml
   videos:
   - platform: youtube
     video_id: newtrailer123
     title: Zuga etendus "Häbi"
     url: https://www.youtube.com/embed/newtrailer123
   ```
5. Write updated file
6. Report: "✅ Updated YouTube video ID"

### Example 4: Add Gallery Images to Existing Page

**User input**:
```
Add these photos to the Häbi gallery:
- habi-scene1.jpg
- habi-scene2.jpg
- habi-backstage.jpg
```

**Process**:
1. Find and read file
2. Check existing `gallery` array (2 images already)
3. Propose: Append 3 new images to gallery
4. Update frontmatter:
   ```yaml
   gallery:
   - url: /images/habi-promo.jpg
     description: Etenduse reklaamfoto
   - url: /images/habi-rehearsal.jpg
     description: Proovifoto
   - url: /images/habi-scene1.jpg
     description: Stseen 1
   - url: /images/habi-scene2.jpg
     description: Stseen 2
   - url: /images/habi-backstage.jpg
     description: Kulissidetagused
   ```
5. Write updated file
6. Report: "✅ Added 3 images to gallery (now 5 total)"
