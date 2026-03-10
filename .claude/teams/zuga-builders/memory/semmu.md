# Semmu — Scratchpad

## Active

### Issue #55 Assessment (2026-03-11)

[LEARNED] Both `.cursor/commands/add-content.md` and `.cursor/commands/harvest.md` already have extensive event scheduling integration. The issue (#55) was written BEFORE implementation — most of the work described is ALREADY DONE.

[LEARNED] There are NO `.github/prompts/add-content.prompt.md` or `.github/prompts/harvest-content.prompt.md` files. The issue mentions them but they don't exist. Only `.cursor/commands/` versions exist.

[PATTERN] Venue ID mappings (7 venues in knowledge-base/venues/):
- stl (Sõltumatu Tantsu Lava)
- kanuti-gildi-saal
- kumu (Kumu Kunstimuuseum)
- rakvere-teater
- haapsalu-kultuurikeskus
- tyri-kultuurikeskus
- rapla-vesiroosi-kool

[LEARNED] Issue mentions only 4 venues in mapping tables but 7 exist. Prompts also only list 4 — gap to fix.

[DECISION] Remaining gaps to address:
1. Venue mapping tables in both prompts miss 3 venues (haapsalu, tyri, rapla)
2. No `.github/prompts/` mirror versions exist (issue assumes they do)
3. Validation checklist section not yet added to either prompt
4. harvest.md line 1082 has confusing comment — says "If different from premiere" but shows stl which could BE the premiere venue
