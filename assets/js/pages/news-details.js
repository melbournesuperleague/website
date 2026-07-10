import { getNews, getManifest, formatDate, qs } from "../data.js";

const { icon } = window.MSLIcons;
const wrap = document.querySelector("[data-article]");
const notFound = document.querySelector("[data-article-not-found]");
const relatedGrid = document.querySelector("[data-related-news]");

async function init() {
  const slug = qs("article");
  const [articles, manifest] = await Promise.all([getNews(), getManifest()]);
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    wrap.style.display = "none";
    notFound.style.display = "block";
    return;
  }

  document.title = `${article.title} — Melbourne Super League`;
  const images = manifest[article.imageFolder] || [];

  wrap.innerHTML = `
    <div class="page-hero bg-dark">
      <div class="container" style="max-width:860px">
        <div class="breadcrumb"><a href="news.html">News</a> ${icon("chevronRight")} <span>${article.category}</span></div>
        <span class="tag" style="margin-top:20px">${article.category}</span>
        <h1 style="margin-top:16px">${article.title}</h1>
        <p style="margin-top:16px;color:rgba(255,255,255,0.6);font-size:.9rem;text-transform:uppercase;letter-spacing:.06em">${formatDate(article.date)}</p>
      </div>
    </div>
    <article class="section-pad bg-white">
      <div class="container-narrow">
        ${images[0] ? `<div class="split-media" style="aspect-ratio:16/9;margin-bottom:40px"><img src="${images[0]}" alt=""></div>` : ""}
        <div class="lede" style="color:var(--msl-ink-soft);display:grid;gap:20px">
          ${article.body.map((p) => `<p>${p}</p>`).join("")}
        </div>
        ${images.length > 1 ? `
          <div class="gallery-grid" style="margin-top:40px;grid-template-columns:repeat(3,1fr)">
            ${images.slice(1).map((src) => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="" loading="lazy"></a>`).join("")}
          </div>` : ""}
        <a class="link-arrow" style="margin-top:40px" href="news.html">${icon("chevronLeft")} Back to News</a>
      </div>
    </article>
  `;

  const related = articles.filter((a) => a.slug !== slug).slice(0, 3);
  if (relatedGrid && related.length) {
    relatedGrid.innerHTML = related
      .map((a) => {
        const cover = (manifest[a.imageFolder] || [])[0];
        return `<a class="card news-card" href="news-details.html?article=${a.slug}">
          <div class="news-thumb">${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}</div>
          <div class="news-body"><div class="news-meta"><span class="tag">${a.category}</span></div><h3>${a.title}</h3></div>
        </a>`;
      })
      .join("");
  }
}

init();
