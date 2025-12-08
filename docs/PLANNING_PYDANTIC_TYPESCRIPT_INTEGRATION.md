# Planning Session Summary: Pydantic ↔ TypeScript Integration

**Date**: 2025-12-08

**Participants**: Planning session for Ada (developer persona)

**Decision**: SOFT connection between Pydantic and TypeScript

---

## Strategic Analysis

### Two Options Evaluated

#### Option 1: SOFT Connection (✅ CHOSEN)
**Manual TypeScript interfaces mirroring Pydantic models**

**Pros**:
- Simple, no build complexity
- Frontend stays independent
- Easy to understand and maintain
- Can add frontend-specific fields (UI state)
- No Python runtime needed for TypeScript development

**Cons**:
- Manual sync required when models change
- Risk of drift between Python and TypeScript

**Best for**: Small schemas (~10 models), infrequent changes ✅ **Our situation**

#### Option 2: HARD Connection (❌ REJECTED)
**Auto-generate TypeScript from Pydantic using tools**

Tools: `pydantic-to-typescript`, `datamodel-code-generator`

**Why rejected**:
- Over-engineered for our small, stable schema
- Adds build toolchain complexity
- Generated code can be verbose/ugly
- Harder to customize TypeScript side
- Our schema is already validated (35 markdown files proven)

---

## Implementation Strategy

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Source of Truth: scripts/extraction_models.py (Pydantic v2) │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Manual sync (documented in comments)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ TypeScript Types: packages/types/src/content.ts             │
│ - PageFrontmatter interface                                  │
│ - MediaItem, VideoEmbed, Link interfaces                    │
│ - Language, MediaType, PageType enums                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Runtime validation
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Zod Validators: packages/types/src/validators.ts            │
│ - PageFrontmatterSchema (runtime type checking)             │
│ - MediaItemSchema (validates gallery/videos arrays)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Used by
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js App: apps/web/src/                                  │
│ - Content loading utilities                                  │
│ - Type-safe component props                                  │
│ - Validated frontmatter parsing                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Content Creation**: Obsidian → Edit markdown files
2. **Type Validation**: Zod → Parse frontmatter, validate structure
3. **Next.js Rendering**: gray-matter → Extract frontmatter → Components
4. **Build Time**: Static generation with validated types

---

## Key Models to Implement

Based on `scripts/extraction_models.py` lines 1-300:

### Core Types

1. **PageFrontmatter** (PRIMARY - unblocks homepage)
   - Required: title, slug, language, description, type, status
   - Optional: page_type, hero_image, translated[]
   - Arrays: gallery[], videos[]

2. **MediaItem** (needed for galleries/videos)
   - url, description, width (for images)
   - platform, video_id, title (for videos)

3. **VideoEmbed** (YouTube embeds)
   - platform, video_id, title, embed_config

4. **Enums**
   - Language: "et" | "en"
   - MediaType: "image" | "video" | "youtube" | "hero" | "gallery_item"
   - PageType: "performance" | "gallery" | "workshop" | "about" | "news" | "landing"

### Validation Reality Check

