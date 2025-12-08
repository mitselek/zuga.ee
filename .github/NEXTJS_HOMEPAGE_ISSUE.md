# Issue: Implement Next.js Homepage with Real Content

**Priority**: High (first user-facing feature)

**Assignee**: Developer

**Labels**: `feature`, `frontend`, `next.js`, `homepage`

**Depends on**: Issue #13 ✅ (TypeScript types complete), Issue #14 ✅ (Schema aligned)

---

## Context

All infrastructure is ready:

- ✅ 35 markdown files with validated YAML frontmatter
- ✅ TypeScript types package (`@zuga/types`) with Zod validation
- ✅ Schema 100% aligned between Python and TypeScript
- ✅ Next.js app skeleton ready at `apps/web/`
- ⏳ Homepage currently shows placeholder "Coming soon..."

**Goal**: Replace placeholder with real content from `packages/content/pages/et/index.md`

---

## Requirements

### Step 1: Install Dependencies

**File**: `apps/web/package.json`

Add markdown parsing libraries:

```bash
cd apps/web
pnpm add gray-matter next-mdx-remote zod
pnpm add -D @types/node
```

**Dependencies explained**:
- `gray-matter` - Parse YAML frontmatter from markdown files
- `next-mdx-remote` - Server-side MDX rendering for Next.js 14+
- `zod` - Runtime validation (re-use schemas from `@zuga/types`)

---

### Step 2: Create Content Loading Utilities

**File**: `apps/web/src/lib/content.ts`

Build type-safe content loaders:

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PageFrontmatterSchema, type PageFrontmatter } from '@zuga/types';

const CONTENT_DIR = path.join(process.cwd(), '../../packages/content/pages');

/**
 * Get all markdown files for a specific language.
 *
 * @param language - 'et' or 'en'
 * @returns Array of file slugs (without .md extension)
 */
export function getAllSlugs(language: 'et' | 'en'): string[] {
  const langDir = path.join(CONTENT_DIR, language);

  if (!fs.existsSync(langDir)) {
    console.warn(`Content directory not found: ${langDir}`);
    return [];
  }

  return fs.readdirSync(langDir)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace(/\.md$/, ''));
}

/**
 * Load and parse a markdown file with type-safe frontmatter.
 *
 * @param language - 'et' or 'en'
 * @param slug - File slug (without .md)
 * @returns Parsed page data with validated frontmatter
 * @throws Error if file not found or validation fails
 */
export function getPageBySlug(
  language: 'et' | 'en',
  slug: string
): { frontmatter: PageFrontmatter; content: string } {
  const filePath = path.join(CONTENT_DIR, language, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Page not found: ${language}/${slug}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContents);

  // Runtime validation with Zod
  const frontmatter = PageFrontmatterSchema.parse(data);

  return { frontmatter, content };
}

/**
 * Get homepage content (index.md) for a language.
 */
export function getHomePage(language: 'et' | 'en' = 'et') {
  return getPageBySlug(language, 'index');
}

/**
 * Get all pages of a specific type.
 *
 * @example
 * ```ts
 * const performances = getPagesByType('et', 'performance');
 * ```
 */
export function getPagesByType(
  language: 'et' | 'en',
  type: string
): Array<{ slug: string; frontmatter: PageFrontmatter; content: string }> {
  const slugs = getAllSlugs(language);

  return slugs
    .map(slug => {
      try {
        const page = getPageBySlug(language, slug);
        return { slug, ...page };
      } catch (error) {
        console.error(`Failed to load ${language}/${slug}:`, error);
        return null;
      }
    })
    .filter((page): page is NonNullable<typeof page> => page !== null)
    .filter(page => page.frontmatter.type === type);
}
```

**Tests**: `apps/web/src/lib/content.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getAllSlugs, getPageBySlug, getHomePage } from './content';

