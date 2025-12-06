# zuga.ee

A self-evolving portfolio website with AI-powered content management and automated news curation.

## Overview

zuga.ee is a two-sided web application that combines:

1. **File-based portfolio** - Static content pages (projects, blog, about)
2. **AI-powered admin interface** - Authenticated chat system for content management and updates

### Key Features

- 🔄 **Historical Content Recovery** - Scrapes and preserves original zuga.ee from Web Archive
- 🤖 **AI Content Assistant** - Agent-powered content editing and generation
- 📰 **Automated News Aggregation** - Scheduled digest creation from multiple sources
- 🌐 **Bilingual** - Estonian (primary) + English translations
- 📝 **Obsidian-Compatible** - Markdown with YAML frontmatter
- 🔐 **Email Authentication** - Magic link/code based JWT sessions
- 🎯 **User Permissions** - Granular control over content, users, and AI capabilities

## Architecture

### Monorepo Structure

```text
zuga.ee/
├── apps/
│   ├── api/              # FastAPI backend (Python + Pydantic)
│   └── web/              # Next.js frontend (TypeScript)
├── packages/
│   ├── content/          # Markdown content store
│   └── types/            # Shared type definitions
├── scripts/
│   ├── scrape_wayback.py
│   └── news_aggregator.py
└── docs/
```

### Tech Stack

**Backend:**

- FastAPI 0.104+ with Pydantic v2
- Python 3.11+ (strict typing)
- File-based content storage
- JWT authentication
- APScheduler for cron jobs

**Frontend:**

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Static Site Generation (SSG)
- Dynamic chat interface

**Content:**

- Markdown with YAML frontmatter
- Obsidian-compatible structure
- Git-based versioning

## Development Philosophy

### Strict TDD Approach

This project follows **Test-Driven Development** with:

- ✅ 90%+ code coverage requirement
- ✅ Tests run before every commit
- ✅ Mutation testing to verify test quality
- ✅ Property-based testing with Hypothesis
- ✅ Type safety enforced (mypy --strict)

### Code Quality Standards

**Python:**

- `black` - Code formatting (PEP 8)
- `flake8` - Linting
- `mypy --strict` - Static type checking
- `pytest` + `pytest-cov` - Testing & coverage
- `mutmut` - Mutation testing

**TypeScript:**

- `prettier` - Code formatting
- `eslint` - Linting
- TypeScript strict mode
- `vitest` - Testing & coverage

### Pre-commit Hooks

All commits must pass:

1. Code formatting (black/prettier)
2. Linting (flake8/eslint)
3. Type checking (mypy/tsc)
4. All tests passing
5. Coverage threshold met

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zuga.ee.git
cd zuga.ee

# Backend setup
cd apps/api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -e ".[dev]"

# Frontend setup
cd ../web
npm install

# Install pre-commit hooks
pip install pre-commit
pre-commit install
```

### Development

```bash
# Run backend (with auto-reload)
cd apps/api
ptw  # pytest-watch for TDD

# Run frontend
cd apps/web
npm run dev

# Run tests
pytest                    # Backend tests
npm test                  # Frontend tests
```

## Deployment

- **Hosting:** Netlify
- **CI/CD:** GitHub Actions
- **Environment:** Production + Staging

## License

TBD
