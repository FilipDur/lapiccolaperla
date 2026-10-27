import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createMenuBackend } from "../lib/menuBackend.js";
import { seededDailyMenus } from "../src/data/dailyMenuSeed.js";

const MAX_ITEMS = 12;
const MAX_BODY_BYTES = 64 * 1024;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Keep the production endpoint contracts without configuring or contacting Redis.
const cleanText = (value, limit) => String(value || "").trim().slice(0, limit);
const cleanDailyItems = (items) => !Array.isArray(items) ? [] : items.slice(0, MAX_ITEMS)
  .map((item) => ({
    id: cleanText(item.id || `${Date.now()}-${item.name || "item"}`, 120),
    name: cleanText(item.name, 120),
    description: cleanText(item.description, 260),
    price: cleanText(item.price, 40)
  }))
  .filter((item) => item.name && item.description && item.price);

const requiredText = (value, limit, field) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > limit) {
    throw fail(400, `${field} must contain between 1 and ${limit} characters.`);
  }
  return value.trim();
};

const validateSpecialItems = (items) => {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    throw fail(400, `Items must be an array with at most ${MAX_ITEMS} entries.`);
  }
  const ids = new Set();
  return items.map((item, index) => {
    if (!isRecord(item) || !isRecord(item.translations)) {
      throw fail(400, `Item ${index + 1} must include Czech, English and Italian text.`);
    }
    const id = item.id === undefined ? randomUUID() : requiredText(item.id, 120, "Item ID");
    if (ids.has(id)) throw fail(400, "Item IDs must be unique.");
    ids.add(id);
    const translations = {};
    for (const language of ["en", "it"]) {
      const translation = item.translations[language];
      if (!isRecord(translation)) throw fail(400, `Missing ${language} translation for item ${index + 1}.`);
      translations[language] = { name: requiredText(translation.name, 120, `${language} name`) };
    }
    return {
      id,
      name: requiredText(item.name, 120, "Czech name"),
      price: requiredText(item.price, 40, "Price"),
      translations
    };
  });
};

const readBody = async (request) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw fail(413, "Menu request is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

function createLocalStore(storePath) {
  let writes = Promise.resolve();
  const read = async () => {
    let text;
    try {
      text = await readFile(storePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return { daily: {}, special: [] };
      throw error;
    }
    const data = JSON.parse(text);
    if (!isRecord(data) || !isRecord(data.daily)) throw fail(500, "Local menu storage is invalid.");
    return data;
  };
  return {
    async read() {
      await writes;
      return read();
    },
    update(change) {
      const save = writes.then(async () => {
        const data = await read();
        const result = change(data);
        await mkdir(dirname(storePath), { recursive: true });
        const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
        try {
          await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
          await rename(temporaryPath, storePath);
        } finally {
          await rm(temporaryPath, { force: true });
        }
        return result;
      });
      writes = save.catch(() => {});
      return save;
    }
  };
}

export function createLocalMenuMiddleware({ storePath, authorize } = {}) {
  if (!storePath) throw new Error("A local menu storage path is required.");
  const store = createLocalStore(resolve(storePath));
  // Only reuse authorization; redisCommand is deliberately never accessed.
  const hasAdminAccess = authorize || createMenuBackend("Local menu").hasAdminAccess;

  return async (request, response, next) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const daily = url.pathname === "/api/daily-menu";
    const auth = url.pathname === "/api/admin-auth";
    if (!daily && !auth && url.pathname !== "/api/special-menu") return next();
    response.setHeader("Cache-Control", "no-store");
    const send = (status, body) => {
      response.statusCode = status;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(body));
    };
    try {
      if (request.method === "OPTIONS") {
        response.statusCode = 204;
        response.end();
        return;
      }
      if (auth) {
        if (request.method !== "POST") {
          response.setHeader("Allow", "POST, OPTIONS");
          return send(405, { error: "Method not allowed." });
        }
        if (!hasAdminAccess(request)) return send(401, { error: "Unauthorized." });
        return send(200, { authenticated: true });
      }
      if (request.method === "GET") {
        const date = url.searchParams.get("date");
        if (daily && !isValidDate(date)) return send(400, { error: "Invalid date." });
        const data = await store.read();
        if (daily) {
          const menus = { ...seededDailyMenus, ...data.daily };
          return send(200, { date, items: Array.isArray(menus[date]) ? menus[date] : [] });
        }
        let items;
        try { items = validateSpecialItems(data.special); } catch { items = []; }
        return send(200, { items });
      }
      if (request.method !== "PUT" && request.method !== "POST") {
        response.setHeader("Allow", "GET, PUT, POST, OPTIONS");
        return send(405, { error: "Method not allowed." });
      }
      if (!hasAdminAccess(request)) return send(401, { error: "Unauthorized." });
      const rawBody = await readBody(request);
      let body;
      try { body = JSON.parse(rawBody || (daily ? "{}" : "null")); }
      catch { throw fail(daily ? 500 : 400, "Invalid JSON body."); }
      if (daily) {
        body ||= {};
        if (!isValidDate(body.date)) return send(400, { error: "Invalid date." });
        const items = cleanDailyItems(body.items);
        await store.update((data) => {
          if (items.length) data.daily[body.date] = items;
          else delete data.daily[body.date];
        });
        return send(200, { date: body.date, items });
      }
      if (!isRecord(body)) throw fail(400, "A JSON object with items is required.");
      const items = validateSpecialItems(body.items);
      await store.update((data) => { data.special = items; });
      send(200, { items });
    } catch (error) {
      send(error.statusCode || 500, { error: error.statusCode ? error.message : "Local menu request failed." });
    }
  };
}

export function localMenuApiPlugin() {
  let storePath;
  return {
    name: "local-menu-api",
    apply: "serve",
    configResolved(config) {
      storePath = resolve(config.root, ".local/menus.json");
    },
    configureServer(server) {
      server.middlewares.use(createLocalMenuMiddleware({ storePath }));
    }
  };
}
