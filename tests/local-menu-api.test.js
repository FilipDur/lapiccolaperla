import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { createLocalMenuMiddleware, localMenuApiPlugin } from "../scripts/local-menu-api.mjs";
import { seededDailyMenus } from "../src/data/dailyMenuSeed.js";

const credentials = { "x-admin-user": "local-test", "x-admin-password": "local-test-password" };
const authorize = (request) => Object.entries(credentials).every(([key, value]) => request.headers[key] === value);
const dailyItem = (id = "daily-test") => ({ id, name: "Test dish", description: "Test description", price: "100 Kč" });
const specialItem = () => ({
  id: "special-test", name: "Test CZ", price: "100 Kč",
  translations: { en: { name: "Test EN" }, it: { name: "Test IT" } }
});

async function request(middleware, url, { method = "GET", body, headers = {} } = {}) {
  const rawBody = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  const incoming = Object.assign(Readable.from([Buffer.from(rawBody)]), { url, method, headers });
  const result = { status: undefined, headers: {}, body: undefined, next: false };
  const response = {
    statusCode: 200,
    setHeader(key, value) { result.headers[key] = value; },
    end(value) {
      result.status = this.statusCode;
      result.body = value ? JSON.parse(value) : undefined;
    }
  };
  await middleware(incoming, response, () => { result.next = true; });
  return result;
}

async function harness(context) {
  const directory = await mkdtemp(join(tmpdir(), "perla-local-api-"));
  const storePath = join(directory, "isolated", "menus.json");
  context.after(() => rm(directory, { recursive: true, force: true }));
  context.mock.method(globalThis, "fetch", () => {
    assert.fail("The local menu API must never contact a remote service.");
  });
  const create = (options = {}) => createLocalMenuMiddleware({ storePath, authorize, ...options });
  return { directory, storePath, create, middleware: create() };
}

test("local API begins empty, retains dated seeds and leaves application routes to Vite", async (context) => {
  const { middleware, storePath } = await harness(context);
  assert.deepEqual((await request(middleware, "/api/special-menu")).body, { items: [] });
  assert.deepEqual((await request(middleware, "/api/daily-menu?date=2099-01-01")).body, { date: "2099-01-01", items: [] });
  const date = Object.keys(seededDailyMenus)[0];
  const seeded = await request(middleware, `/api/daily-menu?date=${date}`);
  assert.equal(seeded.headers["Cache-Control"], "no-store");
  assert.deepEqual(seeded.body.items, seededDailyMenus[date]);
  for (const url of ["/admin", "/en", "/it", "/denni-menu", "/specialni-menu"]) {
    assert.equal((await request(middleware, url)).next, true);
  }
  await assert.rejects(readFile(storePath), { code: "ENOENT" });
  assert.equal(localMenuApiPlugin().apply, "serve");
});

test("confirmed saves persist after restart, preserve both menus and clear specials independently", async (context) => {
  const { middleware, create, storePath } = await harness(context);
  const date = "2099-01-01";
  const daily = [dailyItem()];
  const special = [specialItem()];
  assert.equal((await request(middleware, "/api/daily-menu", { method: "PUT", headers: credentials, body: { date, items: daily } })).status, 200);
  assert.equal((await request(middleware, "/api/special-menu", { method: "POST", headers: credentials, body: { items: special } })).status, 200);
  const restarted = create();
  assert.deepEqual((await request(restarted, `/api/daily-menu?date=${date}`)).body.items, daily);
  assert.deepEqual((await request(restarted, "/api/special-menu")).body.items, special);
  assert.equal((await request(restarted, "/api/special-menu", { method: "PUT", headers: credentials, body: { items: [] } })).status, 200);
  const stored = JSON.parse(await readFile(storePath, "utf8"));
  assert.deepEqual(stored, { daily: { [date]: daily }, special: [] });
});

test("special-menu validation and unauthorized writes never replace published data", async (context) => {
  const { middleware, storePath } = await harness(context);
  const valid = { items: [specialItem()] };
  await request(middleware, "/api/special-menu", { method: "PUT", headers: credentials, body: valid });
  const before = await readFile(storePath, "utf8");
  const missingTranslation = specialItem();
  delete missingTranslation.translations.it;
  const invalid = [
    "{", "null", [], {}, { items: [missingTranslation] },
    { items: [{ ...specialItem(), name: " " }] },
    { items: [{ ...specialItem(), name: "x".repeat(121) }] },
    { items: [specialItem(), specialItem()] },
    { items: Array.from({ length: 13 }, (_, index) => ({ ...specialItem(), id: String(index) })) }
  ];
  for (const body of invalid) {
    assert.equal((await request(middleware, "/api/special-menu", { method: "PUT", headers: credentials, body })).status, 400);
    assert.equal(await readFile(storePath, "utf8"), before);
  }
  for (const url of ["/api/daily-menu", "/api/special-menu"]) {
    for (const method of ["PUT", "POST"]) {
      assert.equal((await request(middleware, url, { method, body: { items: [] } })).status, 401);
      assert.equal(await readFile(storePath, "utf8"), before);
    }
  }
  const legacy = specialItem();
  legacy.description = "Ignored legacy text";
  legacy.translations.en.description = "Ignored legacy text";
  const normalized = await request(middleware, "/api/special-menu", { method: "PUT", headers: credentials, body: { items: [legacy] } });
  assert.deepEqual(normalized.body.items, valid.items);
});

