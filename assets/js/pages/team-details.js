import { getTeams, getManifest, loadPointsTable, loadLeaderboards, getDefaultSeasonId, getSeasonById, standingsGroups, teamCrestHTML, qs } from "../data.js";

const { icon } = window.MSLIcons;
const wrap = document.querySelector("[data-team-details]");
const notFound = document.querySelector("[data-team-not-found]");

async function init() {
  const slug = qs("team");
  const [teams, manifest, seasonId] = await Promise.all([getTeams(), getManifest(), getDefaultSeasonId()]);
  const team = teams.find((t) => t.slug === slug);

  if (!team) {
    wrap.style.display = "none";
    notFound.style.display = "block";
    return;
  }

  document.title = `${team.name} — Melbourne Super League`;
  const [table, leaderboards, season] = await Promise.all([
    loadPointsTable(seasonId), loadLeaderboards(seasonId), getSeasonById(seasonId),
  ]);
  // The roster spans seasons, so a team may have no row in the current season's table.
  const group = standingsGroups(table).find((g) => g.standings.some((s) => s.team === slug));
  const standing = group?.standings.find((s) => s.team === slug);

  const highlights = [];
  ["batting", "bowling", "mvp"].forEach((cat) => {
    leaderboards[cat].players.forEach((p) => {
      if (p.team === slug) highlights.push({ cat, ...p });
    });
  });

  wrap.innerHTML = `
    <div class="page-hero bg-dark">
      <div class="container">
        <div class="breadcrumb"><a href="teams.html">Teams</a> ${icon("chevronRight")} <span>${team.name}</span></div>
        <div class="flex items-center gap-12" style="margin-top:24px;flex-wrap:wrap">
          ${teamCrestHTML(team, manifest, "crest-inline")}
          <div>
            <h1 style="margin-bottom:6px">${team.name}</h1>
          </div>
        </div>
      </div>
    </div>

    <section class="section-pad bg-white">
      <div class="container">
        <div class="split">
          <div>
            <div class="eyebrow">MSL Premiers ${season.label}</div>
            <h2>About the ${team.name}</h2>
            <p class="lede" style="margin-top:18px">${team.blurb}</p>
            ${standing ? `
            <div class="table-wrap" style="margin-top:32px">
              <table class="data-table">
                <thead><tr><th>Played</th><th>Won</th><th>Lost</th><th>NRR</th><th>Points</th><th>Form</th></tr></thead>
                <tbody><tr>
                  <td>${standing.played}</td><td>${standing.won}</td><td>${standing.lost}</td>
                  <td class="${standing.nrr >= 0 ? "nrr-pos" : "nrr-neg"}">${standing.nrr > 0 ? "+" : ""}${standing.nrr.toFixed(3)}</td>
                  <td class="pts">${standing.points}</td>
                  <td><div class="form-pills">${standing.form.map((r) => `<span class="form-pill ${r}">${r}</span>`).join("")}</div></td>
                </tr></tbody>
              </table>
            </div>` : ""}
            <a class="link-arrow" style="margin-top:24px" href="standings.html">Full Points Table ${icon("arrowRight")}</a>
          </div>
          <div>
            ${highlights.length ? `
              <h3 style="font-size:1.3rem;margin-bottom:18px">Season Highlights</h3>
              <div class="feature-list">
                ${highlights.map((h) => `<li>${icon("star")}<span><strong>${h.name}</strong> — ${labelFor(h.cat, h)}</span></li>`).join("")}
              </div>
            ` : `<div class="empty-state" style="padding:40px 0">${icon("trophy")}<p>Season highlights will appear here once this team's players break into the top 5 leaderboards.</p></div>`}
            <p style="margin-top:24px;font-size:.85rem">Full squad list and match-by-match scorecards are available on CricHeroes.</p>
            <a class="btn btn-outline-dark btn-sm" style="margin-top:12px" href="https://cricheroes.com/tournament/1729194/msl-premiers-2025/teams" target="_blank" rel="noopener">View on CricHeroes ${icon("externalLink")}</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function labelFor(cat, h) {
  if (cat === "batting") return `${h.runs} runs at SR ${h.strikeRate}`;
  if (cat === "bowling") return `${h.wickets} wickets at econ ${h.economy}`;
  return `MVP rating ${h.total.toFixed(2)}`;
}

init();
