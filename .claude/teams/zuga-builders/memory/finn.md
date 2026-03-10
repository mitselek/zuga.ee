# Finn — Research Scratchpad

## Session: 2026-03-10

[LEARNED] 2026-03-10 — Project structure overview:

- Content: 36 ET pages, 28 EN pages (64 total .md files under apps/web/src/content/pages/)
- ET has subdirs: etendused/ (suurtele/, noorele-publikule/), meist/, kontakt/, galerii/, uudised/, tootoad/
- EN mirrors ET but asymmetrically: performances/ (for-adults/, for-young-audiences/), about/, contact/, gallery/, workshops/
- ET has 2 extra top-level pages vs EN (zuga-toeoed-ja-etendused.md, workshopid split differently)
- 14 components in apps/web/src/components/
- knowledge-base/ contains: articles, media, persons, press, registry, research, venues (source material only)
- Page routing: apps/web/src/pages/[lang]/ with [slug].astro, [category]/, [calendarSlug]/, kalender/, index.astro

[PATTERN] 2026-03-10 — Bilingual pages linked via `translated` frontmatter field (per common-prompt.md known pitfall)

[GOTCHA] 2026-03-10 — hero_video recently added (2026-03-10), not all pages use it. Schema supports it, PageHero renders it.

[CHECKPOINT] 2026-03-10 — Full reliability audit completed. Key findings below.

[GOTCHA] 2026-03-10 — BROKEN TRANSLATED SLUGS (7 pages): LanguageSwitcher prepends category to translated slug, so the slug must be the simple filename slug (e.g., "inthemood"), NOT the old prefixed style (e.g., "etendused-noorele-publikule-meelekolu"). The following have stale/wrong slugs:

- et/meelekolu.md: slug "performances-for-young-audiences-inthemood" → should be "inthemood"
- et/tuleviku-liigutajad.md: slug "workshops-future-movers" → should be "future-movers"
- en/thepassage.md: slug "etendused-noorele-publikule-kaeik" → should be "kaeik"
- en/magic-stuff.md: slug "etendused-noorele-publikule-voluvaerk" → should be "voluvaerk"
- en/topsy-turvy.md: slug "etendused-noorele-publikule-uperpall" → should be "uperpall"
- en/inthemood.md: slug "etendused-noorele-publikule-meelekolu" → should be "meelekolu"
- en/future-movers.md: slug "workshopid-tuleviku-liigutajad" → should be "tuleviku-liigutajad"

[GOTCHA] 2026-03-10 — SCHEMA GAP: tickets.school_groups field used in mis-sul-viga-on.md (ET+EN) but not in config.ts schema. Zod would strip/warn on unknown keys (schema uses .object() not .passthrough()).

[GOTCHA] 2026-03-10 — BUILD WARNINGS (persistent): 3 WARN messages about /et/kalender route conflict between [calendarslug]/[...slug] and kalender/[...slug] routes. Cosmetic/non-blocking.

[LEARNED] 2026-03-10 — Venue ID "stl" maps to knowledge-base/venues/soltumatu-tantsu-lava.md (id: stl in frontmatter). All 4 venue IDs used (stl, kanuti-gildi-saal, haapsalu-kultuurikeskus, tyri-kultuurikeskus, rapla-vesiroosi-kool) have matching files.

[LEARNED] 2026-03-10 — All local hero_image and hero_video paths verified - ALL exist in public/. No missing local assets.

[LEARNED] 2026-03-10 — All knowledge_base_sources paths verified - ALL exist in knowledge-base/. No broken KB references.

[LEARNED] 2026-03-10 — External URL risk: ~50+ googleusercontent.com URLs used for gallery/hero images across many pages (2-2-22, meelekolu, inthemood, tuleviku-liigutajad, galerii-et, auhinnad, suurtele/index, en/index, en/about-us). Also f12.pmo.ee URL in 2-2-22. These are fragile - if Google Photos sharing links expire, images break silently.

[LEARNED] 2026-03-10 — Showings without venue_id: mis-sul-viga-on has 10 showings without venue_id (all implied STL: 2026-03-19 x2, 2026-03-20, 2026-03-21, and 2026-05-20 x2, 2026-05-21 x2, 2026-05-22 x2). Premiere has stl set so ShowingsList would use defaultVenueId for those at STL.

[DEFERRED] 2026-03-10 — og-image.jpg uses meist-bg.jpg cropped to 1200x630 but top edge is slightly awkward (head/text slightly cropped). Functional for now (#66 closed), but a purpose-composed horizontal OG image would be better long-term.

[DEFERRED] 2026-03-10 — Many performances have no premiere at all (habi, hool, mura, naine-ja-hunt, meelekolu, zugazuugzuh-zuh-zuh, uperpall on ET side; shame, woman-and-wolf, care, noise, inthemood, zugazuugzuh on EN side). These are older performances - probably intentional but adds calendar incompleteness.

## Session: 2026-03-11

[CHECKPOINT] 2026-03-11 — Two research tasks completed this session: PNG optimization audit (#73) and etenduste reorganiseerimise mõjuanalüüs (#63).

[LEARNED] 2026-03-11 — PNG audit (#73): All 6 PNGs in public/images/ are safe to convert to WebP. Despite RGBA color_type, all have 100% opaque pixels (confirmed via Pillow+numpy). Total 19.6MB → ~566KB WebP Q85 (97% reduction). Files are used as CSS background-images, NOT Astro <Image> — must convert manually with `convert {name}.png -quality 85 {name}.webp` and update src references in .astro files.

[LEARNED] 2026-03-11 — #63 impact analysis: Reorganising etendused (removing suurtele/noorele-publikule subcategories) affects ~9 source files. Detail page URLs (/et/etendused/{slug}) do NOT change — they already skip subcategory in the URL. Only the 4 subcategory landing pages need redirects. 6/14 performances lack premiere date — chronological sort policy needed for those.

[DEFERRED] 2026-03-11 — #63 decision needed: What to do with performances lacking premiere date when sorting chronologically (lõppu? eraldi grupp "kuupäev teadmata"?). Team-lead must decide before implementation.

[PATTERN] 2026-03-11 — Subcategory logic is centralized in: routes.ts (SUBCATEGORY_URLS), [subcategory].astro (template), index.astro (getSubsections/hasSubsections), SectionNavigator.astro (2 hardcoded entries). No subcategory logic in [slug].astro or Navigation.astro.
