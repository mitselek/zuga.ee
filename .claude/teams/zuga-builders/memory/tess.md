# Tess — Test Engineer Scratchpad

## Project Context

[LEARNED 2026-03-10] Content stats: 64 markdown files total. ET has 36 files, EN has 28 files. Asymmetry is real — not all ET pages have EN counterparts. The `translated` frontmatter field links pages bidirectionally (e.g., ET `habi.md` → EN `shame.md`).

[LEARNED 2026-03-10] Hero images: mixed — some are local `/images/...` paths, some are external Google/PMO CDN URLs. Local image existence tests are feasible; external URLs are harder to test (skip or mark flaky).

[LEARNED 2026-03-10] Schema uses `slug` field optionally (Astro uses filename as ID anyway). `translated[].slug` is the key link between ET/EN pages — this is what bilingual consistency tests should validate.

[LEARNED 2026-03-10] No test framework installed yet. `package.json` has only `dev`, `build`, `preview`, `astro`, `kill_port` scripts. No vitest, no devDependencies.

[LEARNED 2026-03-10] Knowledge-base venues: 7 venue files (stl, kanuti-gildi-saal, kumu, rakvere-teater, rapla-vesiroosi-kool, soltumatu-tantsu-lava, tyri-kultuurikeskus). `venue_id` in showings can be validated against these.

[GOTCHA 2026-03-10] `duration` and `age_recommendation` etc. were missing from Zod schema — fixed in issue #67 (commit a3c4076). Schema now includes: duration, age_recommendation, collaboration, credits, awards, related_exhibition, tickets.school_groups.

[GOTCHA 2026-03-10] `credits` field is entirely freeform — different files use different subkeys. Schema uses `z.record()` to allow any string key with string|array value.

[GOTCHA 2026-03-10] `collaboration` is inconsistent: sometimes string, sometimes array. `duration` sometimes number, sometimes string range ("15-20"). Both handled with z.union().

[GOTCHA 2026-03-10] `price` and `dates` fields exist in some workshop files but NOT added to schema (not in issue spec). May cause silent stripping.

[PATTERN 2026-03-10] Broken translated slugs used old path-based format (etendused-noorele-publikule-X) instead of simple filename slug (X). 7 links fixed in issue #65 (commit 69dddc9).

[DECISION 2026-03-10] Phase 1 tests done (commit 6d1221c): vitest + gray-matter installed, 238 tests passing. Schema extracted to `src/content/schema.ts` (pure Zod, no `astro:content`). Tests in `apps/web/tests/`.

[GOTCHA 2026-03-10] Zod safeParse uses strip mode by default — unknown fields pass silently. Use `pagesSchema.strict()` in schema-validation test to catch undeclared fields. Deferred to Phase 2.

[LEARNED 2026-03-10] No test framework installed → now installed. `package.json` has `test` and `test:watch` scripts. Vitest 4.x.

## Session 2026-03-11 Summary

[CHECKPOINT 2026-03-11] Test suite end-of-session state: 374 tests, 4 files, all green.
- `tests/bilingual-pairing.test.ts` — 38 tests
- `tests/asset-existence.test.ts` — 132 tests (hero_image + gallery local paths)
- `tests/schema-validation.test.ts` — 56 tests (all content files vs Zod schema)
- `tests/event-scheduling.test.ts` — 148 tests (premiere, showings, tickets, venue IDs, date parsing)

[LEARNED 2026-03-11] Venue ID lookup: venues have `id:` field (e.g. `id: stl`) that differs from filename (`soltumatu-tantsu-lava.md`). loadVenueIds() adds both to Set for safety.

[LEARNED 2026-03-11] Content file count dropped 64→60 after removing 4 dead/orphan files: et/uudised/uudised.md, et/galerii/index.md, et/galerii/galerii-section.md, et/kontakt/kontakt-2.md. Build is 58 pages.

[LEARNED 2026-03-11] PNG→WebP: all 6 PNGs converted (19.7MB→566KB). No PNG references remain in local content. External CDN URLs (Google, PMO, Fienta) untouched.

[DEFERRED 2026-03-11] `pagesSchema.strict()` in schema-validation test — would catch undeclared fields like `price` and `dates` in workshop files. Currently strip mode (silent). Phase 2 task.

[DEFERRED 2026-03-11] `price` and `dates` fields in some workshop files still not in schema. Next schema fix issue.
