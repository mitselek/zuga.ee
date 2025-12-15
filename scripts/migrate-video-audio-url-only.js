#!/usr/bin/env node

/**
 * Migration script for Issue #53: Migrate video/audio embeds to URL-only strategy
 *
 * Removes redundant video_id/track_id fields from content files, as IDs are now
 * extracted automatically from URLs by VideoEmbed and AudioEmbed components.
 *
 * Usage:
 *   node scripts/migrate-video-audio-url-only.js --dry-run
 *   node scripts/migrate-video-audio-url-only.js
 */

const fs = require('fs');
const path = require('path');

// Try to load dependencies from knowledge-base/node_modules
const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base');
const nodeModulesPath = path.join(knowledgeBasePath, 'node_modules');

let yaml;
try {
  try {
    yaml = require(path.join(nodeModulesPath, 'js-yaml'));
  } catch {
    yaml = require('js-yaml');
  }
} catch (error) {
  console.error('❌ Error: js-yaml not found. Please install: npm install js-yaml');
  process.exit(1);
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.isFile() && file.name.endsWith('.md')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const SKIP_BACKUPS = process.argv.includes('--skip-backups');

const CONTENT_DIR = 'apps/web/src/content/pages';

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url) {
  const match = url.match(/(?:vimeo\.com|player\.vimeo\.com\/video)\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract SoundCloud track ID from URL
 */
function extractSoundCloudId(url) {
  const embedMatch = url.match(/tracks%2F(\d+)/);
  if (embedMatch) return embedMatch[1];
  const apiMatch = url.match(/api\.soundcloud\.com\/tracks\/(\d+)/);
  if (apiMatch) return apiMatch[1];
  return null;
}

/**
 * Clean URL by removing tracking parameters
 */
function cleanUrl(url, platform) {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'feature', 'featured', 'si', 'fbclid', 'gclid', 'ref',
      'embed_config', 'autoplay', 'mute', 'loop'
    ];

    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // For YouTube, keep only v parameter
    if (platform === 'youtube' && urlObj.hostname.includes('youtube.com')) {
      const v = urlObj.searchParams.get('v');
      urlObj.search = v ? `?v=${v}` : '';
    }

    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return { data: {}, content, frontmatterMatch: null };
    const frontmatterYaml = frontmatterMatch[1];
    const data = yaml.load(frontmatterYaml);
    return { data, content, frontmatterMatch };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Validate that video_id matches extracted ID from URL
 */
function validateVideoId(video) {
  if (!video.video_id || !video.url) return true; // Skip if no ID or URL

  let extractedId = null;
  if (video.platform === 'youtube') {
    extractedId = extractYouTubeId(video.url);
  } else if (video.platform === 'vimeo') {
    extractedId = extractVimeoId(video.url);
  }

  if (extractedId && video.video_id !== extractedId) {
    return { valid: false, reason: `ID mismatch: video_id="${video.video_id}" but URL contains "${extractedId}"` };
  }

  return { valid: true };
}

/**
 * Validate that track_id matches extracted ID from URL
 */
function validateTrackId(audio) {
  if (!audio.track_id || !audio.url) return { valid: true }; // Skip if no ID or URL

  if (audio.platform === 'soundcloud') {
    const extractedId = extractSoundCloudId(audio.url);
    if (extractedId && audio.track_id !== extractedId) {
      return { valid: false, reason: `ID mismatch: track_id="${audio.track_id}" but URL contains "${extractedId}"` };
    }
  }

  return { valid: true };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const { data, content, frontmatterMatch, error } = parseFrontmatter(filePath);

  if (error) {
    console.error(`❌ Error parsing ${filePath}: ${error}`);
    return null;
  }

  if (!frontmatterMatch) {
    return null; // No frontmatter, skip
  }

  let modified = false;
  const issues = [];
  const newData = { ...data };

  // Process videos
  if (newData.videos && Array.isArray(newData.videos)) {
    newData.videos = newData.videos.map((video, index) => {
      const newVideo = { ...video };

      // Validate video_id matches URL
      if (video.video_id) {
        const validation = validateVideoId(video);
        if (!validation.valid) {
          issues.push(`Video ${index + 1}: ${validation.reason}`);
        }

        // Clean URL
        const cleanedUrl = cleanUrl(video.url, video.platform);
        if (cleanedUrl !== video.url) {
          newVideo.url = cleanedUrl;
          modified = true;
        }

        // Remove video_id (ID will be extracted from URL)
        delete newVideo.video_id;
        modified = true;
      }

      return newVideo;
    });
  }

  // Process audio
  if (newData.audio && Array.isArray(newData.audio)) {
    newData.audio = newData.audio.map((audio, index) => {
      const newAudio = { ...audio };

      // Validate track_id matches URL
      if (audio.track_id) {
        const validation = validateTrackId(audio);
        if (!validation.valid) {
          issues.push(`Audio ${index + 1}: ${validation.reason}`);
        }

        // Remove track_id (ID will be extracted from URL if needed)
        delete newAudio.track_id;
        modified = true;
      }

      return newAudio;
    });
  }

  if (issues.length > 0) {
    console.warn(`⚠️  ${filePath}:`);
    issues.forEach(issue => console.warn(`   ${issue}`));
  }

  if (!modified) {
    return null; // No changes needed
  }

  // Reconstruct file content
  const updatedFrontmatter = yaml.dump(newData, { indent: 2, lineWidth: -1 });
  const bodyContent = content.slice(frontmatterMatch[0].length);
  const updatedContent = `---\n${updatedFrontmatter}---${bodyContent}`;

  return {
    filePath,
    updatedContent,
    issues,
  };
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('Migrate Video/Audio Embeds to URL-Only Strategy');
  console.log('='.repeat(60));

  // Find all markdown files
  const allFiles = findMarkdownFiles(CONTENT_DIR);
  const files = allFiles.filter(file => {
    if (SKIP_BACKUPS) {
      return !file.includes('.backup') && !file.includes('source_zuga_ee');
    }
    return !file.includes('source_zuga_ee'); // Always skip source_zuga_ee
  });

  console.log(`\n📄 Found ${files.length} markdown files to process`);

  const filesToUpdate = [];

  // Process each file
  for (const filePath of files) {
    const result = processFile(filePath);
    if (result) {
      filesToUpdate.push(result);
    }
  }

  if (filesToUpdate.length === 0) {
    console.log('\n✅ No files need updating (all already migrated or no video/audio embeds found)');
    return;
  }

  console.log(`\n📊 Found ${filesToUpdate.length} files to update:`);
  filesToUpdate.forEach((file, index) => {
    console.log(`   ${index + 1}. ${path.relative(process.cwd(), file.filePath)}`);
    if (VERBOSE && file.issues.length > 0) {
      file.issues.forEach(issue => console.log(`      ⚠️  ${issue}`));
    }
  });

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - No files will be modified');
    console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n🚀 Applying updates...');
    let updatedCount = 0;

    for (const file of filesToUpdate) {
      try {
        fs.writeFileSync(file.filePath, file.updatedContent, 'utf8');
        if (VERBOSE) console.log(`✅ Updated: ${path.relative(process.cwd(), file.filePath)}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${file.filePath}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully updated ${updatedCount} files`);
    console.log('\nNext steps:');
    console.log('1. Test build: cd apps/web && npm run build');
    console.log('2. Verify pages render correctly');
    console.log('3. Check for any console warnings about ID extraction');
    console.log('='.repeat(60));
  }
}

main();
