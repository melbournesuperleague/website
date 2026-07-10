# Melbourne Super League — Website

Static website for Melbourne Super League / MSL Premiers. Plain HTML, CSS and vanilla JS — no framework, no build tooling required to run it, one small Node script to keep photo folders in sync.

**Updating content (news, points table, leaderboards, teams, gallery, contact info)?** See **[`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md)** — that's the one you want, written for non-developers.

## Quick start

```bash
npm run build     # scans assets/img/news + assets/img/gallery + assets/img/teams into data/manifest.json
npm run start      # serves the site locally at http://localhost:8080
```

## Structure

```
index.html, about.html, competition.html, teams.html, team-details.html,
standings.html, news.html, news-details.html, gallery.html,
get-involved.html, contact.html, 404.html   ← the 12 pages

data/                  ← everything editable lives here (JSON)
  site-config.json      global settings, contact info, nav/footer links
  teams.json             every franchise that has played (not per-season)
  seasons-index.json     controls the year selector
  points-table/2025.json, points-table/2024.json
  leaderboards/2025.json, leaderboards/2024.json
  news.json
  gallery.json
  manifest.json          AUTO-GENERATED — don't hand-edit, run `npm run build`

assets/
  css/style.css          single stylesheet, design tokens at the top
  js/                     vanilla JS (ES modules), no bundler needed
  img/
    brand/                logo, favicon
    hero/, players/, about/   photography used in fixed page layouts
    teams/                 drop team-logo files here (see CONTENT-GUIDE §3)
    news/<slug>/            one folder per article — drop photos in, they auto-appear
    gallery/<slug>/         one folder per album — drop photos in, they auto-appear

scripts/generate-manifests.mjs   scans the folders above → data/manifest.json
docs/CONTENT-GUIDE.md             full how-to-update guide
```

## Design direction

Palette pulled directly from the MSL Premiers crest: deep indigo-violet (`#3810A8`/`#5B2EE0`) with an electric lime accent (`#D8F84C`) on a near-black base, rather than any default template colour. Typeface pairing is Big Shoulders (condensed display, scoreboard energy) + Chakra Petch (technical/HUD-flavoured body and data font) — loaded via `<link>` in each page `<head>` with `font-display: swap`. Structure and page rhythm (hero → stat strip → competition highlights → standings → news → gallery → footer) is inspired by the Nitro sports template supplied as a reference, rebuilt from scratch in plain HTML/CSS/JS for cricket rather than reusing its soccer imagery/vendor CSS.

## Deploying

GitHub → Cloudflare Pages, build command `node scripts/generate-manifests.mjs`, output directory `/`. Full walkthrough in `docs/CONTENT-GUIDE.md` §11.

## Data sources

Points table and batting/bowling/MVP leaderboards (top 5 of each) were sourced from CricHeroes: the **2024** season from tournament `MSL Premiers` (id `1217667`), the **2025** season from `MSL Premiers 2025` (id `1729194`). See each JSON file's `lastUpdated`/`_comment` field for the export date. Every leaderboard links out to the live, full CricHeroes leaderboard. Contact phone/email/social handles were sourced from MSL's public Facebook and PlayHQ listings — confirm these are still current and update `data/site-config.json` if not.
