// scripts/fetch-games.mjs
//
// Fetches CCU (players online), total visits and the game icon for every
// game in games.config.json from Roblox's public web APIs, and writes them to
// data/Games.json for the homepage to read. Roblox doesn't allow other
// websites to call these APIs from the browser (no CORS headers), so this
// runs server-side, the same way fetch-playlists.mjs does. No API key needed.
//
// Run by .github/workflows/update-playlists.yml.
//
// Local test run:
//   node scripts/fetch-games.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'games.config.json');
const outPath = path.join(__dirname, '..', 'data', 'Games.json');

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

// A place ID is the number in the game's link. The stats APIs want the
// "universe ID" instead, so look that up first.
const games = [];
for (const { name, placeId } of config) {
  const { universeId } = await getJson(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
  if (!universeId) throw new Error(`No game found for "${name}" (place ${placeId})`);
  games.push({ name, placeId, universeId });
}

const ids = games.map((g) => g.universeId).join(',');
const stats = await getJson(`https://games.roblox.com/v1/games?universeIds=${ids}`);
const icons = await getJson(
  `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids}&size=512x512&format=Png`
);

const payload = {
  updatedAt: new Date().toISOString(),
  games: games.map((game) => {
    const info = stats.data.find((s) => s.id === game.universeId);
    if (!info) throw new Error(`Roblox returned no stats for "${game.name}"`);
    const icon = icons.data.find((i) => i.targetId === game.universeId && i.state === 'Completed');
    return {
      ...game,
      playing: info.playing,
      visits: info.visits,
      icon: icon ? icon.imageUrl : ''
    };
  })
};

// Any error above stops the script before this point, so the site keeps
// showing the last good data.
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
console.log(`Saved stats for ${payload.games.length} game(s) to data/Games.json`);
