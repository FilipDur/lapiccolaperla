import assert from "node:assert/strict";
import test from "node:test";
import { invalidateDailyMenuReads, readDailyMenuItems, writeDailyMenuItems } from "../src/lib/dailyMenu.js";
import { fetchSpecialMenuItems, invalidateSpecialMenuReads, saveSpecialMenuItems } from "../src/lib/specialMenu.js";

const tick = () => new Promise((resolve) => setImmediate(resolve));
const auth = { "X-Admin-User": "test-admin", "X-Admin-Password": "test-password" };
const item = (name) => [{ id: name, name }];

function harness(context) {
  const requests = [];
  const events = [];
  const timers = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    setTimeout: (callback, delay) => {
      const timer = setTimeout(callback, delay);
      timers.set(timer, callback);
      return timer;
    },
    clearTimeout: (timer) => { timers.delete(timer); clearTimeout(timer); },
    localStorage: { setItem: () => {} },
    dispatchEvent: (event) => events.push(event.type)
  };
  context.after(() => {
    for (const timer of timers.keys()) clearTimeout(timer);
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  context.mock.method(globalThis, "fetch", (url, options = {}) => {
    assert.ok(url.startsWith("/api/"), "tests must never reach an external service");
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    requests.push({
      url, options, reject,
      respond: (json, status = 200) => resolve({ ok: status < 400, status, json }),
      finish: (items, status = 200) => resolve({ ok: status < 400, status, json: async () => ({ items }) })
    });
    return promise;
  });
  return { requests, events, expireTimeouts: () => { for (const callback of timers.values()) callback(); } };
}

test("concurrent daily reads share one GET; the next completed read is always fresh", async (context) => {
  const { requests } = harness(context);
  const reads = Array.from({ length: 4 }, () => readDailyMenuItems("2099-01-01"));
  await tick();
  assert.equal(requests.length, 1);
  requests[0].finish(item("old"));
  assert.deepEqual(await Promise.all(reads), Array(4).fill(item("old")));
  const next = readDailyMenuItems("2099-01-01");
  await tick();
  assert.equal(requests.length, 2);
  requests[1].finish(item("new"));
  assert.deepEqual(await next, item("new"));
});

test("daily dates, public/admin readers and different credentials never share requests", async (context) => {
  const { requests } = harness(context);
  const reads = [
    readDailyMenuItems("2099-02-01"),
    readDailyMenuItems("2099-02-02"),
    readDailyMenuItems("2099-02-01", { scope: "admin", authHeaders: auth }),
    readDailyMenuItems("2099-02-01", { scope: "admin", authHeaders: { ...auth, "X-Admin-Password": "other" } }),
    readDailyMenuItems("2099-02-01", { scope: "admin", authHeaders: { "x-admin-password": "test-password", "x-admin-user": "test-admin" } })
  ];
  await tick();
  assert.equal(requests.length, 4);
  requests.forEach((request, index) => {
    assert.deepEqual(request.options.headers, { Accept: "application/json" }, "identity must not leak into public GET headers");
    request.finish(item(String(index)));
  });
  assert.deepEqual(await Promise.all(reads), [item("0"), item("1"), item("2"), item("3"), item("2")]);
});

test("aborting one special-menu subscriber leaves the shared GET and other readers intact", async (context) => {
  const { requests } = harness(context);
  const abandoned = new AbortController();
  const active = new AbortController();
  const first = fetchSpecialMenuItems(abandoned.signal);
  const firstRejected = assert.rejects(first, { name: "AbortError" });
  const second = fetchSpecialMenuItems(active.signal);
  await tick();
  abandoned.abort();
  await firstRejected;
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.signal.aborted, false);
  assert.equal(requests[0].options.cache, "no-store");
  requests[0].finish(item("current"));
  assert.deepEqual(await second, item("current"));
  await assert.rejects(fetchSpecialMenuItems(abandoned.signal), { name: "AbortError" });
  assert.equal(requests.length, 1);
});

test("special-menu failures are shared only while pending and a later read retries immediately", async (context) => {
  const { requests } = harness(context);
  const first = assert.rejects(fetchSpecialMenuItems(), /načíst/);
  const second = assert.rejects(fetchSpecialMenuItems(), /načíst/);
  await tick();
  assert.equal(requests.length, 1);
  requests[0].finish([], 503);
  await Promise.all([first, second]);
  const retry = fetchSpecialMenuItems();
  await tick();
  assert.equal(requests.length, 2);
  requests[1].finish(item("recovered"));
  assert.deepEqual(await retry, item("recovered"));
});

