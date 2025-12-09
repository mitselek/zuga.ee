# Content Migration Guide

## Overview

Migration from old flat type system to new hierarchical structure with `type`, `category`, and `subcategory` fields.

**Date**: 2025-12-09

**Related**: GitHub Issue #17 (Phase 1), #16 (Master tracking)

---

## Schema Changes

### Old Schema (Before)

```typescript
type: 'landing' | 'performance' | 'workshop' | 'about' | 'gallery' | 'contact' | 'news'
```

### New Schema (After)

```typescript
type: 'home' | 'section' | 'detail'  // Hierarchy level
category: 'etendused' | 'workshopid' | 'about' | 'gallery' | 'contact' | 'news'  // Content type
subcategory?: string  // Optional grouping ('suurtele', 'noorele-publikule', etc.)
legacy_type?: string  // OLD type field (for reference during migration)
```

---

## Migration Mapping

### Homepage Files

**Pattern**: `index.md` files

**Old**:

```yaml
type: landing
slug: index
```

**New**:

```yaml
type: home
category: about
legacy_type: landing
# subcategory: (not needed)
```

**Examples**:

- `et/index.md` → `type: home, category: about`
- `en/index.md` → `type: home, category: about`

---

### Section/Category Pages

**Pattern**: Category index pages (e.g., `etendused-suurtele.md`, `workshopid.md`)

**Old**:

```yaml
type: landing
slug: etendused-suurtele
```

**New**:

```yaml
type: section
category: etendused
subcategory: suurtele
legacy_type: landing
```

**Examples**:

| Old Slug | New Type | New Category | New Subcategory |
|----------|----------|--------------|-----------------|
| `etendused-suurtele` | `section` | `etendused` | `suurtele` |
| `etendused-noorele-publikule` | `section` | `etendused` | `noorele-publikule` |
| `workshopid` | `section` | `workshopid` | *(empty)* |
| `galerii` | `section` | `gallery` | *(empty)* |
| `tegijad` | `section` | `about` | *(empty)* |
| `kontakt-2` | `section` | `contact` | *(empty)* |
| `uudised` | `section` | `news` | *(empty)* |

---

### Detail Pages

**Pattern**: Individual performance/workshop pages

#### Performances

**Old**:

```yaml
type: performance
slug: etendused-suurtele-habi
```

**New**:

```yaml
type: detail
category: etendused
subcategory: suurtele
legacy_type: performance
```

**Examples**:

| Old Slug | New Type | New Category | New Subcategory |
|----------|----------|--------------|-----------------|
| `etendused-suurtele-habi` | `detail` | `etendused` | `suurtele` |
| `etendused-suurtele-mura` | `detail` | `etendused` | `suurtele` |
| `etendused-noorele-publikule-2-2-22` | `detail` | `etendused` | `noorele-publikule` |
| `etendused-noorele-publikule-ilma` | `detail` | `etendused` | `noorele-publikule` |

#### Workshops

**Old**:

```yaml
type: workshop
slug: workshopid-meelekolu-mangud-mindstuff-games
```

**New**:

```yaml
type: detail
category: workshopid
subcategory: (empty)
legacy_type: workshop
```

**Examples**:

| Old Slug | New Type | New Category | New Subcategory |
|----------|----------|--------------|-----------------|
| `workshopid-meelekolu-mangud...` | `detail` | `workshopid` | *(empty)* |
| `workshopid-zuga-heliliikumistootoad` | `detail` | `workshopid` | *(empty)* |
| `workshopid-tuleviku-liigutajad` | `detail` | `workshopid` | *(empty)* |

#### Other Pages

**Old**:

```yaml
type: about
slug: tegijad
```

**New**:

```yaml
type: detail
category: about
subcategory: (empty)
legacy_type: about
```

**Examples**:

| Old Type | Old Slug | New Type | New Category |
|----------|----------|----------|--------------|
| `about` | `tegijad` | `detail` | `about` |
| `gallery` | `galerii` | `detail` | `gallery` |
| `contact` | `kontakt-2` | `detail` | `contact` |
| `news` | `uudised` | `detail` | `news` |
| `news` | `press-zugast` | `detail` | `news` |

---

## Automated Migration Script

### Algorithm

