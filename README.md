# zuga.ee

[![CI](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml/badge.svg)](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mitselek/zuga.ee/branch/main/graph/badge.svg)](https://codecov.io/gh/mitselek/zuga.ee)

Zuga Theatre website - a modern, bilingual (Estonian/English) performance showcase platform.

## Project Structure

```
zuga.ee/
├── apps/
│   ├── api/          # FastAPI backend with strict TDD
│   └── web/          # Next.js frontend
├── packages/
│   ├── content/      # Markdown content files (35 pages)
│   └── types/        # Shared TypeScript types & Zod validators
├── scripts/          # Python extraction and conversion tools
└── docs/             # Project documentation
```

## Monorepo Components

### 🎭 Content (`packages/content/`)

Bilingual markdown content extracted from legacy Google Sites:
- **35 total pages**: 9 English + 26 Estonian
- YAML frontmatter with metadata (title, slug, language, status, etc.)
- Media galleries (images, videos) in frontmatter
- Bilingual linking between EN/ET versions

### 📦 Types Package (`packages/types/`)

Type-safe TypeScript definitions mirroring Python Pydantic models:
- Runtime validation with Zod schemas
- 28 tests validating all 35 markdown files
- Cross-referenced with Python sources
- [See package README](packages/types/README.md)

### 🔧 Backend API (`apps/api/`)

FastAPI backend with strict TDD:
- Python 3.12+ with Pydantic v2
- 100% test coverage requirement
- Black, flake8, mypy enforcement
- Pre-commit hooks

### 🌐 Frontend (`apps/web/`)

Next.js 14 with TypeScript:
- React 18 with App Router
- Vitest for testing
- Type-safe content consumption

### 📝 Scripts (`scripts/`)

Python data extraction and conversion pipeline:
- JSON → Markdown conversion (35 files)
- Bilingual page linking
- Pydantic models for validation
- [See scripts README](scripts/README.md)

## Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/mitselek/zuga.ee.git
cd zuga.ee

# Python setup (backend + scripts)
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install -e apps/api[dev]

# Node.js setup (frontend + types)
cd apps/web && npm install
cd ../../packages/types && npm install

# Install pre-commit hooks
pre-commit install
```

### Running Tests

```bash
# Backend tests (Python)
cd apps/api
pytest --cov

# Frontend tests (Node.js)
cd apps/web
npm test

# Types validation (validates all 35 markdown files)
cd packages/types
npm test
```

### Quality Checks

```bash
# Python: black, flake8, mypy, pytest
cd apps/api
black .
flake8 .
mypy --strict api/
pytest

# TypeScript: type-check, lint, test
cd apps/web
npm run type-check
npm run lint
npm test

# Content validation
cd packages/types
npm test  # Validates all 35 markdown files
```

## CI/CD

GitHub Actions workflow runs on every push/PR:

- ✅ Backend tests (Python)
  - Black formatting
  - Flake8 linting
  - Mypy type checking
  - Pytest with 100% coverage
- ✅ Frontend tests (Node.js)
  - TypeScript type checking
  - ESLint
  - Vitest with coverage
- ✅ Build check
  - Frontend production build
  - Backend package build

Coverage reports uploaded to [Codecov](https://codecov.io/gh/mitselek/zuga.ee).

## Documentation

- [Content Data Model](docs/JSON_DATA_MODEL.md)
- [Markdown Format Spec](docs/MARKDOWN_FORMAT_SPEC.md)
- [Image Mapping](docs/IMAGE_MAPPING.md)
- [Scripts README](scripts/README.md)
- [Types Package README](packages/types/README.md)

## Tech Stack

**Backend**:
- Python 3.12
- FastAPI
- Pydantic v2
- Pytest

**Frontend**:
- Next.js 14
- React 18
- TypeScript
- Vitest

**Validation**:
- Zod (runtime validation)
- Pydantic (Python models)
- Gray-matter (markdown parsing)

**Tooling**:
- Pre-commit hooks
- Black, flake8, mypy
- ESLint, Prettier
- GitHub Actions

## License

See repository for license information.
