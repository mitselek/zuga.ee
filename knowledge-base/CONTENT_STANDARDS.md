# Knowledge Base Content Standards

## Core Principles

The ZUGA Knowledge Base (KnB) is a **factual archive** of source materials. All content must adhere to strict accuracy and attribution standards.

## Fundamental Rules

### 1. Verbatim Text Only

**Rule**: All text content MUST be copied exactly as it appears in the original source.

**What this means**:

- ✓ Copy text word-for-word from the source
- ✓ Preserve original punctuation, capitalization, spelling (even if incorrect)
- ✓ Keep original language (Estonian/English/other as published)
- ✗ NO paraphrasing or rewording
- ✗ NO translation (keep original language)
- ✗ NO corrections or improvements
- ✗ NO filling in gaps or missing information
- ✗ NO embellishments or additions

**Example - CORRECT**:

```markdown
---
title: "ZUGA uus lavastus „Ilma" uurib kliimamuutusi"
source_url: https://kultuur.err.ee/article-12345
source_type: article
---

ZUGA liikumisteatri uus lavastus "Ilma" uurib kliimamuutusi läbi tundliku liikumiskeele. Lavastaja Päär Pärenson ütleb: "Tahtsime luua etenduse, mis räägib loodusest."
```

**Example - INCORRECT**:

```markdown
---
title: "ZUGA's new performance explores climate change"
source_url: https://kultuur.err.ee/article-12345
source_type: article
---

ZUGA movement theater's innovative new work "Weather or Not" examines climate change through expressive movement language. Director Päär Pärenson explains that the team wanted to create a performance about nature and environmental awareness.
```

❌ Problems: Translated title, embellished description ("innovative"), translated quotes, added interpretation ("environmental awareness" not in original)

### 2. Source Attribution Required

**Rule**: Every KnB file MUST include source attribution in YAML frontmatter.

**Required fields**:

```yaml
---
source_url: [Original URL where content was found]
source_type:
  [article|press_release|interview|review|preview|news|photo|video|social_media]
source_publication: [Publication name - ERR, EPL, Postimees, etc.]
source_date: [YYYY-MM-DD - date of original publication]
source_author: [Author name if available]
archived_date: [YYYY-MM-DD - date added to KnB]
---
```

**Optional but recommended**:

```yaml
source_language: [et|en|other]
source_title: [Original headline/title]
retrieved_via: [web|email|pdf|screenshot|physical_copy]
archive_location: [If physical copy or special archive]
```

### 3. No Gap Filling

**Rule**: If information is missing from the source, leave it missing in KnB.

**What to do**:

- ✓ Document what IS in the source
- ✓ Note gaps with `[information not provided in source]`
- ✓ Leave fields empty if not in source
- ✗ Do NOT infer or assume missing information
- ✗ Do NOT combine information from multiple sources into one file
- ✗ Do NOT add context from other knowledge

**Example - CORRECT**:

```yaml
---
title: "Etenduse arvustus"
source_url: https://example.com/review
premiere_date: [not mentioned in source]
venue: Kanuti Gildi SAAL
performers: [not mentioned in source]
---
Etendus oli muljetavaldav. Liikumiskeel oli väga tundlik.
```

**Example - INCORRECT**:

```yaml
---
title: "Etenduse arvustus"
source_url: https://example.com/review
premiere_date: 2024-10-15  # ❌ Found this from another article
venue: Kanuti Gildi SAAL
performers: Kärt Tõnisson  # ❌ Saw this on social media
---

Etendus oli muljetavaldav ja uuris kliimamuutusi. # ❌ Added interpretation
Liikumiskeel oli väga tundlik ja emotsionaalne. # ❌ Added "emotsionaalne"
```

### 4. No Translation

**Rule**: Keep content in its original published language.

**What this means**:

- ✓ Estonian article stays in Estonian
- ✓ English review stays in English
- ✓ Mixed-language source preserves both languages as written
- ✗ Do NOT translate Estonian to English
- ✗ Do NOT translate English to Estonian
- ✗ Do NOT standardize to one language

