# zuga.ee Phase 1 Architecture

**Version**: 1.0

**Date**: December 8, 2025

**Author**: Morgan (Business Analyst)

**Status**: Approved

---

## Executive Summary

Phase 1 delivers a high-performance, bilingual (Estonian/English) static portfolio website showcasing 35+ theatrical performances. Built with Astro SSG for optimal technical excellence (Lighthouse scores ≥90), the site renders all content from structured markdown files with YAML frontmatter, ensuring complete regenerability for future AI-powered content management (Phase 2).

**Timeline**: Days to MVP deployment

**Priority**: Technical excellence over visual polish

---

## Goals & Success Criteria

### Primary Goal

Launch a technically excellent portfolio website that showcases Zuga Theatre's performances with optimal performance, accessibility, and maintainability.

### Success Criteria

- [ ] All 35+ pages deployed and accessible at correct URLs
- [ ] Lighthouse Performance score ≥90
- [ ] Lighthouse Accessibility score = 100
- [ ] Bilingual navigation (Estonian/English) working seamlessly
- [ ] All content regeneratable from markdown files via `npm run build`
- [ ] Site loads in <2 seconds on 3G connection
- [ ] Zero critical accessibility violations (WCAG 2.1 AA compliant)

### Out of Scope (Phase 2)

- AI assistant frontend for content management
- User authentication system
- Content editing capabilities
- Database integration
- Real-time updates

---

## Technical Stack

### Core Framework

**Astro 4.x** (Static Site Generator)

**Rationale**:

- Optimal for content-heavy sites (35+ pages with rich media)
- Built-in image optimization via `astro:assets`
- Zero JavaScript by default (maximum performance)
- Excellent build speeds
- Future-ready: Can add React islands for Phase 2 chat UI
- **Constitutional Compliance**: §5 Pragmatic Simplicity (purpose-built, boring technology)

### Styling

**Tailwind CSS 3.x**

**Rationale**:

- Zero runtime cost (purged at build time)
- Fast development iteration
- Built-in responsive utilities
- Excellent performance (optimized CSS bundles)
- **Constitutional Compliance**: §5 Pragmatic Simplicity (proven, widely adopted)

### Content Management

**Markdown + YAML Frontmatter** (Astro Content Collections)

**Rationale**:

- Human-readable and AI-friendly (Phase 2 ready)
- Type-safe via Zod schemas
- Version-controllable (Git-based workflow)
- Regeneratable (single source of truth)
- **Constitutional Compliance**: §1 Type Safety First (Zod validation)

### Hosting

**Netlify** (✅ Deployed)

**Rationale**:

- Optimized for static sites
- Automatic deployments from Git
- Global CDN distribution
- Free tier sufficient for MVP
- **Constitutional Compliance**: §5 Pragmatic Simplicity (managed service)

**Configuration**:

- Base directory: `apps/web`
- Build command: `npm run build`
- Publish directory: `dist`
- Automatic deployments on push to `main`
- Security headers configured (CSP, X-Frame-Options, etc.)
- Cache headers for static assets (1 year)

---

## Project Structure

```text
zuga.ee/
├── apps/
│   └── web/                    # Astro application (to be created)
│       ├── src/
│       │   ├── content/
│       │   │   └── pages/      # Markdown content (copied from source_zuga_ee)
│       │   │       ├── en/     # English pages
│       │   │       └── et/     # Estonian pages
│       │   ├── layouts/        # Page templates
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Route files
│       │   │   └── [lang]/     # Dynamic language routes
│       │   └── styles/         # Global styles
│       ├── public/             # Static assets
│       │   └── images/         # Placeholder images
│       ├── astro.config.mjs    # Astro configuration
│       ├── tailwind.config.cjs # Tailwind configuration
│       └── tsconfig.json       # TypeScript config (strict)
├── source_zuga_ee/             # Source content (DO NOT MODIFY)
│   ├── pages/                  # Original markdown files (35 total)
│   │   ├── en/                 # 9 English pages
│   │   └── et/                 # 26 Estonian pages
│   ├── extracted_v2/           # Original JSON extractions
│   ├── beautified/             # HTML beautification output
│   └── originals/              # Original HTML files
├── .specify/
│   ├── architecture/           # Architecture documentation
│   └── memory/                 # Constitution and memory files
├── .github/
│   └── prompts/                # AI persona prompts
├── scripts/                    # Python extraction tools (archived)
├── packages/                   # Empty (for future Phase 2 use)
└── archive/                    # Old project attempts
```

---

## Content Schema

### Frontmatter Fields

