/*
  playlist.js
  ----------------------------------------------------------------------
  Fetches the most recent video from a YouTube playlist (via its public
  RSS feed) and renders it into a container on the page.

  Why the proxy: YouTube's own feed endpoint
  (https://www.youtube.com/feeds/videos.xml?playlist_id=...) does not
  send CORS headers, so a browser on a different origin (your GitHub
  Pages site) can't fetch it directly — the request gets blocked before
  your JS ever sees a response. rss2json.com is a small free service
  built exactly for this: you send it a feed URL, it fetches the feed
  server-side and hands you back CORS-friendly JSON.

  IMPORTANT — you need a free API key for this to work:
  rss2json's fully-anonymous tier is now too restricted to rely on (it
  returns a 422 error on most requests without a key). Get a free key at:

    1. https://rss2json.com/sign-up  — create a free account, confirm your email
    2. https://rss2json.com/me/api_key  — copy your key
    3. Paste it into RSS2JSON_API_KEY below

  It's fine for this key to be visible in your page's source — it's a
  free-tier key with no billing attached, and if it's ever abused you can
  regenerate it from the same dashboard page.
  ----------------------------------------------------------------------
*/

const RSS2JSON_API_KEY = 'mdveieuuo3bjxstgeata0zgpegwtoiqx8q9gee5m'; // paste your free rss2json.com API key here
const PROXY_BASE = 'https://api.rss2json.com/v1/api.json';

function playlistRssUrl(playlistId) {
  return `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
}

function extractVideoId(link) {
  try {
    return new URL(link).searchParams.get('v');
  } catch (e) {
    return null;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Loads the newest video from a playlist and renders it into #containerId.
 * @param {string} playlistId - the YouTube playlist ID (the part after list= in the playlist URL)
 * @param {string} containerId - id of the element to render the result into
 */
async function loadLatestFromPlaylist(playlistId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Defensive cleanup: if someone pastes a full share link's query string
  // (e.g. "PLxxxx&si=abc123" from YouTube's "Share" button, or a whole
  // "?list=PLxxxx&si=abc123" fragment) instead of the bare ID, strip
  // everything after the first & or ? so we're left with just the ID.
  const cleanId = (playlistId || '').trim().split('&')[0].split('?')[0].replace(/^list=/, '');

  if (!/^[A-Za-z0-9_-]{10,}$/.test(cleanId)) {
    console.warn(
      `loadLatestFromPlaylist: "${cleanId}" doesn't look like a valid playlist ID. ` +
      `Real YouTube playlist IDs are usually ~34 characters. Open the playlist directly ` +
      `(not via the Share button) and copy everything after list= in the address bar.`
    );
  }

  if (!RSS2JSON_API_KEY) {
    console.warn(
      'loadLatestFromPlaylist: no RSS2JSON_API_KEY set. rss2json.com now requires a free ' +
      'API key for reliable access — sign up at https://rss2json.com/sign-up, grab your key ' +
      'from https://rss2json.com/me/api_key, and paste it into RSS2JSON_API_KEY at the top ' +
      'of assets/playlist.js. Without it, requests will likely fail with a 422 error.'
    );
  }

  const rssUrl = playlistRssUrl(cleanId);
  // Pull more than 1 item: YouTube's feed order follows the playlist's own
  // sort setting (which can be manual order or oldest-first), not
  // necessarily "newest upload first" — so we fetch a batch and sort them
  // ourselves by actual publish date to reliably find the newest one.
  let apiUrl = `${PROXY_BASE}?rss_url=${encodeURIComponent(rssUrl)}&count=15`;
  if (RSS2JSON_API_KEY) apiUrl += `&api_key=${RSS2JSON_API_KEY}`;

  try {
    const res = await fetch(apiUrl);
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON error body, ignore */ }

    if (!res.ok) {
      const detail = data && data.message ? data.message : `HTTP ${res.status}`;
      throw new Error('Feed request failed: ' + detail);
    }
    if (!data || data.status !== 'ok') throw new Error((data && data.message) || 'Feed service returned an error');
    if (!data.items || !data.items.length) throw new Error('No videos found in this playlist yet');

    const sorted = [...data.items].sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    );
    const latest = sorted[0];
    const videoId = extractVideoId(latest.link);
    if (!videoId) throw new Error('Could not read a video ID from the feed entry');

    const rawDescription = (latest.description || '').replace(/<[^>]*>/g, '');
    const shortDescription = rawDescription.length > 500
      ? rawDescription.slice(0, 500).trim() + '…'
      : rawDescription;

    container.innerHTML = `
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          title="${escapeHtml(latest.title)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
      <div class="video-info">
        ${latest.pubDate ? `<span class="video-date">${formatDate(latest.pubDate)}</span>` : ''}
        <h3>${escapeHtml(latest.title)}</h3>
        <p>${escapeHtml(shortDescription).replace(/\n/g, '<br>')}</p>
        <a class="video-link" href="${latest.link}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
      </div>
    `;
  } catch (err) {
    console.error('loadLatestFromPlaylist:', err);
    container.innerHTML = `
      <div class="video-error">
        <p>Couldn't load the latest video right now.</p>
        <a href="https://www.youtube.com/playlist?list=${cleanId}" target="_blank" rel="noopener">View the playlist on YouTube ↗</a>
      </div>
    `;
  }
}