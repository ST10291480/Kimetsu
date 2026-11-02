const fs = require('node:fs/promises');
const path = require('node:path');

const endpoint = 'https://graphql.anilist.co';
const projectRoot = path.resolve(__dirname, '..');
const posterDir = path.join(projectRoot, 'images', 'popular');
const excluded = new Set([
  'yu yu hakusho', 'one piece', 'naruto', 'hunter x hunter', 'dragon ball z', 'bleach',
  'attack on titan', 'berserk', 'black clover', 'blue lock', 'code geass lelouch of the rebellion',
  'demon slayer kimetsu no yaiba', 'fullmetal alchemist brotherhood', 'jujutsu kaisen', 'monster',
  'my hero academia', 'nana', 'solo leveling', 'vinland saga'
].map(normalize));

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

async function getPage(page) {
  const query = `query ($page: Int) { Page(page: $page, perPage: 50) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { id title { romaji english } coverImage { large } episodes format status seasonYear startDate { year } averageScore genres description(asHtml: false) studios { nodes { name } } } } }`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { page } })
  });
  if (!response.ok) throw new Error(`AniList page ${page} returned HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data.Page.media;
}

async function download(item) {
  const url = item.coverImage?.large;
  if (!url || !/^https:\/\/.+\.jpe?g(?:\?.*)?$/i.test(url)) return null;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Poster ${item.id} returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error(`Poster ${item.id} was not a JPEG`);
  }
  const filename = `anilist-${item.id}.jpg`;
  await fs.writeFile(path.join(posterDir, filename), bytes);
  const title = item.title.english || item.title.romaji || `Anime ${item.id}`;
  return {
    id: `anilist-${item.id}`,
    anilistId: item.id,
    title,
    image: `popular/${filename}`,
    year: item.startDate?.year || item.seasonYear || '',
    score: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : 0,
    episodes: item.episodes || 0,
    genres: item.genres || [],
    studio: item.studios?.nodes?.[0]?.name || 'Studio information unavailable',
    description: (item.description || '').replace(/~!|!~/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000),
    format: item.format || '',
    status: item.status || ''
  };
}

async function main() {
  await fs.mkdir(posterDir, { recursive: true });
  const candidates = [];
  for (let page = 1; candidates.length < 300; page++) {
    const items = await getPage(page);
    if (!items.length) break;
    for (const item of items) {
      const title = normalize(item.title.english || item.title.romaji);
      if (!excluded.has(title) && item.coverImage?.large && /\.jpe?g(?:\?.*)?$/i.test(item.coverImage.large)) candidates.push(item);
    }
    console.log(`Fetched AniList popularity page ${page}; ${candidates.length} eligible entries.`);
    if (candidates.length < 300) await new Promise(resolve => setTimeout(resolve, 1200));
  }

  const catalog = [];
  for (let i = 0; i < candidates.length && catalog.length < 300; i += 5) {
    const batch = await Promise.all(candidates.slice(i, i + 5).map(download));
    catalog.push(...batch.filter(Boolean));
    if (catalog.length % 25 === 0 || catalog.length >= 300) console.log(`Downloaded ${catalog.length}/300 JPEG covers.`);
  }
  if (catalog.length !== 300) throw new Error(`Only ${catalog.length} JPEG covers were available; expected 300.`);

  const output = `window.popularAnimeCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
  await fs.writeFile(path.join(projectRoot, 'popular-anime.js'), output, 'utf8');
  console.log(`Saved ${catalog.length} anime entries and JPEG covers.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
