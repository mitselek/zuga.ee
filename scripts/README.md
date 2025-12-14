# Migration Scripts

Scripts for automated data migrations during the Content Architecture Refactoring project.

## migrate-articles-31a.js

**Purpose**: Migrate articles collection from legacy field names to new source attribution schema.

**Usage**:
```bash
# Dry-run mode (show changes without applying)
node scripts/migrate-articles-31a.js --dry-run [--verbose] [file1.md file2.md ...]

# Apply changes to all files
node scripts/migrate-articles-31a.js [--verbose]

# Apply changes to specific files
node scripts/migrate-articles-31a.js file1.md file2.md
```

**Options**:
- `--dry-run`: Show changes without applying them
- `--verbose`: Print detailed progress for each file
- File arguments: Process specific files instead of all files

**Transformations**:
- `url`/`source` → `source_url`
- `publication` → `source_publication`
- `author` → `source_author`
- `type: preview-article` → `type: preview`
- Adds `source_type` field (mapped from `type`)
- Adds `source_date` field (from `date` field, with format conversion)
- Adds `archived_date: 2025-12-14`
- Converts partial dates: YYYY-MM → YYYY-MM-01

**Safety Features**:
- Verifies backup exists before running
- Dry-run mode for testing
- Detailed logging
- Error handling with rollback instructions

**Related Issue**: #42

**Date**: 2025-12-14
