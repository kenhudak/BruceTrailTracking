# Bruce Trail Progress

A static site (GitHub Pages friendly) that displays your incremental end-to-end
hike of the Bruce Trail on an OpenStreetMap base layer.

## Directory layout

```
index.html
css/style.css
js/app.js          ← map logic, stats, geolocation (edit CONFIG at the top)
js/tracks.js       ← the track manifest you edit after each hike
main_trail/        ← put the full Bruce Trail GPX here as bruce_trail.gpx
tracks/            ← drop each weekend's Garmin GPX export here
```

## Setup

1. Put the full end-to-end trail GPX at `main_trail/bruce_trail.gpx`.
   It renders as a muted green dashed line; your hikes render on top in orange.
2. Push the repo to GitHub and enable **Settings → Pages → Deploy from branch**
   (branch `main`, folder `/`).

## Adding a hike (weekend workflow)

1. Export the GPX from Garmin Express.
2. Rename it with the convention `YYYY-MM-DD_short-description.gpx`,
   e.g. `2026-07-12_tobermory-to-cyprus-lake.gpx`.
3. Drop it in `tracks/`.
4. Add the filename to the `TRACK_FILES` array in `js/tracks.js`.
5. Commit and push. Done — the page shows the new segment, updates the
   km/percent stats, and adds it to the hike log.

### Optional: skip step 4 forever

GitHub Pages can't list a directory, but the GitHub API can. Fill in
`CONFIG.github` at the top of `js/app.js`:

```js
github: { user: "your-username", repo: "your-repo", branch: "main", tracksPath: "tracks" },
```

The page will then auto-discover every `.gpx` in `tracks/` on each load.
The manifest in `js/tracks.js` remains as a fallback (used automatically if
the API is unreachable or rate-limited — unauthenticated limit is 60
requests/hour per IP, plenty for personal use).

## Features

- **Base layers**: Normal (OSM), Dark (CARTO Dark Matter), Topo (OpenTopoMap)
- **Measurement tool**: ruler icon, top-left of the map (Leaflet.PolylineMeasure)
- **Find me**: shows your iPhone GPS position with an accuracy circle
  (requires HTTPS, which GitHub Pages provides, and location permission in Safari)
- **Stats**: total km hiked, % of the full trail, hike count, progress bar.
  The % uses the measured length of your main-trail GPX (falls back to 900 km).
- **Hike log**: tap any entry to zoom to that segment.

## Local testing

Browsers block `fetch` of local files over `file://`, so serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