test("a stalled daily GET times out and does not trap later refreshes in the old promise", async (context) => {
  const { requests, expireTimeouts } = harness(context);
  const stalled = assert.rejects(readDailyMenuItems("2099-06-01"), { name: "AbortError" });
  await tick();
  expireTimeouts();
  await stalled;
  const retry = readDailyMenuItems("2099-06-01");
  await tick();
  assert.equal(requests.length, 2);
  requests[1].finish(item("recovered"));
  assert.deepEqual(await retry, item("recovered"));
});

test("confirmed special-menu writes replace pending old reads without waiting for them", async (context) => {
  const { requests, events } = harness(context);
  const old = fetchSpecialMenuItems();
  await tick();
  const save = saveSpecialMenuItems(item("saved"), auth);
  requests[1].finish(item("saved"));
  assert.deepEqual(await save, item("saved"));
  assert.deepEqual(events, ["special-menu-updated"]);
  await tick();
  assert.equal(requests.length, 3, "old readers must start a fresh GET after the write");
  requests[0].reject(new Error("obsolete request failed late"));
  const refreshed = fetchSpecialMenuItems();
  await tick();
  assert.equal(requests.length, 3, "late cleanup must not remove the replacement GET");
  requests[2].finish(item("saved"));
  assert.deepEqual(await old, item("saved"));
  assert.deepEqual(await refreshed, item("saved"));
});

test("a daily write invalidates all identities for that date, not another date", async (context) => {
  const { requests } = harness(context);
  const publicRead = readDailyMenuItems("2099-03-01");
  const adminRead = readDailyMenuItems("2099-03-01", { scope: "admin", authHeaders: auth });
  const otherDate = readDailyMenuItems("2099-03-02");
  await tick();
  const save = writeDailyMenuItems("2099-03-01", item("saved"), auth);
  assert.equal(requests[3].options.method, "PUT");
  assert.equal(requests[3].options.headers["X-Admin-Password"], "test-password");
  requests[3].finish(item("saved"));
  await save;
  await tick();
  assert.equal(requests.length, 6);
  requests[0].finish(item("stale public"));
  requests[1].finish(item("stale admin"));
  requests[2].finish(item("other date"));
  requests[4].finish(item("saved"));
  requests[5].finish(item("saved"));
  assert.deepEqual(await publicRead, item("saved"));
  assert.deepEqual(await adminRead, item("saved"));
  assert.deepEqual(await otherDate, item("other date"));
});

test("failed writes neither publish a revision nor turn pending reads into draft data", async (context) => {
  const { requests, events } = harness(context);
  const special = fetchSpecialMenuItems();
  const daily = readDailyMenuItems("2099-04-01");
  await tick();
  const saveSpecial = assert.rejects(saveSpecialMenuItems(item("draft"), auth), /Přihlášení/);
  const saveDaily = assert.rejects(writeDailyMenuItems("2099-04-01", item("draft"), auth), /save failed/);
  requests[2].finish([], 401);
  requests[3].finish([], 401);
  await Promise.all([saveSpecial, saveDaily]);
  const sameSpecial = fetchSpecialMenuItems();
  const sameDaily = readDailyMenuItems("2099-04-01");
  await tick();
  assert.equal(requests.length, 4);
  assert.deepEqual(events, []);
  requests[0].finish(item("published"));
  requests[1].finish(item("published"));
  for (const read of [special, daily, sameSpecial, sameDaily]) assert.deepEqual(await read, item("published"));
});

test("cross-tab revision invalidation discards late reads and shares the replacement request", async (context) => {
  const { requests } = harness(context);
  const special = fetchSpecialMenuItems();
  const daily = readDailyMenuItems("2099-05-01");
  await tick();
  invalidateSpecialMenuReads();
  invalidateDailyMenuReads("2099-05-01");
  const nextSpecial = fetchSpecialMenuItems();
  const nextDaily = readDailyMenuItems("2099-05-01");
  await tick();
  assert.equal(requests.length, 4);
  requests[2].finish(item("updated"));
  requests[3].finish(item("updated"));
  for (const read of [special, daily, nextSpecial, nextDaily]) assert.deepEqual(await read, item("updated"));
  requests[0].finish(item("outdated"));
  requests[1].finish(item("outdated"));
  await tick();
  const after = fetchSpecialMenuItems();
  await tick();
  assert.equal(requests.length, 5);
  requests[4].finish(item("latest"));
  assert.deepEqual(await after, item("latest"));
});

