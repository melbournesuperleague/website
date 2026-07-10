# MSL Website — Content Guide

This site is plain HTML/CSS/JS — **no build step, no framework, no CMS login**. Everything you'll want to update regularly lives in small `.json` files inside the `data/` folder, or as photos inside `assets/img/`. Edit those, push to GitHub, and Cloudflare Pages redeploys automatically.

You do not need to touch any `.html`, `.css` or `.js` file for routine updates (news, points table, leaderboards, teams, gallery, contact info). Those are only needed if you want to change the page layout/design itself.

---

## 1. Preview the site on your computer

Because the site loads its data with `fetch()`, you can't just double-click `index.html` — browsers block that for security reasons. Run a tiny local server instead:

```bash
# Option A — Node (already includes the manifest builder)
npm run build     # scans your photo folders first
npm run start     # serves the site at http://localhost:8080

# Option B — Python
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## 2. Update contact details & social links

**File:** `data/site-config.json`

Edit `contact.email`, `contact.phone`, `contact.city`, `contact.facebook`, `contact.instagram`. These automatically appear in the footer on every page and on the Contact page — no need to edit them anywhere else.

---

## 3. Update Teams

**File:** `data/teams.json`

Each team is one object with a `name`, `blurb` (short description) and `accent` colour (used for its generated crest). To change a team's name or description, edit it here — it updates everywhere the team appears (Teams page, Standings, leaderboards, footer links).

### Adding a real team logo
Drop an image into `assets/img/teams/` named **exactly** after the team's `slug`:

```
assets/img/teams/melbourne-bulls.png
assets/img/teams/melbourne-pirates.png
assets/img/teams/melbourne-thunders.png
assets/img/teams/auscon-melbourne-united.png
assets/img/teams/melbourne-tuskers.png
assets/img/teams/melbourne-cobras.png
```

`.png`, `.jpg` or `.webp` all work. Once it's there (and you've run the build — see §8), the site automatically swaps the generated initials badge for your real logo everywhere. No JSON or code edit required for this part.

---

## 4. Update the Points Table

**File:** `data/points-table/2025-26.json`

Each row in `standings` is one team's record for the season:

```json
{ "rank": 1, "team": "melbourne-thunders", "played": 5, "won": 4, "lost": 1,
  "drawn": 0, "tied": 0, "noResult": 0, "nrr": 0.094,
  "quotient": "858/99.5", "for": "850/100", "points": 8,
  "form": ["W","W","L","W","W"] }
