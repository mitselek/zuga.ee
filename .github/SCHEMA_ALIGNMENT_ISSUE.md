# Issue: Align Pydantic Schema with Generated Markdown

**Priority**: Medium (frontend works with workarounds, but ideal schema not enforced)

**Assignee**: Ada (Developer persona with strict quality standards)

**Labels**: `bug`, `schema`, `data-consistency`, `python`

**Related**: Issue #13 (TypeScript types implementation)

---

## Context

While implementing TypeScript types (Issue #13), Ada discovered **3 schema inconsistencies** between:

- **Ideal schema**: `scripts/frontmatter_models.py::ContentFrontmatter`
- **Actual output**: `scripts/extraction_models.py::ExtractedPage.to_markdown()`
- **Generated files**: 35 markdown files in `packages/content/pages/`

**Current state**:

- ✅ TypeScript types implemented with workarounds
- ✅ All 35 markdown files validate successfully
- ❌ Schema doesn't match ideal specification
- ❌ Some fields optional when they should be required

---

## Issue 1: Missing `original_url` field

### Expected (frontmatter_models.py)

```python
class ContentFrontmatter(BaseModel):
    original_url: str = Field(..., description="Full canonical URL")  # REQUIRED
```

### Actual (extraction_models.py::to_markdown())

**Not generated** - Field is completely missing from output

### Evidence

All 35 markdown files missing this field:

```bash
$ grep -r "original_url:" packages/content/pages/
# No results
```

### Impact

- TypeScript schema had to make field optional: `original_url: z.string().url().optional()`
- Breaks type contract (should be required)
- No source URL preserved for archival/reference purposes

### Root Cause

`ExtractedPage.to_markdown()` lines 350-365 builds frontmatter dict but never includes `original_url`.

### Proposed Fix

**Option A**: Extract from source HTML filename

```python
def to_markdown(self) -> str:
    frontmatter: dict[str, Any] = {
        "title": self.metadata.title,
        "slug": self.metadata.slug,
        "language": self.metadata.language.value,
        "description": self.metadata.description,
        "type": self.metadata.page_type or "page",
        "status": "published",
        "original_url": self._build_original_url(),  # ADD THIS
    }

def _build_original_url(self) -> str:
    """Build original URL from slug and language."""
    lang_path = "english" if self.metadata.language == Language.ENGLISH else "et"
    # Remove language prefix from slug
    clean_slug = self.metadata.slug.replace(f"{self.metadata.language.value}-", "")
    return f"https://www.zuga.ee/{lang_path}/{clean_slug}"
```

**Option B**: Add to `PageMetadata` model

```python
class PageMetadata(BaseModel):
    title: str
    language: Language
    slug: str
    description: str
    original_url: str = Field(..., description="Source URL from archive")  # ADD THIS
    page_type: Optional[Literal["performance", "gallery", "workshop", "about", "news", "landing"]]
```

Then populate when creating `ExtractedPage` from JSON.

**Recommendation**: Option A (can reconstruct from existing data, no need to modify JSON files)

### Test Updates Needed

After fix, update TypeScript validator:

```typescript
// packages/types/src/validators.ts
original_url: z.string().url(),  // Change from .optional() to required
```

Verify all 35 files still validate with new schema.

---

## Issue 2: `translated` field format mismatch

### Expected (frontmatter_models.py)

```python
class TranslationReference(BaseModel):
    language: Literal["et", "en"]
    slug: str

class ContentFrontmatter(BaseModel):
    translated: list[TranslationReference] = Field(...)
```

Should generate:

```yaml
translated:
  - language: et
    slug: etendused-suurtele-mura
```

### Actual (extraction_models.py::to_markdown())

Generates simple string array:

```python
# Line 367
if self.bilingual_link:
    frontmatter["translated"] = [self.bilingual_link]  # String array
```

Produces:

```yaml
translated:
  - etendused-suurtele-mura  # Just slug, no language
```

### Evidence

```bash
$ cat packages/content/pages/en/english-noise.md
---
translated:
- etendused-suurtele-mura  # Missing language field
---
```

### Impact

- TypeScript schema needs union type to accept both formats:

```typescript
translated: z.union([
  z.array(z.string()),  // Actual format (workaround)
  z.array(TranslationReferenceSchema),  // Ideal format
]).optional()
```

- Cannot infer language of translated content
- Harder to build bilingual navigation

### Root Cause

`to_markdown()` line 367 stores slug as string instead of `{language, slug}` object.

### Proposed Fix

Update `to_markdown()` to generate proper structure:

```python
if self.bilingual_link:
    # Infer target language (opposite of current)
    target_lang = "en" if self.metadata.language == Language.ESTONIAN else "et"
    frontmatter["translated"] = [
        {
            "language": target_lang,
            "slug": self.bilingual_link
        }
    ]
```

### Alternative: Store language in ExtractedPage

If language can't be inferred, add to model:

```python
class ExtractedPage(BaseModel):
    bilingual_link: Optional[str] = None
    bilingual_link_language: Optional[Language] = None  # ADD THIS
```

### Test Updates Needed

After fix:

1. Regenerate all 35 markdown files
2. Update TypeScript validator to remove union (accept only object format):

```typescript
translated: z.array(
  z.object({
    language: z.enum(['et', 'en']),
    slug: z.string(),
  })
).optional()
```

3. Verify all 35 files validate

---

## Issue 3: `type` field has undocumented values

### Expected (frontmatter_models.py)

```python
type: Optional[Literal["page", "performance", "news"]]
```

### Actual (found in real files)

- ✅ `"page"`
- ✅ `"performance"`
- ✅ `"news"`
- ❌ `"about"` (undocumented, found in `english-about-us-1.md`)

### Evidence

```bash
$ grep "^type:" packages/content/pages/en/english-about-us-1.md
type: about
```

### Impact

- TypeScript enum validation fails
- Had to accept any string: `type: z.string().optional()`
- Loses type safety on page type

### Root Cause

Either:

1. Python model Literal union is incomplete (missing `"about"`)
2. OR markdown file has wrong type value (should be `"page"`)

### Investigation Needed

Check all files for type values:

```bash
$ grep "^type:" packages/content/pages/**/*.md | cut -d: -f3 | sort | uniq -c
```

Expected result will show which types are actually used.

### Proposed Fix

**Option A**: Add `"about"` to Literal union

```python
# frontmatter_models.py
type: Optional[Literal["page", "performance", "news", "about", "landing", "gallery", "workshop"]]
```

**Option B**: Normalize file to use `"page"` type

Edit `english-about-us-1.md`:

```yaml
type: page  # Change from "about"
page_type: about  # Keep for categorization
```

**Recommendation**: Option A (preserve actual content type, update schema to match reality)

### Test Updates Needed

After fix, update TypeScript validator:

```typescript
type: z.enum(['page', 'performance', 'news', 'about', 'landing', 'gallery', 'workshop']).optional()
```

Verify all 35 files validate.

---

## Implementation Plan

### Phase 1: Data Analysis (1 hour)

```bash
# Find all type values actually used
grep "^type:" packages/content/pages/**/*.md | cut -d: -f3 | sort | uniq -c

# Check if original_url pattern is consistent
# (Verify we can reconstruct from slug + language)

# Analyze bilingual_link patterns
grep "^translated:" packages/content/pages/**/*.md -A1
```

**Deliverable**: Data report showing actual values used in all 35 files

### Phase 2: Update Python Models (2 hours)

1. Add `original_url` generation to `to_markdown()`
2. Update `translated` to generate object format
3. Update `type` Literal union to include all actual values
4. Write tests for new output format

**Test-first approach**:

```python
def test_to_markdown_includes_original_url():
    page = ExtractedPage(
        metadata=PageMetadata(
            title="Test",
            slug="english-test",
            language=Language.ENGLISH,
            description="Test page"
        ),
        content_sections=[],
        media=[]
    )

    markdown = page.to_markdown()
    frontmatter = yaml.safe_load(markdown.split("---")[1])

    assert "original_url" in frontmatter
    assert frontmatter["original_url"] == "https://www.zuga.ee/english/test"

def test_translated_field_includes_language():
    page = ExtractedPage(
        metadata=PageMetadata(...),
        bilingual_link="eesti-versioon",
        ...
    )

    markdown = page.to_markdown()
    frontmatter = yaml.safe_load(markdown.split("---")[1])

    assert frontmatter["translated"][0]["language"] == "et"
    assert frontmatter["translated"][0]["slug"] == "eesti-versioon"
```

### Phase 3: Regenerate Markdown Files (30 min)

```bash
cd scripts
python convert_json_to_markdown.py

# Verify all 35 files regenerated
git diff packages/content/pages/
```

### Phase 4: Update TypeScript Types (30 min)

Remove workarounds:

```typescript
// packages/types/src/validators.ts
export const PageFrontmatterSchema = z.object({
  original_url: z.string().url(),  // Required now
  type: z.enum(['page', 'performance', 'news', 'about', 'landing', 'gallery', 'workshop']).optional(),
  translated: z.array(
    z.object({
      language: z.enum(['et', 'en']),
      slug: z.string(),
    })
  ).optional(),  // Object format only
});
```

### Phase 5: Validation (1 hour)

```bash
# Run Python tests
cd scripts
pytest tests/ -v

# Run TypeScript tests
cd packages/types
pnpm test

# Verify all 35 files validate
pnpm test -- --reporter=verbose
```

**Success criteria**:

- ✅ All Python tests pass
- ✅ All TypeScript tests pass (28/28)
- ✅ All 35 markdown files validate without errors
- ✅ No workarounds in TypeScript validators
- ✅ Schema matches documentation

---

## Quality Checks (Ada's Standards)

Before closing issue:

```bash
# Python side
cd scripts
black extraction_models.py --line-length=100
flake8 extraction_models.py --max-line-length=100
mypy extraction_models.py --strict
pytest tests/ --cov=extraction_models --cov-fail-under=80

# TypeScript side
cd packages/types
pnpm type-check
pnpm test
```

**Expected**:

- [ ] Python: 0 linting errors
- [ ] Python: 0 type errors
- [ ] Python: All tests pass with 80%+ coverage
- [ ] TypeScript: 0 compilation errors
- [ ] TypeScript: 28/28 tests pass
- [ ] Problems panel: 0 errors

---

## Acceptance Criteria

**Definition of Done**:

- [ ] `original_url` field generated for all pages
- [ ] `translated` field uses `{language, slug}` object format
- [ ] `type` Literal union includes all actual values found
- [ ] All 35 markdown files regenerated with new format
- [ ] TypeScript validators updated (no workarounds)
- [ ] All tests pass (Python + TypeScript)
- [ ] Documentation updated to reflect actual schema
- [ ] Clean baseline (0 Problems panel errors)

**Deliverables**:

1. Updated `scripts/extraction_models.py` with schema fixes
2. Regenerated 35 markdown files with correct format
3. Updated `packages/types/src/validators.ts` (remove workarounds)
4. Test coverage for new fields
5. Data analysis report from Phase 1

---

## Success Metrics

**Before**:

- ❌ Schema doesn't match specification
- ❌ `original_url` missing (can't link to archive)
- ❌ `translated` format ambiguous (can't infer language)
- ❌ `type` enum incomplete (had to accept any string)
- ⚠️ TypeScript validators use workarounds

**After**:

- ✅ Schema matches specification exactly
- ✅ All required fields present
- ✅ Type safety fully enforced
- ✅ No workarounds needed
- ✅ Clean, consistent data model

---

## Notes

**Why this wasn't caught earlier**:

- TypeScript implementation was first time actual files were validated
- Python tests validate JSON → Markdown conversion but not against ideal schema
- `frontmatter_models.py` defines ideal spec but wasn't enforced in generation

**Lessons learned**:

- Always validate generated data against specification
- Schema drift happens when multiple models exist
- Test against real data, not just examples

**Follow-up work**:

After this fix, consider:

- Unifying `frontmatter_models.py` and `extraction_models.py`
- Using Pydantic models directly for YAML generation
- Adding CI check to validate all markdown files against spec
