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

[DECISION 2026-03-10] Test strategy proposal sent to team-lead. Proposed 4-phase incremental approach. Phase 1 is this week: vitest setup + schema smoke tests + bilingual pairing check.