```

`team` must match a `slug` from `data/teams.json`. `form` is the last-5 results shown as coloured pills (`W`/`L`/`D`/`T`/`N`). Re-order rows by `rank` after every round, or just edit the numbers — the site always displays them in the order they appear in the file, so keep `rank` correct.

---

## 5. Update the Leaderboards (Batting / Bowling / MVP)

**File:** `data/leaderboards/2025-26.json`

Three sections — `batting`, `bowling`, `mvp` — each with a `players` array. The site shows the **top 5** from each list (whatever order they're in the file), with a "View Full Leaderboard on CricHeroes" link driven by `cricheroesUrl`.

To refresh after new matches: re-export the leaderboard from CricHeroes and update the numbers, or edit by hand. Keep `team` matching a team `slug`.

---

## 6. Update Tournament Stats

**File:** `data/stats/2025-26.json`

The stat strip shown on the Standings page (and a subset on the homepage). Just a label/value list — edit the `value` for any stat, or add a new `{ "label": "...", "value": ... }` entry.

---

## 7. Adding a brand-new season / year (e.g. 2026–27)

The year selector on the Standings page is driven entirely by `data/seasons-index.json`. To add a new season once next year's competition finishes:

1. Duplicate the three files below and rename them for the new season:
   - `data/points-table/2025-26.json` → `data/points-table/2026-27.json`
   - `data/leaderboards/2025-26.json` → `data/leaderboards/2026-27.json`
   - `data/stats/2025-26.json` → `data/stats/2026-27.json`
2. Fill each new file in with the new season's numbers.
3. Add a new entry to `data/seasons-index.json`:

```json
{
  "id": "2026-27",
  "label": "MSL Premiers 2026–27",
  "isDefault": true,
  "pointsTable": "data/points-table/2026-27.json",
  "leaderboards": "data/leaderboards/2026-27.json",
  "stats": "data/stats/2026-27.json"
}
```

4. Set `"isDefault": true` on the new season and remove/change it on the old one — this controls which season loads first when someone visits Standings. Old seasons stay selectable in the dropdown forever, so your season history builds up automatically.

---

## 8. Adding / updating News articles

**File:** `data/news.json`, plus a photo folder per article.

1. Create a folder: `assets/img/news/<your-slug>/` and drop your photo(s) in (any filenames — `IMG_0001.jpg` is fine).
2. Add an entry to `data/news.json`:

```json
{
  "slug": "your-slug",
  "title": "Article Title",
  "date": "2026-07-15",
  "category": "Competition",
  "excerpt": "One or two sentence summary shown on the News page.",
  "imageFolder": "assets/img/news/your-slug",
  "body": ["First paragraph.", "Second paragraph.", "Third paragraph."]
}
```

3. Run the build (`npm run build`) or just push to GitHub — Cloudflare Pages runs it for you (see §10). The article's cover photo (first image in the folder, alphabetically) shows automatically on the News page and homepage; all photos in the folder show on the article page itself.

To remove an article, delete its object from `news.json` (you can leave the photo folder — it just won't be linked to anything).

---

## 9. Adding / updating Gallery albums

**File:** `data/gallery.json`, plus a photo folder per album.

1. Create a folder: `assets/img/gallery/<album-slug>/` and drop all the event's photos in.
2. Add an entry to `data/gallery.json`:

```json
{
  "slug": "album-slug",
  "title": "Album Title",
  "date": "2026-07-15",
  "folder": "assets/img/gallery/album-slug",
  "cover": "assets/img/gallery/album-slug/01.jpg"
}
```

3. Run the build / push. **Every photo in that folder automatically appears in the album** — you never list filenames by hand. Click any photo on the site to open the full-screen lightbox (arrow keys / swipe to move between photos).

---

## 10. How the "auto photo pickup" actually works

Because this is a fully static site (no server, no database), the browser can't "look inside a folder" on its own. So `scripts/generate-manifests.mjs` does it for you ahead of time: it scans every folder under `assets/img/news/` and `assets/img/gallery/`, plus `assets/img/teams/`, and writes the result to `data/manifest.json`. The website reads that file to know which photos exist.

**You only need to remember one thing: after adding/removing photos, the manifest needs to be regenerated.** Two ways this happens:

- **Automatically on deploy** — if you set your Cloudflare Pages build command to `node scripts/generate-manifests.mjs` (see §10 below), it re-scans on every push. Just add photos, commit, push — done.
- **Manually / locally** — run `npm run build` before previewing locally.

If you forget and photos don't show up yet, that's why — re-run the build.

---

## 11. Deploying: GitHub + Cloudflare Pages

1. **Push this folder to a GitHub repository** (create a new repo, e.g. `msl-website`, and push all these files to it — everything except what's listed in `.gitignore`).
2. **In Cloudflare:** Workers & Pages → Create → Pages → Connect to Git → select your `msl-website` repo.
3. **Build settings:**
   - Framework preset: `None`
   - Build command: `node scripts/generate-manifests.mjs`
   - Build output directory: `/` (the repo root — this is a plain static site, nothing gets bundled)
4. Deploy. Cloudflare gives you a `*.pages.dev` URL immediately; add your own domain under the project's **Custom Domains** tab whenever you're ready.
5. From then on: **every `git push` to your main branch automatically rebuilds and redeploys the live site** — including re-scanning your photo folders.

If you'd rather host on plain GitHub Pages instead of Cloudflare Pages, that works too, but GitHub Pages doesn't run a build command for you — you'd need to run `npm run build` locally and commit the resulting `data/manifest.json` yourself before pushing.

---

## 12. Editing on-page text (About, MSL Premiers, Get Involved, etc.)

Most long-form copy (About page story/values, MSL Premiers highlights, Get Involved copy, homepage intro text) is regular HTML inside the page files themselves, since it doesn't change often. To edit it:

1. Open the relevant `.html` file in any text editor (e.g. `about.html`).
2. Find the paragraph/heading you want to change — it's plain readable text between tags like `<h2>...</h2>` or `<p>...</p>`.
3. Edit the text directly, save, and push.

The **top navigation menu** is duplicated at the top of every page (standard practice for fast static sites, so the menu never needs a network request to appear). To rename or add a nav item, use find-and-replace across all `.html` files for the `<nav class="nav-primary">` and `<nav class="mobile-nav-links">` blocks.

---

## 13. The contact form

The Contact page form currently opens the visitor's email client with the message pre-filled (works with zero setup, since this is a static site with no server). If you'd like submissions to land directly in an inbox or spreadsheet instead, connect a free static-form service — no code changes beyond adding your endpoint:

- [Formspree](https://formspree.io) — free tier, just point the form's `action` at your Formspree endpoint.
- [Web3Forms](https://web3forms.com) — free tier, similar setup.

---

## 14. Troubleshooting

- **A page shows a blank section / spinner forever** — almost always a typo in a `.json` file (missing comma, unmatched quote). Paste the file into [jsonlint.com](https://jsonlint.com) to find the error.
- **Photos aren't showing up** — did you run the build (`npm run build`) after adding them? See §10.
- **Site looks unstyled / no fonts** — you opened `index.html` directly via `file://` instead of running a local server. See §1.
- **New team logo not appearing** — check the filename matches the team's `slug` in `data/teams.json` exactly (including hyphens), and that you've rebuilt the manifest.
