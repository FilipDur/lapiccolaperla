import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

async function harness(context) {
  const credentials = { "x-admin-user": `test-${randomUUID()}`, "x-admin-password": randomUUID() };
  const environment = {
    DAILY_MENU_ADMIN_USER: credentials["x-admin-user"],
    DAILY_MENU_ADMIN_PASSWORD: credentials["x-admin-password"],
    KV_REST_API_URL: "https://menu-storage.invalid",
    KV_REST_API_TOKEN: randomUUID()
  };
  const previous = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  Object.assign(process.env, environment);
  context.mock.method(globalThis, "fetch", () => {
    assert.fail("Authentication must not contact menu storage or another remote service.");
  });
  const { default: handler } = await import(`../api/admin-auth.js?test=${randomUUID()}`);
  const request = async (method, headers = {}) => {
    const result = { status: undefined, headers: {}, body: undefined };
    const response = {
      setHeader(key, value) { result.headers[key] = value; },
      status(value) { result.status = value; return this; },
      json(value) { result.body = value; return this; },
      end() { return this; }
    };
    await handler({ method, headers, get body() { assert.fail("Authentication must not read a menu payload."); } }, response);
    assert.equal(result.headers["Cache-Control"], "no-store");
    return result;
  };
  return { credentials, request };
}

test("admin authentication rejects missing, empty and incorrect credentials", async (context) => {
  const { credentials, request } = await harness(context);
  for (const headers of [
    {},
    { "x-admin-user": "", "x-admin-password": "" },
    { "x-admin-user": credentials["x-admin-user"] },
    { "x-admin-password": credentials["x-admin-password"] },
    { ...credentials, "x-admin-user": `wrong-${randomUUID()}` },
    { ...credentials, "x-admin-password": randomUUID() }
  ]) {
    const result = await request("POST", headers);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: "Unauthorized." });
  }
});

test("admin authentication accepts configured credentials without accessing storage", async (context) => {
  const { credentials, request } = await harness(context);
  const result = await request("POST", credentials);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { authenticated: true });
});

test("admin authentication supports OPTIONS and rejects every other method", async (context) => {
  const { credentials, request } = await harness(context);
  const options = await request("OPTIONS");
  assert.equal(options.status, 204);
  assert.equal(options.body, undefined);
  for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD"]) {
    const result = await request(method, credentials);
    assert.equal(result.status, 405);
    assert.equal(result.headers.Allow, "POST, OPTIONS");
    assert.deepEqual(result.body, { error: "Method not allowed." });
  }
});
