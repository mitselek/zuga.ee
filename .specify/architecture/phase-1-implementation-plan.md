# zuga.ee Phase 1 Implementation Plan

**Version**: 1.0

**Date**: December 8, 2025

**Author**: Morgan (Business Analyst)

**Timeline**: 3-5 days to MVP deployment

---

## Overview

This plan breaks down Phase 1 (Static Portfolio Website) into concrete, executable tasks. Each phase includes validation steps to ensure constitutional compliance and technical quality.

---

## Phase 1: Project Initialization (Day 1 - Morning)

**Goal**: Set up Astro project with proper monorepo structure and tooling.

### Tasks

- [ ] **1.1**: Initialize Astro project in `apps/web/`
  - Run: `npm create astro@latest apps/web -- --template minimal --typescript strict --no-git`
  - Verify: TypeScript strict mode enabled in `tsconfig.json`
  - **Constitution Check**: §1 Type Safety First

- [ ] **1.2**: Install and configure Tailwind CSS
  - Run: `npx astro add tailwind`
  - Create `tailwind.config.cjs` with Zuga brand colors (define later)
  - **Constitution Check**: §5 Pragmatic Simplicity

- [ ] **1.3**: Set up monorepo workspace
  - Update root `package.json` with workspace: `["apps/*", "packages/*"]`
  - Add scripts: `"dev": "npm run dev -w apps/web"`, `"build": "npm run build -w apps/web"`
  - Verify: `npm install` resolves workspace structure

- [ ] **1.4**: Configure TypeScript strict mode
  - Ensure `apps/web/tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`
  - **Constitution Check**: §1 Type Safety First

### Validation

```bash
cd apps/web
npm run dev  # Should start Astro dev server on localhost:4321
npm run build  # Should complete without TypeScript errors
```

**Exit Criteria**: Astro dev server runs, TypeScript strict mode passes, Tailwind CSS loaded.

---

## Phase 2: Content Collections Setup (Day 1 - Afternoon)

**Goal**: Define type-safe content schema and copy markdown files.

### Tasks

- [ ] **2.1**: Create content collection schema
  - Create `apps/web/src/content/config.ts`
  - Define Zod schema matching frontmatter fields (see Architecture doc)
  - **Constitution Check**: §1 Type Safety First (Zod validation)

- [ ] **2.2**: Copy markdown files from source
  - Copy `source_zuga_ee/pages/en/*.md` → `apps/web/src/content/pages/en/`
  - Copy `source_zuga_ee/pages/et/*.md` → `apps/web/src/content/pages/et/`
  - Count: Should have 9 EN + 26 ET files (35 total)

- [ ] **2.3**: Validate content collection
  - Run: `npm run build`
  - Fix any Zod validation errors (frontmatter schema mismatches)
  - **Constitution Check**: §4 Observable Development (explicit validation errors)

- [ ] **2.4**: Create placeholder image generator script
  - Create `apps/web/scripts/generate-placeholders.ts`
  - Generate SVG placeholders for hero (1920x1080) and gallery (1280x720) types
  - Output to `apps/web/public/images/`

### Validation

```bash
npm run build  # Should show "Content collection 'pages' validated: 35 entries"
ls apps/web/public/images/  # Should show placeholder SVGs
```

**Exit Criteria**: All 35 markdown files validated, placeholders generated, no build errors.

---

## Phase 3: Page Routes & Layouts (Day 2 - Morning)

**Goal**: Implement dynamic routing for bilingual pages with reusable layouts.

### Tasks

- [ ] **3.1**: Create base layout
  - Create `apps/web/src/layouts/BaseLayout.astro`
  - Include: HTML boilerplate, meta tags, language switcher slot
  - Add global styles: System font stack, base typography

- [ ] **3.2**: Create performance layout
  - Create `apps/web/src/layouts/PerformanceLayout.astro`
  - Extends `BaseLayout.astro`
  - Slots: hero, gallery, video, content
  - **Constitution Check**: §3 Composable-First Architecture

- [ ] **3.3**: Implement dynamic routes
  - Create `apps/web/src/pages/[lang]/[...slug].astro`
  - Implement `getStaticPaths()` to generate routes from content collection
  - Filter: Only `status: "published"` pages
  - **Constitution Check**: §1 Type Safety First (TypeScript params)

- [ ] **3.4**: Create language switcher component
  - Create `apps/web/src/components/LanguageSwitcher.astro`
  - Use `translated` frontmatter field to link language versions
  - Style with Tailwind (accessible focus states)

### Validation

```bash
npm run dev
# Visit http://localhost:4321/en/shame
# Visit http://localhost:4321/et/habi
# Verify: Both pages render, language switcher works
```

**Exit Criteria**: All 35 pages accessible at correct URLs, language switching functional.

---

## Phase 4: Component Development (Day 2 - Afternoon)

**Goal**: Build reusable UI components for galleries, videos, and navigation.

### Tasks

- [ ] **4.1**: Create placeholder image component
  - Create `apps/web/src/components/PlaceholderImage.astro`
  - Props: width, height, alt, type ('hero' | 'gallery')
  - Render appropriate placeholder SVG
  - **Constitution Check**: §3 Composable-First Architecture

