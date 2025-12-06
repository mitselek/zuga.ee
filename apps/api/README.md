# zuga.ee API

FastAPI backend with strict TDD, Pydantic models, and AI agent integration.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Watch mode (TDD)
ptw

# Run server
uvicorn api.main:app --reload
```

## Development

### TDD Workflow

1. Write failing test
2. Run `ptw` (auto-runs tests on save)
3. Write minimal code to pass
4. Refactor
5. Commit (pre-commit hooks enforce quality)

### Code Quality

All code must pass:

- `black` formatting
- `flake8` linting
- `mypy --strict` type checking
- 90%+ test coverage
- All tests passing

## Structure

```text
api/
├── models.py          # Pydantic models (single source of truth)
├── routers/           # API endpoints
├── services/          # Business logic
├── parsers/           # Content parsers
└── tests/             # Mirror structure
```
