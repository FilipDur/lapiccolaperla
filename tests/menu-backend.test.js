import assert from "node:assert/strict";
import test from "node:test";
import { createMenuBackend } from "../lib/menuBackend.js";

const keys = ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REDIS_URL", "STORAGE_REDIS_URL", "REDIS_URL"];
function storageEnvironment(context, values) {
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, values);
  context.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("REST request aborts within its deadline and does not retry a write", async context => {
  storageEnvironment(context, { KV_REST_API_URL: "https://storage.invalid", KV_REST_API_TOKEN: "private-token" });
  let calls = 0;
  let signal;
  context.mock.method(globalThis, "fetch", (_url, options) => {
    calls++;
    signal = options.signal;
    return new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
  });
  const backend = createMenuBackend("Test", { requestTimeoutMs: 20 });
  // A real fetch/socket keeps the event loop alive. The mocked hanging fetch
  // does not, so this bounded guard also ensures a lost abort fails the test.
  let guard;
  const started = performance.now();
  try {
    await Promise.race([
      assert.rejects(backend.redisCommand(["SET", "test-key", "test-value"]), error => error.statusCode === 503 && !error.message.includes("private-token")),
      new Promise((_, reject) => { guard = setTimeout(() => reject(new Error("REST deadline did not abort")), 500); })
    ]);
  } finally { clearTimeout(guard); }
  assert.ok(performance.now() - started < 500);
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
});

test("Redis uses finite connection/socket/command deadlines and no reconnect replay", async context => {
  storageEnvironment(context, { REDIS_URL: "redis://storage.invalid" });
  let configuration;
  let commandOptions;
  let writeCalls = 0;
  const client = {
    on() { return this; },
    async connect() { return this; },
    withCommandOptions(options) { commandOptions = options; return this; },
    async set() { writeCalls++; throw new Error("private connection details"); }
  };
  const backend = createMenuBackend("Test", { createRedisClient: options => { configuration = options; return client; } });
  await assert.rejects(backend.redisCommand(["SET", "test-key", "test-value"]), error => error.statusCode === 503 && !error.message.includes("private connection details"));
  assert.equal(configuration.socket.connectTimeout, 3000);
  assert.equal(configuration.socket.socketTimeout, 4000);
  assert.equal(configuration.socket.reconnectStrategy, false);
  assert.equal(configuration.disableOfflineQueue, true);
  assert.equal(commandOptions.timeout, 4000);
  assert.equal(writeCalls, 1);
});
