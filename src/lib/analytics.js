import { publicRoutes, SITE_URL } from "../restaurant/seo.js";
import { ANALYTICS_ORIGINS, GA4_MEASUREMENT_ID } from "../data/analyticsConfig.js";

export const ANALYTICS_CONSENT_KEY = "la-piccola-perla-analytics-consent-v1";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const SCRIPT_ID = "perla-google-analytics";
const deniedConsent = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
const destinations = { reservation_open: "choiceqr_booking", phone_click: "phone", directions_click: "google_maps", map_load: "google_maps_embed", order_open: "choiceqr_order" };
const placements = new Set(["header", "footer", "navigation", "reservation", "contact", "map", "takeaway", "main"]);
const searchEngineHosts = new Set([
  ...["com", "cz", "sk", "de", "at", "ch", "co.uk", "ie", "fr", "it", "es", "pl", "nl", "be", "ca", "com.au", "co.nz", "co.jp", "co.in", "com.br"]
    .flatMap((suffix) => [`google.${suffix}`, `www.google.${suffix}`]),
  "bing.com", "www.bing.com", "search.yahoo.com", "uk.search.yahoo.com", "de.search.yahoo.com", "fr.search.yahoo.com", "it.search.yahoo.com",
  "seznam.cz", "www.seznam.cz", "search.seznam.cz", "duckduckgo.com", "www.duckduckgo.com",
  "search.brave.com", "ecosia.org", "www.ecosia.org", "qwant.com", "www.qwant.com", "startpage.com", "www.startpage.com",
]);

export function getAnalyticsReferrer(referrer) {
  try {
    const url = new URL(referrer);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && searchEngineHosts.has(url.hostname) ? url.origin : "";
  } catch { return ""; }
}

// Unknown paths may contain personal information. Only existing, canonical public routes qualify.
export function getAnalyticsContext(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) return null;
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const route = publicRoutes.find(({ path }) => path === cleanPath);
  return route ? { path: route.path, language: route.language } : null;
}

export function classifyAnalyticsLink(href, { isLocationLink = false } = {}) {
  if (typeof href !== "string") return null;
  if (/^tel:/i.test(href)) return "phone_click";
  let url;
  try { url = new URL(href, SITE_URL); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.origin === "https://la-piccola-perla.choiceqr.com") {
    if (url.pathname.replace(/\/$/, "") === "/takeaway/booking") return "reservation_open";
    if (url.pathname.startsWith("/takeaway/section:menu/")) return "order_open";
  }
  if (["www.google.com", "google.com"].includes(url.hostname)
    && (/^\/maps\/(?:search|dir)(?:\/|$)/.test(url.pathname)
      || (url.pathname === "/maps" && (url.searchParams.has("q") || url.searchParams.has("daddr")))
      || (isLocationLink && url.pathname === "/maps" && url.searchParams.get("cid") === "218766933573814212"))) return "directions_click";
  return null;
}

function placementOf(element) {
  if (element.closest("header")) return "header";
  if (element.closest("footer")) return "footer";
  if (element.closest("nav")) return "navigation";
  if (element.closest(".r-map")) return "map";
  if (element.closest(".r-takeaway")) return "takeaway";
  if (element.closest(".r-booking")) return "reservation";
  if (element.closest(".r-contact-details") || element.closest(".r-contact-image")) return "contact";
  return "main";
}

