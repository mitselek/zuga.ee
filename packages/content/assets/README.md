# Content Assets

Static assets for zuga.ee content (images, videos, etc.)

## Directory Structure

```text
assets/
  images/     - Image files from archive
```

## Images

Total: 23 files (36MB)

**Source archives**:

- `archive/zuga/assets/` - 16 files (35MB)
- `archive/zuga2/dl/assets/` - 8 files (2MB)

**File types**:

- PNG: 7 files
- JPG: 6 files
- GIF: 2 files
- Other: 8 files (legacy hash-named files with extensions added)

**Naming convention**:

- Files from Google Sites use googleusercontent hash IDs
- Some files have hash suffix (e.g., `_664028c2.jpg`)
- Legacy files named by MD5 hash

## Usage

Reference images in markdown content using relative paths:

```markdown
![Alt text](../assets/images/filename.jpg)
```

## Maintenance

- Do not delete files without checking references in content
- Original archives preserved in `archive/` directory
- Run image optimization when adding new files