```python
def migrate_frontmatter(slug: str, old_type: str) -> dict:
    """
    Convert old frontmatter to new structure.

    Returns: {type, category, subcategory, legacy_type}
    """
    # Homepage
    if slug == 'index':
        return {
            'type': 'home',
            'category': 'about',
            'subcategory': None,
            'legacy_type': old_type
        }

    # Section pages (category index pages)
    if old_type == 'landing':
        if slug.startswith('etendused-'):
            parts = slug.split('-')
            subcategory = '-'.join(parts[1:])  # e.g., 'suurtele', 'noorele-publikule'
            return {
                'type': 'section',
                'category': 'etendused',
                'subcategory': subcategory,
                'legacy_type': old_type
            }
        elif slug == 'workshopid':
            return {
                'type': 'section',
                'category': 'workshopid',
                'subcategory': None,
                'legacy_type': old_type
            }
        # Other landings become sections
        return {
            'type': 'section',
            'category': infer_category(slug),
            'subcategory': None,
            'legacy_type': old_type
        }

    # Detail pages
    if old_type == 'performance':
        # Extract subcategory from slug
        if 'suurtele' in slug:
            subcategory = 'suurtele'
        elif 'noorele-publikule' in slug:
            subcategory = 'noorele-publikule'
        else:
            subcategory = None

        return {
            'type': 'detail',
            'category': 'etendused',
            'subcategory': subcategory,
            'legacy_type': old_type
        }

    if old_type == 'workshop':
        return {
            'type': 'detail',
            'category': 'workshopid',
            'subcategory': None,
            'legacy_type': old_type
        }

    # Other types (about, gallery, contact, news)
    return {
        'type': 'detail',
        'category': old_type,  # about → about, gallery → gallery, etc.
        'subcategory': None,
        'legacy_type': old_type
    }
```

---

## Edge Cases & Manual Review

### 1. Pages with ambiguous category

**Example**: `galerii.md` with `type: gallery`

- Could be `type: section, category: gallery` (index page)
- Or `type: detail, category: gallery` (single gallery page)

**Resolution**: Check if other pages exist under this category. If only one page exists, it's probably a `detail` page.

### 2. Pages with complex slug patterns

**Example**: `etendused-noorele-publikule-zugazuugzuh-zuh-zuh.md`

**Resolution**: Subcategory is `noorele-publikule` (first part after `etendused-`). The rest is the performance title.

### 3. English pages with different naming

**Example**: `english-2-2-22.md` vs `etendused-noorele-publikule-2-2-22.md`

**Resolution**: Use the `translated` field to cross-reference and apply same category/subcategory.

---

## Migration Checklist

### Pre-Migration

- [x] Schema updated in `src/content/config.ts`
- [x] Build tested to confirm validation errors
- [ ] All 36 pages documented with mapping

### During Migration

- [ ] Update homepage files (`et/index.md`, `en/index.md`)
- [ ] Update section pages (categories with sub-pages)
- [ ] Update detail pages (performances, workshops, etc.)
- [ ] Test build after each file or batch
- [ ] Fix any validation errors

### Post-Migration

- [ ] Build succeeds with 0 errors
- [ ] All 36 pages still accessible
- [ ] Routing still works (update in Phase 2)
- [ ] Git commit with migration complete message

---

## Validation Commands

```bash
# Check for validation errors
cd apps/web
npm run build

# Count migrated pages
grep -r "^type: home" src/content/pages/ | wc -l    # Should be 2 (et/en)
grep -r "^type: section" src/content/pages/ | wc -l  # Should be ~7-8
grep -r "^type: detail" src/content/pages/ | wc -l   # Should be ~26-28

# Verify category distribution
grep -r "^category:" src/content/pages/ | sort | uniq -c
```

---

## Rollback Plan

If migration fails or needs to be reverted:

1. **Restore old schema**:

```bash
git checkout HEAD~1 apps/web/src/content/config.ts
```

2. **Revert frontmatter changes**:

```bash
git checkout HEAD~1 apps/web/src/content/pages/
```

3. **Test build**:

```bash
cd apps/web && npm run build
```

---

## Next Steps

After content migration completes:

1. **Phase 2**: Update routing to use new category/slug structure
2. **Phase 3**: Build long-scroll homepage with section components
3. **Phase 4**: Update detail page layouts
4. **Phase 5**: Testing and polish

See `SITE_STRUCTURE.md` for full implementation plan.
