import {
  getTeams, getManifest, getNews, getGallery, getSeasonsIndex, loadPointsTable, loadLeaderboards,
  getDefaultSeasonId, teamCrestHTML, miniCrestHTML, formatDate,
} from "../data.js";

const { icon } = window.MSLIcons;

let teams = [];
let manifest = {};
const seasonLabelCache = {};

async function init() {
  [teams, manifest] = await Promise.all([getTeams(), getManifest()]);
  const [news, gallery, seasons, defaultSeasonId] = await Promise.all([
    getNews(), getGallery(), getSeasonsIndex(), getDefaultSeasonId(),
  ]);
  seasons.forEach((s) => (seasonLabelCache[s.id] = s.label));

  // Season selector (mirrors the one on standings.html, scoped to this preview)
  const seasonSelect = document.querySelector("[data-home-season-select]");
  if (seasonSelect) {
    seasonSelect.innerHTML = seasons
      .map((s) => `<option value="${s.id}" ${s.id === defaultSeasonId ? "selected" : ""}>${s.label}</option>`)
      .join("");
    seasonSelect.addEventListener("change", (e) => renderSeason(e.target.value));
  }

  await renderSeason(defaultSeasonId);

  // News preview (latest 3) — not season-dependent
  const newsPreview = document.querySelector("[data-news-preview]");
  if (newsPreview) {
    const sorted = [...news].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    newsPreview.innerHTML = sorted
      .map((a, i) => {
        const cover = (manifest[a.imageFolder] || [])[0];
        return `<a class="card news-card reveal" data-reveal-delay="${(i * 0.08).toFixed(2)}" href="news-details.html?article=${a.slug}">
          <div class="news-thumb">${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}</div>
          <div class="news-body">
            <div class="news-meta"><span class="tag">${a.category}</span><span>${formatDate(a.date)}</span></div>
            <h3>${a.title}</h3><p>${a.excerpt}</p>
          </div>
        </a>`;
      })
      .join("");
    window.MSLReveal?.observe(newsPreview);
  }

  // Gallery preview
  const galleryPreview = document.querySelector("[data-gallery-preview]");
  if (galleryPreview && gallery.length) {
    const images = (manifest[gallery[0].folder] || []).slice(0, 4);
    galleryPreview.innerHTML = images
      .map((src) => `<a href="gallery.html?album=${gallery[0].slug}"><img src="${src}" alt="" loading="lazy"></a>`)
      .join("");
  }

  // Team strip — always shows every team in data/teams.json, so the count
  // adjusts on its own if teams are added/removed for a new season.
  const teamStrip = document.querySelector("[data-team-strip]");
  if (teamStrip) {
    teamStrip.innerHTML = teams
      .map((t, i) => `<a class="card team-card reveal" data-reveal-delay="${(i * 0.07).toFixed(2)}" href="team-details.html?team=${t.slug}">${teamCrestHTML(t, manifest)}<h3 style="margin-top:14px;font-size:1.1rem">${t.name}</h3></a>`)
      .join("");
    window.MSLReveal?.observe(teamStrip);
  }
}

async function renderSeason(seasonId) {
  document.querySelectorAll("[data-season-label]").forEach((el) => {
    el.textContent = seasonLabelCache[seasonId] || "This Season";
  });

  const [table, leaderboards] = await Promise.all([
    loadPointsTable(seasonId), loadLeaderboards(seasonId),
  ]);

  // Points table preview — every team, not just the top 3, so the table
  // never looks like it's missing teams.
  const pointsPreview = document.querySelector("[data-points-preview]");
  if (pointsPreview) {
    pointsPreview.innerHTML = table.standings
      .map((row) => {
        const team = teams.find((t) => t.slug === row.team) || { name: row.team, slug: row.team };
        return `<tr>
          <td class="rank">${row.rank}</td>
          <td class="team-cell"><a href="team-details.html?team=${team.slug}" style="display:flex;align-items:center;gap:10px;color:inherit">${miniCrestHTML(team, manifest)}${team.name}</a></td>
          <td class="num">${row.played}</td><td class="num">${row.won}</td><td class="num">${row.lost}</td>
          <td class="num pts">${row.points}</td>
        </tr>`;
      })
      .join("");
  }

  // Batting leaderboard preview (top 3 — intentionally a teaser for the full leaderboard)
  const lbPreview = document.querySelector("[data-lb-preview]");
  if (lbPreview) {
    lbPreview.innerHTML = leaderboards.batting.players
      .slice(0, 3)
      .map((p) => {
        const team = teams.find((t) => t.slug === p.team);
        return `<tr>
          <td class="rank">${p.rank}</td>
          <td class="player-name"><a href="${leaderboards.cricheroesUrl}" target="_blank" rel="noopener">${p.name} ${icon("externalLink")}</a><span class="player-team">${team ? team.name : ""}</span></td>
          <td class="num"><strong>${p.runs}</strong></td>
          <td class="num">${p.strikeRate}</td>
        </tr>`;
      })
      .join("");
  }
}

init();
