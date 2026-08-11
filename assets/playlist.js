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

  Free tier is unauthenticated and rate-limited, which is plenty for a
  personal portfolio's traffic. If you ever outgrow it, sign up at
  rss2json.com for an API key and drop it into RSS2JSON_API_KEY below,
  or swap PROXY_BASE for your own small serverless function.
  ----------------------------------------------------------------------
*/

const RSS2JSON_API_KEY = ''; // optional — leave blank to use the free anonymous tier
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

  const rssUrl = playlistRssUrl(playlistId);
  let apiUrl = `${PROXY_BASE}?rss_url=${encodeURIComponent(rssUrl)}&count=1`;
  if (RSS2JSON_API_KEY) apiUrl += `&api_key=${RSS2JSON_API_KEY}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Feed request failed with status ' + res.status);
    const data = await res.json();

    if (data.status !== 'ok') throw new Error(data.message || 'Feed service returned an error');
    if (!data.items || !data.items.length) throw new Error('No videos found in this playlist yet');

    const latest = data.items[0];
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
        <a href="https://www.youtube.com/playlist?list=${playlistId}" target="_blank" rel="noopener">View the playlist on YouTube ↗</a>
      </div>
    `;
  }
}
