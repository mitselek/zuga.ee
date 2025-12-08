# Architecture Documentation

This directory contains the architecture documentation for zuga.ee.

## Active Documents

### Phase 1: Static Portfolio Website

- **[phase-1-architecture.md](./phase-1-architecture.md)** - Complete technical specification

  - Goals & success criteria
  - Tech stack decisions (Astro, Tailwind CSS)
  - Content schema (Zod validation)
  - URL structure (bilingual routing)
  - Image handling strategy (placeholders)
  - Performance targets (Lighthouse ≥90)
  - Constitutional compliance check

- **[phase-1-implementation-plan.md](./phase-1-implementation-plan.md)** - Step-by-step implementation guide
  - 10 phases with detailed tasks
  - Validation checkpoints
  - Testing checklists
  - Rollback plan
  - Success metrics

## Project History

### December 2025 - Project Reboot

After initial over-scoping, project was simplified to two phases:

1. **Phase 1** (Current): Static portfolio website - Technical excellence focus
2. **Phase 2** (Future): AI assistant frontend - Content management capabilities

**Key Decisions**:

- Astro SSG for optimal performance
- Copy content from `source_zuga_ee/pages/` (35 markdown files)
- Bilingual routing with `/en/` and `/et/` prefixes
- Placeholder images (originals permanently lost)
- MVP timeline: Days, not weeks

### Original Attempt (Archived)

First iteration included:

- Next.js + FastAPI backend
- Python extraction scripts (completed, archived in `scripts/`)
- Over-engineered type system
- Premature AI integration planning

**Lessons Learned**:

- Start with simplest working solution (§5 Pragmatic Simplicity)
- Focus on one goal at a time
- Leverage existing content instead of building complex pipelines

## Constitutional Principles

All architecture decisions are validated against the Constitution (see `.specify/memory/constitution.md`):

- **§1 Type Safety First**: TypeScript strict mode, Zod schemas for content validation
- **§2 Test-First Development**: Lighthouse CI as integration tests (exception for MVP speed)
- **§3 Composable-First Architecture**: Small, single-purpose Astro components
- **§4 Observable Development**: Explicit error handling, build logs, deploy previews
- **§5 Pragmatic Simplicity**: Boring technology (Astro, Tailwind), YAGNI enforcement

## Future Phases

### Phase 2: AI Assistant (Planned)

- React islands for interactive chat UI
- Authentication system (user management)
- Content editing capabilities via AI
- Real-time markdown generation
- Preview/publish workflow

**Not Yet Designed** - Will be planned after Phase 1 launch and feedback gathering.

## Current Folder Structure

```text
zuga.ee/
├── source_zuga_ee/pages/       # Source markdown (9 EN + 26 ET = 35 files)
├── .specify/architecture/       # This directory
├── .github/prompts/            # AI persona definitions
├── scripts/                    # Python extraction tools (archived)
└── packages/                   # Empty (Phase 2 future use)
```

**Note**: `apps/web/` will be created in Phase 1, Task 1.1

## Navigation

- Back to [Project Root](../../README.md)
- [Constitution](./../memory/constitution.md)
- [Morgan Persona Prompt](../../.github/prompts/Morgan-the-analyst.prompt.md)
