# Riidik — Product Owner Scratchpad

## [CHECKPOINT] 2026-03-11 — Session complete

### Site Status (post-session)

**Build:** 54 pages, 0 errors, 0 warnings
**Tests:** 360/360 (4 files: bilingual-pairing, asset-existence, schema-validation, event-scheduling)
**Active production:** "Mis sul viga on?" — premiere 19 March 2026 (8 days away)

### What was fixed this session (all merged)

**P0 — before premiere:**
- #65 — 7 broken language-switcher links (legacy translated slugs) ✓
- #67 — school_groups + age_recommendation + credits + collaboration added to Zod schema ✓
- #64 — PerformanceGallery prop mismatch (items → images) ✓

**Infrastructure:**
- #70 — Vitest setup + 3 test files (238 → now 360 tests) ✓
- #66 — og-image.jpg added (1200x630, 130KB) ✓
- #68 — video preload=metadata + iframe lazy loading ✓
- #69 — ogImage passed to BaseLayout from all templates ✓
- #71 — EventCard URL translated for EN ✓
- #72 — hreflang tags in BaseLayout ✓
- routes.ts — centralized category/subcategory URL maps ✓
- Calendar templates merged (duplicate removed, build warnings gone) ✓
- #73 — PNG → WebP (19.7MB → 566KB, 97% savings) ✓
- #74 — JSON-LD Organization + DanceEvent structured data ✓
- #63 — Performances flattened chronologically (subcategories removed, 4 Netlify redirects) ✓
- #54 — Event scheduling tests (134 new tests) ✓
- Dead placeholder files removed (4 files) ✓

### [DEFERRED] 2026-03-11 — Backlog items

- May showings (20-22 May) in "Mis sul viga on?" have no venue_id — needs confirmation
- Häbi ET + Shame EN pages have placeholder content only — need real description
- inthemood EN uses legacy Google CDN image URLs (broken) — P1
- Ilma + Hool (2024 productions) have no upcoming dates shown — need "enquire for bookings" signal
- premiere date 2026-03-20 duplicated in both `premiere` and `showings` array in mis-sul-viga-on
- `etendused.md` body text still says "nii suurtele kui noorele publikule" — outdated after #63
- legacy `original_url` fields still have subcategory-based paths (cosmetic)
- etendused-suurtele-habi-hero.jpg filename is legacy (works, cosmetic)

### [LEARNED] 2026-03-11

- Performances are now flat: `/et/etendused/{slug}` and `/en/performances/{slug}` — no subcategories
- routes.ts is single source of truth for category/subcategory URL translation
- Test suite runs in 400ms — fast enough for pre-commit hook
- venue_id values use short IDs (e.g. `stl`) not filenames (`soltumatu-tantsu-lava`) — both accepted in tests
- Zod schema now in `src/content/schema.ts` (importable without Astro runtime)
- JSON-LD DanceEvent generated per showing date, timezone +02:00, venue from knowledge-base
- 4 Netlify 301 redirects cover old subcategory URLs

### [PATTERN] 2026-03-11

- Review flow: read commit diff → verify dist output → run tests → approve/flag
- All inline category URL maps replaced by `getCategoryUrl()` from routes.ts
- Schema changes always need build + test verification (Zod strips unknown keys silently)
