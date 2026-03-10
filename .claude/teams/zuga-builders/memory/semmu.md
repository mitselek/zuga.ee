# Semmu — Scratchpad

## Active

### Issue #55 — Prompt Updates for Event Scheduling (2026-03-11)

[CHECKPOINT] 2026-03-11: Completed venue mapping + validation checklist updates to both prompts. Awaiting team-lead decision on `.github/prompts/` mirrors and issue closure.

**Done this session:**
- Updated venue mappings in `.cursor/commands/harvest.md` (added 3 venues + short names)
- Added venue mapping list to `.cursor/commands/add-content.md` (was missing entirely)
- Added Event Scheduling Validation checklist to both prompts
- Added Venue Collection Reference table to end of both prompts
- Added 2 event scheduling items to harvest.md final validation checklist

**Files modified:**
- `.cursor/commands/add-content.md` — venue mappings (~line 517), validation checklist (~line 1111), venue reference (end of file)
- `.cursor/commands/harvest.md` — venue mappings (~line 1044), validation checklist (~line 1189), venue reference + checklist items (end of file)

[DEFERRED] `.github/prompts/` mirror versions — team-lead decision needed. These don't exist and may not be needed.

### Issue #54 — Event Calendar System Assessment (2026-03-11)

[LEARNED] Phases 1-6 are DONE. Phase 7 (testing) is weak — `schema-validation.test.ts` has no event scheduling tests. Recommended: close #54 and create separate test issue.

## Stable Knowledge

[PATTERN] Venue ID mappings (7 venues in knowledge-base/venues/):
- stl, kanuti-gildi-saal, kumu, rakvere-teater, haapsalu-kultuurikeskus, tyri-kultuurikeskus, rapla-vesiroosi-kool

[LEARNED] Only `.cursor/commands/` prompt versions exist. No `.github/prompts/` mirrors for add-content or harvest.

[LEARNED] Event scheduling schema is in `apps/web/src/content/schema.ts` (not config.ts — config.ts just re-exports).
