# Riidik — Product Owner Scratchpad

## Session started: 2026-03-10

[LEARNED 2026-03-10] Content inventory — two performance categories:

- **Noorele publikule** (8 shows): 2+2=22, Ilma, Käik, meeleKolu, Mis sul viga on?, Uperpall, Võluvärk, Zuga zuug zuh-zuh-zuh
- **Suurtele** (6 shows): Häbi, Hool, Müra, Naine ja hunt, Suur teadmatus, Tempo

[LEARNED 2026-03-10] "Mis sul viga on?" is the active new production:

- Premiere 20 March 2026 at STL (3 days: 19-21 March)
- Tour: Haapsalu 25.03, Türi 01.04, Rapla 02.04, + May dates TBD venue
- Tickets live on Fienta + school groups Google Form
- Made in collaboration with Peaasi.ee (mental health)
- hero_video field used (recently added schema feature)
- EN page slug: whats-wrong-with-you

[PATTERN 2026-03-10] Bilingual structure: ET content under `et/`, EN under `en/`, linked via `translated` frontmatter. Not all shows have EN translations yet (e.g. meeleKolu has EN but odd slug).

[DEFERRED 2026-03-10] May showings (20-22 May) have no venue_id — need to confirm if STL or elsewhere.

[DEFERRED 2026-03-10] Several older shows missing hero_image or have Google Drive URLs (index pages for suurtele/noorele) — cleanup candidate but low urgency.

[LEARNED 2026-03-10] Performance status audit:

- **ACTIVE (upcoming 2026):** Mis sul viga on? (Mar-May 2026)
- **RECENTLY ACTIVE (2024, may tour again):** Ilma (premiere Oct 2024, no future showings in content)
- **ARCHIVED (no future dates):** 2+2=22 (2019), Käik (2014), meeleKolu (2016), Uperpall (2022), Võluvärk (2011), Zuga zuug zuh-zuh-zuh (2009), Häbi, Hool (Sep 2024), Müra (2019), Naine ja hunt (2006), Suur teadmatus (2022), Tempo (2018)
- **WORKSHOPS (bookable, evergreen):** meeleKolu mängud, Tuleviku liigutajad (2021-22 Kumu), Heliliikumistöötoad (Fienta on sale), Liikumispausid (free), Liikumise töötuba peredele

[GOTCHA 2026-03-10] meeleKolu ET page has broken translated slug:

- ET `translated.slug` = "performances-for-young-audiences-inthemood" (old full-path style)
- Actual EN file slug = "inthemood"
- LanguageSwitcher builds URL as /en/performances/performances-for-young-audiences-inthemood → 404
- Fix: change ET meeleKolu `translated[0].slug` to "inthemood"

[GOTCHA 2026-03-10] school_groups field in tickets frontmatter (mis-sul-viga-on ET+EN) is NOT in Zod schema — silently ignored. Build passes (Zod strips unknown keys). The school groups booking URL is lost at the data layer. Either add to schema or keep only in markdown body.

[GOTCHA 2026-03-10] Häbi ET + Shame EN pages have placeholder content ("This performance features 7 gallery images. Fotogalerii etendusest Häbi") — no real description. Same for inthemood EN, and several other EN pages.

[GOTCHA 2026-03-10] Build produces 3 routing warnings about /et/kalender conflicts. Pages still build correctly (dist/et/kalender/ exists). Low priority noise but worth cleaning up.

[GOTCHA 2026-03-10] No automated tests exist (no vitest, playwright, or any .test.\* files). The only quality gate is `npm run build`. Zero test coverage.

[LEARNED 2026-03-10] Credits and collaboration frontmatter fields are NOT in schema — silently stripped. This means structured credit data is inaccessible in templates. Body text has the credits manually as markdown.
