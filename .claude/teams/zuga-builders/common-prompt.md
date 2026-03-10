# Zuga Builders — Common Standards

## Team

- **Team name:** `zuga-builders`
- **Members:** team-lead, riidik (product owner), kai (frontend), tess (testing), finn (research), medici (health audit)

## Project Overview

Zuga.ee is a bilingual (ET/EN) static website for Zuga Ühendatud Tantsijad, a contemporary dance company.

- **Stack:** Astro 5 + Tailwind CSS + TypeScript
- **Deployment:** Netlify (auto-deploy on push to main)
- **Content:** Markdown pages with Zod schema validation
- **Monorepo:** `apps/web/` contains the Astro site
- **Knowledge base:** `knowledge-base/` contains source material (press, articles, persons, venues)

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata. Raport peab sisaldama: mis tehti, mis on tulemus, ja kas midagi jäi pooleli.

## Standards

- **Language:** UI and code in English, content in ET and EN
- **Commit messages:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.) in English
- **Commit technique:** Use temp file to avoid backtick issues: `git commit -F /tmp/commit-msg.txt`
- **Branch:** `main` is production (auto-deploys to Netlify)
- **Quality gates before push:** `npm run build` must succeed
- **Content schema:** All page frontmatter validated by `apps/web/src/content/config.ts`
- **Bilingual pages:** ET and EN versions linked via `translated` frontmatter field

## Key Paths

| What | Path |
|------|------|
| Astro site | `apps/web/` |
| Components | `apps/web/src/components/*.astro` |
| Page templates | `apps/web/src/pages/[lang]/` |
| Content pages | `apps/web/src/content/pages/{et,en}/` |
| Content schema | `apps/web/src/content/config.ts` |
| Styles | `apps/web/src/styles/global.css` |
| Knowledge base | `knowledge-base/` |
| Netlify config | `apps/web/netlify.toml` |
| Team config | `.claude/teams/zuga-builders/` |

## Agent Spawning Rule

**KOHUSTUSLIK:** Agente tuleb ALATI spawnida `run_in_background: true` parameetriga. Foreground Agent tool blokeerib team-lead'i ja ta ei saa vahepeal SendMessage sõnumeid vastu võtta.

```
Agent tool parameetrid:
  run_in_background: true    <-- ALATI
  name: "agent-name"
  team_name: "zuga-builders"
  prompt: "..."
```

## Research Support

When you need information gathered (GitHub issues, codebase lookups, content audits), message **finn**. He will collect the data and send you a markdown report.

## On Startup

1. Read `common-prompt.md` and your personal prompt
2. Read your scratchpad at `.claude/teams/zuga-builders/memory/<your-name>.md` if it exists
3. Send a brief intro message to `team-lead` saying you're ready and what you recall from your scratchpad

## Team Memory

### Personal Scratchpads

Each teammate maintains a personal notes file at `.claude/teams/zuga-builders/memory/<your-name>.md`.
You own this file — only you write to it. Keep it under 100 lines; prune stale entries.

Use tags to categorize entries (date every entry):

- `[DECISION]` — settled choices and rationale
- `[PATTERN]` — discovered approaches that work
- `[WIP]` — in-progress state (resume points)
- `[CHECKPOINT]` — periodic progress snapshots during long tasks
- `[DEFERRED]` — items pending a decision, with reason
- `[GOTCHA]` — important pitfalls or surprises
- `[LEARNED]` — key discoveries worth remembering

### What to Save

Only persist knowledge that:
- Is non-obvious from reading the code
- Is stable (won't change next commit)
- Cost real tokens to discover
- Would save a fresh you >5 minutes of re-discovery

### What NOT to Save

- Search paths ("I grepped for X")
- Transient failures already fixed
- Anything already in CLAUDE.md or one grep away
- Draft work that got superseded

## Shutdown Protocol

**REEGEL: Team-lead lõpetab ALATI viimasena.**

### Teammates — when you receive a shutdown request

1. Write in-progress state to your scratchpad (`[WIP]` or `[CHECKPOINT]`)
2. Send a closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Then approve the shutdown

### Team-lead — shutdown sequence

1. Peata kogu töö — ära alusta uusi ülesandeid
2. Saada shutdown KÕIGILE agentidele
3. Oota kinnitust igaühelt
4. Commit ja push memory failid
5. ÄRA kasuta TeamDelete — tiimi kataloog jääb alles

## Shared Workspace Protocol

The team shares one git working directory. To prevent conflicts:

- **Only one agent owns git operations at a time** — the agent creating the commit handles all git
- **Team-lead is read-only during implementation** — delegates, doesn't touch files
- **Never force-push or reset** without team-lead approval

## Known Pitfalls

- **Netlify auto-deploys** — every push to main goes live. Build must pass first (`npm run build`).
- **Content schema strictness** — Zod validates all frontmatter. New fields must be added to `config.ts` first.
- **Bilingual sync** — ET and EN pages must stay in sync. When updating content, check both language versions.
- **hero_video** — recently added (2026-03-10), not all pages use it yet. Schema supports it, PageHero renders it.
