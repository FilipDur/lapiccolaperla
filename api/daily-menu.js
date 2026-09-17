import { createMenuBackend } from "../lib/menuBackend.js";
import { seededDailyMenus } from "../src/data/dailyMenuSeed.js";

const STORAGE_KEY = "la-piccola-perla:daily-menu";
const MAX_ITEMS = 12;

const { redisCommand, hasAdminAccess } = createMenuBackend("Daily menu");

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
