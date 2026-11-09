import test from "node:test";
import assert from "node:assert/strict";
import { ANALYTICS_CONSENT_KEY, CONSENT_MAX_AGE_MS, classifyAnalyticsLink, createAnalytics, getAnalyticsContext, getAnalyticsReferrer } from "../src/lib/analytics.js";
import { privacyUi as analyticsCopy } from "../src/restaurant/analyticsCopy.js";

const measurementId = "G-TEST123456";
const currentTime = Date.parse("2026-10-31T12:00:00Z");
const choice = (analytics, updatedAt = currentTime) => JSON.stringify({ version: 2, analytics, updatedAt });

// Pure fake browser: no script execution, real cookies, network or Google traffic.
function fakeBrowser(url = "https://lapiccolaperla.cz/", initial = {}) {
  const storage = new Map(Object.entries(initial));
  const scripts = [];
  const listeners = new Map();
  const windowListeners = new Map();
  const timers = new Map();
  const cookieValues = new Map([["_ga", "old-analytics"], ["_ga_TEST123456", "old-session"], ["la_piccola_perla_daily_menu", "menu"]]);
  let timerId = 0;
  let reloads = 0;
  const on = (map, event, listener) => { if (!map.has(event)) map.set(event, new Set()); map.get(event).add(listener); };
  const off = (map, event, listener) => map.get(event)?.delete(listener);
  const document = {
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return { remove() { const index = scripts.indexOf(this); if (index >= 0) scripts.splice(index, 1); } }; },
    getElementById(id) { return scripts.find((script) => script.id === id); },
    addEventListener: (event, listener) => on(listeners, event, listener),
    removeEventListener: (event, listener) => off(listeners, event, listener),
    get cookie() { return [...cookieValues].map(([key, value]) => `${key}=${value}`).join("; "); },
    set cookie(value) { if (value.includes("Max-Age=0")) cookieValues.delete(value.split("=", 1)[0]); },
  };
  const location = new URL(url);
  location.reload = () => { reloads += 1; };
  const browser = {
    location, document,
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener: (event, listener) => on(windowListeners, event, listener),
    removeEventListener: (event, listener) => off(windowListeners, event, listener),
  };
  return {
    browser, storage, scripts, listeners, timers, cookieValues,
    get reloads() { return reloads; },
    commands() { return (browser.dataLayer || []).map((entry) => [...entry]); },
    events() { return this.commands().filter(([type]) => type === "event"); },
    dispatchStorage(key = ANALYTICS_CONSENT_KEY) { for (const handler of windowListeners.get("storage") || []) handler({ key }); },
    click(href, placement = "main", extra = {}) {
      const selectors = { header: "header", footer: "footer", navigation: "nav", map: ".r-map", reservation: ".r-booking", contact: ".r-contact-details", contactImage: ".r-contact-image", takeaway: ".r-takeaway" };
      const link = { getAttribute: () => href, closest: (selector) => selectors[placement] === selector ? {} : null };
      for (const handler of listeners.get("click") || []) handler({ button: 0, target: { closest: () => link }, ...extra });
    },
  };
}

function adapter(fake, options = {}) { return createAnalytics({ browser: fake.browser, measurementId, now: () => currentTime, ...options }); }

test("old notice acceptance never starts analytics; rejection needs no Google script or queue", () => {
  const fake = fakeBrowser(undefined, { "la-piccola-perla-cookie-notice": "accepted" });
  const analytics = adapter(fake);
  const states = [];
  analytics.mount({ pathname: "/", onConsentChange: (state) => states.push(state) });
  assert.equal(analytics.getConsent(), "unknown");
  fake.click("tel:+420224282537");
  assert.equal(fake.scripts.length, 0);
  assert.equal(fake.browser.dataLayer, undefined);
  assert.equal(analytics.setConsent("accepted"), false);
  analytics.setConsent("denied");
  assert.deepEqual(states, ["unknown", "denied"]);
  assert.equal(fake.scripts.length, 0);
  assert.equal(fake.browser.dataLayer, undefined);
  assert.equal(JSON.parse(fake.storage.get(ANALYTICS_CONSENT_KEY)).analytics, "denied");
  assert.deepEqual([...fake.cookieValues.keys()], ["la_piccola_perla_daily_menu"]);
});