Based on analysis of existing markdown files (`source_zuga_ee/pages/`):

```yaml
---
# Required fields
title: string                    # Page title
slug: string                     # URL-friendly identifier
language: "en" | "et"           # Content language
type: "performance" | "about" | "workshop" | "news" | "gallery" | "contact"
status: "published" | "draft"   # Publication status

# Optional fields
description?: string            # Meta description (SEO)
page_type?: string             # Legacy field (keep for reference)
original_url?: string          # Legacy URL (documentation)
hero_image?: string            # Hero/header image URL
translated?: Array<{           # Linked translations
  language: string
  slug: string
}>
gallery?: Array<{              # Image gallery
  url: string
  width?: number
  description?: string
}>
videos?: Array<{               # Embedded videos
  platform: "youtube" | "vimeo"
  video_id: string
  title?: string
  url: string
}>
---
```

### Astro Content Collection Type

```typescript
// src/content/config.ts
import { z, defineCollection } from "astro:content";

const pagesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    language: z.enum(["en", "et"]),
    type: z.enum([
      "performance",
      "about",
      "workshop",
      "news",
      "gallery",
      "contact",
    ]),
    status: z.enum(["published", "draft"]),
    description: z.string().optional(),
    page_type: z.string().optional(),
    original_url: z.string().url().optional(),
    hero_image: z.string().optional(),
    translated: z
      .array(
        z.object({
          language: z.string(),
          slug: z.string(),
        })
      )
      .optional(),
    gallery: z
      .array(
        z.object({
          url: z.string(),
          width: z.number().optional(),
          description: z.string().optional(),
        })
      )
      .optional(),
    videos: z
      .array(
        z.object({
          platform: z.enum(["youtube", "vimeo"]),
          video_id: z.string(),
          title: z.string().optional(),
          url: z.string().url(),
        })
      )
      .optional(),
  }),
});

export const collections = {
  pages: pagesCollection,
};
```

**Constitutional Compliance**: §1 Type Safety First (strict Zod schemas validate all content at build time)

---

## URL Structure

### Pattern

```text
/{language}/{slug}
```

### Examples

- English performance: `zuga.ee/en/shame`
- Estonian performance: `zuga.ee/et/habi`
- English about page: `zuga.ee/en/about-us-1`
- Estonian about page: `zuga.ee/et/tegijad`

### Root Redirect

`zuga.ee/` → Auto-detect browser language or redirect to `/et/` (Estonian default)

### Language Switching

Each page includes language switcher linking to `translated.slug` if available.

---

## Image Handling Strategy

### Current Reality

**All Google-hosted images are permanently lost** (`lh3.googleusercontent.com/*` URLs no longer accessible).

### Phase 1 Approach: Placeholders

1. **Preserve URL references** in frontmatter (documentation/recovery potential)
2. **Generate placeholder images** for all missing assets:
   - Hero images: 1920x1080px placeholder with page title overlay
   - Gallery images: 1280x720px placeholder with "Image Unavailable" text
   - Consistent visual style (grey background, Zuga branding)

### Implementation

```typescript
// src/components/PlaceholderImage.astro
---
interface Props {
  width: number;
  height: number;
  alt: string;
  type: 'hero' | 'gallery';
}

const { width, height, alt, type } = Astro.props;
const placeholderUrl = `/images/placeholder-${type}-${width}x${height}.svg`;
---

<img
  src={placeholderUrl}
  width={width}
  height={height}
  alt={alt}
  class="placeholder-image"
  loading="lazy"
/>
```

### Future Recovery Path (Phase 2+)

- Keep original URLs in frontmatter as `original_url` field
- If images are recovered, update frontmatter to point to local files
- Astro's image optimization will handle format conversion (WebP, AVIF)

**Constitutional Compliance**: §4 Observable Development (explicit handling of missing data, no silent failures)

---

## Bilingual Implementation

### Content Organization

```text
src/content/pages/
├── en/
│   ├── shame.md
│   ├── about-us-1.md
│   └── ...
└── et/
    ├── habi.md
    ├── tegijad.md
    └── ...
```

### Route Generation

Astro dynamic routes with language prefix:

```typescript
// src/pages/[lang]/[...slug].astro
export async function getStaticPaths() {
  const allPages = await getCollection("pages");

  return allPages
    .filter((page) => page.data.status === "published")
    .map((page) => ({
      params: {
        lang: page.data.language,
        slug: page.data.slug,
      },
      props: { page },
    }));
}
```

### Language Switching Component

