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

### New Navigation (not visible or hidden or collapsed by default)

in collapsed state its floating on top left and showing the name of current section. on section change it smoothly transitions to new section name. Also previous and next section names could be faintly visible on top and bottom of the current section name to indicate user can scroll up or down to navigate to those sections. When clicked it expands to show full nav.

```text
Main Nav: [Etendused ↓] [Töötoad ↓] [Tegijad ↓] [Galerii ↓] [Kontakt ↓]
               ↓            ↓           ↓          ↓          ↓
          Anchor to    Anchor to   Anchor to  Anchor to  Anchor to
          section      section     section    section    section
          on same      on same     on same    on same    on same
          page         page        page       page       page
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

### Phase 1: Terminology Alignment

- [ ] Update type field values in schema
- [ ] Rename files if needed
- [ ] Update component references

### Phase 2: Homepage Consolidation

- [ ] Create long-scroll homepage layout
- [ ] Build section components (inline listings)
- [ ] Update navigation to anchor links
- [ ] Handle smooth scrolling

### Phase 3: Detail Page Updates

- [ ] Decide on detail page UX
- [ ] Update routing if needed
- [ ] Add back-navigation
- [ ] Test language switching

### Phase 4: Content Migration

- [ ] Update all markdown frontmatter
- [ ] Move/rename files as needed
- [ ] Update cross-references

### Phase 5: Testing & Polish

- [ ] Test all navigation flows
- [ ] Verify SEO (canonical URLs, sitemap)
- [ ] Accessibility audit
- [ ] Mobile responsiveness

---

## Notes & Considerations

- **SEO Impact:** Moving to single-page may affect SEO - detail pages should remain separate routes
- **Performance:** Long homepage with many images/videos - lazy loading essential
- **Analytics:** Track section scrolling/visibility separately from page views
- **Deep Linking:** Anchor links must work when shared (e.g., `zuga.ee/et/#etendused`)
- **Back Button:** Browser back from detail page should return to correct scroll position on homepage

---

## Decisions Log

| Date       | Decision            | Rationale                                         |
| ---------- | ------------------- | ------------------------------------------------- |
| 2025-12-09 | Terminology defined | Homepage → Section → Detail hierarchy established |
| _TBD_      | _Pending_           | _Awaiting discussion_                             |
