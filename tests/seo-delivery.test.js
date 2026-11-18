import assert from "node:assert/strict";
import { readFile, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { publicRoutes, getPageSeo, SITE_URL } from "../src/restaurant/seo.js";
import { renderRouteHtml, renderSitemap } from "../scripts/site-pages.mjs";
import { createLocalMenuReaders } from "../scripts/local-menu-api.mjs";
import { createPublicPageHandler } from "../lib/publicPageServer.js";
import middleware from "../middleware.js";

const offer = { id: "published-test", name: "SSR nabídka", price: "395 Kč", translations: { en: { name: "SSR offer" }, it: { name: "Offerta SSR" } } };

test("all current-design pages render full public HTML, metadata and safe bootstrap without browser globals", async () => {
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("../", import.meta.url)), plugins: [react()], server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom", logLevel: "error" });
  try {
    const { renderDocument } = await server.ssrLoadModule("/src/entry-server.jsx");
    const templates = Object.fromEntries(await Promise.all(["cs", "en", "it"].map(async language => [language, await readFile(new URL(language === "cs" ? "../index.html" : `../${language}.html`, import.meta.url), "utf8")])));
    assert.equal(publicRoutes.length, 22);
    for (const route of publicRoutes) {
      const html = renderDocument(templates[route.language], route, { today: "2026-10-31", specialMenuItems: [offer], dailyMenuItems: [] });
      const seo = getPageSeo(route.page, route.language, { hasSpecialMenu: true });
      assert.equal((html.match(/<h1\b/g) || []).length, 1, route.path);
      assert.match(html, /class="r-footer"/, route.path);
      assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${route.path}"`), route.path);
      assert.ok(html.includes(`<html lang="${route.language}">`), route.path);
      assert.ok(html.includes(`<meta name="robots" content="${seo.robots}"`), route.path);
      assert.equal((html.match(/hreflang=/g) || []).length, route.page === "daily" ? 2 : 4, route.path);
      assert.ok(html.includes("#940b0b"), "current red brand theme retained");
      const bootstrap = JSON.parse(html.match(/<script id="perla-initial-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
      assert.equal(bootstrap.initialData.pathname, route.path);
      assert.equal(bootstrap.initialData.language, route.language);
      assert.deepEqual(bootstrap.initialData.specialMenuItems, [offer]);
      const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
      assert.equal(graph.find(entity => entity["@type"] === "WebPage").url, SITE_URL + route.path);
      assert.doesNotMatch(html, /<script[^>]+googletagmanager\.com/);
    }
    const notFound = renderDocument(templates.en, { page: "notFound", language: "en" }, { pathname: "/en/missing", today: "2026-10-31" });
    assert.doesNotMatch(notFound, /rel="canonical"|hreflang=/);
    assert.match(notFound, /noindex, follow/);
    assert.equal(JSON.parse(notFound.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"].some(entity => entity["@type"] === "WebPage"), false);
    const missingPath = "/it/seo-audit-missing-20261031.html?keep=1";
    const routed = middleware(new Request(SITE_URL + missingPath));
    assert.equal(routed.headers.get("location"), null);
    const forwarded = new URL(routed.headers.get("x-middleware-rewrite"));
    assert.equal(forwarded.searchParams.get("url"), missingPath);
    const handler = createPublicPageHandler({
      loadRenderer: async () => ({ renderDocument }),
      readTemplate: async language => templates[language],
      readSpecial: async () => { assert.fail("404 must not read special storage"); },
      readDaily: async () => { assert.fail("404 must not read daily storage"); }
    });
    const result = { headers: {} };
    await handler({ url: forwarded.href, method: "GET" }, {
      set statusCode(value) { result.status = value; },
      setHeader(name, value) { result.headers[name] = value; },
      end(body) { result.body = body; }
    });
    assert.equal(result.status, 404);
    assert.equal(result.headers["X-Robots-Tag"], "noindex, follow");
    assert.match(result.body, /<html lang="it">/);
    assert.doesNotMatch(result.body, /rel="canonical"|hreflang=/);
  } finally { await server.close(); }
});

test("current sitemap follows live offer state and omits nonexistent reservation URLs", () => {
  for (const hasSpecialMenu of [false, true]) {
    const xml = renderSitemap({ hasSpecialMenu });
    assert.equal((xml.match(/<loc>/g) || []).length, hasSpecialMenu ? 22 : 19);
    assert.equal(xml.includes("/specialni-menu"), hasSpecialMenu);
    assert.doesNotMatch(xml, /\/rezervace|\/reservation|\/prenotazioni|\/admin|\/copy-of-home|\/gallery/);
  }
});

test("middleware redirects observed historical URLs once and forwards canonical document queries safely", () => {
  for (const [alias, target] of [["/copy-of-home", "/menu"], ["/copy-of-home.html", "/menu"], ["/gallery", "/galerie"], ["/gallery.html", "/galerie"]]) {
    const response = middleware(new Request(`${SITE_URL}${alias}?utm_source=google_maps`));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `${SITE_URL}${target}?utm_source=google_maps`);
  }
  const response = middleware(new Request(`${SITE_URL}/en/menu?category=pizza&url=untrusted`));
  const rewrite = new URL(response.headers.get("x-middleware-rewrite"));
  assert.equal(rewrite.pathname, "/api/public-page");
  assert.equal(rewrite.searchParams.get("url"), "/en/menu?category=pizza&url=untrusted");
  for (const path of ["/admin", "/admin.html", "/google260a340fd746cdf3.html", "/assets/test.js"]) {
    assert.equal(middleware(new Request(SITE_URL + path)).headers.get("x-middleware-next"), "1");
  }
});

test("HTML, trailing slashes and language selection normalize in a single middleware redirect", () => {
  const cases = [
    ["/copy-of-home.html?utm_source=maps", "/menu?utm_source=maps"],
    ["/gallery.html", "/galerie"],
    ["/index-en.html", "/en"],
    ["/index-it.html", "/it"],
    ["/index-de.html", "/it"],
    ["/en/gallery.html?lang=it&x=1&x=2", "/it/galerie?x=1&x=2"],
    ["/menu/?lang=en&category=pasta", "/en/menu?category=pasta"],
    ["/en/gallery.html/?lang=it&x=1&x=2", "/it/galerie?x=1&x=2"],
    ["/admin/?keep=1", "/admin?keep=1"],
    ["/admin.html/?keep=1", "/admin.html?keep=1"]
  ];
  for (const [source, target] of cases) {
    for (const method of ["GET", "HEAD"]) {
      const response = middleware(new Request(SITE_URL + source, { method }));
      assert.equal(response.status, 308, source);
      assert.equal(response.headers.get("location"), SITE_URL + target, source);
      const final = middleware(new Request(response.headers.get("location"), { method }));
      assert.equal(final.headers.get("location"), null, `${source} must finish after one redirect`);
      assert.ok(final.headers.get("x-middleware-rewrite") || final.headers.get("x-middleware-next"), target);
    }
  }
});

test("bootstrap escapes script delimiters and preserves only the supplied public snapshot", async () => {
  const template = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const initialData = { pathname: "/", specialMenuItems: [{ name: "</script><script>private</script>" }] };
  const html = renderRouteHtml(template, { page: "home", language: "cs" }, { markup: "<main>Public content</main>", initialData });
  const payload = html.match(/<script id="perla-initial-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(payload, /</);
  assert.deepEqual(JSON.parse(payload), { initialData });
});

test("local SSR reads the same isolated menu file shape and rejects incomplete specials", async () => {
  const storePath = join(tmpdir(), `perla-seo-reader-${randomUUID()}.json`);
  const readers = createLocalMenuReaders({ storePath });
  try {
    await writeFile(storePath, JSON.stringify({ daily: { "2026-10-31": [{ name: "Published lunch" }] }, special: [offer] }));
    assert.deepEqual(await readers.readSpecial(), [offer]);
    assert.deepEqual(await readers.readDaily("2026-10-31"), [{ name: "Published lunch" }]);
    await writeFile(storePath, JSON.stringify({ daily: {}, special: [{ name: "Incomplete" }] }));
    assert.deepEqual(await readers.readSpecial(), []);
  } finally { await rm(storePath, { force: true }); }
});

test("production packaging includes the server renderer and never rewrites every URL to home", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.functions["api/public-page.js"].includeFiles, ".server/**");
  assert.equal(config.framework, "vite");
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.cleanUrls, false, "verification .html must be served directly");
  assert.equal(Object.hasOwn(config, "trailingSlash"), false, "middleware must combine slash and language normalization");
  assert.deepEqual(config.rewrites, [{ source: "/admin", destination: "/admin.html" }]);
  assert.equal((config.rewrites || []).some(({ source }) => source === "/(.*)"), false);
  assert.ok(config.redirects.length < 1024);
  assert.ok(config.redirects.every(({ has }) => has?.some(({ type }) => type === "host")), "path and lang normalization belong together in middleware");
  assert.deepEqual([...new Set(config.redirects.flatMap(({ has }) => has.filter(({ type }) => type === "host").map(({ value }) => value)))].sort(), ["cs.lapiccolaperla.cz", "en.lapiccolaperla.cz", "it.lapiccolaperla.cz", "lapiccolaperla.vercel.app", "www.lapiccolaperla.cz"].sort());
  for (const redirect of config.redirects.filter(({ source }) => source === "/:path*")) assert.equal(redirect.destination, SITE_URL + "/:path*");
  const verification = await readFile(new URL("../public/google260a340fd746cdf3.html", import.meta.url), "utf8");
  assert.equal(verification.trim(), "google-site-verification: google260a340fd746cdf3.html");
});