- [ ] **4.2**: Create gallery component
  - Create `apps/web/src/components/PerformanceGallery.astro`
  - Render gallery items in responsive grid (CSS Grid or Flexbox)
  - Use `<PlaceholderImage>` for all images
  - Lazy loading: `loading="lazy"` on images

- [ ] **4.3**: Create video embed component
  - Create `apps/web/src/components/VideoEmbed.astro`
  - Support YouTube and Vimeo embeds
  - Responsive iframe wrapper (16:9 aspect ratio)
  - **Constitution Check**: §5 Pragmatic Simplicity (use platform embed APIs)

- [ ] **4.4**: Create navigation component
  - Create `apps/web/src/components/Navigation.astro`
  - List all page types (Performances, About, Workshops, News, Gallery, Contact)
  - Mobile-responsive hamburger menu (CSS-only if possible)

### Validation

```bash
npm run dev
# Visit performance page with gallery
# Verify: Gallery renders in grid, videos embed, navigation works on mobile
```

**Exit Criteria**: All components render correctly, responsive on mobile/tablet/desktop.

---

## Phase 5: Styling & Typography (Day 3)

**Goal**: Apply consistent visual design with Tailwind, ensuring accessibility.

### Tasks

- [ ] **5.1**: Define Tailwind theme
  - Update `tailwind.config.cjs` with Zuga brand colors
  - Define typography scale (headings, body text)
  - Set up spacing/sizing tokens

- [ ] **5.2**: Style performance pages
  - Hero section: Full-width placeholder with title overlay
  - Gallery grid: 2 columns mobile, 3-4 columns desktop
  - Typography: Readable font size (≥16px body text)

- [ ] **5.3**: Style navigation
  - Desktop: Horizontal nav bar with logo
  - Mobile: Hamburger menu (CSS-only toggle if possible)
  - Accessible: Focus states, ARIA labels

- [ ] **5.4**: Ensure WCAG 2.1 AA compliance
  - Color contrast: ≥4.5:1 for text, ≥3:1 for large text
  - Focus indicators: Visible on all interactive elements
  - Semantic HTML: Proper heading hierarchy (h1 → h2 → h3)
  - **Constitution Check**: §4 Observable Development (accessibility is observable quality)

### Validation

```bash
npm run build
npm run preview
# Test with Lighthouse: Accessibility score should be 100
# Test keyboard navigation: Tab through all interactive elements
```

**Exit Criteria**: Lighthouse Accessibility = 100, keyboard navigation works, visual design consistent.

---

## Phase 6: Performance Optimization (Day 4)

**Goal**: Achieve Lighthouse Performance ≥90.

### Tasks

- [ ] **6.1**: Optimize CSS
  - Enable Tailwind purge in production
  - Remove unused Tailwind classes
  - Verify CSS bundle <10KB gzipped

- [ ] **6.2**: Optimize HTML
  - Enable Astro minification in `astro.config.mjs`
  - Verify HTML output is minified

- [ ] **6.3**: Add Lighthouse CI
  - Install: `npm install -D @lhci/cli`
  - Create `.lighthouserc.json` with thresholds (Performance ≥90, Accessibility = 100)
  - Add script: `"lighthouse": "lhci autorun"`
  - **Constitution Check**: §2 Test-First Development (Lighthouse as integration test)

- [ ] **6.4**: Profile build performance
  - Run: `npm run build`
  - Measure: Build time should be <30s for 35 pages
  - If slow: Profile with `DEBUG=astro:* npm run build`

### Validation

```bash
npm run lighthouse
# Verify: Performance ≥90, Accessibility = 100, SEO ≥90
```

**Exit Criteria**: Lighthouse CI passes all thresholds, build completes in <30s.

---

## Phase 7: SEO & Meta Tags (Day 4 - Afternoon)

**Goal**: Optimize for search engines with proper meta tags and structured data.

### Tasks

- [ ] **7.1**: Add meta tags to BaseLayout
  - Title: `{page.data.title} | Zuga Theatre`
  - Description: `{page.data.description || 'Zuga Theatre performances'}`
  - OG tags: `og:title`, `og:description`, `og:image` (use placeholder)
  - Language: `<html lang={page.data.language}>`

- [ ] **7.2**: Generate sitemap
  - Install: `npx astro add sitemap`
  - Configure with both languages: `en`, `et`
  - Verify: `public/sitemap-0.xml` generated after build

- [ ] **7.3**: Create robots.txt
  - Create `apps/web/public/robots.txt`
  - Allow all: `User-agent: * / Allow: /`
  - Sitemap: `Sitemap: https://zuga.ee/sitemap-0.xml`

- [ ] **7.4**: Add structured data
  - Add JSON-LD schema for Organization
  - Add breadcrumbs schema for navigation
  - **Constitution Check**: §4 Observable Development (structured data is machine-readable)

### Validation

```bash
npm run build
# Check: apps/web/dist/sitemap-0.xml exists
# Check: robots.txt accessible at root
# Test with Google Structured Data Testing Tool
```