export function createAnalytics({ browser, measurementId = GA4_MEASUREMENT_ID, allowedOrigins = ANALYTICS_ORIGINS, now = Date.now, reload = () => browser?.location.reload() } = {}) {
  const doc = browser?.document;
  const validId = /^G-[A-Z0-9]{10}$/.test(measurementId || "");
  const enabled = Boolean(doc && validId && allowedOrigins.includes(browser.location.origin));
  let storedChoice = null;
  let context = null;
  let mounts = 0;
  let loaded = false;
  let reloading = false;
  let lastPageView = null;
  let expirationTimer;
  const subscribers = new Set();

  function readChoice() {
    try {
      const value = JSON.parse(browser?.localStorage.getItem(ANALYTICS_CONSENT_KEY) || "null");
      if (value?.version === 1 && ["granted", "denied"].includes(value.analytics)
        && Number.isFinite(value.updatedAt) && value.updatedAt <= now()
        && now() - value.updatedAt < CONSENT_MAX_AGE_MS) return value;
    } catch { /* Storage may be unavailable; the session choice still works. */ }
    try { browser?.localStorage.removeItem(ANALYTICS_CONSENT_KEY); } catch { /* Optional storage. */ }
    return null;
  }
  storedChoice = readChoice();

  function consent() {
    return storedChoice && now() - storedChoice.updatedAt < CONSENT_MAX_AGE_MS ? storedChoice.analytics : "unknown";
  }
  function notify() { for (const subscriber of subscribers) subscriber(consent()); }
  function command() { browser.dataLayer.push(arguments); }
  function pageParameters() {
    return {
      page_path: context.path, page_location: `${SITE_URL}${context.path}`,
      page_referrer: getAnalyticsReferrer(doc.referrer), page_title: "La Piccola Perla", language: context.language,
    };
  }
  function clearAnalyticsCookies() {
    if (!doc) return;
    try {
      const names = doc.cookie.split(";").map((entry) => entry.trim().split("=", 1)[0]).filter((name) => /^_ga(?:_|$)/.test(name));
      const hostname = browser.location.hostname;
      for (const name of names) {
        for (const domain of ["", hostname, `.${hostname}`]) {
          doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
        }
      }
    } catch { /* A browser which blocks cookies must still be able to refuse. */ }
  }
  function stopCollection() {
    if (validId && browser) browser[`ga-disable-${measurementId}`] = true;
    clearAnalyticsCookies();
    if (!loaded || reloading) return;
    // Disable collection first, then revoke storage permission. A fresh document
    // removes the already executed Google library and its automatic listeners.
    reloading = true;
    command("consent", "update", { ...deniedConsent });
    doc.getElementById(SCRIPT_ID)?.remove();
    reload();
  }
  function scheduleExpiry() {
    browser?.clearTimeout(expirationTimer);
    if (!storedChoice || !mounts) return;
    const remaining = storedChoice.updatedAt + CONSENT_MAX_AGE_MS - now();
    expirationTimer = browser.setTimeout(() => {
      if (consent() === "unknown") {
        storedChoice = null;
        try { browser.localStorage.removeItem(ANALYTICS_CONSENT_KEY); } catch { /* Optional storage. */ }
        stopCollection();
        notify();
      } else scheduleExpiry();
    }, Math.max(1, Math.min(remaining, 2147483647)));
  }
  function activate() {
    scheduleExpiry();
    if (!enabled || !context || !mounts || reloading || consent() !== "granted"
      || getAnalyticsContext(browser.location.pathname)?.path !== context.path) return;
    browser[`ga-disable-${measurementId}`] = false;
    if (!loaded) {
      browser.dataLayer = browser.dataLayer || [];
      command("consent", "default", { ...deniedConsent });
      command("set", "ads_data_redaction", true);
      command("set", "url_passthrough", false);
      command("consent", "update", { ...deniedConsent, analytics_storage: "granted" });
      command("js", new Date(now()));
      command("config", measurementId, {
        ...pageParameters(), send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: "none", cookie_path: "/", cookie_expires: CONSENT_MAX_AGE_MS / 1000,
        cookie_update: false, cookie_flags: "SameSite=Lax;Secure",
      });
      const script = doc.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.referrerPolicy = "no-referrer";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      loaded = true;
      doc.head.appendChild(script);
    }
    const pageKey = `${context.language}:${context.path}`;
    if (pageKey !== lastPageView) {
      command("event", "page_view", { ...pageParameters(), send_to: measurementId });
      lastPageView = pageKey;
    }
  }
  function syncStoredChoice() {
    storedChoice = readChoice();
    if (consent() !== "granted") stopCollection();
    else activate();
    scheduleExpiry();
    notify();
  }
  function onStorage(event) {
    if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) syncStoredChoice();
  }
  function track(name, placement = "main") {
    // Re-check the current URL as well as the mounted context before every event.
    const current = getAnalyticsContext(browser?.location.pathname);
    if (!enabled || !loaded || reloading || !mounts || consent() !== "granted" || !context || current?.path !== context.path || !destinations[name]) return false;
    command("event", name, { ...pageParameters(), placement: placements.has(placement) ? placement : "main", destination_type: destinations[name], send_to: measurementId });
    return true;
  }
  function onClick(event) {
    if (event.defaultPrevented || (event.button !== undefined && event.button !== 0)) return;
    const link = event.target?.closest?.("a[href]");
    if (!link) return;
    // The same CID also links to reviews. Only the contact details and entrance photo are map actions.
    const name = classifyAnalyticsLink(link.getAttribute("href"), { isLocationLink: Boolean(link.closest(".r-contact-details") || link.closest(".r-contact-image")) });
    if (name) track(name, placementOf(link));
  }

  return {
    getConsent: consent,
    setConsent(choice) {
      if (!["granted", "denied"].includes(choice)) return false;
      storedChoice = { version: 1, analytics: choice, updatedAt: now() };
      try { browser?.localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(storedChoice)); } catch { /* Remember for this page only. */ }
      if (choice === "denied") stopCollection();
      else activate();
      scheduleExpiry();
      notify();
      return true;
    },
    mount({ pathname, onConsentChange } = {}) {
      context = getAnalyticsContext(pathname);
      if (onConsentChange) subscribers.add(onConsentChange);
      onConsentChange?.(consent());
      mounts += 1;
      if (mounts === 1 && browser) {
        doc.addEventListener("click", onClick);
        browser.addEventListener("storage", onStorage);
      }
      if (consent() !== "granted") stopCollection();
      activate();
      let disposed = false;
      return () => {
        if (disposed) return;
        disposed = true;
        subscribers.delete(onConsentChange);
        mounts -= 1;
        if (mounts === 0 && browser) {
          doc.removeEventListener("click", onClick);
          browser.removeEventListener("storage", onStorage);
          browser.clearTimeout(expirationTimer);
          if (validId) browser[`ga-disable-${measurementId}`] = true;
        }
      };
    },
    track,
  };
}

let browserAnalytics;
export function getAnalytics() {
  if (typeof window === "undefined") return createAnalytics();
  browserAnalytics ||= createAnalytics({ browser: window });
  return browserAnalytics;
}
