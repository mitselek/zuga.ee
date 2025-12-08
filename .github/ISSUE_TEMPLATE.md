# Issue: Create TypeScript Content Types from Pydantic Models

**Priority**: High (blocks Next.js homepage implementation)

**Assignee**: Ada (Developer persona with strict quality standards)

**Labels**: `enhancement`, `typescript`, `types`, `frontend`

---

## Context

We have successfully completed the content pipeline:

- ✅ HTML → JSON extraction (35 files validated with Pydantic)
- ✅ JSON → Markdown conversion (35 files with YAML frontmatter)
- ✅ Obsidian integration for content editing
- ⏳ Next.js homepage needs TypeScript types to parse markdown frontmatter

**Source of Truth**: `scripts/extraction_models.py` (Pydantic v2 models)

**Target**: `packages/types/src/content.ts` (TypeScript interfaces)

---

## Strategic Decision: SOFT Connection

After evaluating options, we're implementing **manual TypeScript interfaces** that mirror Pydantic models:

**Rationale**:

- Schema is small (~10 core models) and stable
- Avoids build toolchain complexity (no Python in Node.js build)
- Allows frontend-specific enhancements (UI state, computed properties)
- Easy to maintain for occasional schema updates
- 35 markdown files already validated - schema is proven

**Trade-off Accepted**:

- Manual sync required when Pydantic models change
- Mitigated by: Comments linking TS to Python, validation tests

---

## Requirements

### Step 1: Create TypeScript Type Definitions

**File**: `packages/types/src/content.ts`

**Models to Implement** (based on `scripts/extraction_models.py`):

1. **Enums**:
   - `Language` - "et" | "en"
   - `MediaType` - "image" | "video" | "youtube" | "hero" | "gallery_item"
   - `PageType` - "performance" | "gallery" | "workshop" | "about" | "news" | "landing"

2. **Component Types**:
   - `MediaItem` - Image/video with url, description, platform, video_id, width, etc.
   - `VideoEmbed` - YouTube embed with platform, video_id, title, embed_config
   - `Link` - Hyperlink with text and url
   - `NewsItem` - News feed item with text, link, importance

3. **Frontmatter Type** (PRIMARY):
   - `PageFrontmatter` - Maps to YAML frontmatter in markdown files
   - Required fields: title, slug, language, description, type, status
   - Optional arrays: gallery[], videos[], translated[]
   - Must match `ExtractedPage.to_markdown()` output format

**Cross-Reference Comments**:

Each TypeScript interface MUST include comment linking to source:

```typescript
/**
 * Page frontmatter structure from markdown files.
 *
 * SOURCE: scripts/extraction_models.py::ExtractedPage.to_markdown()
 * SYNC: Manual - update when Pydantic model changes
 *
 * @see packages/content/pages/et/index.md - Example usage
 * @see docs/MARKDOWN_FORMAT_SPEC.md - Format specification
 */
export interface PageFrontmatter {
  // ...
}
```

---

### Step 2: Add Runtime Validation (Zod)

**File**: `packages/types/src/validators.ts`

Use Zod to validate markdown frontmatter at runtime:

```typescript
import { z } from 'zod';

export const MediaItemSchema = z.object({
  platform: z.enum(['youtube', 'vimeo']).optional(),
  video_id: z.string().optional(),
  url: z.string().url(),
  description: z.string().optional(),
  width: z.string().optional(),
  title: z.string().optional(),
});

export const PageFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  language: z.enum(['et', 'en']),
  description: z.string(),
  type: z.enum(['performance', 'gallery', 'workshop', 'about', 'news', 'landing']),
  status: z.enum(['published', 'draft', 'archived']),
  page_type: z.string().optional(),
  hero_image: z.string().url().optional(),
  gallery: z.array(MediaItemSchema).optional(),
  videos: z.array(MediaItemSchema).optional(),
  translated: z.array(z.string()).optional(),
});

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
```

**Why Zod?**

- Runtime type safety (catches malformed frontmatter)
- Generates TypeScript types automatically
- Provides clear error messages
- Industry standard for Next.js projects

---

### Step 3: Write Tests (Test-First)

**File**: `packages/types/src/content.test.ts`

**Testing Strategy**:

1. **Parse real markdown files** from `packages/content/pages/`
2. **Validate frontmatter** matches TypeScript types
3. **Edge cases**: Missing fields, malformed URLs, invalid enums

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PageFrontmatterSchema } from './validators';

