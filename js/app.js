/* ================================================================
   Bruce Trail Progress — app.js
   Leaflet map + GPX rendering + stats + geolocation
   ================================================================ */

const CONFIG = {
  /* Fill these in and the site will auto-discover every .gpx file
     in /tracks via the GitHub API on each page load — no manual
     manifest editing needed. Leave user as "" to disable and use
     the TRACK_FILES array in tracks.js instead. */
  github: {
    user: "",            // e.g. "kenh"
    repo: "",            // e.g. "bruce-trail-map"
    branch: "main",
    tracksPath: "tracks",
  },

  /* Official end-to-end length of the Bruce Trail main trail (km).
     Used for the % complete stat. If the main-trail GPX loads,
     its measured length is used instead. */
  trailLengthKm: 900,

  /* Line styles */
  mainTrailStyle: { color: "#557a5b", weight: 3, opacity: 0.55, dashArray: "6 8" },
  trackStyle:     { color: "#d95d2c", weight: 4, opacity: 0.9 },

  /* Initial view: centred on the escarpment */
  center: [44.35, -80.6],
  zoom: 7,
};

/* ---------------- Map + base layers ---------------- */

const baseLayers = {
  normal: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }),
  dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }),
  topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  }),
};

const map = L.map("map", {
  center: CONFIG.center,
  zoom: CONFIG.zoom,
  layers: [baseLayers.normal],
});

/* Layer switcher buttons (in the bento card) */
let activeLayer = baseLayers.normal;
document.querySelectorAll(".layer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = baseLayers[btn.dataset.layer];
    if (!next || next === activeLayer) return;
    map.removeLayer(activeLayer);
    map.addLayer(next);
    activeLayer = next;
    document.querySelectorAll(".layer-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  });
});

/* ---------------- Measurement tool ---------------- */

L.control.polylineMeasure({
  position: "topleft",
  unit: "kilometres",
  showBearings: false,
  clearMeasurementsOnStop: false,
  showClearControl: true,
  showUnitControl: true,
}).addTo(map);

/* ---------------- GPX loading ---------------- */

const hikeListEl = document.getElementById("hike-list");
const trackGroup = L.featureGroup().addTo(map);
let mainTrailKm = CONFIG.trailLengthKm;
let completedKm = 0;
let hikeCount = 0;
let loadedCount = 0;
let expectedCount = 0;

/* Parse "YYYY-MM-DD_some-name.gpx" into { date, name } */
function parseFilename(filename) {
  const base = filename.replace(/\.gpx$/i, "");
  const m = base.match(/^(\d{4}-\d{2}-\d{2})[_-]?(.*)$/);
  const date = m ? m[1] : "";
  const raw = m && m[2] ? m[2] : base;
  const name = raw.replace(/[-_]+/g, " ").trim() || "Unnamed hike";
  return { date, name: name.charAt(0).toUpperCase() + name.slice(1) };
}

function loadMainTrail() {
  new L.GPX(MAIN_TRAIL_FILE, {
    async: true,
    polyline_options: CONFIG.mainTrailStyle,
    // new (1.7.0 syntax — null URLs suppress the start/end pin markers)
    marker_options: {
      startIconUrl: null,
      endIconUrl: null,
      shadowUrl: null,
      wptIconUrls: {},
    },
  })
    .on("loaded", (e) => {
      const km = e.target.get_distance() / 1000;
      if (km > 100) mainTrailKm = km; // trust the file if it looks like the full trail
      map.fitBounds(e.target.getBounds(), { padding: [30, 30] });
      updateStats();
    })
    .on("error", () => {
      console.warn("Main trail GPX not found at " + MAIN_TRAIL_FILE);
    })
    .addTo(map);
}

function loadTrack(filename) {
  const { date, name } = parseFilename(filename);
  new L.GPX("tracks/" + filename, {
    async: true,
    polyline_options: CONFIG.trackStyle,
    markers: { startIcon: null, endIcon: null, wptIcons: {} },
  })
    .on("loaded", (e) => {
      const gpx = e.target;
      const km = gpx.get_distance() / 1000;
      completedKm += km;
      hikeCount += 1;

      gpx.bindPopup(
        `<strong>${name}</strong><br>${date || ""}<br>${km.toFixed(1)} km`
      );

      addHikeListItem({ date, name, km, layer: gpx });
      trackGroup.addLayer(gpx);
      updateStats();
    })
    .on("error", () => {
      console.warn("Could not load track: " + filename);
      finishOne();
    })
    .on("loaded", finishOne)
    .addTo(map);
}

