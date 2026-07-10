/**
 * main.js — site-wide behaviour: mobile nav, active nav link, scroll reveal,
 * back-to-top. No frameworks/build step — plain DOM APIs so this runs as-is
 * on GitHub Pages / Cloudflare Pages.
 */
(function () {
  "use strict";

  // ---- Mobile / offcanvas nav ----
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const closeBtn = document.querySelector("[data-nav-close]");
  const navOverlay = document.querySelector("[data-nav-overlay]");

  function openNav() {
    mobileNav?.classList.add("is-open");
    navOverlay?.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle?.setAttribute("aria-expanded", "true");
  }
  function closeNav() {
    mobileNav?.classList.remove("is-open");
    navOverlay?.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
  toggle?.addEventListener("click", openNav);
  closeBtn?.addEventListener("click", closeNav);
  navOverlay?.addEventListener("click", closeNav);
  mobileNav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  // ---- Offcanvas "Pages" accordion ----
  document.querySelectorAll("[data-accordion-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest("[data-accordion]")?.classList.toggle("is-open");
    });
  });

  // ---- Desktop nav dropdown (keyboard/touch — hover is handled in CSS) ----
  document.querySelectorAll("[data-dropdown-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.closest(".nav-dropdown")?.classList.toggle("is-open");
    });
  });

  // ---- Shared icon injection for header/offcanvas (same on every page) ----
  if (window.MSLIcons) {
    document.querySelectorAll("[data-dropdown-chevron], [data-accordion-chevron]").forEach((el) => {
      el.innerHTML = MSLIcons.icon("chevronDown");
    });
    const iconMap = { "data-icon-pin": "mapPin", "data-icon-mail": "mail", "data-icon-phone": "phone" };
    Object.entries(iconMap).forEach(([attr, name]) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => { el.innerHTML = MSLIcons.icon(name); });
    });
  }

  // ---- Header: transparent over the hero until scrolled, then solid+fixed ----
  const siteHeader = document.querySelector("[data-site-header]");
  if (siteHeader) {
    const applyHeaderState = () => siteHeader.classList.toggle("is-scrolled", window.scrollY > 60);
    applyHeaderState();
    window.addEventListener("scroll", applyHeaderState, { passive: true });
  }

  // ---- Active nav link (based on current filename) ----
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-primary a, .mobile-nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });

  // ---- Footer year ----
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---- Scroll reveal ----
  // Exposed as window.MSLReveal so pages that inject cards after an async
  // data fetch (team strip, news preview, feature lists, ...) can bind
  // reveal behaviour to elements that didn't exist yet when this ran.
  // Elements stay observed and the class toggles off when they leave the
  // viewport, so the animation replays on every re-entry — same behaviour
  // as the Nitro template's "play reverse play reverse" ScrollTriggers.
  const revealIO = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      )
    : null;

  // Elements already sitting in the viewport when they're bound (hero copy,
  // anything above the fold) get is-visible immediately rather than waiting
  // on the observer's first async callback — IntersectionObserver callbacks
  // can be deferred by the browser (backgrounded tab, slow layout settle
  // after web fonts swap in), which silently ate the hero entrance
  // animation. The observer stays attached either way, so scroll-out/back-in
  // replay still works for everything below the fold.
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
  }
  function observeReveal(root) {
    (root || document).querySelectorAll(".reveal:not([data-reveal-bound]), .reveal-fade:not([data-reveal-bound])").forEach((el) => {
      el.setAttribute("data-reveal-bound", "");
      const delay = el.getAttribute("data-reveal-delay");
      if (delay) el.style.transitionDelay = `${delay}s`;
      if (revealIO) {
        revealIO.observe(el);
        if (isInViewport(el)) el.classList.add("is-visible");
      } else {
        el.classList.add("is-visible");
      }
    });
  }
  observeReveal();
  window.MSLReveal = { observe: observeReveal };

  // ---- Counter-up (stat numbers count from 0 when scrolled into view) ----
  const counterEls = document.querySelectorAll("[data-counter]");
  if (counterEls.length) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const runCounter = (el) => {
      const target = parseFloat(el.getAttribute("data-counter"));
      const suffix = el.getAttribute("data-counter-suffix") || "";
      if (prefersReducedMotion || Number.isNaN(target)) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const counterIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              counterIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counterEls.forEach((el) => counterIO.observe(el));
    } else {
      counterEls.forEach(runCounter);
    }
  }

  // ---- Hero headline word-stagger entrance ----
  // Fired directly on load rather than via IntersectionObserver: the hero
  // is always above the fold, so there's nothing to "scroll into view" —
  // gating it on IO just adds a failure mode (deferred callbacks, threshold
  // math landing wrong after web-font swap-in reflows the line count).
  // Double rAF: one frame to let the browser paint the pre-animation state
  // (opacity:0, offset), the next to flip the class so the transition
  // actually has a "from" state to animate away from.
  const heroTitle = document.querySelector("[data-split-title]");
  if (heroTitle && !heroTitle.dataset.split) {
    heroTitle.dataset.split = "true";
    const accentWords = (heroTitle.getAttribute("data-accent-words") || "").split(",").map((w) => w.trim().replace(/[.,]$/, "")).filter(Boolean);
    const text = heroTitle.textContent.trim();
    heroTitle.innerHTML = text
      .split(" ")
      .map((word, i) => {
        const isAccent = accentWords.includes(word.replace(/[.,]$/, ""));
        return `<span class="word${isAccent ? " accent" : ""}" style="transition-delay:${(i * 0.045).toFixed(3)}s">${word}</span>`;
      })
      .join(" ");
    requestAnimationFrame(() => requestAnimationFrame(() => heroTitle.classList.add("is-revealed")));
  }

  // ---- Hero visual mouse-tilt (desktop only, mirrors Nitro's cursor-tilt) ----
  const tiltSection = document.querySelector("[data-tilt-zone]");
  const tiltTarget = document.querySelector("[data-tilt]");
  if (
    tiltSection && tiltTarget &&
    window.matchMedia("(min-width: 981px) and (hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    let rafId;
    tiltSection.addEventListener("mousemove", (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = tiltSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 12;
        const rotateX = ((y / rect.height) - 0.5) * -12;
        tiltTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
      });
    });
    tiltSection.addEventListener("mouseleave", () => {
      if (rafId) cancelAnimationFrame(rafId);
      tiltTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  }

  // ---- Back to top ----
  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    window.addEventListener(
      "scroll",
      () => { backToTop.classList.toggle("is-visible", window.scrollY > 700); },
      { passive: true }
    );
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }


  // ---- Custom cursor (dot + trailing ring, Nitro-style) ----
  // Injected from JS so every page gets it without markup changes. The dot
  // tracks the pointer instantly; the ring's easing comes from its CSS
  // transform transition (no lerp loop needed). Native cursor stays
  // visible, matching the reference template. Desktop pointers only.
  if (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.append(ring, dot);

    document.addEventListener("mousemove", (e) => {
      const pos = `translate(${e.clientX}px, ${e.clientY}px)`;
      dot.style.transform = pos;
      ring.style.transform = pos;
      dot.classList.add("is-active");
      ring.classList.add("is-active");
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      dot.classList.remove("is-active");
      ring.classList.remove("is-active");
    });

    // Grow on interactive elements (event delegation so injected cards count)
    document.addEventListener("mouseover", (e) => {
      const interactive = !!e.target.closest("a, button, select, input, textarea, [data-lightbox]");
      dot.classList.toggle("cursor-hover", interactive);
      ring.classList.toggle("cursor-hover", interactive);
    }, { passive: true });
  }
})();