describe('PageFrontmatter validation', () => {
  it('validates index.md frontmatter', () => {
    const filePath = path.join(__dirname, '../../content/pages/et/index.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    // This should not throw
    const result = PageFrontmatterSchema.parse(data);

    expect(result.title).toBe('Zuga');
    expect(result.language).toBe('et');
    expect(result.slug).toBe('index');
  });

  it('validates all 35 markdown files', () => {
    const etPages = fs.readdirSync(
      path.join(__dirname, '../../content/pages/et')
    ).filter(f => f.endsWith('.md'));

    const enPages = fs.readdirSync(
      path.join(__dirname, '../../content/pages/en')
    ).filter(f => f.endsWith('.md'));

    const allFiles = [
      ...etPages.map(f => `et/${f}`),
      ...enPages.map(f => `en/${f}`)
    ];

    expect(allFiles).toHaveLength(35);

    const errors: { file: string; error: string }[] = [];

    allFiles.forEach(file => {
      const fullPath = path.join(__dirname, '../../content/pages', file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(content);

      try {
        PageFrontmatterSchema.parse(data);
      } catch (e) {
        errors.push({ file, error: String(e) });
      }
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid frontmatter', () => {
    const invalidData = {
      title: '',  // Empty title should fail
      slug: 'test',
      language: 'fr',  // Invalid language
      description: 'Test',
      type: 'invalid',  // Invalid type
      status: 'published'
    };

    expect(() => PageFrontmatterSchema.parse(invalidData)).toThrow();
  });
});
```

---

### Step 4: Create Package Configuration

**File**: `packages/types/package.json`

```json
{
  "name": "@zuga/types",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/content.ts",
  "types": "./src/content.ts",
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**File**: `packages/types/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Step 5: Quality Checks (Ada's Standards)

Before marking complete, run ALL quality checks:

```bash
# Step 5.1: Type checking
cd packages/types
pnpm type-check

# Step 5.2: Run tests
pnpm test

# Step 5.3: Verify all 35 markdown files pass validation
pnpm test -- --reporter=verbose

# Step 5.4: Check VS Code Problems panel
# Expected: 0 errors (clean baseline)
```

**Quality Gates** (Non-Negotiable):

- [ ] TypeScript compiles with no errors (`tsc --noEmit`)
- [ ] All tests pass (35/35 markdown files validated)
- [ ] Zod schemas match Pydantic models exactly
- [ ] Cross-reference comments link to Python sources
- [ ] Problems panel shows 0 errors
- [ ] No `any` types without justification

---

### Step 6: Update Documentation

**File**: `packages/types/README.md`

Document:

- Purpose: Type-safe frontmatter parsing for Next.js
- Source of truth: Pydantic models in `scripts/extraction_models.py`
- Sync strategy: Manual updates when Pydantic changes
- Usage examples: How to parse markdown in Next.js components
- Validation: How to use Zod schemas

**File**: `docs/MARKDOWN_FORMAT_SPEC.md`

Add section:

- **TypeScript Types**: Link to `packages/types/src/content.ts`
- **Validation**: Explain Zod runtime validation
- **Testing**: How types are validated against actual markdown files

---

## Acceptance Criteria

**Definition of Done**:

- [ ] TypeScript interfaces created for all Pydantic models used in frontmatter
- [ ] Zod schemas provide runtime validation
- [ ] All 35 markdown files pass validation tests
- [ ] Cross-reference comments link TypeScript ↔ Pydantic
- [ ] Package exports types for consumption by Next.js app
- [ ] Tests achieve 100% coverage of type definitions
- [ ] Quality checks pass (see Step 5)
- [ ] Documentation updated (README + spec)
- [ ] Problems panel clean (0 errors)

**Deliverables**:

1. `packages/types/src/content.ts` - TypeScript interfaces
2. `packages/types/src/validators.ts` - Zod schemas
3. `packages/types/src/content.test.ts` - Validation tests
4. `packages/types/package.json` - Package configuration
5. `packages/types/tsconfig.json` - TypeScript config
6. `packages/types/README.md` - Updated documentation

---

## Implementation Notes

### Priority Order

1. **Start with `PageFrontmatter`** - This unblocks Next.js homepage
2. **Add `MediaItem` and `VideoEmbed`** - Needed for gallery/video rendering
3. **Add remaining types** - Complete the type system

### Testing Strategy

**Why test against real files?**

- Ensures types match actual data structure
- Catches discrepancies between Pydantic output and TypeScript expectations
- Provides confidence for future schema changes
- Documents real-world usage patterns

**Edge cases to test**:

- Missing optional fields (gallery, videos, translated)
- Invalid enums (language: "fr", type: "invalid")
- Malformed URLs (hero_image: "not-a-url")
- Empty required fields (title: "", description: "")

### Sync Protocol

**When Pydantic models change**:

1. Update corresponding TypeScript interface
2. Update Zod schema if validation rules changed
3. Run test suite to catch breaking changes
4. Update cross-reference comments if model moved/renamed

**Communication**:

Add comment in `extraction_models.py`:

```python
class ExtractedPage(BaseModel):
    """
    SYNC NOTE: TypeScript types in packages/types/src/content.ts
    must be updated when this model changes.

    Run: cd packages/types && pnpm test
    """
```

---

## Related Issues

- Blocks: #[Next.js Homepage Implementation]
- Depends on: Content conversion pipeline (COMPLETE)
- Related: `docs/MARKDOWN_FORMAT_SPEC.md` (format specification)

---

## Questions for Clarification

1. **Frontmatter extensions**: Do we need UI-specific fields (e.g., `isLoading`, `lastEdited`)?
2. **Validation strictness**: Fail on unknown fields or allow extras?
3. **Package naming**: `@zuga/types` vs `@zuga.ee/types`?
4. **Export strategy**: Named exports vs default export?

---

## Estimated Effort

- **Step 1** (Type definitions): 1 hour
- **Step 2** (Zod validators): 1 hour
- **Step 3** (Tests): 2 hours
- **Step 4** (Package setup): 30 minutes
- **Step 5** (Quality checks): 30 minutes
- **Step 6** (Documentation): 30 minutes

**Total**: ~5.5 hours

---

## Success Metrics

**Before this issue**:

- Next.js has no type safety for markdown frontmatter
- Manual parsing prone to runtime errors
- No validation of content structure

**After this issue**:

- Type-safe frontmatter parsing in Next.js components
- Runtime validation catches malformed content at load time
- 100% test coverage across all 35 markdown files
- Clear sync protocol between Pydantic and TypeScript
- Foundation for rapid Next.js feature development