**Exit Criteria**: Sitemap generated, robots.txt accessible, structured data valid.

---

## Phase 8: Deployment Setup ✅ COMPLETED

**Goal**: Configure Netlify for automatic deployments.

### Tasks

- [x] **8.1**: Create Netlify configuration
  - Created `apps/web/netlify.toml`
  - Set base directory: `apps/web`
  - Set build command: `npm run build`
  - Set publish directory: `dist` (relative to base)
  - Security headers configured (X-Frame-Options, CSP, etc.)
  - Cache headers for static assets (31536000s)

- [x] **8.2**: Set up Netlify project
  - Connected GitHub repo to Netlify
  - Configured automatic deployments from `main` branch
  - Build status badge added to README

- [ ] **8.3**: Configure custom domain
  - Add custom domain: `zuga.ee`
  - Enable HTTPS (Let's Encrypt)
  - Verify DNS propagation

- [x] **8.4**: Add redirect rules
  - Configured in `netlify.toml`: `/ → /et/index` (302)
  - 404 handling via Astro's built-in support

### Validation

```bash
# Push to GitHub main branch
# Verify: Netlify deploys automatically
# Visit: https://zuga.ee
# Check: Redirects to /et/, all pages accessible
```

**Exit Criteria**: Site deployed to zuga.ee, HTTPS enabled, redirects working.

---

## Phase 9: Final Quality Assurance (Day 5 - Afternoon)

**Goal**: Comprehensive testing before public launch.

### Testing Checklist

#### Functional Testing

- [ ] All 35 pages accessible (manually spot-check 5-10 pages)
- [ ] Language switcher works on all pages with translations
- [ ] Navigation menu functional on desktop and mobile
- [ ] Video embeds load (test YouTube, Vimeo)
- [ ] Placeholder images display (no broken image icons)
- [ ] 404 page shows for non-existent URLs

#### Performance Testing

- [ ] Lighthouse Performance ≥90 (run on 5 random pages)
- [ ] Lighthouse Accessibility = 100 (run on all page types)
- [ ] Page load time <2s on 3G throttled connection
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s

#### Accessibility Testing

- [ ] Keyboard navigation works (tab through all interactive elements)
- [ ] Screen reader announces page structure correctly (test with NVDA/JAWS)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Focus indicators visible on all interactive elements
- [ ] Form labels associated (if any forms present)

#### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### SEO Testing

- [ ] Meta titles unique per page
- [ ] Meta descriptions present and descriptive
- [ ] Sitemap accessible at /sitemap-0.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] Structured data validates (Google Rich Results Test)

### Validation

```bash
# Run full Lighthouse CI suite
npm run lighthouse

# Check all Constitutional compliance
npm run build  # Should pass TypeScript strict mode (§1)
# Manual review: Components are small and single-purpose (§3)
# Manual review: Build logs show all pages generated (§4)
# Manual review: No premature optimization, boring tech stack (§5)
```

**Exit Criteria**: All testing checklists pass, Constitutional compliance verified.

---

## Phase 10: Launch & Monitoring (Day 5 - End)

**Goal**: Public launch with monitoring in place.

### Tasks

- [ ] **10.1**: Pre-launch announcement
  - Notify stakeholders of launch timeline
  - Share staging URL for final review

- [ ] **10.2**: Deploy to production
  - Merge PR to `main` branch
  - Verify Netlify deploys successfully
  - Smoke test: Visit zuga.ee, check 5 random pages

- [ ] **10.3**: Set up monitoring
  - Enable Netlify Analytics (basic traffic stats)
  - Add Google Analytics or Plausible (privacy-friendly)
  - Set up uptime monitoring (UptimeRobot or Netlify)

- [ ] **10.4**: Document launch
  - Update `README.md` with live URL
  - Create `CHANGELOG.md` entry for Phase 1
  - Archive this implementation plan

### Validation

```bash
# Visit https://zuga.ee
# Verify: Site loads, all core functionality works
# Check: Analytics tracking fires (test with browser dev tools)
```

**Exit Criteria**: Site live at zuga.ee, monitoring active, documentation updated.

---

## Rollback Plan

If critical issues discovered post-launch:

1. **Revert Netlify deployment** to previous version (one-click rollback)
2. **Fix issue** in development branch
3. **Test thoroughly** with Lighthouse CI
4. **Re-deploy** once validated

---

## Success Metrics (7 Days Post-Launch)

- [ ] **Uptime**: ≥99.9%
- [ ] **Performance**: Lighthouse scores maintained (Performance ≥90, Accessibility = 100)
- [ ] **Traffic**: Baseline established (track unique visitors, pageviews)
- [ ] **Errors**: Zero critical errors in browser console
- [ ] **Feedback**: Stakeholder satisfaction confirmed

---

## Phase 2 Readiness

After Phase 1 launch, prepare for Phase 2 (AI Assistant) by:

1. Documenting content schema changes needed for AI editing
2. Identifying which pages need interactive components (React islands)
3. Planning authentication system requirements
4. Defining AI assistant capabilities and permissions

**Next Steps**: See [Phase 2 Planning Document](./phase-2-planning.md) (to be created).
