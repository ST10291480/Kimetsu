# Kitsu

**Your anime, beautifully kept.**

Kitsu is a responsive anime discovery and journaling app. Browse a curated catalog, build a personal library, track what you are watching, and keep notes on the stories you love.

## Features

- Browse and search a catalog of 300 popular anime
- Filter titles by genre and view ratings, status, and episode details
- Save titles to your library and track your watching journal
- Explore profile, community, friends, and anime news views
- Optionally load live favorites and metadata from AniDB
- Keep personal app data in browser storage, with no account required

## Preview

Run the app locally to explore the interface and features.

## Getting started

### Requirements

- Node.js 18 or later

### Run the app

```bash
git clone https://github.com/ST10291480/Kimetsu.git
cd Kimetsu
npm start
```

Open [http://localhost:8080](http://localhost:8080) in your browser. To use another port, set the `PORT` environment variable before starting the server.

The catalog and local features work without API credentials. To enable AniDB live data, enter your registered AniDB client name in the app's settings.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | App shell and page layout |
| `app.js` | Catalog, navigation, and interactions |
| `styles.css`, `extras.css`, `mobile.css` | Core, supplemental, and responsive styles |
| `popular-anime.js` | Curated anime catalog data |
| `images/` | Local poster artwork |
| `server.js` | Lightweight local Node.js server |
| `scripts/` | Catalog and poster maintenance scripts |

## Built with

Vanilla JavaScript, HTML, and CSS, served by Node.js. The app has no runtime package dependencies.

## Data and privacy

Your library, settings, journal, and community activity are stored in your browser's `localStorage`. They are local to that browser and are not synchronized to a server. AniDB live data is optional and requires a registered client name configured in the app.
