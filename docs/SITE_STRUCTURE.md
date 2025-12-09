# ZUGA.ee Site Structure

## Terminology

### Page Hierarchy

- **Homepage** - Single long-scrollable page with all sections
- **Section** - Content category (performances, workshops, about, gallery, contact)
- **Detail** - Individual performance/workshop page

### Navigation

- **Main nav** - Top navigation (will become anchor links to sections)
- **Section listing** - Collection of detail pages within each section

---

## Current Structure (Multi-page)

```text
/et/index                    [Homepage - type: landing]
/et/etendused-suurtele       [Section page - type: landing]
  ├─ /et/etendused-suurtele-mura        [Detail - type: performance]
  ├─ /et/etendused-suurtele-habi        [Detail - type: performance]
  └─ /et/etendused-suurtele-suur-teadmatus  [Detail - type: performance]
/et/etendused-noorele-publikule  [Section page - type: landing]
  ├─ /et/etendused-noorele-publikule-2-2-22  [Detail - type: performance]
  └─ ...
/et/workshopid               [Section page - type: landing]
  ├─ /et/workshopid-meelekolu-mangud...  [Detail - type: workshop]
  └─ ...
/et/tegijad                  [Page - type: about]
/et/galerii                  [Page - type: gallery]
/et/kontakt-2                [Page - type: contact]
```

### Current Navigation

```text
Main Nav: [Avaleht] [Etendused] [Töötoad] [Tegijad] [Galerii] [Kontakt]
              ↓          ↓           ↓         ↓         ↓        ↓
          Separate   Separate    Separate  Separate  Separate  Separate
           page       page        page      page      page      page
```

---

## Proposed Structure (Long-scroll Homepage)

### Vision

Single scrollable homepage with sections, detail pages remain separate routes.

```text
/et/index (long scroll)
├─ Hero Section
├─ Performances Section
│   ├─ Sub-section: Suurtele (cards inline)
│   │   └─ Click → /et/etendused-suurtele-mura
│   └─ Sub-section: Noorele Publikule (cards inline)
│       └─ Click → /et/etendused-noorele-publikule-2-2-22
├─ Workshops Section (cards inline)
│   └─ Click → /et/workshopid-meelekolu-mangud...
├─ About Section (inline content)
├─ Gallery Section (inline)
└─ Contact Section (inline)
```

### New Navigation (Implemented)

**Desktop:** Floating pill navigator

- **Position**: Starts below header, scrolls up with page, then sticks at top-left (sticky positioning)
- **Collapsed state**: Shows current section name with faded prev/next sections
- **Smooth transitions**: Section names update automatically as user scrolls
- **Expandable**: Click to reveal all sections
- **Interactive**: Click section to navigate, auto-collapses after selection
- **Scroll tracking**: Position-based detection using getBoundingClientRect
- **Algorithm**: Selects section whose top edge is closest to (but above) viewport center

**Mobile:** Sticky header with hamburger menu

- Traditional mobile menu (unchanged from Phase 3.3)
- Hamburger icon in header
- Full navigation menu slides down on click

**Header Differences:**

- **Desktop**: Static header, logo + language switcher only
- **Mobile**: Sticky header, logo + language switcher + hamburger

```text
Desktop: [Floating Pill]     Mobile: [Logo] [☰]
         ┌─────────┐                 ↓
         │  Meist  │              [Full Nav Menu]
         │Etendused│
         │Töötoad  │
         └─────────┘
         Click to expand
              ↓
         ┌─────────┐
         │ Avaleht │
         │Etendused│
         │ •Suurtele
         │ •Noorele
         │Töötoad  │
         │  Meist  │
         │ Galerii │
         │ Kontakt │
         └─────────┘
```

---

## Design Questions

### 1. Detail Pages

- [x] **Separate routes?** (e.g., `/et/etendused/mura`)
- [ ] **Modal overlays?** (open on homepage)
- [ ] **Full page but with back-to-section link?**

**Decision:** Traditional approach - Full detail pages with separate routes. Homepage shows preview cards that link to full detail pages. Simpler, better for SEO, and more accessible.

---

### 2. Language Switching

- [x] **Still `/et/` and `/en/` routes?**
- [x] **One homepage per language?** (`/et/` and `/en/`)
- [x] **Language switcher behavior on detail pages?** Check if translated version exists, otherwise go to homepage.

**Decision:** Keep current bilingual routing. Detail pages use `translated` frontmatter field to link language versions. If translation missing, language switcher redirects to homepage.

---

### 3. Section Content Display

- [ ] **Full listings** - Show all performances/workshops on homepage
- [x] **Featured subset** - Show 3-5 items per category
- [x] **Categorized** - Keep "Suurtele" vs "Noorele Publikule" grouping
- [ ] **Flat list** - All performances together

