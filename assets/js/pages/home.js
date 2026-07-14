import {
  getSiteConfig, getTeams, getManifest, getNews, getGallery, getSeasonsIndex, loadPointsTable, loadLeaderboards,
  getDefaultSeasonId, teamCrestHTML, miniCrestHTML, formatDate, standingsGroups,
} from "../data.js";

const { icon } = window.MSLIcons;

let teams = [];
let manifest = {};
let activeLbTab = "batting";
let activeGroup = 0;
const seasonLabelCache = {};

/* Compact previews of the full leaderboards on standings.html — three columns each. */
const previewColumns = {
  batting: {
    head: ["#", "Player", "Runs", "SR"],
    row: (p) => [`<strong>${p.runs}</strong>`, p.strikeRate],
  },
  bowling: {
    head: ["#", "Player", "Wkts", "Econ"],
    row: (p) => [`<strong>${p.wickets}</strong>`, p.economy],
  },
  mvp: {
    head: ["#", "Player", "Points", "Mat"],
    row: (p) => [`<strong>${p.total.toFixed(2)}</strong>`, p.mat],
  },
};

/* Hero cutout rotator — when siteConfig.heroRotatingCutouts is true, cycles
   through every transparent player image found in assets/img/hero/cutouts/
   (listed in data/manifest.json by scripts/generate-manifests.mjs — drop a
   new image in the folder, re-run the script, and it joins the rotation).
   When the flag is false, or the folder is empty, or the JSON fails to load,
   the static hero-cutout.png already in the HTML stays untouched. */
async function initHeroRotator() {
  const wrap = document.querySelector(".hero-visual-photo");
  if (!wrap) return;

  let config, mf;
  try {
    [config, mf] = await Promise.all([getSiteConfig(), getManifest()]);
  } catch {
    return; // static cutout stays
  }
  const sources = mf["assets/img/hero/cutouts"] || [];
  if (!config.heroRotatingCutouts || !sources.length) return;

  const loadImg = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.alt = "A Melbourne Super League player";
      img.decoding = "async";
      img.src = src;
    });

  // The first rotation image is fully loaded BEFORE the static cutout is
  // swapped out, so the hero never shows an empty gap mid-handoff.
  let first;
  try {
    first = await loadImg(sources[0]);
  } catch {
    return;
  }

  const staticImg = wrap.querySelector("img");
  // Mark the existing static image active first so flipping the wrapper to
  // grid-stacked rotator mode doesn't blink it to opacity 0 for a frame.
  if (staticImg) staticImg.classList.add("is-active");
  wrap.classList.add("is-rotator");
  wrap.appendChild(first);

  const SWAP_MS = 1000; // matches the CSS transition duration below
  const imgs = [first];
  let idx = 0;

  const activate = (incoming, outgoing) => {
    if (outgoing) {
      outgoing.classList.remove("is-active");
      outgoing.classList.add("is-leaving");
      setTimeout(() => outgoing.classList.remove("is-leaving"), SWAP_MS);
    }
    void incoming.offsetWidth; // commit the appended img's hidden state so the entrance transitions
    incoming.classList.add("is-active");
  };

  // Double-rAF: the entrance transition needs the img painted in its
  // hidden state for at least one frame (same trick as the hero title).
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      activate(first, staticImg);
      if (staticImg) setTimeout(() => staticImg.remove(), SWAP_MS + 100);
    })
  );

  // Auto-carousels are exactly what reduced-motion users opt out of — they
  // get the first cutout as a static hero. One image needs no cycling either.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sources.length < 2 || reduceMotion) return;

  const ROTATE_MS = 5000;
  let busy = false;
  setInterval(async () => {
    if (document.hidden || busy) return; // don't queue swaps in a background tab
    busy = true;
    const nextIdx = (idx + 1) % sources.length;
    let next = imgs[nextIdx];
    if (!next) {
      try {
        next = imgs[nextIdx] = await loadImg(sources[nextIdx]);
      } catch {
        busy = false;
        return; // skip this tick; retry the same image next interval
      }
      wrap.appendChild(next);
    }
    activate(next, imgs[idx]);
    idx = nextIdx;
    setTimeout(() => (busy = false), SWAP_MS);
  }, ROTATE_MS);
}

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

  // Leaderboard category tabs — mirrors the tab set on standings.html.
  const lbTabs = document.querySelectorAll("[data-home-lb-tab]");
  lbTabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      activeLbTab = btn.dataset.homeLbTab;
      lbTabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      renderLeaderboardPreview(window.__mslHomeLeaderboards);
    })
  );

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

  // Gallery preview — one cover card per album/folder (Matchday Actions,
  // Players, Community Day…), not loose thumbnails from a single folder.
  const galleryPreview = document.querySelector("[data-gallery-preview]");
  if (galleryPreview && gallery.length) {
    galleryPreview.innerHTML = gallery
      .map((a, i) => {
        const images = manifest[a.folder] || [];
        const cover = a.cover && images.includes(a.cover) ? a.cover : images[0];
        const count = `${images.length} photo${images.length === 1 ? "" : "s"}`;
        return `
        <a class="album-card reveal" data-reveal-delay="${(i * 0.08).toFixed(2)}" href="gallery.html?album=${a.slug}">
          <div class="album-cover">${cover ? `<img src="${cover}" alt="${a.title}" loading="lazy">` : `<div class="empty-state" style="padding:0;height:100%;display:flex;align-items:center;justify-content:center">${window.MSLIcons.icon("image")}</div>`}</div>
          <div class="album-info">
            <h3>${a.title}</h3>
            <div class="news-meta"><span>${count}</span></div>
          </div>
        </a>`;
      })
      .join("");
    window.MSLReveal?.observe(galleryPreview);
  }

  // Team strip — always shows every team in data/teams.json, so the count
  // adjusts on its own if teams are added/removed for a new season.
  const teamStrip = document.querySelector("[data-team-strip]");
  if (teamStrip) {
    teamStrip.innerHTML = teams
      .map((t, i) => `<a class="cyt-card reveal" data-reveal-delay="${(i * 0.04).toFixed(2)}" href="team-details.html?team=${t.slug}" aria-label="${t.name}" title="${t.name}">${teamCrestHTML(t, manifest)}</a>`)
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
  window.__mslHomeLeaderboards = leaderboards;

  // Points table preview — one group at a time, picked with the tabs above it,
  // so a 12-team two-group season doesn't run the page long.
  window.__mslHomeGroups = standingsGroups(table);
  activeGroup = 0;
  renderGroupTabs();
  renderPointsPreview();

  renderLeaderboardPreview(leaderboards);
}

