/* ================================================================
   TRACK MANIFEST
   ================================================================
   After each hike, export the GPX from Garmin Express, drop it in
   the /tracks directory, and add its filename to this list.

   Naming convention (recommended):
     YYYY-MM-DD_short-description.gpx
     e.g. 2026-07-12_tobermory-to-cyprus-lake.gpx

   The date prefix keeps the log sorted chronologically, and the
   page parses it to show a date next to each hike.

   NOTE: If CONFIG.github in app.js is filled in, the site will
   auto-discover every .gpx in /tracks via the GitHub API and this
   list is only used as a fallback (e.g. if the API rate limit is
   hit, or when testing locally).
   ================================================================ */

const TRACK_FILES = [
  "20260518_Hamilton_22928885421.gpx", // delete this line (and the file) once you add real hikes, end the list in a ,
  "20260519_Hamilton_22939818045.gpx",
  "20251004_BurlingtonDay1_20590461353.gpx",
  "20251005_BurlingtonDay2_20601435417.gpx",
  // "2026-07-19_cyprus-lake-to-crane-lake.gpx",
];

/* The full end-to-end trail file, displayed in a muted color
   beneath your completed segments. */
const MAIN_TRAIL_FILE = "main_trail/bruce_trail.gpx";