**Decision:** Featured subset (3-5 cards) per subcategory on homepage, with categorized grouping. Each card links to full detail page.

---

### 4. Type Field Restructuring

#### Option A: Semantic Types (Current)

```typescript
type: "landing" |
  "performance" |
  "workshop" |
  "about" |
  "gallery" |
  "contact" |
  "news";
```

**Pros:** Describes content nature
**Cons:** Doesn't reflect hierarchy

#### Option B: Hierarchical Types (New and preferred)

```typescript
type: "home" | "section" | "detail";
category: "performance" | "workshop" | "about" | "gallery" | "contact" | "news";
```

**Pros:** Clear hierarchy + content type
**Cons:** More fields to maintain

#### Option C: Hybrid

```typescript
type: "home" |
  "performance" |
  "workshop" |
  "about" |
  "gallery" |
  "contact" |
  "news";
// home = homepage
// others = detail pages (no separate section pages needed)
```

**Pros:** Simple, matches new structure
**Cons:** Loses explicit section concept

**Decision:** Option B (Hierarchical) - Use `type` for hierarchy level and `category` for content type. This provides clear structure and flexibility.

---

### 5. URL Structure for Detail Pages

#### Current

```text
/et/etendused-suurtele-mura
/et/etendused-noorele-publikule-2-2-22
/et/workshopid-meelekolu-mangud-mindstuff-games
```

#### Option A: Keep Current (with category prefix)

**Pros:** SEO-friendly, category visible in URL
**Cons:** Long URLs

#### Option B: Flatten

```text
/et/mura
/et/2-2-22
/et/meelekolu-mangud
```

**Pros:** Shorter, cleaner
**Cons:** Loses category context in URL

#### Option C: Add hierarchy

```text
/et/etendused/suurtele/mura
/et/etendused/noorele-publikule/2-2-22
/et/workshopid/meelekolu-mangud
```

**Pros:** Clear hierarchy, organized
**Cons:** Requires routing changes

#### Option D: Modified Hierarchy (Recommended)

```text
/et/etendused/mura
/et/workshopid/meelekolu-mangud
```

**Pros:** Clean hierarchy without over-nesting, category visible in URL, no collision risk, better SEO
**Cons:** Subcategory not in URL (but can be in frontmatter)

**Decision:** Option D - Two-level hierarchy `/[lang]/[category]/[slug]`. Subcategory stored in frontmatter for filtering/grouping on homepage, but not in URL to keep it clean.

---

## Implementation Phases

### Phase 1: Terminology Alignment ✅

- [x] Update type field values in schema
- [x] Rename files if needed
- [x] Update component references

### Phase 2: Homepage Consolidation ✅

- [x] Create long-scroll homepage layout
- [x] Build section components (inline listings)
- [x] Update navigation to anchor links
- [x] Handle smooth scrolling

### Phase 3: Navigation & Components ✅

- [x] Build ContentCard and HomeSection components
- [x] Implement sticky navigation with active states
- [x] Create floating pill navigator for desktop
- [x] Maintain mobile hamburger menu
- [x] Test responsive behaviors

### Phase 4: Content Migration ✅

- [x] Update all markdown frontmatter (36 pages)
- [x] Implement hierarchical routing
- [x] Create redirects for old URLs
- [x] Update cross-references

### Phase 5: Testing & Polish (In Progress)

- [x] Test navigation flows
- [x] Verify SEO (canonical URLs, sitemap)
- [ ] Accessibility audit
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Analytics integration

---

## Notes & Considerations

- **SEO Impact:** Moving to single-page may affect SEO - detail pages should remain separate routes
- **Performance:** Long homepage with many images/videos - lazy loading essential
- **Analytics:** Track section scrolling/visibility separately from page views
- **Deep Linking:** Anchor links must work when shared (e.g., `zuga.ee/et/#etendused`)
- **Back Button:** Browser back from detail page should return to correct scroll position on homepage

---

## Decisions Log

| Date       | Decision                           | Rationale                                                                                    |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| 2025-12-09 | Terminology defined                | Homepage → Section → Detail hierarchy established                                            |
| 2025-12-09 | Hierarchical schema (Option B)     | Type field for hierarchy, category for content type. Clear structure with flexibility        |
| 2025-12-09 | Two-level URLs (Option D)          | `/[lang]/[category]/[slug]` balances SEO and cleanliness                                     |
| 2025-12-09 | Featured subset display            | 3-5 cards per subcategory on homepage with categorized grouping                              |
| 2025-12-09 | Separate detail page routes        | Traditional approach for better SEO and accessibility                                        |
| 2025-12-09 | Floating pill navigator (desktop)  | Top-left pill with prev/current/next sections, expandable. Mobile keeps hamburger menu       |
| 2025-12-09 | Static desktop header              | Desktop header not sticky (floating nav handles navigation). Mobile header remains sticky    |