/* Group A / Group B pickers. A single-group season (2024) still renders its one
   pill — dropping the row would shorten this card and break symmetry with the
   leaderboard card beside it. */
function renderGroupTabs() {
  const wrap = document.querySelector("[data-home-group-tabs]");
  if (!wrap) return;
  const groups = window.__mslHomeGroups || [];

  if (!groups.length) {
    wrap.innerHTML = "";
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML = groups
    .map((g, i) => `<button type="button" role="tab" data-home-group-tab="${i}" aria-selected="${i === activeGroup}">${g.name}</button>`)
    .join("");

  wrap.querySelectorAll("[data-home-group-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      activeGroup = Number(btn.dataset.homeGroupTab);
      wrap.querySelectorAll("[data-home-group-tab]").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      renderPointsPreview();
    })
  );
}

function renderPointsPreview() {
  const body = document.querySelector("[data-points-preview]");
  const group = (window.__mslHomeGroups || [])[activeGroup];
  if (!body || !group) return;

  body.innerHTML = group.standings
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

// Top 5 — the full leaderboard on standings.html goes deeper.
function renderLeaderboardPreview(leaderboards) {
  const lbPreview = document.querySelector("[data-lb-preview]");
  const lbHead = document.querySelector("[data-lb-preview-head]");
  if (!lbPreview || !leaderboards) return;

  const set = previewColumns[activeLbTab];
  lbHead.innerHTML = `<tr>${set.head.map((h, i) => `<th class="${i > 1 ? "num" : ""}">${h}</th>`).join("")}</tr>`;
  lbPreview.innerHTML = leaderboards[activeLbTab].players
    .slice(0, 5)
    .map((p) => {
      const team = teams.find((t) => t.slug === p.team);
      const cells = set.row(p).map((v) => `<td class="num">${v}</td>`).join("");
      return `<tr>
        <td class="rank">${p.rank}</td>
        <td class="player-name"><a href="${leaderboards.cricheroesUrl}" target="_blank" rel="noopener">${p.name} ${icon("externalLink")}</a><span class="player-team">${team ? team.name : ""}</span></td>
        ${cells}
      </tr>`;
    })
    .join("");
}

init();
initHeroRotator();