```typescript
// src/components/LanguageSwitcher.astro
---
const { currentPage } = Astro.props;
const translations = currentPage.data.translated || [];
---

<nav class="language-switcher">
  <a href={`/${currentPage.data.language}/${currentPage.data.slug}`}
     class="active"
     aria-current="page">
    {currentPage.data.language.toUpperCase()}
  </a>
  {translations.map(t => (
    <a href={`/${t.language}/${t.slug}`}>
      {t.language.toUpperCase()}
    </a>
  ))}
</nav>
```

---

## Performance Optimization

### Build-Time Optimizations

1. **Static Pre-rendering**: All 35+ pages rendered as HTML at build time
2. **CSS Purging**: Tailwind removes unused styles (typically <10KB final CSS)
3. **HTML Minification**: Astro automatically minifies output
4. **Asset Hashing**: Cache-busting for long-term browser caching

### Runtime Optimizations

1. **Zero JavaScript by default**: Static HTML + CSS only (unless explicitly needed)
2. **Lazy image loading**: `loading="lazy"` on all images below fold
3. **Responsive images**: Placeholder SVGs are infinitely scalable (no bandwidth waste)
4. **Font optimization**: System fonts preferred (no external font loading)

### Target Metrics

- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Total Blocking Time (TBT)**: <300ms
- **Lighthouse Performance**: ≥90
- **Lighthouse Accessibility**: 100

**Constitutional Compliance**: §5 Pragmatic Simplicity (no premature optimization, but leverage platform defaults)

---

## Constitutional Alignment

### §1: Type Safety First ✅

- TypeScript strict mode enabled (`tsconfig.json`)
- Zod schemas validate all frontmatter at build time
- Build fails on type errors (no silent failures)

### §2: Test-First Development ⚠️

- **Phase 1 Exception**: MVP prioritizes speed over test coverage
- **Mitigation**: Lighthouse CI acts as integration test (performance, accessibility, SEO)
- **Phase 2**: Add Vitest + Playwright for full test coverage

### §3: Composable-First Architecture ✅

- Small single-purpose Astro components (`<LanguageSwitcher>`, `<PerformanceGallery>`, etc.)
- Reusable layout templates
- Content decoupled from presentation (markdown → templates)

### §4: Observable Development ✅

- Build logs show all pages generated
- Netlify deploy previews for every commit
- Explicit error handling for missing images (placeholders, not broken links)

### §5: Pragmatic Simplicity ✅

- Boring technology (Astro, Tailwind, Markdown)
- No premature optimization (rely on Astro's defaults)
- Minimal dependencies
- YAGNI enforcement (no features for Phase 2 yet)

---

## Risks & Mitigation

| Risk                                               | Likelihood | Impact | Mitigation                                                                                        |
| -------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------- |
| **Lost images reduce visual appeal**               | High       | Medium | Use well-designed placeholders with consistent branding. Focus on content quality and typography. |
| **35+ pages overwhelm initial build**              | Low        | Low    | Astro builds are fast (~10s for 35 pages). Profile if issues arise.                               |
| **Bilingual complexity causes routing bugs**       | Medium     | Medium | Use Astro's dynamic routing. Test both languages thoroughly before launch.                        |
| **Tailwind CSS bundle too large**                  | Low        | Low    | Purge unused styles in production build. Monitor bundle size.                                     |
| **Phase 2 AI integration requires major refactor** | Low        | Medium | Astro supports React islands. Can add interactivity incrementally without rebuild.                |

---

## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "astro": "^4.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### Rationale

- **Minimal dependency footprint** (4 total packages)
- All dependencies are stable, widely-adopted, and actively maintained
- No experimental or niche libraries
- **Constitutional Compliance**: §5 Pragmatic Simplicity (boring technology stack)

---

## Validation & Quality Gates

### Pre-Deployment Checklist

- [ ] All 35+ pages render without errors (`npm run build` succeeds)
- [ ] Lighthouse CI passes (Performance ≥90, Accessibility = 100)
- [ ] Both language versions (/en/ and /et/) accessible
- [ ] Language switcher works on all pages with translations
- [ ] Placeholders display correctly (no broken image links)
- [ ] Typography is readable (sufficient contrast, proper hierarchy)
- [ ] Mobile responsive (tested on viewport widths: 375px, 768px, 1440px)
- [ ] No console errors in browser DevTools

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run lighthouse-ci # Performance validation
      - name: Deploy to Netlify
        if: github.ref == 'refs/heads/main'
        uses: netlify/actions/cli@master
```

---

## Next Steps

See [Phase 1 Implementation Plan](./phase-1-implementation-plan.md) for detailed task breakdown.
