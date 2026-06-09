import { seededDailyMenus } from "../src/data/dailyMenuSeed.js";

const STORAGE_KEY = "la-piccola-perla:daily-menu";
const MAX_ITEMS = 12;

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const adminUser = process.env.DAILY_MENU_ADMIN_USER || "perla";
const adminPassword = process.env.DAILY_MENU_ADMIN_PASSWORD || "la perla";

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const parseMenus = (value) => {
  try {
    const parsed = value ? JSON.parse(value) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const cleanItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      id: cleanText(item.id || `${Date.now()}-${item.name || "item"}`, 120),
      name: cleanText(item.name, 120),
      description: cleanText(item.description, 260),
      price: cleanText(item.price, 40)
    }))
    .filter((item) => item.name && item.description && item.price);
};

const redisCommand = async (command) => {
  if (!redisUrl || !redisToken) {
    const error = new Error("Daily menu storage is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    const error = new Error(data.error || "Daily menu storage request failed.");
    error.statusCode = response.status || 500;
    throw error;
  }

  return data.result;
};

const readStoredMenus = async () => parseMenus(await redisCommand(["GET", STORAGE_KEY]));

const readPublicMenus = async () => {
  try {
    return {
      ...seededDailyMenus,
      ...(await readStoredMenus())
    };
  } catch (error) {
    if (error.statusCode === 503) {
      return seededDailyMenus;
    }

    throw error;
  }
};

const writeMenus = async (menus) => {
  await redisCommand(["SET", STORAGE_KEY, JSON.stringify(menus)]);
};

const hasAdminAccess = (request) =>
  request.headers["x-admin-user"] === adminUser &&
  request.headers["x-admin-password"] === adminPassword;

const sendJson = (response, status, body) => {
  response.status(status).json(body);
};

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    if (request.method === "GET") {
      const date = request.query.date;

      if (!isValidDate(date)) {
        sendJson(response, 400, { error: "Invalid date." });
        return;
      }

      const menus = await readPublicMenus();
      sendJson(response, 200, { date, items: Array.isArray(menus[date]) ? menus[date] : [] });
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      if (!hasAdminAccess(request)) {
        sendJson(response, 401, { error: "Unauthorized." });
        return;
      }

      const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
      const date = body.date;

      if (!isValidDate(date)) {
        sendJson(response, 400, { error: "Invalid date." });
        return;
      }

      const items = cleanItems(body.items);
      const menus = await readStoredMenus();

      if (items.length > 0) {
        menus[date] = items;
      } else {
        delete menus[date];
      }

      await writeMenus(menus);
      sendJson(response, 200, { date, items });
      return;
    }

    response.setHeader("Allow", "GET, PUT, POST, OPTIONS");
    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Daily menu request failed."
    });
  }
}
