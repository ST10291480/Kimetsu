# Kitsu

**Your anime, beautifully kept.**

Kitsu is a responsive anime discovery and journaling app. Browse a curated catalog, build a personal library, track what you are watching, and keep notes on the stories you love.

## Features

- Browse and search a catalog of 300 popular anime
- Filter titles by genre and view ratings, status, and episode details
- Share direct links to anime details and use browser back/forward navigation
- Save titles to your library and track your watching journal
- Explore profile, community, friends, and anime news views
- Optionally load live favorites and metadata from AniDB
- Install Kitsu as a progressive web app and browse the cached shell offline (HTTPS hosting required)
- Export and restore a portable backup of your library and activity
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

The catalog and local features work without API credentials. To enable AniDB live data, enter your registered AniDB client name in the app's settings. Requests go through the Node server so they also work when Kitsu is hosted over HTTPS.

## Deployment

Deploy this repository as a Node.js web service with Node.js 18 or later and use `npm start` as the start command. The server listens on `0.0.0.0` and uses the platform-provided `PORT` value. Set `HOST` only if your hosting platform requires a different bind address.

Kitsu has no database or account backend: profiles, library entries, and activity are stored in each visitor's browser. The community and friends views are local demo features, so visitors do not share posts with one another. Users can export a backup from their profile before clearing browser data or changing devices.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | App shell and page layout |
| `app.js` | Catalog, navigation, and interactions |
| `styles.css`, `extras.css`, `mobile.css` | Core, supplemental, and responsive styles |
| `popular-anime.js` | Curated anime catalog data |
| `images/` | Local poster artwork |
| `icons/` | Progressive web app install icons |
| `server.js` | Lightweight local Node.js server |
| `scripts/` | Catalog and poster maintenance scripts |

## Built with

Vanilla JavaScript, HTML, and CSS, served by Node.js. The app has no runtime package dependencies.

## Data and privacy

Your library, settings, ratings, and activity are stored in your browser's `localStorage`. They are local to that browser and are not synchronized to a server. The optional AniDB proxy accepts only the supported metadata requests and applies a per-IP request limit; it does not store the configured client name or user activity.