test("explicit grant loads one tag, denies all advertising and sanitizes the initial page view", () => {
  const fake = fakeBrowser("https://lapiccolaperla.cz/en/kontakt?email=private@example.com&utm_campaign=private#private");
  const analytics = adapter(fake);
  analytics.mount({ pathname: fake.browser.location.pathname });
  analytics.setConsent("granted");
  assert.equal(fake.scripts.length, 1);
  assert.equal(fake.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  assert.equal(fake.scripts[0].referrerPolicy, "no-referrer");
  const commands = fake.commands();
  assert.deepEqual(commands[0], ["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  const update = commands.find(([type, action]) => type === "consent" && action === "update")[2];
  assert.deepEqual(update, { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  const config = commands.find(([type]) => type === "config")[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_expires, 180 * 24 * 60 * 60);
  assert.equal(config.cookie_update, false);
  assert.equal(config.page_location, "https://lapiccolaperla.cz/en/kontakt");
  assert.equal(config.page_referrer, "");
  assert.equal(config.language, "en");
  assert.equal(fake.events().filter((event) => event[1] === "page_view").length, 1);
  assert.doesNotMatch(JSON.stringify(commands), /private|email=|utm_campaign|#private/);
});

test("StrictMode mount cleanup and re-mount does not duplicate tag, page view or delegated listeners", () => {
  const fake = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
  const analytics = adapter(fake);
  assert.equal(fake.scripts.length, 0, "construction alone never loads scripts");
  const cleanup = analytics.mount({ pathname: "/" });
  cleanup();
  cleanup();
  const cleanupAgain = analytics.mount({ pathname: "/" });
  analytics.setConsent("granted");
  assert.equal(fake.scripts.length, 1);
  assert.equal(fake.events().length, 1);
  assert.equal(fake.listeners.get("click").size, 1);
  fake.click("https://la-piccola-perla.choiceqr.com/takeaway/booking?name=private#private", "reservation");
  assert.equal(fake.events().filter((event) => event[1] === "reservation_open").length, 1);
  assert.equal(fake.browser[`ga-disable-${measurementId}`], false);
  cleanupAgain();
  assert.equal(fake.listeners.get("click").size, 0);
  assert.equal(fake.browser[`ga-disable-${measurementId}`], true);
});

test("only the five intended interactions are measured with fixed destination types and safe context", () => {
  const fake = fakeBrowser("https://lapiccolaperla.cz/it/kontakt?name=private#private");
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/it/kontakt" });
  assert.equal(analytics.track("map_load", "map"), false);
  analytics.setConsent("granted");
  fake.click("/it/prenotazioni", "header");
  fake.click("https://www.google.com/maps?cid=218766933573814212", "main");
  fake.click("https://la-piccola-perla.choiceqr.com/takeaway/booking?name=private#private", "reservation");
  fake.click("tel:+420224282537", "contact");
  fake.click("https://www.google.com/maps/search/?api=1&query=private", "map");
  fake.click("https://la-piccola-perla.choiceqr.com/takeaway/section:menu/polevky?private=1", "takeaway");
  analytics.track("map_load", "map");
  assert.equal(analytics.track("purchase", "main"), false);
  const events = fake.events().filter((event) => event[1] !== "page_view");
  assert.deepEqual(events.map((event) => event[1]), ["reservation_open", "phone_click", "directions_click", "order_open", "map_load"]);
  assert.deepEqual(events.map((event) => event[2].destination_type), ["choiceqr_booking", "phone", "google_maps", "choiceqr_order", "google_maps_embed"]);
  for (const [, , values] of events) {
    assert.equal(values.page_path, "/it/kontakt");
    assert.equal(values.language, "it");
    assert.equal(values.page_referrer, "");
    assert.deepEqual(Object.keys(values).sort(), ["destination_type", "language", "page_location", "page_path", "page_referrer", "page_title", "placement", "send_to"].sort());
  }
  assert.doesNotMatch(JSON.stringify(events), /private|224282537|section:menu|booking\?/);
  const count = fake.events().length;
  fake.click("tel:+420224282537", "header", { defaultPrevented: true });
  fake.click("tel:+420224282537", "header", { button: 1 });
  assert.equal(fake.events().length, count);
});

test("revocation immediately disables collection, clears GA cookies, removes tag and reloads once", () => {
  const fake = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/" });
  analytics.setConsent("denied");
  analytics.setConsent("denied");
  assert.equal(fake.browser[`ga-disable-${measurementId}`], true);
  assert.equal(fake.scripts.length, 0);
  assert.equal(fake.reloads, 1);
  assert.equal(JSON.parse(fake.storage.get(ANALYTICS_CONSENT_KEY)).analytics, "denied");
  assert.deepEqual([...fake.cookieValues.keys()], ["la_piccola_perla_daily_menu"]);
  assert.equal(analytics.track("phone_click", "header"), false);
  const lastConsent = fake.commands().filter(([type]) => type === "consent").at(-1)[2];
  assert.deepEqual(lastConsent, { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
});

test("no tracking on local previews, admin, unknown paths, absent ID or server rendering", () => {
  for (const [url, pathname, id] of [
    ["http://localhost:4175/", "/", measurementId],
    ["https://preview.example/", "/", measurementId],
    ["https://lapiccolaperla.cz/admin", "/admin", measurementId],
    ["https://lapiccolaperla.cz/admin", "/", measurementId],
    ["https://lapiccolaperla.cz/customers/private", "/customers/private", measurementId],
    ["https://lapiccolaperla.cz/", "/", ""],
  ]) {
    const fake = fakeBrowser(url, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
    const analytics = adapter(fake, { measurementId: id });
    analytics.mount({ pathname });
    analytics.setConsent("granted");
    assert.equal(fake.scripts.length, 0, url);
    assert.equal(fake.browser.dataLayer, undefined, url);
    assert.equal(analytics.track("phone_click"), false, url);
  }
  const server = createAnalytics();
  server.mount({ pathname: "/" })();
  assert.equal(server.track("phone_click"), false);
});

test("expired, malformed, future-dated and unversioned choices do not authorize tracking", () => {
  for (const value of ["accepted", "granted", "{", JSON.stringify({ analytics: "granted", updatedAt: currentTime }), choice("granted", currentTime - CONSENT_MAX_AGE_MS), choice("granted", currentTime + 1)]) {
    const fake = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: value });
    const analytics = adapter(fake);
    analytics.mount({ pathname: "/" });
    assert.equal(analytics.getConsent(), "unknown");
    assert.equal(fake.scripts.length, 0);
    assert.equal(fake.storage.has(ANALYTICS_CONSENT_KEY), false);
  }
});

test("cross-tab withdrawal and expiry stop active collection", () => {
  const fake = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/" });
  fake.storage.set(ANALYTICS_CONSENT_KEY, choice("denied"));
  fake.dispatchStorage();
  assert.equal(analytics.getConsent(), "denied");
  assert.equal(fake.reloads, 1);
  assert.equal(analytics.track("phone_click"), false);

  let clock = currentTime;
  const expired = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
  const expiringAnalytics = adapter(expired, { now: () => clock });
  expiringAnalytics.mount({ pathname: "/" });
  assert.ok([...expired.timers.values()].every(({ delay }) => delay <= 2147483647));
  clock += CONSENT_MAX_AGE_MS;
  [...expired.timers.values()][0].fn();
  assert.equal(expiringAnalytics.getConsent(), "unknown");
  assert.equal(expired.reloads, 1);
  assert.equal(expired.storage.has(ANALYTICS_CONSENT_KEY), false);
});

test("blocked browser storage still permits a page-session choice and rejection", () => {
  const fake = fakeBrowser();
  fake.browser.localStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/" });
  assert.equal(analytics.getConsent(), "unknown");
  analytics.setConsent("granted");
  assert.equal(fake.scripts.length, 1);
  assert.equal(analytics.getConsent(), "granted");
  analytics.setConsent("denied");
  assert.equal(analytics.getConsent(), "denied");
  assert.equal(fake.reloads, 1);
});

test("route and target classifiers reject unrelated or private values, with all three consent languages", () => {
  assert.deepEqual(getAnalyticsContext("/en/menu?private=1#private"), { path: "/en/menu", language: "en" });
  for (const path of ["https://evil.example/menu", "//evil.example/menu", "/unknown/private", "/admin"]) assert.equal(getAnalyticsContext(path), null);
  for (const href of ["/rezervace", "https://la-piccola-perla.choiceqr.com.evil.example/takeaway/booking", "https://private@la-piccola-perla.choiceqr.com/takeaway/booking", "https://www.google.com/maps?cid=123", "mailto:private@example.com"]) assert.equal(classifyAnalyticsLink(href), null);
  for (const language of ["cs", "en", "it"]) {
    assert.ok(analyticsCopy[language].allow);
    assert.ok(analyticsCopy[language].deny);
    assert.ok(analyticsCopy[language].title);
  }
});

test("organic attribution keeps only recognized search-engine origins, with no private referrer data", () => {
  for (const origin of ["https://www.google.com", "https://www.google.cz", "https://www.google.co.uk", "https://www.bing.com", "https://search.seznam.cz", "https://search.yahoo.com", "https://duckduckgo.com", "https://search.brave.com"]) {
    assert.equal(getAnalyticsReferrer(`${origin}/search/private?q=private@example.com#private`), origin);
  }
  for (const referrer of ["", "not a URL", "https://private.example/search?q=private", "https://www.google.com.attacker.example/search", "https://google.cz:444/search", "https://private@www.google.com/search", "http://www.google.com/search", "javascript:alert(1)"]) {
    assert.equal(getAnalyticsReferrer(referrer), "");
  }
  const fake = fakeBrowser("https://lapiccolaperla.cz/menu?private=1");
  fake.browser.document.referrer = "https://www.google.cz/search?q=private@example.com#private";
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/menu" });
  analytics.setConsent("granted");
  const config = fake.commands().find(([type]) => type === "config")[2];
  assert.equal(config.page_referrer, "https://www.google.cz");
  assert.equal(config.ignore_referrer, undefined);
  assert.ok(!Object.keys(config).some((key) => key.startsWith("campaign_")));
  fake.click("tel:+420224282537");
  assert.equal(fake.events().at(-1)[2].page_referrer, "https://www.google.cz");
  assert.doesNotMatch(JSON.stringify(fake.commands()), /private@example|q=|#private|private=1/);
});

test("the shared Google CID counts as directions only in contact details and the entrance photo", () => {
  const cid = "https://www.google.com/maps?cid=218766933573814212";
  assert.equal(classifyAnalyticsLink(cid), null);
  assert.equal(classifyAnalyticsLink(cid, { isLocationLink: true }), "directions_click");
  assert.equal(classifyAnalyticsLink("https://www.google.com/maps?cid=999", { isLocationLink: true }), null);
  const fake = fakeBrowser("https://lapiccolaperla.cz/kontakt");
  const analytics = adapter(fake);
  analytics.mount({ pathname: "/kontakt" });
  analytics.setConsent("granted");
  fake.click(cid, "main");
  fake.click(cid, "contact");
  const actions = fake.events().filter(([, name]) => name !== "page_view");
  assert.deepEqual(actions.map(([, name, parameters]) => [name, parameters.placement]), [["directions_click", "contact"]]);
  fake.click(cid, "contactImage");
  assert.deepEqual(fake.events().filter(([, name]) => name !== "page_view").map(([, name, parameters]) => [name, parameters.placement]), [["directions_click", "contact"], ["directions_click", "contact"]]);
});

test("SPA page and language changes record each visit without adding a second tag", () => {
  const fake = fakeBrowser(undefined, { [ANALYTICS_CONSENT_KEY]: choice("granted") });
  const analytics = adapter(fake);
  let cleanup = analytics.mount({ pathname: "/" });
  for (const path of ["/en/menu", "/"]) {
    cleanup();
    fake.browser.location.pathname = path;
    cleanup = analytics.mount({ pathname: path });
  }
  assert.equal(fake.scripts.length, 1);
  assert.deepEqual(fake.events().map(([, name, parameters]) => [name, parameters.page_path, parameters.language]), [
    ["page_view", "/", "cs"], ["page_view", "/en/menu", "en"], ["page_view", "/", "cs"],
  ]);
  cleanup();
});