test("daily API keeps production normalization and rejects unsupported requests", async (context) => {
  const { middleware } = await harness(context);
  assert.equal((await request(middleware, "/api/daily-menu")).status, 400);
  assert.equal((await request(middleware, "/api/daily-menu?date=invalid")).status, 400);
  const items = Array.from({ length: 13 }, (_, index) => dailyItem(String(index)));
  items[0].name = `  ${"x".repeat(130)}  `;
  items[1].description = " ";
  const saved = await request(middleware, "/api/daily-menu", {
    method: "PUT", headers: credentials, body: { date: "2099-01-01", items }
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.items.length, 11);
  assert.equal(saved.body.items[0].name.length, 120);
  assert.ok(saved.body.items.every((item) => item.id !== "12"));
  for (const url of ["/api/daily-menu", "/api/special-menu"]) {
    assert.equal((await request(middleware, url, { method: "OPTIONS" })).status, 204);
    const unsupported = await request(middleware, url, { method: "DELETE" });
    assert.equal(unsupported.status, 405);
    assert.equal(unsupported.headers.Allow, "GET, PUT, POST, OPTIONS");
  }
});

test("concurrent saves preserve every date and remain isolated from another store", async (context) => {
  const { middleware, directory } = await harness(context);
  const dates = Array.from({ length: 8 }, (_, index) => `2099-01-${String(index + 1).padStart(2, "0")}`);
  const results = await Promise.all([
    ...dates.map((date) => request(middleware, "/api/daily-menu", {
      method: "PUT", headers: credentials, body: { date, items: [dailyItem(date)] }
    })),
    request(middleware, "/api/special-menu", { method: "PUT", headers: credentials, body: { items: [specialItem()] } })
  ]);
  assert.ok(results.every((result) => result.status === 200));
  for (const date of dates) assert.equal((await request(middleware, `/api/daily-menu?date=${date}`)).body.items[0].id, date);
  assert.deepEqual((await request(middleware, "/api/special-menu")).body.items, [specialItem()]);
  const isolated = createLocalMenuMiddleware({ storePath: join(directory, "another-store.json"), authorize });
  assert.deepEqual((await request(isolated, "/api/special-menu")).body.items, []);
  assert.deepEqual((await request(isolated, `/api/daily-menu?date=${dates[0]}`)).body.items, []);
});

test("the default authorization reuses the backend contract without making remote calls", async (context) => {
  const saved = [process.env.DAILY_MENU_ADMIN_USER, process.env.DAILY_MENU_ADMIN_PASSWORD];
  context.after(() => {
    ["DAILY_MENU_ADMIN_USER", "DAILY_MENU_ADMIN_PASSWORD"].forEach((key, index) => {
      if (saved[index] === undefined) delete process.env[key];
      else process.env[key] = saved[index];
    });
  });
  process.env.DAILY_MENU_ADMIN_USER = credentials["x-admin-user"];
  process.env.DAILY_MENU_ADMIN_PASSWORD = credentials["x-admin-password"];
  const { create } = await harness(context);
  const middleware = create({ authorize: undefined });
  assert.equal((await request(middleware, "/api/special-menu", { method: "PUT", headers: credentials, body: { items: [] } })).status, 200);
  assert.equal((await request(middleware, "/api/special-menu", { method: "PUT", body: { items: [] } })).status, 401);
  assert.deepEqual((await request(middleware, "/api/admin-auth", { method: "POST", headers: credentials })).body, { authenticated: true });
  assert.equal((await request(middleware, "/api/admin-auth", { method: "POST" })).status, 401);
});

test("local admin authentication enforces methods and injected credentials without creating a store", async (context) => {
  const { create, storePath } = await harness(context);
  const login = { "x-admin-user": `test-${randomUUID()}`, "x-admin-password": randomUUID() };
  const middleware = create({ authorize: (incoming) => Object.entries(login).every(([key, value]) => incoming.headers[key] === value) });
  const call = async (method, headers = {}) => {
    const result = await request(middleware, "/api/admin-auth", { method, headers, body: "{" });
    assert.equal(result.next, false);
    assert.equal(result.headers["Cache-Control"], "no-store");
    await assert.rejects(readFile(storePath), { code: "ENOENT" });
    return result;
  };
  for (const headers of [
    {}, { "x-admin-user": "", "x-admin-password": "" },
    { "x-admin-user": login["x-admin-user"] },
    { "x-admin-password": login["x-admin-password"] },
    { ...login, "x-admin-user": `wrong-${randomUUID()}` },
    { ...login, "x-admin-password": randomUUID() }
  ]) {
    const result = await call("POST", headers);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: "Unauthorized." });
  }
  const valid = await call("POST", login);
  assert.equal(valid.status, 200);
  assert.deepEqual(valid.body, { authenticated: true });
  const options = await call("OPTIONS");
  assert.equal(options.status, 204);
  assert.equal(options.body, undefined);
  for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD"]) {
    const result = await call(method, login);
    assert.equal(result.status, 405);
    assert.equal(result.headers.Allow, "POST, OPTIONS");
  }
});

test("local admin authentication never reads or changes an existing menu store", async (context) => {
  const { create, storePath } = await harness(context);
  const login = { "x-admin-user": `test-${randomUUID()}`, "x-admin-password": randomUUID() };
  const middleware = create({ authorize: (incoming) => Object.entries(login).every(([key, value]) => incoming.headers[key] === value) });
  await mkdir(join(storePath, ".."), { recursive: true });
  for (const contents of ["invalid JSON that must never be read", JSON.stringify({ daily: { "2099-01-01": [dailyItem()] }, special: [specialItem()] })]) {
    await writeFile(storePath, contents);
    for (const [method, headers, status] of [["POST", login, 200], ["POST", {}, 401], ["OPTIONS", {}, 204], ["DELETE", login, 405]]) {
      const result = await request(middleware, "/api/admin-auth", { method, headers, body: { items: [] } });
      assert.equal(result.status, status);
      assert.equal(result.headers["Cache-Control"], "no-store");
      assert.equal(await readFile(storePath, "utf8"), contents);
    }
  }
});
