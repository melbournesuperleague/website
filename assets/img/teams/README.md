# Team logo folder

Drop a team's logo file here named **exactly** after its slug (see `data/teams.json`):

| Slug (filename) | Team | Status |
| --- | --- | --- |
| `melbourne-bulls.png` | Melbourne Bulls | ✅ |
| `melbourne-pirates.png` | Melbourne Pirates | ✅ |
| `melbourne-thunders.png` | Melbourne Thunders | ❌ **missing — drop the file here** |
| `auscon-melbourne-united.png` | Auscon Melbourne United | ✅ |
| `melbourne-tuskers.png` | Melbourne Tuskers | ✅ |
| `melbourne-cobras.png` | Melbourne Cobras | ✅ |
| `westside-falcons.png` | Westside Falcons | ✅ |
| `ray-white-warriors.png` | Ray White Warriors | ✅ |
| `aussie-kings.png` | Aussie Kings | ✅ |
| `kerala-tigers.png` | Kerala Tigers | ✅ |
| `sydney-title-club.png` | Sydney Title Club | ✅ |
| `brimbank-lions.png` | Brimbank Lions | ✅ |
| `sahara-chargers.png` | Sahara Chargers | ✅ |

`.png`, `.jpg` or `.webp` all work. Once the file exists and you've run the manifest build
(`npm run build`, or just push — Cloudflare Pages runs it for you), the site automatically
swaps that team's generated initials badge for the real logo everywhere it appears
(team cards, points table, leaderboards). No code changes needed.

## Preparing a logo

Source artwork lives in `../../../../Team logos/`. The files here were produced from the
supplied vector PDFs: rasterised at 4×, trimmed to the artwork's alpha bounding box, then
centred on a 288×288 transparent canvas with a 3% margin. Crests display at 88px, so 288px
covers 3× retina. Keep files under ~120 KB.

Two logos needed a judgement call:

- **Aussie Kings** — the only supplied vector has an opaque black background baked in, so it
  renders as a black tile rather than a free-standing crest. Knocking the black out destroys
  the crown and wordmark (they're black-filled too). A transparent-background version from the
  designer would fix this.
- **Ray White Warriors** — the vector PDF sets "Ray White" in white type for dark backgrounds,
  which disappears on the site's cream cards. This uses the supplied PNG instead, which omits
  the sponsor line; the full team name still appears as the card heading.

Full instructions: see `docs/CONTENT-GUIDE.md`.
