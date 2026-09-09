/* ================================================================
   Bruce Trail Club Sections overlay
   ================================================================
   Draws each club section name in a left-hand column, with a dashed
   leader line running east to the point where the main trail crosses
   that section's southern boundary — the same convention the BTC
   uses on its reference map.

   You only need to supply the boundary LATITUDE. The code snaps each
   boundary to the nearest point on the loaded main-trail GPX, so the
   leader always lands exactly on the trail. If the trail crosses a
   latitude more than once (it wanders), add an optional `lng` hint
   and the nearest crossing to that longitude wins.

   Edit BOUNDARY latitudes below to match the official section limits.
   ================================================================ */

const CLUB_SECTIONS = [
  // Listed north → south. `boundary` is each section's SOUTHERN limit.
  { name: "Peninsula",       boundary: { place: "Wiarton",     lat: 44.740, lng: -81.14 } },
  { name: "Sydenham",        boundary: { place: "Blantyre",    lat: 44.545, lng: -80.73 } },
  { name: "Beaver Valley",   boundary: { place: "Craigleith",  lat: 44.530, lng: -80.32 } },
  { name: "Blue Mountains",  boundary: { place: "Lavender",    lat: 44.270, lng: -80.16 } },
  { name: "Dufferin Hi-Land",boundary: { place: "Mono Centre", lat: 44.020, lng: -80.06 } },
  { name: "Caledon Hills",   boundary: { place: "Cheltenham",  lat: 43.755, lng: -79.93 } },
  { name: "Toronto",         boundary: { place: "Milton",      lat: 43.530, lng: -79.93 } },
  { name: "Iroquoia",        boundary: { place: "Grimsby",     lat: 43.200, lng: -79.56 } },
  { name: "Niagara",         boundary: null }, // ends at Queenston — no southern leader
];

const SECTION_STYLE = {
  labelLng: -82.35,          // longitude of the label column (west of the whole trail)
  leader: { color: "#2a241c", weight: 1, opacity: 0.55, dashArray: "4 5", interactive: false },
  minZoom: 7,                // hide the overlay when zoomed in tighter than this
  maxZoom: 10,
};

/* ---- helpers --------------------------------------------------- */

/* Flatten a leaflet-gpx layer (may hold several polylines with
   nested segment arrays) into a single flat LatLng array. */
function gpxLatLngs(gpxLayer) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v.lat === "number") out.push(v);
  };
  gpxLayer.getLayers().forEach((l) => {
    if (typeof l.getLatLngs === "function") walk(l.getLatLngs());
  });
  return out;
}

/* Nearest trail point to a latitude (and optional longitude hint). */
function snapToTrail(points, lat, lng) {
  let best = null, bestScore = Infinity;
  for (const p of points) {
    const dLat = Math.abs(p.lat - lat);
    // latitude dominates; the lng hint only breaks ties between crossings
    const score = dLat + (lng != null ? Math.abs(p.lng - lng) * 0.15 : 0);
    if (score < bestScore) { bestScore = score; best = p; }
  }
  return best;
}

/* ---- main ------------------------------------------------------ */

function addClubSections(map, mainTrailGpx) {
  const points = gpxLatLngs(mainTrailGpx);
  if (!points.length) return;

  const group = L.layerGroup();

  CLUB_SECTIONS.forEach((section, i) => {
    let anchorLat;

    if (section.boundary) {
      const b = section.boundary;
      const trailPt = snapToTrail(points, b.lat, b.lng);
      anchorLat = trailPt.lat;

      // dashed leader from the label column east to the trail
      L.polyline(
        [[trailPt.lat, SECTION_STYLE.labelLng], [trailPt.lat, trailPt.lng]],
        SECTION_STYLE.leader
      ).addTo(group);

      // small place label where the leader meets the trail
      L.marker(trailPt, {
        icon: L.divIcon({
          className: "section-place",
          html: `<span>${b.place}</span>`,
          iconSize: null,
          iconAnchor: [-6, 14],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(group);
    } else {
      // last section: sit the name just below the previous boundary
      const prev = CLUB_SECTIONS[i - 1];
      const prevPt = snapToTrail(points, prev.boundary.lat, prev.boundary.lng);
      anchorLat = prevPt.lat - 0.16;
    }

    // section name, sitting just above its leader line
    L.marker([anchorLat, SECTION_STYLE.labelLng], {
      icon: L.divIcon({
        className: "section-name",
        html: `<span>${section.name}</span>`,
        iconSize: null,
        iconAnchor: [0, section.boundary ? 6 : -14],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(group);
  });

  // show only at province-scale zooms
  const sync = () => {
    const z = map.getZoom();
    const show = z >= SECTION_STYLE.minZoom && z <= SECTION_STYLE.maxZoom;
    if (show && !map.hasLayer(group)) group.addTo(map);
    if (!show && map.hasLayer(group)) map.removeLayer(group);
  };
  map.on("zoomend", sync);
  sync();

  return group;
}
