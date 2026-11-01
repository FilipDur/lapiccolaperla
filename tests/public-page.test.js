import assert from "node:assert/strict";
import test from "node:test";
import { createPublicPageHandler } from "../lib/publicPageServer.js";
import { getPageSeo } from "../src/restaurant/seo.js";

const fixture = [{ id: "offer", name: "Test nabídky", price: "395 Kč", translations: { en: { name: "Test offer" }, it: { name: "Offerta test" } } }];
const clock = () => new Date("2026-10-30T23:30:00Z");

function harness(overrides = {}) {
  const calls = { special: 0, daily: [], render: [] };
  const handler = createPublicPageHandler({
    now: clock,
    readTemplate: async language => `template:${language}`,
    readSpecial: async () => { calls.special++; return fixture; },
    readDaily: async date => { calls.daily.push(date); return [{ id: "lunch", name: "Test lunch" }]; },
    loadRenderer: async () => ({
      renderDocument: (template, route, initialData) => {
        calls.render.push({ template, route, initialData });
        const seo = getPageSeo(route.page, route.language, { hasSpecialMenu: initialData.specialMenuItems.length > 0 });
        return JSON.stringify({ ...seo, ...initialData });
      },
      renderSitemap: ({ hasSpecialMenu }) => `<urlset>${hasSpecialMenu ? "special" : "regular"}</urlset>`
    }),
    ...overrides
  });
  const request = async (url, { method = "GET", query } = {}) => {
    const result = { statusCode: undefined, headers: {}, body: undefined };
    const response = {
      set statusCode(status) { result.statusCode = status; },
      setHeader(name, value) { result.headers[name] = value; },
      end(body) { result.body = body; }
    };
    await handler({ url, method, query }, response);
    return result;
  };
  return { request, calls };
}

test("published offer state reaches the first HTML and sitemap consistently", async () => {
  for (const active of [true, false]) {
    const { request, calls } = harness({ readSpecial: async () => active ? fixture : [] });
    for (const path of ["/specialni-menu", "/en/specialni-menu", "/it/specialni-menu"]) {
      const response = await request(`/api/public-page?url=${encodeURIComponent(path)}`);
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["Cache-Control"], "no-store");
      const data = JSON.parse(response.body);
      assert.equal(data.robots.includes("noindex"), !active);
      assert.deepEqual(data.specialMenuItems, active ? fixture : []);
      assert.equal(data.canonical, `https://lapiccolaperla.cz${path}`);
    }
    const sitemap = await request("/api/public-page?url=%2Fsitemap.xml");
    assert.equal(sitemap.statusCode, 200);
    assert.equal(sitemap.headers["Content-Type"], "application/xml; charset=utf-8");
    assert.equal(sitemap.body, `<urlset>${active ? "special" : "regular"}</urlset>`);
    assert.equal(calls.render.length, 3);
  }
});

test("GET and HEAD return the same status and metadata without a HEAD body", async () => {
  const { request, calls } = harness();
  const get = await request("/en/menu");
  const head = await request("/en/menu", { method: "HEAD" });
  assert.equal(get.statusCode, 200);
  assert.equal(head.statusCode, get.statusCode);
  assert.deepEqual(head.headers, get.headers);
  assert.equal(head.body, undefined);
  assert.equal(calls.daily.length, 0);
});

test("unknown pages remain localized 404 even with language/query parameters", async () => {
  const { request, calls } = harness();
  const response = await request("/en/missing?lang=it&keep=1");
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers["X-Robots-Tag"], "noindex, follow");
  const page = JSON.parse(response.body);
  assert.equal(page.htmlLang, "en");
  assert.equal(page.canonical, null);
  assert.equal(page.robots, "noindex, follow");
  assert.equal(calls.special, 0);
  assert.deepEqual(calls.daily, []);
});

test("canonical redirects preserve unrelated queries and remove recognized lang", async () => {
  const { request, calls } = harness();
  const response = await request("/menu?lang=it&category=pizza&campaign=abc");
  assert.equal(response.statusCode, 308);
  assert.equal(response.headers.Location, "/it/menu?category=pizza&campaign=abc");
  assert.equal(calls.render.length, 0);
  assert.equal(calls.special, 0);
  const alias = await request("/en/gallery?campaign=abc");
  assert.equal(alias.statusCode, 308);
  assert.equal(alias.headers.Location, "/en/galerie?campaign=abc");
  const final = await request(response.headers.Location);
  assert.equal(final.statusCode, 200);
});

