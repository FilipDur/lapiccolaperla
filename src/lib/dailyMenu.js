import { invalidateMenuReads, readMenu } from "./menuReads.js";

const API_PATH = "/api/daily-menu";
export const DAILY_MENU_REVISION_KEY = "la-piccola-perla-daily-menu-revision";
const resourceForDate = (date) => `${API_PATH}?date=${encodeURIComponent(date)}`;

export const invalidateDailyMenuReads = (date) => invalidateMenuReads(resourceForDate(date));

export function readDailyMenuItems(date, options) {
  const resource = resourceForDate(date);
  return readMenu(resource, async () => {
    const controller = new AbortController();
    // A stalled shared GET must not prevent subsequent focus/poll refreshes forever.
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(resource, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error("Daily menu API is not available.");
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } finally {
      window.clearTimeout(timeout);
    }
  }, options);
}

export async function writeDailyMenuItems(date, items, authHeaders) {
  const response = await fetch(API_PATH, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ date, items })
  });
  if (!response.ok) throw new Error("Daily menu API save failed.");
  // Invalidate as soon as the server confirms the write, even if JSON parsing fails.
  invalidateDailyMenuReads(date);
  const data = await response.json();
  return Array.isArray(data.items) ? data.items : items;
}
