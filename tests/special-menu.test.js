import assert from "node:assert/strict";
import test from "node:test";

const SPECIAL_KEY = "la-piccola-perla:special-menu";
const DAILY_KEY = "la-piccola-perla:daily-menu";
const credentials = { "x-admin-user": "test-admin", "x-admin-password": "test-password" };
const environmentKeys = [
  "KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN",
  "KV_REDIS_URL", "STORAGE_REDIS_URL", "REDIS_URL", "DAILY_MENU_ADMIN_USER", "DAILY_MENU_ADMIN_PASSWORD"
];
let importNumber = 0;

const specialItem = () => ({
  id: "special-1",
  name: "Lanýžové rizoto",
  price: "390 Kč",
  translations: {
    en: { name: "Truffle risotto" },
    it: { name: "Risotto al tartufo" }
  }
});

const createHarness = async (context, { configured = true, customCredentials = true } = {}) => {
  const savedEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  for (const key of environmentKeys) delete process.env[key];
  if (configured) {
    process.env.KV_REST_API_URL = "https://redis-test.invalid";
    process.env.KV_REST_API_TOKEN = "test-token";
  }
  if (customCredentials) {
    process.env.DAILY_MENU_ADMIN_USER = credentials["x-admin-user"];
    process.env.DAILY_MENU_ADMIN_PASSWORD = credentials["x-admin-password"];
  }
  context.after(() => {
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const storage = new Map();
  const commands = [];
  context.mock.method(globalThis, "fetch", async (url, options) => {
    // Any attempted real service call fails the test before touching the network.
    assert.equal(url, "https://redis-test.invalid");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    const command = JSON.parse(options.body);
    commands.push(command);
    const [operation, key, value] = command;
    if (operation === "GET") return { ok: true, json: async () => ({ result: storage.get(key) ?? null }) };
    assert.equal(operation, "SET");
    storage.set(key, value);
    return { ok: true, json: async () => ({ result: "OK" }) };
  });

  const special = (await import(`../api/special-menu.js?test=${++importNumber}`)).default;
  const daily = (await import(`../api/daily-menu.js?test=${++importNumber}`)).default;
  const request = async (handler, method = "GET", body, headers = {}) => {
    const result = { status: undefined, headers: {}, body: undefined };
    const response = {
      setHeader: (key, value) => { result.headers[key] = value; },
      status: (value) => { result.status = value; return response; },
      json: (value) => { result.body = value; },
      end: () => {}
    };
    await handler({ method, body, headers, query: { date: "2099-01-01" } }, response);
    return result;
  };
  return { storage, commands, special, daily, request };
};

test("an empty special menu stays empty with or without configured storage", async (context) => {
  for (const configured of [true, false]) {
    await context.test(`storage configured: ${configured}`, async (child) => {
      const { request, special, commands } = await createHarness(child, { configured });
      const response = await request(special);
      assert.equal(response.status, 200);
      assert.equal(response.headers["Cache-Control"], "no-store");
      assert.deepEqual(response.body, { items: [] });
      if (!configured) {
        const save = await request(special, "PUT", { items: [specialItem()] }, credentials);
        assert.equal(save.status, 503);
        assert.equal(commands.length, 0);
      }
    });
  }
});

test("names-only special menu saves all languages, survives reload and clears independently of daily menus", async (context) => {
  const { storage, special, daily, request } = await createHarness(context);
  const dailyItems = [{ id: "daily-1", name: "Polévka", description: "Rajčatová polévka", price: "80 Kč" }];
  const dailySave = await request(daily, "PUT", { date: "2099-01-01", items: dailyItems }, credentials);
  assert.equal(dailySave.status, 200);
  const dailyStored = storage.get(DAILY_KEY);

  const items = [specialItem()];
  const save = await request(special, "PUT", JSON.stringify({ items }), credentials);
  assert.equal(save.status, 200);
  assert.deepEqual(save.body, { items });
  assert.deepEqual(JSON.parse(storage.get(SPECIAL_KEY)), items);
  assert.deepEqual((await request(special)).body, { items });
  assert.equal(storage.get(DAILY_KEY), dailyStored);
  assert.deepEqual((await request(daily)).body.items, dailyItems);

  const clear = await request(special, "POST", { items: [] }, credentials);
  assert.equal(clear.status, 200);
  assert.deepEqual((await request(special)).body, { items: [] });
  assert.equal(storage.get(DAILY_KEY), dailyStored);
});

test("legacy saved descriptions are omitted from GET without rewriting stored data", async (context) => {
  const { storage, commands, special, request } = await createHarness(context);
  const legacy = specialItem();
  legacy.description = "Rizoto s černým lanýžem a parmazánem";
  legacy.translations.en.description = "Risotto with black truffle and Parmesan";
  legacy.translations.it.description = "Risotto con tartufo nero e Parmigiano";
  const stored = JSON.stringify([legacy]);
  storage.set(SPECIAL_KEY, stored);

  const response = await request(special);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { items: [specialItem()] });
  assert.equal(storage.get(SPECIAL_KEY), stored);
  assert.deepEqual(commands, [["GET", SPECIAL_KEY]]);
});

test("legacy description fields are ignored on save and never retained in canonical storage", async (context) => {
  const { storage, special, request } = await createHarness(context);
  const legacy = specialItem();
  legacy.description = "A legacy description";
  legacy.translations.en.description = " ";
  legacy.translations.it.description = "a".repeat(261);

  const response = await request(special, "PUT", { items: [legacy] }, credentials);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { items: [specialItem()] });
  assert.deepEqual(JSON.parse(storage.get(SPECIAL_KEY)), [specialItem()]);
  assert.deepEqual((await request(special)).body, { items: [specialItem()] });
});

