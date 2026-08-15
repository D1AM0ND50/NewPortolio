// scripts/fetch-playlists.mjs
//
// Fetches every video in each configured playlist via the official
// YouTube Data API v3 (playlistItems.list, part=snippet) and writes the
// result to a JSON file the static site reads directly — no client-side
// API calls, no CORS problem, no third-party proxy.
//
// Run by .github/workflows/update-playlists.yml on a daily schedule (and
// manually via the Actions tab's "Run workflow" button). Requires the
// YOUTUBE_API_KEY environment variable to be set — in CI this comes from
// the YOUTUBE_API_KEY repository secret.
//
// Local test run:
//   YOUTUBE_API_KEY=your_key_here node scripts/fetch-playlists.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error(
    'Missing YOUTUBE_API_KEY environment variable.\n' +
    'In GitHub Actions: Settings → Secrets and variables → Actions → New repository secret,\n' +
    'name it YOUTUBE_API_KEY, and make sure the workflow passes it through (it already does).'
  );
  process.exit(1);
}

const configPath = path.join(__dirname, 'playlists.config.json');
const playlists = JSON.parse(await fs.readFile(configPath, 'utf-8'));

async function fetchAllPlaylistItems(playlistId) {
  const items = [];
  let pageToken = '';

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('key', API_KEY);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url);
    const rawBody = await res.text();
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${res.status}): ${rawBody.slice(0, 200)}`);
    }

    if (!res.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    for (const item of data.items || []) {
      const s = item.snippet;
      if (!s || !s.resourceId || !s.resourceId.videoId) continue;
      // Deleted/private videos still show up as placeholder entries — skip them.
      if (s.title === 'Private video' || s.title === 'Deleted video') continue;

      items.push({
        videoId: s.resourceId.videoId,
        title: s.title,
        description: s.description || '',
        publishedAt: s.publishedAt,
        thumbnail:
          (s.thumbnails && (
            (s.thumbnails.medium && s.thumbnails.medium.url) ||
            (s.thumbnails.default && s.thumbnails.default.url)
          )) || ''
      });
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  // The API returns items in playlist order (which can be manual or
  // oldest-first) — sort explicitly so the newest upload is always first.
  items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return items;
}

let hadError = false;

for (const { name, playlistId, outFile } of playlists) {
  try {
    console.log(`Fetching "${name}" (playlist ${playlistId})...`);
    const videos = await fetchAllPlaylistItems(playlistId);

    const payload = {
      playlistId,
      updatedAt: new Date().toISOString(),
      videoCount: videos.length,
      videos
    };

    const outPath = path.join(__dirname, '..', outFile);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
    console.log(`  -> saved ${videos.length} video(s) to ${outFile}`);
  } catch (err) {
    hadError = true;
    console.error(`  !! Failed to fetch "${name}" (playlist ${playlistId}): ${err.message}`);
    console.error(`     Leaving ${outFile} untouched so the site keeps showing last-known-good data.`);
  }
}

if (hadError) {
  console.error('\nOne or more playlists failed — see errors above. Common causes:');
  console.error('  - The playlist ID is wrong or truncated (real IDs are ~34 characters)');
  console.error('  - The playlist is private');
  console.error('  - YOUTUBE_API_KEY is invalid, restricted, or has no quota left');
  process.exit(1);
}
