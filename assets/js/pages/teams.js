import { getTeams, getManifest, loadPointsTable, getDefaultSeasonId, getSeasonById, teamCrestHTML } from "../data.js";

const grid = document.querySelector("[data-team-grid]");

async function init() {
  const [teams, manifest, seasonId] = await Promise.all([getTeams(), getManifest(), getDefaultSeasonId()]);
  const [table, season] = await Promise.all([loadPointsTable(seasonId), getSeasonById(seasonId)]);

  document.querySelectorAll("[data-season-label]").forEach((el) => { el.textContent = season?.label || "MSL Premiers"; });

  grid.innerHTML = teams
    .map((team, i) => {
      const standing = table.standings.find((s) => s.team === team.slug);
      const rank = standing ? `#${standing.rank} · ${standing.points} PTS` : "";
      return `
      <a class="card team-card reveal" data-reveal-delay="${(i * 0.06).toFixed(2)}" href="team-details.html?team=${team.slug}">
        ${teamCrestHTML(team, manifest, "")}
        ${rank ? `<span class="team-rank-pill">${rank}</span>` : ""}
        <h3>${team.name}</h3>
        <p>${team.blurb}</p>
        <span class="link-arrow">View Team ${window.MSLIcons.icon("arrowRight")}</span>
      </a>`;
    })
    .join("");

  window.MSLReveal?.observe(grid);
}

init();