test("both write methods require the same administrator credentials as daily menu", async (context) => {
  const { storage, commands, special, request } = await createHarness(context);
  storage.set(SPECIAL_KEY, JSON.stringify([specialItem()]));
  for (const method of ["PUT", "POST"]) {
    for (const headers of [{}, { ...credentials, "x-admin-password": "wrong" }]) {
      assert.equal((await request(special, method, { items: [] }, headers)).status, 401);
    }
  }
  assert.equal(commands.length, 0);
  assert.deepEqual(JSON.parse(storage.get(SPECIAL_KEY)), [specialItem()]);
});

test("default administrator credentials remain compatible", async (context) => {
  const { special, request } = await createHarness(context, { customCredentials: false });
  assert.equal((await request(special, "PUT", { items: [] }, {
    "x-admin-user": "perla", "x-admin-password": "la perla"
  })).status, 200);
});

test("invalid submissions never replace the previously published menu", async (context) => {
  const { storage, commands, special, request } = await createHarness(context);
  const stored = JSON.stringify([specialItem()]);
  storage.set(SPECIAL_KEY, stored);
  const missingItalian = specialItem();
  delete missingItalian.translations.it;
  const blankEnglish = specialItem();
  blankEnglish.translations.en.name = "  ";
  const longItalian = specialItem();
  longItalian.translations.it.name = "a".repeat(121);
  const invalidBodies = [
    "{", "null", null, [], {}, { items: null }, { items: {} }, { items: [null] },
    { items: [{}] }, { items: [missingItalian] }, { items: [blankEnglish] },
    { items: [{ ...specialItem(), name: " " }] },
    { items: [{ ...specialItem(), price: { value: 390 } }] },
    { items: [{ ...specialItem(), name: "a".repeat(121) }] },
    { items: [longItalian] },
    { items: [{ ...specialItem(), price: "a".repeat(41) }] },
    { items: [specialItem(), specialItem()] },
    { items: Array.from({ length: 13 }, (_, index) => ({ ...specialItem(), id: `special-${index}` })) }
  ];
  for (const body of invalidBodies) {
    const response = await request(special, "PUT", body, credentials);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(storage.get(SPECIAL_KEY), stored);
  }
  assert.equal(commands.length, 0);
});

test("corrupt or incomplete saved data is hidden without changing stored data", async (context) => {
  const { storage, commands, special, request } = await createHarness(context);
  for (const value of ["broken", "{}", "null", '[{"name":"Incomplete"}]']) {
    storage.set(SPECIAL_KEY, value);
    assert.deepEqual((await request(special)).body, { items: [] });
    assert.equal(storage.get(SPECIAL_KEY), value);
  }
  assert.ok(commands.every(([method]) => method === "GET"));
});

test("unsupported methods are rejected and storage failures are not reported as successful saves", async (context) => {
  const { special, request, commands } = await createHarness(context);
  const options = await request(special, "OPTIONS");
  assert.equal(options.status, 204);
  const deletion = await request(special, "DELETE");
  assert.equal(deletion.status, 405);
  assert.equal(deletion.headers.Allow, "GET, PUT, POST, OPTIONS");
  assert.equal(commands.length, 0);

  context.mock.method(globalThis, "fetch", async () => ({
    ok: false, status: 503, json: async () => ({ error: "Storage unavailable" })
  }));
  assert.equal((await request(special, "PUT", { items: [specialItem()] }, credentials)).status, 503);
  assert.equal((await request(special)).status, 503);

  context.mock.method(globalThis, "fetch", async () => ({
    ok: true, status: 200, json: async () => ({ error: "ERR write failed" })
  }));
  assert.equal((await request(special, "PUT", { items: [specialItem()] }, credentials)).status, 500);
});