**Rationale**: Translation introduces interpretation. Original language preserves exact meaning and context.

**For bilingual needs**: Create separate KnB entries for each language version if source exists in multiple languages (e.g., press release issued in both ET and EN).

### 5. Multiple Sources = Multiple Files

**Rule**: Each source gets its own KnB file, even if about the same topic.

**What this means**:

- ✓ One ERR article = one KnB file
- ✓ One EPL article = separate KnB file
- ✓ One press release = separate KnB file
- ✗ Do NOT combine multiple articles into one file
- ✗ Do NOT merge similar content

**Example structure**:

```text
knowledge-base/articles/
  2024-10-15-err-ilma-review.md        # ERR review
  2024-10-18-epl-ilma-preview.md       # EPL preview
  2024-11-05-criticaldance-ilma.md     # CriticalDance review
```

Each file contains only what was in that specific source.

### 6. Metadata Accuracy

**Rule**: All metadata fields must reflect information explicitly stated in the source.

**Required metadata review**:

```yaml
---
# Only fill if explicitly mentioned in source
performance_title: [Exact title as written in source]
venue: [Exact venue name from source]
premiere_date: [Only if date is stated]
duration: [Only if mentioned - in minutes]
team_members: [Only names mentioned in THIS source]
---
```

**Example - CORRECT**:

Source text: "ZUGA etendus Kanuti Gildis kestab 45 minutit"

```yaml
venue: Kanuti Gildi SAAL # ✓ Mentioned
duration: 45 # ✓ Mentioned
premiere_date: # ✗ Not mentioned - leave empty
```

**Example - INCORRECT**:

```yaml
venue: Kanuti Gildi SAAL
duration: 45
premiere_date: 2024-10-15 # ❌ Not in this source, found elsewhere
choreographer: Päär Pärenson # ❌ Not mentioned in this article
```

## Bidirectional Linking

**Rule**: Use bidirectional linking fields to establish traceability between Knowledge Base content and web pages.

### KnB → Web Pages (`used_in_pages`)

Track which web pages reference each KnB file. This enables:

- **Update cascade**: When KnB content is updated, identify all web pages that need review
- **Content audit**: Find orphaned KnB content or unsupported web claims
- **AI prompt validation**: `/add-content` prompt can verify KnB backing

**Format**:

```yaml
---
used_in_pages:
  - et/etendused-noorele-publikule-ilma.md
  - en/performances-for-young-audiences-weather-or-not.md
---
```

**Path format**: Relative paths from `apps/web/src/content/pages/` directory, including language prefix (`et/` or `en/`).

**When to populate**:

