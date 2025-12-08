# zuga.ee Web

[![Frontend Tests](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml/badge.svg?job=frontend-tests)](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml)
[![Build Status](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml/badge.svg?job=build)](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml)

Next.js frontend with TypeScript strict mode and comprehensive testing.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

## Development

### TDD Workflow

1. Write failing test
2. Run `npm run test:watch`
3. Write minimal code to pass
4. Refactor
5. Commit (format & lint checks)

### Code Quality

All code must pass:

- TypeScript strict mode
- ESLint
- Prettier formatting
- 90%+ test coverage
- All tests passing

## Structure

```text
web/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/           # Utilities
│   └── test/          # Test utilities
└── public/            # Static assets
```
