# CLAUDE.md — zuga.ee

Bilingual website for Zuga Ühendatud Tantsijad, an Estonian contemporary dance company.

## Stack

- **Astro 5** — static site generator
- **Tailwind CSS** — styling with custom CSS variables
- **TypeScript** — content schema validation (Zod)
- **Netlify** — deployment (auto-deploy on push to main)

## Project Structure

```
apps/web/           — Astro site
  src/
    components/     — Astro components (*.astro)
    content/
      config.ts     — Zod schema for all page frontmatter
      pages/
        et/         — Estonian content
        en/         — English content
    layouts/        — Base layout
    pages/          — Route templates ([lang]/[category]/[slug].astro etc.)
    styles/         — global.css with CSS variables
  public/           — Static assets (images, videos)
  netlify.toml      — Netlify config
knowledge-base/     — Source material (press, articles, persons, venues)
.claude/teams/      — Agent team configurations
```

## Development

```bash
cd apps/web
npm install
npm run dev        # Local dev server
npm run build      # Production build (MUST pass before push)
```

## Content Workflow

- All pages are markdown with YAML frontmatter, validated by Zod schema in `config.ts`
- Bilingual: ET and EN versions linked via `translated` frontmatter field
- When updating content, always check both language versions
- New frontmatter fields must be added to `config.ts` schema first

## Conventions

- **Commits:** Conventional commits in English (`feat:`, `fix:`, `docs:`, etc.)
- **Commit technique:** `git commit -F /tmp/commit-msg.txt` (avoids backtick issues)
- **Branch:** `main` is production — every push auto-deploys via Netlify
- **Language:** Code and commits in English. Content in ET and EN.

## Team

See `.claude/teams/zuga-builders/` for multi-agent team configuration.
Roster: `.claude/teams/zuga-builders/roster.json`