describe('Content loaders', () => {
  it('getAllSlugs returns markdown files', () => {
    const slugs = getAllSlugs('et');
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs).toContain('index');
  });

  it('getHomePage loads index.md', () => {
    const page = getHomePage('et');
    expect(page.frontmatter.title).toBe('Zuga');
    expect(page.frontmatter.language).toBe('et');
    expect(page.frontmatter.slug).toBe('index');
  });

  it('getPageBySlug validates frontmatter', () => {
    const page = getPageBySlug('et', 'index');

    // Required fields present
    expect(page.frontmatter.title).toBeDefined();
    expect(page.frontmatter.slug).toBe('index');
    expect(page.frontmatter.description).toBeDefined();
    expect(page.frontmatter.original_url).toBeDefined();
  });

  it('throws error for missing page', () => {
    expect(() => getPageBySlug('et', 'nonexistent')).toThrow('Page not found');
  });
});
```

---

### Step 3: Implement Homepage Component

**File**: `apps/web/src/app/page.tsx`

Replace placeholder with real content:

```tsx
import { getHomePage, getPagesByType } from '@/lib/content';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const { frontmatter, content } = getHomePage('et');
  const performances = getPagesByType('et', 'performance').slice(0, 3);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="hero relative h-[60vh] flex items-center justify-center bg-gray-900 text-white">
        {frontmatter.hero_image && (
          <div className="absolute inset-0 opacity-40">
            <Image
              src={frontmatter.hero_image}
              alt={frontmatter.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl font-bold mb-4">{frontmatter.title}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {frontmatter.description}
          </p>
        </div>
      </section>

      {/* Video Section */}
      {frontmatter.videos && frontmatter.videos.length > 0 && (
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Video</h2>
          <div className="aspect-video max-w-4xl mx-auto">
            <iframe
              src={frontmatter.videos[0].url}
              title={frontmatter.videos[0].title}
              className="w-full h-full rounded-lg shadow-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Featured Performances */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Etendused</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {performances.map((perf) => (
              <Link
                key={perf.slug}
                href={`/et/${perf.slug}`}
                className="group"
              >
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  {perf.frontmatter.hero_image && (
                    <div className="relative h-48">
                      <Image
                        src={perf.frontmatter.hero_image}
                        alt={perf.frontmatter.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {perf.frontmatter.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3">
                      {perf.frontmatter.description}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      {frontmatter.gallery && frontmatter.gallery.length > 0 && (
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Galerii</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {frontmatter.gallery.slice(0, 8).map((image, idx) => (
              <div key={idx} className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.description || `Gallery image ${idx + 1}`}
                  fill
                  className="object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p className="text-gray-400">
          © {new Date().getFullYear()} Zuga
        </p>
      </footer>
    </main>
  );
}
```

---

### Step 4: Add Basic Styling

**File**: `apps/web/src/app/globals.css`

Add minimal utility classes (Tailwind already configured):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply antialiased;
  }

  body {
    @apply bg-white text-gray-900;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-bold;
  }
}

@layer utilities {
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

**Next.js Image Configuration**:

**File**: `apps/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
        pathname: '/embed/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

### Step 5: Update Package References

**File**: `apps/web/package.json`

Ensure monorepo package reference:

```json
{
  "dependencies": {
    "@zuga/types": "workspace:*",
    "gray-matter": "^4.0.3",
    "next": "^14.0.0",
    "next-mdx-remote": "^4.4.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.4"
  }
}
```

If using pnpm workspaces, update root `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

### Step 6: Test and Verify

**Development server**:

```bash
cd apps/web
pnpm dev
```

Open http://localhost:3000

**Checklist**:
- [ ] Homepage loads without errors
- [ ] Hero section displays title + hero_image
- [ ] Video iframe embeds YouTube video
- [ ] Featured performances show 3 cards with images
- [ ] Gallery shows 8 preview images
- [ ] All images load from Google Photos CDN
- [ ] Links to performances work (even if 404 - pages not implemented yet)
- [ ] Responsive layout works on mobile
- [ ] No console errors
- [ ] TypeScript compiles without errors

**Unit tests**:

```bash
cd apps/web
pnpm test
```

Expected: All content loader tests pass (4/4)

---

## Quality Checks

Before marking complete:

```bash
# Type check
cd apps/web
pnpm type-check

# Run tests
pnpm test

# Lint
pnpm lint

# Build production bundle
pnpm build

# Start production server
pnpm start
```

**Expected**:
- [ ] TypeScript: 0 compilation errors
- [ ] Tests: 4/4 passing (content loaders)
- [ ] Lint: 0 warnings
- [ ] Build: Success (no errors)
- [ ] Production: Page loads correctly

---

## Acceptance Criteria

**Definition of Done**:

- [ ] Dependencies installed (gray-matter, next-mdx-remote)
- [ ] Content loading utilities created and tested
- [ ] Homepage component displays real content from index.md
- [ ] Hero section with title + hero_image
- [ ] Video section with YouTube embed
- [ ] Featured performances grid (3 cards)
- [ ] Gallery preview (8 images)
- [ ] Responsive design (mobile + desktop)
- [ ] All images load correctly
- [ ] Type-safe content loading (uses @zuga/types)
- [ ] Tests pass (content loaders)
- [ ] Production build succeeds
- [ ] No console errors

**Deliverables**:

1. `apps/web/src/lib/content.ts` - Content loading utilities
2. `apps/web/src/lib/content.test.ts` - Unit tests
3. `apps/web/src/app/page.tsx` - Homepage component
4. `apps/web/next.config.js` - Image domain configuration
5. `apps/web/package.json` - Updated dependencies

---

## Success Metrics

**Before**:
- ❌ Placeholder "Coming soon..." page
- ❌ No real content displayed
- ❌ No content loading utilities

**After**:
- ✅ Real homepage with content from markdown
- ✅ Hero section with video and images
- ✅ Featured performances preview
- ✅ Gallery preview
- ✅ Type-safe content loading
- ✅ Foundation for all other pages

---

## Implementation Notes

### Performance Considerations

**Static Generation** (recommended for homepage):

```tsx
// apps/web/src/app/page.tsx
export const revalidate = 3600; // Revalidate every hour

// OR for true static site generation:
export const dynamic = 'force-static';
```

**Why static**:
- Homepage content changes infrequently
- Instant page loads (pre-rendered HTML)
- Better SEO
- Lower server costs

### Content Path Resolution

The content loading utilities use relative paths from `apps/web/`:

```
apps/web/
  ├── src/app/page.tsx
  └── ../../packages/content/pages/
```

This works in monorepo structure. If deploying as standalone, copy content folder to `apps/web/content/` and update `CONTENT_DIR` constant.

### Image Optimization

Next.js `<Image>` component automatically:
- Lazy loads images
- Serves WebP format
- Generates responsive srcsets
- Optimizes Google Photos URLs

Configure in `next.config.js` to allow external domains.

### Error Handling

Content loaders throw errors for missing pages. Wrap in try-catch for production:

```tsx
export default function Home() {
  try {
    const page = getHomePage('et');
    return <HomePage page={page} />;
  } catch (error) {
    return <ErrorPage error={error} />;
  }
}
```

Or use Next.js error boundaries:

```tsx
// apps/web/src/app/error.tsx
export default function Error({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  );
}
```

### Bilingual Support (Future)

Homepage currently loads Estonian (`et`) content. For bilingual:

1. Add language switcher component
2. Use Next.js internationalization (i18n)
3. Load content based on locale: `getHomePage(locale)`

Defer to future issue - focus on Estonian homepage first.

---

## Related Issues

- Depends on: Issue #13 ✅ (TypeScript types)
- Depends on: Issue #14 ✅ (Schema alignment)
- Blocks: Individual page routes (performance, about, etc.)
- Blocks: Navigation component
- Blocks: Bilingual language switcher

---

## Timeline Estimate

- Step 1 (Dependencies): 5 minutes
- Step 2 (Content loaders): 1 hour
- Step 3 (Homepage component): 1.5 hours
- Step 4 (Styling): 30 minutes
- Step 5 (Configuration): 15 minutes
- Step 6 (Testing): 30 minutes

**Total**: ~4 hours (single session)

---

## Questions for Clarification

1. **Language**: Start with Estonian (et) or English (en) homepage?
   - Recommendation: Estonian (primary audience)

2. **Featured performances**: Show 3 random or specific ones?
   - Recommendation: First 3 by slug order (alphabetical)

3. **Gallery preview**: 8 images or all?
   - Recommendation: 8 images (better page load performance)

4. **Video**: Embed first video or all?
   - Recommendation: First video only (index.md has 1 video)

5. **Deployment target**: Vercel, Netlify, self-hosted?
   - Impacts: Image optimization, caching strategy