test("a confirmed special-menu HTTP write invalidates reads before a slow response body finishes", async (context) => {
  const { requests, events } = harness(context);
  const pending = fetchSpecialMenuItems();
  await tick();
  const save = saveSpecialMenuItems(item("saved"), auth);
  let finishBody;
  requests[1].respond(() => new Promise((resolve) => { finishBody = resolve; }));
  await tick();
  assert.equal(requests.length, 3, "a confirmed write must refresh readers without waiting for JSON");
  assert.deepEqual(events, [], "the save notification still waits for a verified response body");
  requests[0].finish(item("obsolete"));
  requests[2].finish(item("saved"));
  assert.deepEqual(await pending, item("saved"));
  finishBody({ items: item("saved") });
  assert.deepEqual(await save, item("saved"));
  assert.deepEqual(events, ["special-menu-updated"]);
});

test("a daily write with invalid JSON still invalidates reads after HTTP success", async (context) => {
  const { requests } = harness(context);
  const pending = readDailyMenuItems("2099-07-01");
  await tick();
  const save = assert.rejects(writeDailyMenuItems("2099-07-01", item("saved"), auth), /invalid JSON/);
  requests[1].respond(async () => { throw new SyntaxError("invalid JSON"); });
  await save;
  await tick();
  assert.equal(requests.length, 3);
  requests[0].finish(item("obsolete"));
  requests[2].finish(item("saved"));
  assert.deepEqual(await pending, item("saved"));
});

test("repeated revisions and an aborted subscriber cannot publish either superseded response", async (context) => {
  const { requests } = harness(context);
  const abandoned = new AbortController();
  const cancelled = assert.rejects(fetchSpecialMenuItems(abandoned.signal), { name: "AbortError" });
  const active = fetchSpecialMenuItems();
  await tick();
  invalidateSpecialMenuReads();
  await tick();
  abandoned.abort();
  await cancelled;
  invalidateSpecialMenuReads();
  const latest = fetchSpecialMenuItems();
  await tick();
  assert.equal(requests.length, 3);
  requests[2].finish(item("last revision"));
  assert.deepEqual(await active, item("last revision"));
  assert.deepEqual(await latest, item("last revision"));
  requests[1].finish(item("middle revision"));
  requests[0].reject(new Error("first revision failed late"));
  await tick();
});

test("special-menu admin identities stay separate and a timed-out read can retry", async (context) => {
  const { requests, expireTimeouts } = harness(context);
  const reads = [
    fetchSpecialMenuItems(),
    fetchSpecialMenuItems(undefined, { scope: "admin", authHeaders: auth }),
    fetchSpecialMenuItems(undefined, { scope: "admin", authHeaders: { ...auth, "X-Admin-User": "other-admin" } })
  ].map((promise) => assert.rejects(promise, /Spojení/));
  await tick();
  assert.equal(requests.length, 3);
  requests.forEach((request) => assert.deepEqual(request.options.headers, { Accept: "application/json" }));
  expireTimeouts();
  await Promise.all(reads);
  const retry = fetchSpecialMenuItems();
  await tick();
  assert.equal(requests.length, 4);
  requests[3].finish(item("recovered"));
  assert.deepEqual(await retry, item("recovered"));
});

test("out-of-order reads across a date boundary remain attached to their requested date", async (context) => {
  const { requests } = harness(context);
  const beforeMidnight = readDailyMenuItems("2099-12-31");
  const afterMidnight = readDailyMenuItems("2100-01-01");
  await tick();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "/api/daily-menu?date=2099-12-31");
  assert.equal(requests[1].url, "/api/daily-menu?date=2100-01-01");
  requests[1].finish(item("next day"));
  requests[0].finish(item("previous day"));
  assert.deepEqual(await afterMidnight, item("next day"));
  assert.deepEqual(await beforeMidnight, item("previous day"));
});

test("focus invalidation starts fresh GETs while concurrent readers join the new generation", async (context) => {
  const { requests } = harness(context);
  const oldSpecial = fetchSpecialMenuItems();
  const oldDaily = readDailyMenuItems("2100-02-01");
  await tick();
  // The public focus handlers explicitly invalidate before refreshing.
  invalidateSpecialMenuReads();
  invalidateDailyMenuReads("2100-02-01");
  const focusSpecial = fetchSpecialMenuItems();
  const focusDaily = readDailyMenuItems("2100-02-01");
  const concurrentSpecial = fetchSpecialMenuItems();
  const concurrentDaily = readDailyMenuItems("2100-02-01");
  await tick();
  assert.equal(requests.length, 4, "focus must create exactly one new GET per resource");
  requests[0].finish(item("before focus"));
  requests[1].finish(item("before focus"));
  requests[2].finish(item("after focus"));
  requests[3].finish(item("after focus"));
  for (const read of [oldSpecial, oldDaily, focusSpecial, focusDaily, concurrentSpecial, concurrentDaily]) {
    assert.deepEqual(await read, item("after focus"));
  }
});
