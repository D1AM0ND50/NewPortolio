/*
  playlist.js
  ----------------------------------------------------------------------
  Renders videos from a locally-stored JSON file (e.g. data/Animations.json)
  that's generated once a day by a GitHub Actions workflow calling the
  official YouTube Data API server-side — see:
    .github/workflows/update-playlists.yml
    scripts/fetch-playlists.mjs
    scripts/playlists.config.json

  Because the browser now just fetches a plain JSON file living on the
  same site (same origin), there's no CORS problem and no third-party
  proxy involved — this replaces the old rss2json.com-based approach
  entirely, and also removes the ~15-video cap that YouTube's RSS feed
  imposed, since the Data API can page through an entire playlist.
  ----------------------------------------------------------------------
*/

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Loads every video from a pre-fetched playlist JSON file and renders
 * them into #containerId: a "now playing" embedded player (defaulting to
 * the newest video) plus a clickable grid of every saved video. Clicking
 * a thumbnail swaps the now-playing player without a page reload.
 *
 * @param {string} dataUrl - path to the JSON file, e.g. "data/Animations.json"
 * @param {string} containerId - id of the element to render the result into
 */
async function loadPlaylistFromData(dataUrl, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(dataUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load ${dataUrl} (HTTP ${res.status})`);
    const data = await res.json();

    if (!data.videos || !data.videos.length) {
      throw new Error(
        'No videos saved yet. If this is a brand new setup, run the ' +
        '"Update YouTube Playlist Data" workflow once from the Actions tab.'
      );
    }

    renderPlaylistGrid(data.videos, container, data.playlistId, data.updatedAt);
  } catch (err) {
    console.error('loadPlaylistFromData:', err);
    container.innerHTML = `
      <div class="video-error">
        <p>Couldn't load videos right now.</p>
        <p class="video-error-detail">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderPlaylistGrid(videos, container, playlistId, updatedAt) {
  const videoMap = new Map();

  const gridItems = videos.map((v) => {
    videoMap.set(v.videoId, v);
    return `
      <div class="video-thumb-card" data-video-id="${v.videoId}" tabindex="0" role="button" aria-label="Play ${escapeHtml(v.title)}">
        <div class="thumb-wrap">
          <img src="${v.thumbnail || ''}" alt="${escapeHtml(v.title)}" loading="lazy">
          <span class="play-badge">▶</span>
        </div>
        <div class="thumb-info">
          <h4>${escapeHtml(v.title)}</h4>
          ${v.publishedAt ? `<span class="video-date">${formatDate(v.publishedAt)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div id="nowPlaying"></div>
    <h3 class="grid-heading">All videos (${videos.length})</h3>
    ${updatedAt ? `<p class="updated-note">Updated ${formatDate(updatedAt)}</p>` : ''}
    <div class="video-grid">${gridItems}</div>
    ${playlistId ? `
      <div class="playlist-footer-link">
        <a href="https://www.youtube.com/playlist?list=${playlistId}" target="_blank" rel="noopener">View full playlist on YouTube ↗</a>
      </div>` : ''}
  `;

  function renderNowPlaying(video) {
    const rawDescription = video.description || '';
    const shortDescription = rawDescription.length > 500
      ? rawDescription.slice(0, 500).trim() + '…'
      : rawDescription;

    document.getElementById('nowPlaying').innerHTML = `
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/${video.videoId}"
          title="${escapeHtml(video.title)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
      <div class="video-info">
        ${video.publishedAt ? `<span class="video-date">${formatDate(video.publishedAt)}</span>` : ''}
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(shortDescription).replace(/\n/g, '<br>')}</p>
        <a class="video-link" href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
      </div>
    `;

    container.querySelectorAll('.video-thumb-card').forEach(el => {
      el.classList.toggle('active', el.dataset.videoId === video.videoId);
    });
  }

  container.querySelectorAll('.video-thumb-card').forEach(card => {
    const playThis = () => {
      const video = videoMap.get(card.dataset.videoId);
      if (!video) return;
      renderNowPlaying(video);
      document.getElementById('nowPlaying').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    card.addEventListener('click', playThis);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playThis();
      }
    });
  });

  renderNowPlaying(videos[0]);
}
