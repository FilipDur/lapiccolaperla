import { invalidateMenuReads, readMenu } from "./menuReads.js";

export const SPECIAL_MENU_UPDATED = "special-menu-updated";
export const SPECIAL_MENU_REVISION_KEY = "la-piccola-perla-special-menu-revision";
const API_PATH = "/api/special-menu";

async function requestMenu(options = {}, onResponse) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = window.setTimeout(abort, 15000);
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  try {
    const response = await fetch(API_PATH, { ...options, signal: controller.signal });
    onResponse?.(response);
    const data = await response.json().catch(() => null);
    return { response, data };
  } catch {
    throw new Error("Spojení se nezdařilo. Zkuste to prosím znovu.");
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}

export const invalidateSpecialMenuReads = () => invalidateMenuReads(API_PATH);

export function fetchSpecialMenuItems(signal, options = {}) {
  return readMenu(API_PATH, async () => {
    const { response, data } = await requestMenu({
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("Speciální menu se nepodařilo načíst.");
    if (!Array.isArray(data?.items)) throw new Error("Speciální menu se nepodařilo načíst.");
    return data.items;
  }, { ...options, signal });
}

export async function saveSpecialMenuItems(items, authHeaders) {
  const { response, data } = await requestMenu({
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ items })
  }, (response) => {
    // The write is confirmed by HTTP status; a slow response body must not keep old GETs alive.
    if (response.ok) invalidateSpecialMenuReads();
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Přihlášení vypršelo. Přihlaste se prosím znovu.");
    if (response.status === 400) throw new Error("Vyplňte název ve všech třech jazycích a cenu.");
    throw new Error("Změnu se nepodařilo uložit na web. Zkuste to prosím znovu.");
  }
  if (!Array.isArray(data?.items)) throw new Error("Uložení se nepodařilo ověřit. Načtěte menu znovu.");
  // Broadcast only confirmed server changes; never display an unpublished local copy.
  try {
    window.localStorage.setItem(SPECIAL_MENU_REVISION_KEY, `${Date.now()}-${Math.random()}`);
  } catch {
    // Focus refresh still works when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(SPECIAL_MENU_UPDATED));
  return data.items;
}
