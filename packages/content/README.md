# Content Storage

This directory contains all markdown-based content for zuga.ee.

## Structure

```text
content/
├── projects/       # Project portfolio items
├── blog/          # Blog posts
├── pages/         # Static pages (about, contact, etc.)
└── news/          # News digest items
```

## Format

All content uses:

- Markdown with YAML frontmatter
- Obsidian-compatible syntax
- Bilingual support (et/en)

## Example

```markdown
---
title: "Example Project"
slug: "example-project"
status: "published"
language: "et"
translated: ["en"]
tags: ["web", "design"]
created_at: 2025-12-06T00:00:00Z
updated_at: 2025-12-06T00:00:00Z
---

# Project content here

This is an example of content structure.
```
