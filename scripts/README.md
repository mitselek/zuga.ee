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

## move-performances-34a.js

**Purpose**: Move performance files from flat directory structure into hierarchical folders.

**Usage**:
```bash
# Dry-run mode (show what would be moved)
node scripts/move-performances-34a.js --dry-run [--verbose]

# Execute migration
node scripts/move-performances-34a.js [--verbose]
```

**Options**:
- `--dry-run`: Show changes without applying them
- `--verbose`: Print detailed progress for each file

**What it does**:
- Moves ~30 performance files into folder structure:
  - ET: `etendused-suurtele-*.md` → `et/performances/for-adults/*.md`
  - ET: `etendused-noorele-publikule-*.md` → `et/performances/for-young-audiences/*.md`
  - EN: `performances-for-adults-*.md` → `en/performances/for-adults/*.md`
  - EN: `performances-for-young-audiences-*.md` → `en/performances/for-young-audiences/*.md`
- Moves section index files to `index.md` in respective folders
- Uses `git mv` to preserve file history
- Updates `slug` fields to use just performance name (e.g., "shame" not "performances-for-adults-shame")
- Updates `translated` field slugs to match new structure

**Safety Features**:
- Uses `git mv` to preserve history
- Dry-run mode for testing
- Detailed logging
- Backup recommended before running

**Related Issue**: #46

**Date**: 2025-12-14

## fix-performance-slugs-46.js

**Purpose**: Fix slug and translated fields in moved performance files after folder migration.

**Usage**:
```bash
node scripts/fix-performance-slugs-46.js
```

**What it fixes**:
- Removes duplicate `slug` fields
- Updates `slug` to use just performance name (filename)
- Updates `translated` field slugs to match new folder structure

**Related Issue**: #46

**Date**: 2025-12-14
