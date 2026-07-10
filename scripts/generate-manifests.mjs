#!/usr/bin/env node
/**
 * generate-manifests.mjs
 * ------------------------------------------------------------------
 * Scans the folder-based image directories (news, gallery, teams) and
 * writes data/manifest.json listing every image file found in each one,
 * in natural filename order.
 *
 * The website's JS reads this manifest to know which photos exist in
 * assets/img/news/<slug>/ and assets/img/gallery/<slug>/ WITHOUT you
 * having to list filenames anywhere by hand — drop files in, run this,
 * commit, push.
 *
 * Usage:
 *   node scripts/generate-manifests.mjs
 *
 * This also runs automatically on every Cloudflare Pages deploy if you
 * set the Pages build command to:
 *   node scripts/generate-manifests.mjs
 * (see docs/CONTENT-GUIDE.md)
 *
 * No npm install required — uses only Node's built-in "fs"/"path".
 * ------------------------------------------------------------------
 */
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function listImages(dirAbs) {
  if (!existsSync(dirAbs)) return [];
  return readdirSync(dirAbs)
    .filter((f) => IMG_EXT.has(extname(f).toLowerCase()))
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

function listSubfolders(dirAbs) {
  if (!existsSync(dirAbs)) return [];
  return readdirSync(dirAbs).filter((f) => {
    const full = join(dirAbs, f);
    return !f.startsWith(".") && statSync(full).isDirectory();
  });
}

const manifest = {};

// --- News folders: assets/img/news/<slug>/ ---
const newsRoot = join(ROOT, "assets/img/news");
for (const slug of listSubfolders(newsRoot)) {
  const relFolder = `assets/img/news/${slug}`;
  manifest[relFolder] = listImages(join(newsRoot, slug)).map((f) => `${relFolder}/${f}`);
}

// --- Gallery folders: assets/img/gallery/<slug>/ ---
const galleryRoot = join(ROOT, "assets/img/gallery");
for (const slug of listSubfolders(galleryRoot)) {
  const relFolder = `assets/img/gallery/${slug}`;
  manifest[relFolder] = listImages(join(galleryRoot, slug)).map((f) => `${relFolder}/${f}`);
}

// --- Team logos: assets/img/teams/<slug>.<ext> (flat, not a folder) ---
const teamsRoot = join(ROOT, "assets/img/teams");
const teamLogos = {};
if (existsSync(teamsRoot)) {
  for (const f of readdirSync(teamsRoot)) {
    if (!IMG_EXT.has(extname(f).toLowerCase())) continue;
    const slug = f.slice(0, f.length - extname(f).length);
    teamLogos[slug] = `assets/img/teams/${f}`;
  }
}
manifest.__teamLogos = teamLogos;

manifest.__generatedAt = new Date().toISOString();

const outPath = join(ROOT, "data/manifest.json");
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

const folderCount = Object.keys(manifest).filter((k) => !k.startsWith("__")).length;
const logoCount = Object.keys(teamLogos).length;
console.log(`[generate-manifests] wrote data/manifest.json — ${folderCount} folders scanned, ${logoCount} team logos found.`);