- Manually when creating/updating web pages that reference KnB content
- Automatically via linking scripts (see Issue #36, #37)

### KnB → KnB (`related_knb`)

Cross-reference related content within the Knowledge Base to build a knowledge graph.

**Format**:

```yaml
---
related_knb:
  performances:
    - ilma
    - habi
  persons:
    - paar-parenson
    - kart-tonisson
  articles:
    - 2024-10-err-kultuur-ilma-review
  press:
    - 2024-10-ilma-announcement
  research:
    - awards-tantsuauhind
---
```

**Field formats**:

- **performances**: Performance IDs from registry (slug format, e.g., `"ilma"`)
- **persons**: Person file slugs without extension (e.g., `"paar-parenson"`)
- **articles**: Article file slugs without extension (e.g., `"2024-10-err-kultuur-ilma-review"`)
- **press**: Press release file slugs without extension
- **research**: Research file slugs without extension

**When to populate**:

- When KnB content explicitly mentions other KnB entities
- When articles reference specific performances or persons
- When press releases announce performances with known team members

### Web Pages → KnB (`knowledge_base_sources`)

Web content pages should reference their KnB sources to enable validation and traceability.

**Format** (in web page frontmatter):

```yaml
---
knowledge_base_sources:
  articles:
    - articles/2024-10-err-kultuur-ilma-review.md
  persons:
    - persons/paar-parenson.md
  press:
    - press/2024-10-ilma-announcement.md
  research:
    - research/awards-tantsuauhind.md
---
```

**Path format**: Relative paths from `knowledge-base/` root directory.

**When to populate**:

- When creating web pages using `/add-content` prompt
- When web page content makes claims that should be backed by KnB sources
- For performance pages: link to press coverage, reviews, team member profiles

**Best practices**:

- Link to ALL KnB sources that support claims on the web page
- Keep links bidirectional: if web page links to KnB, KnB should list web page in `used_in_pages`
- Update links when content changes or new sources are added

### Registry Validation Rules

When referencing performances or workshops in KnB files:

- **Use registry IDs**: Reference performance/workshop IDs from `registry/performances.yaml` and `registry/workshops.yaml`
- **Validate references**: Use `related_knb.performances` array with registry IDs (e.g., `"ilma"`, `"habi"`)
- **Don't use slugs**: Use the `id` field from registry, not `slug` or `full_slug`
- **Run validation**: Use `node scripts/validate-all.js` to verify all references are valid

### Validation Requirements

All content must pass validation before committing:

```bash
# Validate all content
node scripts/validate-all.js

# Validate specific collections
node scripts/validate-all.js --knb-only
node scripts/validate-all.js --web-only
node scripts/validate-all.js --registry-only
```

**Validation checks**:
- ✅ Schema compliance (all required fields present, correct types)
- ✅ Registry references (performance/workshop IDs exist in registry)
- ✅ Bidirectional linking integrity (links are consistent)
- ⚠️ Orphaned content detection (KnB files not referenced)
- ⚠️ Unsupported claims detection (web pages without KnB sources)

## Content Types and Standards

### Articles (Press Coverage)

**Location**: `knowledge-base/articles/`

**Naming**: `YYYY-MM-DD-publication-slug.md`

**Required frontmatter**:

```yaml
---
title: [Original headline]
slug: [Generated from date-publication-title]
source_url: [Original article URL]
source_type: article # or review, interview, preview, news
source_publication: [Publication name]
source_date: YYYY-MM-DD
archived_date: YYYY-MM-DD
source_language: [et|en]
---
```

**Body**: Verbatim article text, including:

- Headline (as H1)
- Byline if present
- Full article text
- Quotes exactly as written
- Photo captions if present

### Press Releases

**Location**: `knowledge-base/press/`

**Naming**: `YYYY-MM-DD-release-title-slug.md`

**Required frontmatter**:

```yaml
---
title: [Original press release title]
source_type: press_release
issued_by: ZUGA
issued_date: YYYY-MM-DD
archived_date: YYYY-MM-DD
source_language: [et|en]
distribution: [public|media_only|internal]
---
```

**Body**: Complete press release text verbatim

### Person Profiles

**Location**: `knowledge-base/persons/`

**Naming**: `firstname-lastname.md`

**Required frontmatter**:

```yaml
---
name: [Full name]
role: [Primary role - from official ZUGA bio]
source_url: [Where bio text came from]
source_type: [bio|press_release|article]
archived_date: YYYY-MM-DD
---
```

**Body**: Bio text exactly as provided by ZUGA or published source

### Research Documents

**Location**: `knowledge-base/research/`

**Naming**: `topic-or-award-slug.md`

**Required frontmatter**:

```yaml
---
title: [Document title]
source_url: [Original source]
source_type: [award_announcement|grant_info|production_notes]
source_date: YYYY-MM-DD
archived_date: YYYY-MM-DD
---
```

## Quality Control Checklist

Before adding content to KnB, verify:

- [ ] Text is copied verbatim from source (no paraphrasing)
- [ ] Original language preserved (no translation)
- [ ] All quotes use exact wording from source
- [ ] `source_url` field present and accurate
- [ ] `source_type` field present and correct
- [ ] `source_date` matches publication date
- [ ] `archived_date` is today's date
- [ ] No information added that wasn't in source
- [ ] No gaps filled with assumptions
- [ ] No embellishments or interpretations
- [ ] Metadata reflects only what's in source
- [ ] If information missing, field left empty or noted as `[not in source]`

## Common Violations to Avoid

### ❌ Violation 1: Paraphrasing

**Original source**: "Lavastus uurib inimese ja loodu suhet"

**Wrong**: "Etendus käsitleb inimlooduse teemat"

**Correct**: "Lavastus uurib inimese ja loodu suhet"

### ❌ Violation 2: Translation

**Original source**: "The performance explores human nature"

**Wrong**: "Etendus uurib inimloomu"

**Correct**: "The performance explores human nature"

### ❌ Violation 3: Adding Context

**Original source**: "Etendus esietendub oktoobris"

**Wrong**: "Etendus esietendub oktoobris 2024 Kanuti Gildis" (added year and venue from memory)

**Correct**: "Etendus esietendub oktoobris"

### ❌ Violation 4: Combining Sources

**Wrong**: Creating one file with text from ERR article + EPL review + ZUGA press release

**Correct**: Three separate files, each with its own source attribution

### ❌ Violation 5: Filling Gaps

**Original source**: "Lavastaja on Päär Pärenson"

**Wrong**: Adding "Koreograaf: Päär Pärenson" (source said "lavastaja" not "koreograaf")

**Correct**: Keep "Lavastaja on Päär Pärenson" exactly as written

## Rationale

### Why These Rules?

1. **Accuracy**: Verbatim content ensures no misrepresentation of sources
2. **Attribution**: Clear sourcing allows verification and credits original publishers
3. **Legal**: Proper attribution respects copyright and fair use
4. **Trust**: Future editors know KnB content is reliable, not interpreted
5. **Traceability**: Every fact can be traced back to its original source
6. **No Telephone Game**: Prevents gradual distortion through rewording

### When to Use KnB Content

The `/add-content` prompt creates homepage content FROM KnB sources by:

- Synthesizing information from multiple KnB files
- Translating when needed for bilingual pages
- Structuring content for web presentation
- Adding navigation and linking

**KnB = Raw Archive** → **Homepage = Curated Presentation**

## Enforcement

### During Content Harvest

When using `/harvest-content`:

1. Copy text exactly from source (use copy-paste, not retyping)
2. Verify `source_url` is accessible and correct
3. Check `source_date` matches publication date
4. Leave fields empty if information not in source
5. Create separate file for each distinct source

### During Review

When reviewing KnB files:

1. Open source URL and compare text
2. Verify no paraphrasing or translation
3. Check all metadata is from source
4. Ensure no information from other sources mixed in
5. Confirm proper attribution in frontmatter

### Correcting Violations

If KnB file violates these standards:

1. **For paraphrasing**: Restore original verbatim text from source
2. **For translation**: Revert to original language or create separate file for each language version
3. **For added info**: Remove any information not in the cited source
4. **For missing attribution**: Add complete source frontmatter or remove file if source cannot be verified
5. **For merged sources**: Split into separate files, one per source

## Examples

### Example 1: Correct KnB Article Entry

**File**: `knowledge-base/articles/2024-10-24-err-kultuur-ilma.md`

```yaml
---
title: "ZUGA uus lavastus „Ilma" uurib kliimamuutusi"
slug: 2024-10-24-err-kultuur-ilma
source_url: https://kultuur.err.ee/1234567/zuga-uus-lavastus-ilma-uurib-kliimamuutusi
source_type: review
source_publication: ERR kultuur
source_date: 2024-10-24
source_author: Mari Mets
archived_date: 2024-12-14
source_language: et
performance_title: Ilma
venue: Kanuti Gildi SAAL
---

# ZUGA uus lavastus „Ilma" uurib kliimamuutusi

**Mari Mets, 24. oktoober 2024**

ZUGA liikumisteatri uus lavastus "Ilma" esietendus 15. oktoobril Kanuti Gildi SAALis. Lavastus uurib kliimamuutusi läbi tundliku liikumiskeele ja isikliku lähenemise.

Lavastaja Päär Pärenson ütleb: "Tahtsime luua etenduse, mis räägib loodusest, aga mis ei oleks moraliseeriv või õpetlik."

Etendus kestab 45 minutit ja on mõeldud noorele publikule alates 12. eluaastast.
```

**Why this is correct**:

- ✓ All text verbatim from ERR article
- ✓ Original Estonian preserved
- ✓ Complete source attribution
- ✓ Metadata (venue, duration, target audience) only what was mentioned in article
- ✓ Quotes exactly as published

### Example 2: Correct Multi-Source Documentation

**Three separate files, not combined**:

**File 1**: `knowledge-base/articles/2024-10-15-epl-ilma-preview.md`

```yaml
---
title: "ZUGA toob lavale uue liikumisetenduse"
source_url: https://epl.ee/article-111
source_type: preview
source_publication: Eesti Päevaleht
source_date: 2024-10-15
archived_date: 2024-12-14
source_language: et
---
[Verbatim text from EPL preview article]
```

**File 2**: `knowledge-base/articles/2024-10-24-err-kultuur-ilma.md`

```yaml
---
title: "ZUGA uus lavastus „Ilma" uurib kliimamuutusi"
source_url: https://kultuur.err.ee/article-222
source_type: review
source_publication: ERR kultuur
source_date: 2024-10-24
archived_date: 2024-12-14
source_language: et
---

[Verbatim text from ERR review]
```

**File 3**: `knowledge-base/press/2024-10-01-ilma-press-release.md`

```yaml
---
title: "Pressiteade: ZUGA uus lavastus „Ilma""
source_type: press_release
issued_by: ZUGA
issued_date: 2024-10-01
archived_date: 2024-12-14
source_language: et
---

[Verbatim ZUGA press release]
```

**Why this is correct**:

- ✓ Each source gets separate file
- ✓ Each has complete attribution
- ✓ No mixing of content
- ✓ Homepage content prompt can synthesize from all three

### Example 3: Handling Missing Information

**Source article** mentions performance but not premiere date or venue.

**Correct KnB entry**:

```yaml
---
title: "Uus etendus räägib loodusest"
source_url: https://example.com/article
source_type: article
source_date: 2024-10-20
archived_date: 2024-12-14
performance_title: Ilma
premiere_date: # Not mentioned in article
venue: # Not mentioned in article
---
Uus etendus "Ilma" räägib loodusest. Lavastaja sõnul on tegemist tundliku käsitlusega.
```

**Why this is correct**:

- ✓ Empty fields for missing information (not filled from memory)
- ✓ Only includes what source article stated
- ✓ Note in comment why fields empty
- ✗ Did NOT add premiere date from ZUGA website
- ✗ Did NOT add venue from social media post

## Usage with Content Prompts

### `/harvest-content` Prompt

**When harvesting**:

1. Fetch original source (web page, PDF, image)
2. Extract text verbatim (no paraphrasing)
3. Preserve original language
4. Create complete source attribution
5. Save to appropriate KnB directory
6. Commit with message: "harvest: Add [source type] from [publication]"

### `/add-content` Prompt

**When creating homepage content**:

1. Search KnB for relevant sources
2. Read multiple KnB files for complete picture
3. Synthesize information (combining allowed here)
4. Translate if needed for bilingual pages
5. Structure for web presentation
6. Link back to KnB sources in page content

**Key difference**: KnB preserves raw sources, homepage presents curated content.

## Summary

| Aspect          | KnB Standard            | Homepage Content           |
| --------------- | ----------------------- | -------------------------- |
| **Text**        | Verbatim only           | Can synthesize/rewrite     |
| **Language**    | Original preserved      | Translated as needed       |
| **Sources**     | One per file            | Multiple sources combined  |
| **Gaps**        | Left empty              | Can be filled with context |
| **Attribution** | Required in frontmatter | Links to KnB articles      |
| **Purpose**     | Factual archive         | User presentation          |

## Questions?

If unsure whether something violates these standards, ask:

1. "Is this text exactly as it appears in the source?" → If no, it's wrong
2. "Did I translate anything?" → If yes, it's wrong
3. "Did I add information not in this source?" → If yes, it's wrong
4. "Is source_url present and accurate?" → If no, it's wrong
5. "Did I combine multiple sources?" → If yes, split into separate files

**When in doubt**: Copy-paste exactly, preserve original language, cite source completely.

---

_Last updated: 2025-12-14_
