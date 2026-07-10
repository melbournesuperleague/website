/**
 * partials.js — fills in contact/social details site-wide from
 * data/site-config.json so email/phone/social links only need updating
 * in ONE place. Runs on every page (see footer include).
 */
import { getSiteConfig } from "./data.js";

getSiteConfig().then((cfg) => {
  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    el.textContent = cfg.contact.email;
    if (el.tagName === "A") el.href = `mailto:${cfg.contact.email}`;
  });
  document.querySelectorAll("[data-contact-phone]").forEach((el) => {
    el.textContent = cfg.contact.phoneDisplay;
    if (el.tagName === "A") el.href = `tel:${cfg.contact.phone.replace(/\s+/g, "")}`;
  });
  document.querySelectorAll("[data-contact-city]").forEach((el) => { el.textContent = cfg.contact.city; });
  document.querySelectorAll("[data-contact-facebook]").forEach((el) => { el.href = cfg.contact.facebook; });
  document.querySelectorAll("[data-contact-instagram]").forEach((el) => { el.href = cfg.contact.instagram; });
});
