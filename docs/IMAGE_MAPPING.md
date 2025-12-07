# Image Mapping Analysis

## Summary

- **Local images found**: 16 files across two archives
- **Images in JSON extractions**: 134 unique googleusercontent URLs
- **Images in HTML sources**: More comprehensive (not all extracted to JSON)

## Archive Structure

### archive/zuga/assets/ (16 files, 35MB)

Files named with 32-char MD5 hashes (some with .png extension):

- `1ad7c25101956464bd92818421aed0ff` (165K)
- `2167e29aeae81a1e84438e62d854eda2.png` (4.8M)
- `48ab08a88eeb95347c154dfd7579d2a2.png` (4.8M)
- `4d7dc78d9ca7c450c12dd3da5d9c0265` (153K)
- `61ce531b2a0b414a83cbfef09cfe0973` (118K)
- `664028c28e5091e1aa4a8b4cd3205b1c` (161K, JPEG)
- `7662b8a4fc97ed600d1aa7ebf10bdf87.png` (4.5M)
- `7f4631b419aa1476741c5cb5b47fecfc` (814K)
- `83f8b2c93145380db8003007f414cb8d.png` (4.6M)
- `85969f5bc89cedfb1829ffdb42a3cbad.png` (4.3M)
- `950c074caac4e7d61df68840c6cca6a1.png` (4.6M)
- `990b3921a1f4b66fba22061210b931a2` (1.6K, GIF)
- `be8c1c090fae904c5eb4260741f38764.png` (4.4M)
- `c9c9d221fdb0461161b49522e99efd44` (241K)
- `fa71bf11d4e5d2661de52b204c20734b` (310K)
- `rs=AGEqA5kElfi3xvzPCZS88WkRFa3Ga2SxvA` (1.3M, CSS file)

### archive/zuga2/dl/assets/ (8 files, 2.0MB)

Files named with full googleusercontent hash + short hash:

```
<googleusercontent_hash>=w<width>_<short_hash>.<ext>
```

Examples:

- `d2QzA0GYQooaGEg14rgVJyYQwAmJim_-E1BriHW6kbEzScOf0VofY4OX-h9pDjjelA2amuxg_ff9w3aE749wkM21sOAraPcE0DfILu75PZE6dPwyMK5C6s7m6BWY6j6Clw=w1280_664028c2.jpg`
  - Google hash: `d2QzA0GYQooaGEg14rgVJyYQwAmJim...Clw`
  - Short hash: `664028c2`
  - Matches zuga file: `664028c28e5091e1aa4a8b4cd3205b1c`

Confirmed mappings (8 files):

1. `664028c2` → `664028c28e5091e1aa4a8b4cd3205b1c`
2. `4d7dc78d` → `4d7dc78d9ca7c450c12dd3da5d9c0265`
3. `990b3921` → `990b3921a1f4b66fba22061210b931a2`
4. `c9c9d221` → `c9c9d221fdb0461161b49522e99efd44`
5. `fa71bf11` → `fa71bf11d4e5d2661de52b204c20734b`
6. `7f4631b4` → `7f4631b419aa1476741c5cb5b47fecfc`
7. `1ad7c251` → `1ad7c25101956464bd92818421aed0ff`
8. `61ce531b` → `61ce531b2a0b414a83cbfef09cfe0973`

## Mapping Strategy

### Current Challenge

The local image files use internal Google Storage hashes (32-char MD5), NOT the googleusercontent.com URL hashes found in the HTML/JSON. The googleusercontent URLs look like:

```
https://lh3.googleusercontent.com/2xIFCyCa68-hNcL94-Ka0c5OyJQq9mFHiQxkYjnHMv5V8em6h8hsRvm56ON3Hq91wsjnHQ=w1280
```

But the local files are named with different hashes.

### Potential Solutions

#### Option 1: Content-Based Matching

Compare image file contents (e.g., perceptual hashing) to match local files with URLs in JSON/HTML.

#### Option 2: Reverse Engineer from HTML

1. Extract ALL googleusercontent URLs from original HTML files
2. Cross-reference with which images appear on which pages
3. Use zuga2 filenames (which include googleusercontent hash) as Rosetta Stone
4. Map remaining images by elimination/context

#### Option 3: Copy Local Images As-Is

Since we have 16 local image files, we can:

1. Copy them to `packages/content/media/`
2. Update markdown files to reference local paths
3. Accept that URLs in JSON/HTML may not resolve (expected - site is down)
4. Note which images are available vs missing

#### Option 4: Attempt Download from googleusercontent

Try downloading images from googleusercontent URLs in JSON:

- Most likely will fail (images probably deleted with Google Sites)
- But worth attempting for any that might still be accessible
- Use local copies as fallback

## Recommendations

1. **Immediate**: Copy 16 local images to `packages/content/media/` with original filenames
2. **Short-term**: Create mapping table from zuga2 filenames to googleusercontent hashes
3. **Medium-term**: Implement Option 2 (reverse engineer from HTML) to build complete map
4. **Long-term**: Consider Option 1 (perceptual hashing) if needed for disambiguation

## Next Steps

1. Copy local images to content directory
2. Build googleusercontent → local file mapping from zuga2
3. Update markdown files to use local image paths where available
4. Document which images are available vs referenced-but-missing
5. Consider renaming local files to meaningful names based on usage context
