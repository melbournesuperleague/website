import {
  getSeasonsIndex, getTeams, getManifest, loadPointsTable, loadLeaderboards,
  teamCrestHTML, miniCrestHTML, getDefaultSeasonId, standingsGroups,
} from "../data.js";

const { icon } = window.MSLIcons;

const pointsGroups = document.querySelector("[data-points-groups]");
const seasonSelect = document.querySelector("[data-season-select]");
const seasonLabel = document.querySelectorAll("[data-season-label]");
const lbBody = document.querySelector("[data-leaderboard-body]");
const lbHead = document.querySelector("[data-leaderboard-head]");
const lbTabs = document.querySelectorAll("[data-lb-tab]");
const lbSourceLink = document.querySelector("[data-lb-source]");
const pointsSourceLink = document.querySelector("[data-points-source]");

let manifest = {};
let teams = [];
let activeTab = "batting";

async function init() {
  [manifest, teams] = await Promise.all([getManifest(), getTeams()]);
  const seasons = await getSeasonsIndex();
  const defaultId = await getDefaultSeasonId();

  seasonSelect.innerHTML = seasons
    .map((s) => `<option value="${s.id}" ${s.id === defaultId ? "selected" : ""}>${s.label}</option>`)
    .join("");

  await renderSeason(defaultId);

  seasonSelect.addEventListener("change", (e) => renderSeason(e.target.value));
  lbTabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.lbTab;
      lbTabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      renderLeaderboard(window.__mslCurrentLeaderboards, activeTab);
    })
  );
}

async function renderSeason(seasonId) {
  seasonLabel.forEach((el) => (el.textContent = seasons_label_cache[seasonId] || seasonId));
  const [table, leaderboards] = await Promise.all([
    loadPointsTable(seasonId),
    loadLeaderboards(seasonId),
  ]);
  window.__mslCurrentLeaderboards = leaderboards;
  renderPointsTable(table);
  renderLeaderboard(leaderboards, activeTab);
  if (pointsSourceLink) pointsSourceLink.href = table.sourceUrl || "#";
  if (lbSourceLink) lbSourceLink.href = leaderboards.cricheroesUrl || "#";
}

// small helper cache populated lazily so renderSeason can show a label before seasons list resolves twice
const seasons_label_cache = {};
getSeasonsIndex().then((list) => list.forEach((s) => (seasons_label_cache[s.id] = s.label)));

function standingRow(row) {
  const team = teams.find((t) => t.slug === row.team) || { name: row.team, slug: row.team };
  const nrrClass = row.nrr > 0 ? "nrr-pos" : row.nrr < 0 ? "nrr-neg" : "";
  const nrrSign = row.nrr > 0 ? "+" : "";
  const form = row.form
    .map((r) => `<span class="form-pill ${r}" title="${r === "W" ? "Won" : r === "L" ? "Lost" : r}">${r}</span>`)
    .join("");
  return `<tr>
    <td class="rank">${row.rank}</td>
    <td class="team-cell"><a href="team-details.html?team=${team.slug}" style="display:flex;align-items:center;gap:10px;color:inherit">${miniCrestHTML(team, manifest)}${team.name}</a></td>
    <td class="num">${row.played}</td>
    <td class="num">${row.won}</td>
    <td class="num">${row.lost}</td>
    <td class="num">${row.drawn}</td>
    <td class="num">${row.noResult}</td>
    <td class="num ${nrrClass}">${nrrSign}${row.nrr.toFixed(3)}</td>
    <td class="num">${row.runsFor}</td>
    <td class="num">${row.runsAgainst}</td>
    <td class="num pts">${row.points}</td>
    <td><div class="form-pills">${form}</div></td>
  </tr>`;
}

function renderPointsTable(table) {
  if (!pointsGroups) return;
  const groups = standingsGroups(table);
  // A single unnamed league phase needs no group heading; two groups do.
  const showHeadings = groups.length > 1;
  pointsGroups.innerHTML = groups
    .map(
      (g) => `
      ${showHeadings ? `<h3 class="group-heading">${g.name}</h3>` : ""}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th>
              <th class="num">D</th><th class="num">NR</th><th class="num">NRR</th><th class="num">For</th>
              <th class="num">Against</th><th class="num">Pts</th><th>Form</th>
            </tr>
          </thead>
          <tbody>${g.standings.map(standingRow).join("")}</tbody>
        </table>
      </div>`
    )
    .join("");
}

const columnSets = {
  batting: {
    label: "Most Runs",
    head: ["#", "Player", "Mat", "Inns", "Runs", "HS", "Avg", "SR", "4s", "6s", "50s", "100s"],
    row: (p) => [
      p.rank, playerCell(p), p.mat, p.inns, `<strong>${p.runs}</strong>`, p.highest,
      p.average, p.strikeRate, p.fours, p.sixes, p.fifties, p.hundreds,
    ],
  },
  bowling: {
    label: "Most Wickets",
    head: ["#", "Player", "Style", "Mat", "Overs", "Runs", "Wkts", "Best", "Econ", "Avg", "SR"],
    row: (p) => [
      p.rank, playerCell(p), p.style, p.mat, p.overs, p.runs, `<strong>${p.wickets}</strong>`,
      p.best, p.economy, p.average, p.strikeRate,
    ],
  },
  mvp: {
    label: "MVP Rankings",
    head: ["#", "Player", "Mat", "Total", "Batting", "Bowling", "Fielding"],
    row: (p) => [p.rank, playerCell(p), p.mat, `<strong>${p.total.toFixed(3)}</strong>`, p.batting.toFixed(3), p.bowling.toFixed(3), p.fielding.toFixed(3)],
  },
};

function playerCell(p) {
  const team = teams.find((t) => t.slug === p.team);
  const teamName = team ? team.name : p.team;
  return `<div class="player-name"><a href="${window.__mslCurrentLeaderboards.cricheroesUrl}" target="_blank" rel="noopener">${p.name} ${icon("externalLink", "")}</a><span class="player-team">${teamName}</span></div>`;
}

function renderLeaderboard(doc, tab) {
  if (!lbBody || !doc) return;
  const set = columnSets[tab];
  const data = doc[tab];
  lbHead.innerHTML = `<tr>${set.head.map((h, i) => `<th class="${i > 1 ? "num" : ""}">${h}</th>`).join("")}</tr>`;
  lbBody.innerHTML = data.players
    .map((p) => `<tr>${set.row(p).map((v, i) => `<td class="${i > 1 ? "num" : ""}">${v}</td>`).join("")}</tr>`)
    .join("");
}

init();