function finishOne() {
  loadedCount += 1;
  if (loadedCount >= expectedCount && hikeCount === 0) {
    hikeListEl.innerHTML =
      '<li class="hike-empty">No hikes yet — add a GPX file to /tracks and list it in js/tracks.js. Lace up!</li>';
  }
}

const hikeItems = [];
function addHikeListItem(item) {
  hikeItems.push(item);
  hikeItems.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  hikeListEl.innerHTML = "";
  hikeItems.forEach((h) => {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="hike-date">${h.date || "—"}</span>` +
      `<span class="hike-name">${h.name}</span>` +
      `<span class="hike-km">${h.km.toFixed(1)} km</span>`;
    li.addEventListener("click", () => {
      map.fitBounds(h.layer.getBounds(), { padding: [40, 40] });
      h.layer.openPopup();
    });
    hikeListEl.appendChild(li);
  });
}

function updateStats() {
  const pct = Math.min(100, (completedKm / mainTrailKm) * 100);
  document.getElementById("stat-km").textContent = completedKm.toFixed(1);
  document.getElementById("stat-pct").textContent = pct.toFixed(1) + "%";
  document.getElementById("stat-hikes").textContent = hikeCount;
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-bar-wrap").setAttribute("aria-valuenow", pct.toFixed(1));
}

/* Discover track files: GitHub API if configured, else the manifest */
async function discoverTracks() {
  const g = CONFIG.github;
  if (g.user && g.repo) {
    try {
      const url = `https://api.github.com/repos/${g.user}/${g.repo}/contents/${g.tracksPath}?ref=${g.branch}`;
      const res = await fetch(url);
      if (res.ok) {
        const files = await res.json();
        const gpx = files
          .filter((f) => f.type === "file" && /\.gpx$/i.test(f.name))
          .map((f) => f.name);
        if (gpx.length) return gpx;
      }
    } catch (err) {
      console.warn("GitHub API discovery failed, falling back to manifest.", err);
    }
  }
  return TRACK_FILES;
}

async function init() {
  loadMainTrail();
  const files = await discoverTracks();
  expectedCount = files.length;
  if (files.length === 0) {
    hikeListEl.innerHTML =
      '<li class="hike-empty">No hikes yet — add a GPX file to /tracks and list it in js/tracks.js. Lace up!</li>';
  } else {
    hikeListEl.innerHTML = "";
    files.forEach(loadTrack);
  }
  document.getElementById("footer-updated").textContent =
    "Rendered " + new Date().toLocaleDateString("en-CA");
}

init();

/* ---------------- Geolocation ---------------- */

const locateBtn = document.getElementById("locate-btn");
const locateStatus = document.getElementById("locate-status");
let userMarker = null;
let accuracyCircle = null;

locateBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    locateStatus.textContent = "Location isn't available in this browser.";
    return;
  }
  locateStatus.textContent = "Finding you…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const latlng = [latitude, longitude];

      if (userMarker) map.removeLayer(userMarker);
      if (accuracyCircle) map.removeLayer(accuracyCircle);

      userMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "user-location-dot",
          iconSize: [18, 18],
        }),
      }).addTo(map);

      accuracyCircle = L.circle(latlng, {
        radius: accuracy,
        color: "#2a6cd4",
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map);

      map.setView(latlng, Math.max(map.getZoom(), 14));
      locateStatus.textContent = `Located to ±${Math.round(accuracy)} m`;
    },
    (err) => {
      const msgs = {
        1: "Location permission denied. Allow it in Settings → Safari → Location.",
        2: "Position unavailable. Try again with a clearer sky view.",
        3: "Timed out. Try again.",
      };
      locateStatus.textContent = msgs[err.code] || "Couldn't get your location.";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
});
