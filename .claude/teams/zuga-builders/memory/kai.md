# Kai Scratchpad

## 2026-03-10

[LEARNED] PerformanceGallery expects `images` prop but `[subcategory].astro` and `[slug].astro` pass `items`. Gallery silently breaks on those templates.

[LEARNED] EventCard.astro:48 builds URLs with raw category name (e.g., `etendused`) — breaks English pages where URL should be `performances`.

[GOTCHA] No og-image.jpg exists in public/ despite BaseLayout referencing it. Social sharing broken.

[GOTCHA] Hero video in PageHero has no `preload` attribute — defaults to `preload="auto"`, downloading full video eagerly.

[PATTERN] Category URL translation pattern: templates use a `categoryUrlMap`/`categoryTranslations` object mapping internal names to URL slugs per language. Must be applied consistently everywhere URLs are built.

[PATTERN] Props consistency: always cross-check component Props interface against all call sites. Astro doesn't type-check template props at build time.
