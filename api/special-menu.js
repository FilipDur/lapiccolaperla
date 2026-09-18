import { randomUUID } from "node:crypto";
import { createMenuBackend } from "../lib/menuBackend.js";

const STORAGE_KEY = "la-piccola-perla:special-menu";
const MAX_ITEMS = 12;
const { redisCommand, hasAdminAccess } = createMenuBackend("Special menu");

const invalidPayload = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const requiredText = (value, maxLength, field) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw invalidPayload(`${field} must contain between 1 and ${maxLength} characters.`);
  }
  return value.trim();
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    throw invalidPayload(`Items must be an array with at most ${MAX_ITEMS} entries.`);
  }

  const ids = new Set();
  return items.map((item, index) => {
    if (!isRecord(item) || !isRecord(item.translations)) {
      throw invalidPayload(`Item ${index + 1} must include Czech, English and Italian text.`);
    }

    const id = item.id === undefined ? randomUUID() : requiredText(item.id, 120, "Item ID");
    if (ids.has(id)) throw invalidPayload("Item IDs must be unique.");
    ids.add(id);

    const translations = {};
    for (const language of ["en", "it"]) {
      const translation = item.translations[language];
      if (!isRecord(translation)) throw invalidPayload(`Missing ${language} translation for item ${index + 1}.`);
      translations[language] = {
        name: requiredText(translation.name, 120, `${language} name`)
      };
    }

    return {
      id,
      name: requiredText(item.name, 120, "Czech name"),
      price: requiredText(item.price, 40, "Price"),
      translations
    };
  });
};

const readItems = async () => {
  let stored;
  try {
    stored = await redisCommand(["GET", STORAGE_KEY]);
  } catch (error) {
    if (error.code === "MENU_STORAGE_NOT_CONFIGURED") return [];
    throw error;
  }

  if (!stored) return [];
  try {
    // Incomplete or corrupt stored data must never publish a partial menu.
    // Normalization also omits legacy descriptions without rewriting stored data.
    return validateItems(JSON.parse(stored));
  } catch {
    return [];
  }
};

const parseBody = (body) => {
  let parsed = body;
  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      throw invalidPayload("Invalid JSON body.");
    }
  }
  if (!isRecord(parsed)) throw invalidPayload("A JSON object with items is required.");
  return parsed;
};

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    if (request.method === "GET") {
      response.status(200).json({ items: await readItems() });
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      if (!hasAdminAccess(request)) {
        response.status(401).json({ error: "Unauthorized." });
        return;
      }

      const items = validateItems(parseBody(request.body).items);
      await redisCommand(["SET", STORAGE_KEY, JSON.stringify(items)]);
      response.status(200).json({ items });
      return;
    }

    response.setHeader("Allow", "GET, PUT, POST, OPTIONS");
    response.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    response.status(error.statusCode || 500).json({ error: error.message || "Special menu request failed." });
  }
}
