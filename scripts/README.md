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

## migrate-press-31b.js

**Purpose**: Migrate press collection from legacy field names to new source attribution schema.

**Usage**:
```bash
# Dry-run mode (show changes without applying)
node scripts/migrate-press-31b.js --dry-run [--verbose] [file1.md file2.md ...]

# Apply changes to all files
node scripts/migrate-press-31b.js [--verbose]

# Apply changes to specific files
node scripts/migrate-press-31b.js file1.md file2.md
```

**Options**:
- `--dry-run`: Show changes without applying them
- `--verbose`: Print detailed progress for each file
- File arguments: Process specific files instead of all files

**Transformations**:
- `source` → `source_url` (when URL detected)
- Adds `issued_by: ZUGA` (required for press releases)
- Adds `issued_date` from `date` field (with format conversion)
- Adds `archived_date: 2025-12-14`
- Adds `source_type` mapped from `type` field
- Converts partial dates: YYYY-MM → YYYY-MM-01

**Safety Features**:
- Verifies backup exists before running
- Dry-run mode for testing
- Detailed logging
- Error handling with rollback instructions

**Related Issue**: #43

**Date**: 2025-12-14

## migrate-research-31c.js

**Purpose**: Migrate research collection from legacy field names to new source attribution schema.

**Usage**:
```bash
# Dry-run mode (show changes without applying)
node scripts/migrate-research-31c.js --dry-run [--verbose] [file1.md ...]

# Apply changes to all files
node scripts/migrate-research-31c.js [--verbose]

# Apply changes to specific files
node scripts/migrate-research-31c.js file1.md
```

**Options**:
- `--dry-run`: Show changes without applying them
- `--verbose`: Print detailed progress for each file
- File arguments: Process specific files instead of all files

**Transformations**:
- `source` → `source_url` (when URL detected)
- Adds `archived_date: 2025-12-14`
- Adds `source_type` mapped from `type` field
- Converts partial dates: YYYY-MM → YYYY-MM-01 if needed

**Safety Features**:
- Verifies backup exists before running
- Dry-run mode for testing
- Detailed logging
- Error handling with rollback instructions

**Related Issue**: #44

**Date**: 2025-12-14

## validate-registry.js

**Purpose**: Validate performance and workshop registry YAML files against Zod schemas.

**Usage**:
```bash
# Basic validation
node scripts/validate-registry.js

# Verbose output (detailed error messages)
node scripts/validate-registry.js --verbose
```

**Options**:
- `--verbose`: Print detailed validation output including error paths

**What it validates**:
- YAML syntax correctness
- Schema compliance (Zod schemas in `knowledge-base/registry/schema.ts`)
- Required fields present
- Data types and formats (dates, enums, etc.)
- Bilingual field requirements (at least one language required)

**Exit codes**:
- `0`: All registries valid
- `1`: Validation errors found

**Files validated**:
- `knowledge-base/registry/performances.yaml`
- `knowledge-base/registry/workshops.yaml`

**Dependencies**:
- `js-yaml` (installed in `knowledge-base/`)
- `zod` (installed in `knowledge-base/`)

**Related Issue**: #35

**Date**: 2025-12-14
