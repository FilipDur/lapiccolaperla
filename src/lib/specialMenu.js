export const SPECIAL_MENU_UPDATED = "special-menu-updated";
export const SPECIAL_MENU_REVISION_KEY = "la-piccola-perla-special-menu-revision";
const API_PATH = "/api/special-menu";

async function requestMenu(options = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = window.setTimeout(abort, 15000);
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  try {
    const response = await fetch(API_PATH, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    return { response, data };
  } catch {
    throw new Error("Spojení se nezdařilo. Zkuste to prosím znovu.");
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}

export async function fetchSpecialMenuItems(signal) {
  const { response, data } = await requestMenu({
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal
  });
  if (!response.ok) throw new Error("Speciální menu se nepodařilo načíst.");
  if (!Array.isArray(data?.items)) throw new Error("Speciální menu se nepodařilo načíst.");
  return data.items;
}

export async function saveSpecialMenuItems(items, authHeaders) {
  const { response, data } = await requestMenu({
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ items })
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Přihlášení vypršelo. Přihlaste se prosím znovu.");
    if (response.status === 400) throw new Error("Vyplňte název a popis ve všech třech jazycích a cenu.");
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
