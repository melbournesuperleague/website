import { getGallery, getManifest, formatDate, qs } from "../data.js";

const { icon } = window.MSLIcons;
const albumGrid = document.querySelector("[data-album-grid]");
const photoGrid = document.querySelector("[data-photo-grid]");
const albumHeader = document.querySelector("[data-album-header]");
const emptyState = document.querySelector("[data-gallery-empty]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImg = lightbox?.querySelector("img");

let currentIndex = 0;

// The rendered manifest can lag behind the folder (e.g. a photo deleted after the
// last `npm run build`). Rather than trust the list blindly, we derive the live
// set of photos from the tiles still in the DOM — any image that 404s removes its
// own tile (see the "error" handlers below), so a stale manifest never leaves a
// broken thumbnail or a dead lightbox slide.
function liveImages() {
  return photoGrid ? [...photoGrid.querySelectorAll("a[data-src]")].map((a) => a.dataset.src) : [];
}

function updatePhotoCount() {
  const n = liveImages().length;
  const cnt = document.querySelector("[data-photo-count]");
  if (cnt) cnt.textContent = `${n} photo${n === 1 ? "" : "s"}`;
  if (!n && photoGrid) {
    photoGrid.innerHTML = `<div class="empty-state">${icon("imageOff")}<h3>No photos yet</h3><p>Drop images into this album's folder and they'll appear here.</p></div>`;
  }
}

async function init() {
  const [albums, manifest] = await Promise.all([getGallery(), getManifest()]);
  const albumSlug = qs("album");

  if (!albums.length) {
    if (albumGrid) albumGrid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (albumSlug) {
    const album = albums.find((a) => a.slug === albumSlug);
    if (!album) { location.href = "gallery.html"; return; }
    document.title = `${album.title} — Gallery — Melbourne Super League`;
    const images = manifest[album.folder] || [];
    if (albumHeader) {
      albumHeader.innerHTML = `
        <div class="breadcrumb"><a href="gallery.html">Gallery</a> ${icon("chevronRight")} <span>${album.title}</span></div>
        <h1 style="margin-top:16px">${album.title}</h1>
        <p style="margin-top:12px;color:rgba(255,255,255,0.6)">${formatDate(album.date)} · <span data-photo-count>${images.length} photo${images.length === 1 ? "" : "s"}</span></p>`;
    }
    if (photoGrid) {
      photoGrid.innerHTML = images.length
        ? images.map((src, i) => `<a href="${src}" data-src="${src}"><img src="${src}" alt="${album.title} photo ${i + 1}" loading="lazy"></a>`).join("")
        : `<div class="empty-state">${icon("imageOff")}<h3>No photos yet</h3><p>Drop images into <code>${album.folder}/</code> and they'll appear here.</p></div>`;

      // Self-heal against a stale manifest: a photo that fails to load drops its tile.
      photoGrid.querySelectorAll("img").forEach((img) => {
        img.addEventListener("error", () => { img.closest("a")?.remove(); updatePhotoCount(); });
      });

      photoGrid.addEventListener("click", (e) => {
        const a = e.target.closest("a[data-src]");
        if (!a) return;
        e.preventDefault();
        openLightbox(liveImages().indexOf(a.dataset.src));
      });
    }
    return;
  }

  // Album index view
  if (albumGrid) {
    albumGrid.innerHTML = albums
      .map((a, i) => {
        const images = manifest[a.folder] || [];
        const cover = a.cover && images.includes(a.cover) ? a.cover : images[0];
        return `
        <a class="album-card reveal" data-reveal-delay="${(i * 0.08).toFixed(2)}" href="gallery.html?album=${a.slug}">
          <div class="album-cover" data-placeholder="${icon("image").replace(/"/g, "&quot;")}">${cover ? `<img src="${cover}" alt="${a.title}" loading="lazy">` : `<div class="empty-state" style="padding:0;height:100%;display:flex;align-items:center;justify-content:center">${icon("image")}</div>`}</div>
          <div class="album-info">
            <h3>${a.title}</h3>
            <div class="news-meta"><span>${formatDate(a.date)}</span><span>${images.length} photo${images.length === 1 ? "" : "s"}</span></div>
          </div>
        </a>`;
      })
      .join("");
    // A broken cover falls back to the placeholder icon instead of a broken image.
    albumGrid.querySelectorAll(".album-cover img").forEach((img) => {
      img.addEventListener("error", () => {
        const box = img.closest(".album-cover");
        if (box) box.innerHTML = `<div class="empty-state" style="padding:0;height:100%;display:flex;align-items:center;justify-content:center">${box.dataset.placeholder}</div>`;
      });
    });
    window.MSLReveal?.observe(albumGrid);
  }
}

function openLightbox(index) {
  const list = liveImages();
  if (!lightbox || !list.length || index < 0) return;
  currentIndex = index;
  lightboxImg.src = list[currentIndex];
  lightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox?.classList.remove("is-open");
  document.body.style.overflow = "";
}
function step(delta) {
  const list = liveImages();
  if (!list.length) return;
  currentIndex = (currentIndex + delta + list.length) % list.length;
  lightboxImg.src = list[currentIndex];
}

lightbox?.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
lightbox?.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => step(-1));
lightbox?.querySelector("[data-lightbox-next]")?.addEventListener("click", () => step(1));
document.addEventListener("keydown", (e) => {
  if (!lightbox?.classList.contains("is-open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") step(1);
  if (e.key === "ArrowLeft") step(-1);
});

init();
