import { getNews, getManifest, formatDate } from "../data.js";

const grid = document.querySelector("[data-news-grid]");
const empty = document.querySelector("[data-news-empty]");

async function init() {
  const [articles, manifest] = await Promise.all([getNews(), getManifest()]);
  const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!sorted.length) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }

  grid.innerHTML = sorted
    .map((a, i) => {
      const images = manifest[a.imageFolder] || [];
      const cover = images[0] || "";
      return `
      <a class="card news-card reveal" data-reveal-delay="${(i % 3 * 0.08).toFixed(2)}" href="news-details.html?article=${a.slug}">
        <div class="news-thumb">${cover ? `<img src="${cover}" alt="" loading="lazy">` : `<div class="empty-state" style="padding:0;height:100%;display:flex;align-items:center;justify-content:center">${window.MSLIcons.icon("image")}</div>`}</div>
        <div class="news-body">
          <div class="news-meta"><span class="tag">${a.category}</span><span>${formatDate(a.date)}</span></div>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <span class="link-arrow" style="margin-top:auto">Read More ${window.MSLIcons.icon("arrowRight")}</span>
        </div>
      </a>`;
    })
    .join("");
  window.MSLReveal?.observe(grid);
}

init();
