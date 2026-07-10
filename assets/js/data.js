/**
 * data.js — JSON data layer for the MSL site.
 * ------------------------------------------------------------------
 * Every configurable piece of content (site config, teams, points table,
 * leaderboards, news, gallery) lives in /data/*.json.
 * This module fetches + caches that data and exposes small render helpers
 * used by the inline <script type="module"> blocks on each page.
 *
 * NOTE: fetch() of local JSON only works when the site is served over
 * http(s) — e.g. `npx serve`, `python3 -m http.server`, or once deployed
 * to Cloudflare/GitHub Pages. Opening index.html directly via file:// will
 * NOT load the JSON (browser security restriction on all static hosts).
 * See docs/CONTENT-GUIDE.md.
 * ------------------------------------------------------------------
 */

const cache = new Map();

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const json = await res.json();
  cache.set(path, json);
  return json;
}

export const getSiteConfig = () => fetchJSON("data/site-config.json");
export const getTeams = () => fetchJSON("data/teams.json").then((d) => d.teams);
export const getSeasonsIndex = () => fetchJSON("data/seasons-index.json").then((d) => d.seasons);
export const getNews = () => fetchJSON("data/news.json").then((d) => d.articles);
export const getGallery = () => fetchJSON("data/gallery.json").then((d) => d.albums);
export const getManifest = () => fetchJSON("data/manifest.json").catch(() => ({}));

export async function getDefaultSeasonId() {
  const seasons = await getSeasonsIndex();
  const def = seasons.find((s) => s.isDefault) || seasons[0];
  return def?.id;
}

export async function getSeasonById(id) {
  const seasons = await getSeasonsIndex();
  return seasons.find((s) => s.id === id) || seasons.find((s) => s.isDefault) || seasons[0];
}

export async function loadPointsTable(seasonId) {
  const season = await getSeasonById(seasonId);
  return fetchJSON(season.pointsTable);
}

export async function loadLeaderboards(seasonId) {
  const season = await getSeasonById(seasonId);
  return fetchJSON(season.leaderboards);
}

/**
 * A points table is one or more groups (2025 runs Group A / Group B; 2024 was a
 * single league phase). Older files stored a flat `standings` array — accept both.
 */
export function standingsGroups(table) {
  if (Array.isArray(table?.groups)) return table.groups;
  if (Array.isArray(table?.standings)) return [{ name: null, standings: table.standings }];
  return [];
}

/** Every row across every group, e.g. to look up one team's record. */
export function allStandings(table) {
  return standingsGroups(table).flatMap((g) => g.standings);
}

export async function teamBySlug(slug) {
  const teams = await getTeams();
  return teams.find((t) => t.slug === slug);
}

/* ------------------------------------------------------------------
 * Team crest rendering: uses a real logo file if one exists in
 * assets/img/teams/<slug>.<ext> (tracked via data/manifest.json),
 * otherwise falls back to a generated initials badge in the team's
 * accent colour. Drop a logo file in and it swaps automatically.
 * ------------------------------------------------------------------ */
export function teamInitials(name) {
  return name
    .replace(/^(Melbourne|Auscon)\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function teamCrestHTML(team, manifest, sizeClass = "") {
  const logoPath = manifest?.__teamLogos?.[team.slug];
  if (logoPath) {
    return `<span class="team-crest is-logo ${sizeClass}"><img src="${logoPath}" alt="${team.name} logo" loading="lazy"></span>`;
  }
  const bg = team.accent || "var(--msl-violet-500)";
  const fg = team.accentText || "#fff";
  return `<span class="team-crest is-generated ${sizeClass}" style="background:${bg};color:${fg}">${teamInitials(team.name)}</span>`;
}

export function miniCrestHTML(team, manifest) {
  const logoPath = manifest?.__teamLogos?.[team.slug];
  if (logoPath) {
    return `<span class="mini-crest is-logo"><img src="${logoPath}" alt="" loading="lazy"></span>`;
  }
  const bg = team.accent || "var(--msl-violet-500)";
  const fg = team.accentText || "#fff";
  return `<span class="mini-crest" style="background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:11px">${teamInitials(team.name)}</span>`;
}

export function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

export function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