test("normal url query is not interpreted as the middleware forwarding field", async () => {
  const { request } = harness();
  const response = await request("/menu?url=https%3A%2F%2Fevil.example");
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).canonical, "https://lapiccolaperla.cz/menu");
});

test("invalid forwarded routes cannot become an external redirect or file access", async () => {
  const { request, calls } = harness();
  for (const url of ["https://evil.example/menu", "//evil.example/menu", "\\evil.example", "file:///etc/passwd", ["/", "/menu"], "/\r\nInjected:yes"]) {
    const response = await request("/api/public-page", { query: { url } });
    assert.equal(response.statusCode, 400);
    assert.equal(response.headers.Location, undefined);
  }
  assert.equal(calls.render.length, 0);
});

test("daily and homepage SSR use the restaurant's Prague date", async () => {
  const { request, calls } = harness();
  for (const path of ["/denni-menu", "/"]) {
    const response = await request(path);
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).today, "2026-10-31");
  }
  assert.deepEqual(calls.daily, ["2026-10-31", "2026-10-31"]);
});

test("storage failure does not publish empty specials or a misleading sitemap", async () => {
  const secret = "redis://private-secret@internal.example";
  const { request } = harness({ readSpecial: async () => { throw new Error(secret); } });
  for (const path of ["/specialni-menu", "/sitemap.xml"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await request(path, { method });
      assert.equal(response.statusCode, 503);
      assert.equal(response.headers["X-Robots-Tag"], "noindex, follow");
      assert.equal(response.headers["Retry-After"], "60");
      assert.equal(response.headers["Cache-Control"], "no-store");
      if (method === "HEAD") assert.equal(response.body, undefined);
      else assert.equal(response.body.includes(secret), false);
    }
  }
  const menu = await request("/menu");
  assert.equal(menu.statusCode, 200);
  assert.deepEqual(JSON.parse(menu.body).specialMenuItems, []);
});

test("daily failure returns 503 on the daily page but retains the homepage", async () => {
  const { request } = harness({ readDaily: async () => { throw new Error("storage unavailable"); } });
  assert.equal((await request("/denni-menu")).statusCode, 503);
  const home = await request("/");
  assert.equal(home.statusCode, 200);
  assert.deepEqual(JSON.parse(home.body).dailyMenuItems, []);
});

test("renderer failure is a generic noindex 503, not an empty 200 document", async () => {
  const { request } = harness({ loadRenderer: async () => { throw new Error("private path/config"); } });
  const response = await request("/en/menu");
  assert.equal(response.statusCode, 503);
  assert.ok(response.body.includes('lang="en"'));
  assert.equal(response.body.includes("private path/config"), false);
});

test("the public renderer accepts only safe read methods", async () => {
  const { request, calls } = harness();
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
    const response = await request("/menu", { method });
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, "GET, HEAD");
  }
  assert.equal(calls.render.length, 0);
  assert.equal(calls.special, 0);
});

test("a never-settling special read has a deadline for ordinary pages and sitemap", async () => {
  const { request } = harness({ readSpecial: () => new Promise(() => {}), readTimeoutMs: 20 });
  const started = performance.now();
  const [menu, special, sitemap] = await Promise.all([
    request("/menu"), request("/specialni-menu"), request("/sitemap.xml")
  ]);
  assert.ok(performance.now() - started < 500, "reads must not hang the document response");
  assert.equal(menu.statusCode, 200);
  assert.deepEqual(JSON.parse(menu.body).specialMenuItems, []);
  for (const response of [special, sitemap]) {
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers["X-Robots-Tag"], "noindex, follow");
  }
});

test("never-settling daily and special reads expire together instead of serially", async () => {
  const pending = () => new Promise(() => {});
  const { request } = harness({ readSpecial: pending, readDaily: pending, readTimeoutMs: 20 });
  const started = performance.now();
  const [home, daily] = await Promise.all([request("/"), request("/denni-menu", { method: "HEAD" })]);
  assert.ok(performance.now() - started < 500, "parallel deadlines must bound both reads");
  assert.equal(home.statusCode, 200);
  assert.deepEqual(JSON.parse(home.body).dailyMenuItems, []);
  assert.equal(daily.statusCode, 503);
  assert.equal(daily.body, undefined);
});
