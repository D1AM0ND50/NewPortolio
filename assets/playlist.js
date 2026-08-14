/*
  playlist.js
  ----------------------------------------------------------------------
  Loads videos from a YouTube playlist via its public RSS feed and
  renders all returned videos into a container.
*/

const RSS2JSON_API_KEY = 'mdveieuuo3bjxstgeata0zgpegwtoiqx8q9gee5m';
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

  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Loads ALL videos returned by the playlist RSS feed
 * and renders them into #containerId.
 *
 * @param {string} playlistId
 * @param {string} containerId
 */
async function loadPlaylist(playlistId, containerId) {
  const container = document.getElementById(containerId);

  if (!container) return;

  const cleanId = (playlistId || '')
    .trim()
    .split('&')[0]
    .split('?')[0]
    .replace(/^list=/, '');

  if (!/^[A-Za-z0-9_-]{10,}$/.test(cleanId)) {
    console.warn(
      `loadPlaylist: "${cleanId}" doesn't look like a valid playlist ID.`
    );
  }

  if (!RSS2JSON_API_KEY) {
    console.warn('No RSS2JSON API key configured.');
  }

  const rssUrl = playlistRssUrl(cleanId);

  // Ask RSS2JSON for as many items as it will return.
  let apiUrl =
    `${PROXY_BASE}?rss_url=${encodeURIComponent(rssUrl)}&count=100`;

  if (RSS2JSON_API_KEY) {
    apiUrl += `&api_key=${RSS2JSON_API_KEY}`;
  }

  // Loading message
  container.innerHTML = `
    <div class="video-loading">
      Loading playlist…
    </div>
  `;

  try {
    const res = await fetch(apiUrl);

    let data = null;

    try {
      data = await res.json();
    } catch (e) {
      // Ignore invalid JSON and handle it below.
    }

    if (!res.ok) {
      const detail =
        data && data.message
          ? data.message
          : `HTTP ${res.status}`;

      throw new Error(`Feed request failed: ${detail}`);
    }

    if (!data || data.status !== 'ok') {
      throw new Error(
        (data && data.message) ||
        'Feed service returned an error'
      );
    }

    if (!data.items || !data.items.length) {
      throw new Error('No videos found in this playlist yet');
    }

    /*
      Sort videos newest first.

      Remove this sort if you want to preserve the order
      returned by YouTube/RSS2JSON.
    */
    const videos = [...data.items].sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    );

    /*
      Build HTML for EVERY video.
    */
    const videosHtml = videos
      .map(video => {
        const videoId = extractVideoId(video.link);

        if (!videoId) {
          return '';
        }

        const rawDescription =
          (video.description || '')
            .replace(/<[^>]*>/g, '');

        const shortDescription =
          rawDescription.length > 500
            ? rawDescription.slice(0, 500).trim() + '…'
            : rawDescription;

        return `
          <article class="playlist-video">

            <div class="video-embed">
              <iframe
                src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}"
                title="${escapeHtml(video.title)}"
                frameborder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>

            <div class="video-info">

              ${
                video.pubDate
                  ? `<span class="video-date">
                      ${formatDate(video.pubDate)}
                    </span>`
                  : ''
              }

              <h3>${escapeHtml(video.title)}</h3>

              ${
                shortDescription
                  ? `<p>
                      ${escapeHtml(shortDescription)
                        .replace(/\n/g, '<br>')}
                    </p>`
                  : ''
              }

              <a
                class="video-link"
                href="${escapeHtml(video.link)}"
                target="_blank"
                rel="noopener"
              >
                Watch on YouTube ↗
              </a>

            </div>

          </article>
        `;
      })
      .join('');

    if (!videosHtml) {
      throw new Error('No valid videos could be read from the playlist');
    }

    /*
      Render the entire playlist.
    */
    container.innerHTML = `
      <div class="playlist-videos">
        ${videosHtml}
      </div>
    `;

  } catch (err) {
    console.error('loadPlaylist:', err);

    container.innerHTML = `
      <div class="video-error">
        <p>Couldn't load the playlist right now.</p>

        <a
          href="https://www.youtube.com/playlist?list=${encodeURIComponent(cleanId)}"
          target="_blank"
          rel="noopener"
        >
          View the playlist on YouTube ↗
        </a>
      </div>
    `;
  }
}
