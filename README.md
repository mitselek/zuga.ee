# zuga.ee

Zuga Theatre - High-performance bilingual (Estonian/English) portfolio website showcasing theatrical performances.

## Project Status

**Phase 1**: Static Portfolio Website (In Development)

- Framework: Astro SSG
- Styling: Tailwind CSS
- Content: 35+ markdown pages (performances, about, workshops)
- Timeline: MVP in days
- Focus: Technical excellence (Lighthouse ≥90, Accessibility 100)

## Project Structure

```text
zuga.ee/
├── source_zuga_ee/         # Source content (DO NOT MODIFY)
│   └── pages/              # 35 markdown files ready to copy
│       ├── en/             # 9 English pages
│       └── et/             # 26 Estonian pages
├── .specify/
│   ├── architecture/       # Architecture documentation
│   │   ├── phase-1-architecture.md
│   │   ├── phase-1-implementation-plan.md
│   │   ├── content-schema.md
│   │   └── README.md
│   └── memory/
│       └── constitution.md # Project governance (§1-§5)
├── .github/prompts/        # AI persona prompts
├── scripts/                # Python extraction tools (archived)
└── packages/               # Empty (Phase 2 future use)
```

**Note**: `apps/web/` (Astro site) will be created in implementation Phase 1, Task 1.1

## Phase 1 Goals

- ✅ **Technical Excellence**: Lighthouse Performance ≥90, Accessibility 100
- ✅ **Bilingual Support**: Estonian/English with language switching
- ✅ **Type Safety**: Zod schemas validating all content at build time
- ✅ **Performance**: Static HTML, <2s page load on 3G
- ✅ **Regeneratable**: All content from markdown source files

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

- [Phase 1 Architecture](./.specify/architecture/phase-1-architecture.md) - Complete technical specification
- [Implementation Plan](./.specify/architecture/phase-1-implementation-plan.md) - Step-by-step task breakdown
- [Constitution](./.specify/memory/constitution.md) - Project governance principles (§1-§5)

## Tech Stack

- **Astro 4.x**: Static site generator (Phase 1)
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Strict type checking
- **Zod**: Runtime content validation
- **Markdown + YAML**: Content source format

## Future Phases

- **Phase 2**: AI Assistant frontend for content management
- **Phase 3**: Dynamic features and user interactions

## Constitutional Principles

This project follows 5 core principles defined in [.specify/memory/constitution.md](./.specify/memory/constitution.md):

- §1 **Type Safety First**: TypeScript strict mode, Zod schemas
- §2 **Test-First Development**: Lighthouse CI as integration tests
- §3 **Composable-First Architecture**: Small, reusable Astro components
- §4 **Observable Development**: Explicit validation errors, build logs
- §5 **Pragmatic Simplicity**: Boring technology, YAGNI enforcement

---

MIT License

**Tooling**:

- Pre-commit hooks
- Black, flake8, mypy
- ESLint, Prettier
- GitHub Actions

## License

See repository for license information.