- ✅ 35 markdown files already generated from Pydantic models
- ✅ All files have YAML frontmatter matching Pydantic output
- ✅ Schema is stable (content structure won't change weekly)
- ✅ TypeScript types will be tested against actual markdown files

---

## Sync Protocol

### When Pydantic Models Change

1. **Identify change**: Review `extraction_models.py` diff
2. **Update TypeScript**: Modify corresponding interface in `content.ts`
3. **Update Zod**: Adjust validation schema if rules changed
4. **Run tests**: `cd packages/types && pnpm test` (validates all 35 files)
5. **Update comments**: Ensure cross-references are current

### Prevention of Drift

**In Python** (`scripts/extraction_models.py`):
```python
class ExtractedPage(BaseModel):
    """
    SYNC NOTE: TypeScript types in packages/types/src/content.ts
    must be updated when this model changes.

    Run: cd packages/types && pnpm test
    """
```

**In TypeScript** (`packages/types/src/content.ts`):
```typescript
/**
 * Page frontmatter structure from markdown files.
 *
 * SOURCE: scripts/extraction_models.py::ExtractedPage.to_markdown()
 * SYNC: Manual - update when Pydantic model changes
 * VALIDATION: See content.test.ts (validates all 35 markdown files)
 */
export interface PageFrontmatter { ... }
```

---

## Testing Strategy

### Test Against Real Data

**Why?** Catches discrepancies between Pydantic output and TypeScript expectations.

**Approach**:
1. Load all 35 markdown files from `packages/content/pages/`
2. Parse YAML frontmatter with gray-matter
3. Validate with Zod schemas
4. Report: Which files pass, which fail, what errors

**Coverage**:
- ✅ Happy path: All 35 files should validate
- ✅ Required fields: Missing title/slug/language fails
- ✅ Enums: Invalid language/type fails
- ✅ URLs: Malformed hero_image fails
- ✅ Arrays: gallery/videos structure validated

### Test File Structure

```typescript
// packages/types/src/content.test.ts

describe('PageFrontmatter validation', () => {
  it('validates all 35 markdown files', () => {
    const files = getAllMarkdownFiles();
    const errors = [];

    files.forEach(file => {
      const { data } = matter(readFileSync(file));
      try {
        PageFrontmatterSchema.parse(data);
      } catch (e) {
        errors.push({ file, error: e });
      }
    });

    expect(errors).toHaveLength(0);
  });
});
```

---

## Quality Standards (Ada's Requirements)

From `#file:Ada-the-developer.prompt.md`:

### Non-Negotiable

- [ ] Tests written FIRST (test-driven development)
- [ ] 100% test coverage for type definitions
- [ ] Zero TypeScript errors (`tsc --noEmit`)
- [ ] Zero Problems panel errors (clean baseline)
- [ ] No `any` types without justification
- [ ] Full type annotations on all functions

### Quality Checks Workflow

```bash
# Step 1: Type check
cd packages/types
pnpm type-check

# Step 2: Run tests
pnpm test

# Step 3: Verify all files validate
pnpm test -- --reporter=verbose

# Step 4: Check Problems panel
# Expected: 0 errors (clean baseline)
```

---

## Deliverables

### Created GitHub Issue

**Issue #13**: Create TypeScript Content Types from Pydantic Models

**URL**: https://github.com/mitselek/zuga.ee/issues/13

**Contains**:
- Strategic rationale (SOFT vs HARD connection)
- Step-by-step implementation guide (6 steps)
- Testing strategy against real markdown files
- Quality checks (Ada's standards)
- Sync protocol between Pydantic and TypeScript
- Acceptance criteria (Definition of Done)

### Files to Create

1. `packages/types/src/content.ts` - TypeScript interfaces
2. `packages/types/src/validators.ts` - Zod schemas
3. `packages/types/src/content.test.ts` - Validation tests
4. `packages/types/package.json` - Package configuration
5. `packages/types/tsconfig.json` - TypeScript config
6. `packages/types/README.md` - Updated documentation

### Documentation Updates

1. `packages/types/README.md` - Usage guide, sync protocol
2. `docs/MARKDOWN_FORMAT_SPEC.md` - Add TypeScript types section

---

## Next Steps

### Immediate (Ada's work - Issue #13)

1. Implement TypeScript types (est. 1 hour)
2. Add Zod validators (est. 1 hour)
3. Write validation tests against 35 markdown files (est. 2 hours)
4. Configure package (est. 30 min)
5. Run quality checks (est. 30 min)
6. Update documentation (est. 30 min)

**Total**: ~5.5 hours

### After Types Complete (Next.js integration)

1. Install markdown dependencies in apps/web (gray-matter, next-mdx-remote)
2. Create content loading utilities using @zuga/types
3. Implement homepage with validated types
4. Add styling
5. Test and verify

---

## Success Metrics

**Before**:
- ❌ No TypeScript types for frontmatter
- ❌ Manual parsing prone to runtime errors
- ❌ No validation of content structure
- ❌ Next.js homepage blocked

**After**:
- ✅ Type-safe frontmatter parsing
- ✅ Runtime validation catches malformed content
- ✅ 100% test coverage (35/35 markdown files)
- ✅ Clear sync protocol Pydantic ↔ TypeScript
- ✅ Next.js homepage unblocked
- ✅ Foundation for rapid feature development

---

## Risks & Mitigations

### Risk: Pydantic and TypeScript drift over time

**Likelihood**: Medium (manual sync required)

**Impact**: High (runtime errors, broken pages)

**Mitigation**:
- Cross-reference comments in both codebases
- Tests validate against real markdown files
- Sync protocol documented in README
- Breaking changes caught by test suite

### Risk: Schema becomes too complex for manual sync

**Likelihood**: Low (schema is stable)

**Impact**: Medium (consider auto-generation tools)

**Mitigation**:
- If models exceed 20-30 types, revisit HARD connection option
- Monitor: Time spent on sync vs schema change frequency
- Threshold: If sync takes >1 hour per change, automate

---

## Alternative Approaches Considered

### 1. JSON Schema as Intermediate Format

**Approach**: Pydantic → JSON Schema → TypeScript

**Rejected because**:
- Adds complexity without clear benefit
- JSON Schema doesn't capture all Pydantic features
- Still requires tooling (json-schema-to-typescript)

### 2. Shared Schema Language (Protobuf)

**Approach**: Define schema in .proto files, generate both

**Rejected because**:
- Massive overkill for content types
- Adds build complexity
- Protobuf not idiomatic for web content

### 3. TypeScript-First (Reverse Direction)

**Approach**: Write TypeScript types, generate Pydantic

**Rejected because**:
- Pydantic is already source of truth (35 files validated)
- Python does data extraction/conversion
- Frontend doesn't dictate backend schema

---

## References

**Issue**: https://github.com/mitselek/zuga.ee/issues/13

**Source Models**: `scripts/extraction_models.py`

**Target Package**: `packages/types/`

**Content Files**: `packages/content/pages/` (35 markdown files)

**Specification**: `docs/MARKDOWN_FORMAT_SPEC.md`

**Quality Standards**: `.github/prompts/Ada-the-developer.prompt.md`
