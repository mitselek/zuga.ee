# Tess — Test Engineer Scratchpad

## Project Context

[LEARNED 2026-03-10] Content stats: 64 markdown files total. ET has 36 files, EN has 28 files. Asymmetry is real — not all ET pages have EN counterparts. The `translated` frontmatter field links pages bidirectionally (e.g., ET `habi.md` → EN `shame.md`).

[LEARNED 2026-03-10] Hero images: mixed — some are local `/images/...` paths, some are external Google/PMO CDN URLs. Local image existence tests are feasible; external URLs are harder to test (skip or mark flaky).

[LEARNED 2026-03-10] Schema uses `slug` field optionally (Astro uses filename as ID anyway). `translated[].slug` is the key link between ET/EN pages — this is what bilingual consistency tests should validate.

[LEARNED 2026-03-10] No test framework installed yet. `package.json` has only `dev`, `build`, `preview`, `astro`, `kill_port` scripts. No vitest, no devDependencies.

[LEARNED 2026-03-10] Knowledge-base venues: 7 venue files (stl, kanuti-gildi-saal, kumu, rakvere-teater, rapla-vesiroosi-kool, soltumatu-tantsu-lava, tyri-kultuurikeskus). `venue_id` in showings can be validated against these.

[GOTCHA 2026-03-10] `duration` and `age_recommendation` fields appear in workshop markdown files but are NOT in the Zod schema in `config.ts`. These will currently be silently ignored (or cause Zod to fail if schema is strict). Worth flagging.

[DECISION 2026-03-10] Test strategy proposal sent to team-lead. Proposed 4-phase incremental approach. Phase 1 is this week: vitest setup + schema smoke tests + bilingual pairing check.
