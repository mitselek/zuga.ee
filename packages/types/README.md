# @zuga/types

[![CI](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml/badge.svg)](https://github.com/mitselek/zuga.ee/actions/workflows/ci.yml)

TypeScript types and runtime validators for Zuga content files.

## Purpose

This package provides type-safe TypeScript definitions and Zod validation schemas for Zuga's markdown content files. It mirrors the Pydantic models from the Python extraction pipeline (`scripts/extraction_models.py` and `scripts/frontmatter_models.py`), ensuring type safety across the full stack.

## Features

- **TypeScript Types**: Full type definitions for content frontmatter, media items, and document structure
- **Runtime Validation**: Zod schemas validate markdown frontmatter at runtime
- **Test Coverage**: All 35 production markdown files validated against schemas
- **Python Sync**: Types mirror Python Pydantic models with clear cross-references

## Testing

The package includes comprehensive tests that validate all 35 production markdown files:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run type-check
```

### Test Coverage

- ✅ All 35 markdown files validate successfully
- ✅ 9 English files, 26 Estonian files
- ✅ Language codes match directory structure
- ✅ All slugs are unique and non-empty
- ✅ Bilingual links reference existing slugs
- ✅ Edge cases (invalid data, missing fields) tested

## Python Sync Protocol

These TypeScript types must stay synchronized with Python Pydantic models.

### When to Sync

Update TypeScript types when Python models change:

1. Field added/removed/renamed
2. Type changed
3. Enum values modified
4. Validation rules changed

### Sync Checklist

1. Update `packages/types/src/content.ts` (if structure changed)
2. Update `packages/types/src/validators.ts` (if validation changed)
3. Run `npm test` - validates all 35 markdown files
4. Run `npm run type-check` - TypeScript validation
5. Verify 0 errors in Problems panel

## Related Documentation

- [Python Data Model](../../../docs/JSON_DATA_MODEL.md)
- [Markdown Format Spec](../../../docs/MARKDOWN_FORMAT_SPEC.md)
- [GitHub Issue #13](https://github.com/mitselek/zuga.ee/issues/13)
