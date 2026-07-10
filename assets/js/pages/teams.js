import { getTeams, getManifest, getDefaultSeasonId, getSeasonById, teamCrestHTML } from "../data.js";

const grid = document.querySelector("[data-team-grid]");

async function init() {
  const [teams, manifest, seasonId] = await Promise.all([getTeams(), getManifest(), getDefaultSeasonId()]);
  const season = await getSeasonById(seasonId);

  document.querySelectorAll("[data-season-label]").forEach((el) => { el.textContent = season?.label || "MSL Premiers"; });

  // Alphabetical, not by ladder position — the roster spans seasons, so a rank
  // from any one season would be misleading here.
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name, "en"));

  grid.innerHTML = sorted
    .map(
      (team, i) => `
      <a class="card team-card reveal" data-reveal-delay="${(i * 0.06).toFixed(2)}" href="team-details.html?team=${team.slug}">
        ${teamCrestHTML(team, manifest, "")}
        <h3>${team.name}</h3>
        <p>${team.blurb}</p>
        <span class="link-arrow">View Team ${window.MSLIcons.icon("arrowRight")}</span>
      </a>`
    )
    .join("");

  window.MSLReveal?.observe(grid);
}

init();
