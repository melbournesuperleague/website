# Team logo folder

Drop a team's logo file here named **exactly** after its slug (see `data/teams.json`):

- `melbourne-bulls.png`
- `melbourne-pirates.png`
- `melbourne-thunders.png`
- `auscon-melbourne-united.png`
- `melbourne-tuskers.png`
- `melbourne-cobras.png`

`.png`, `.jpg` or `.webp` all work. Once the file exists and you've run the manifest build
(`npm run build`, or just push — Cloudflare Pages runs it for you), the site automatically
swaps that team's generated initials badge for the real logo everywhere it appears
(team cards, points table, leaderboards). No code changes needed.

Full instructions: see `docs/CONTENT-GUIDE.md`.
