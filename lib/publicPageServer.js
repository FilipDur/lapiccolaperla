import { getRedirectUrl, SITE_URL } from "../src/restaurant/seo.js";
import { parseRoute } from "../src/restaurant/routes.js";
import { getRestaurantDate } from "../src/lib/restaurantDate.js";

// Only the explicit middleware parameter on this endpoint is interpreted as a
// route. A normal page's own ?url=... parameter must not become a redirect.
function publicRequestUrl(request) {
  const outer = new URL(request.url || "/", SITE_URL);
  const isEndpoint = outer.pathname === "/api/public-page";
  const forwarded = isEndpoint ? request.query?.url ?? outer.searchParams.get("url") : undefined;
  const input = forwarded ?? `${outer.pathname}${outer.search}`;
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(input)) {
    throw new Error("Invalid public URL.");
  }
  const url = new URL(input, SITE_URL);
  if (url.origin !== SITE_URL) throw new Error("Invalid public URL.");
  return url;
}

const escapeHtml = (text) => text.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

function send(response, method, status, body, contentType = "text/html; charset=utf-8") {
  response.statusCode = status;
  response.setHeader("Content-Type", contentType);
  response.end(method === "HEAD" ? undefined : body);
}

function unavailable(response, method, language = "cs") {
  const copy = {
    cs: ["Stránka je dočasně nedostupná", "Zkuste to prosím za chvíli. Rezervovat můžete na telefonu +420 224 282 537."],
    en: ["Temporarily unavailable", "Please try again shortly. To book a table, call +420 224 282 537."],
    it: ["Pagina temporaneamente non disponibile", "Riprova tra poco. Per prenotare un tavolo, chiama +420 224 282 537."]
  }[language] || ["Temporarily unavailable", "Please try again shortly."];
  response.setHeader("X-Robots-Tag", "noindex, follow");
  response.setHeader("Retry-After", "60");
  const html = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><title>${escapeHtml(copy[0])} | La Piccola Perla</title></head><body><main><h1>${escapeHtml(copy[0])}</h1><p>${escapeHtml(copy[1])}</p><a href="tel:+420224282537">+420 224 282 537</a></main></body></html>`;
  send(response, method, 503, html);
}

/** The storage and rendering dependencies are injected so SSR delivery can be
 * exercised without contacting production storage or publishing test offers. */
export function createPublicPageHandler({ loadRenderer, readTemplate, readSpecial, readDaily, now = () => new Date(), readTimeoutMs = 3000 }) {
  if (!Number.isFinite(readTimeoutMs) || readTimeoutMs <= 0) throw new RangeError("readTimeoutMs must be positive.");
  const readWithDeadline = async (read) => {
    let timeout;
    try {
      return await Promise.race([
        Promise.resolve().then(read),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error("Published menu read timed out.")), readTimeoutMs);
        })
      ]);
    } finally {
      clearTimeout(timeout);
    }
  };
  return async function publicPageHandler(request, response) {
    const method = request.method || "GET";
    response.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(method)) {
      response.setHeader("Allow", "GET, HEAD");
      response.setHeader("X-Robots-Tag", "noindex");
      send(response, method, 405, "Method not allowed.", "text/plain; charset=utf-8");
      return;
    }
    let url;
    try {
      url = publicRequestUrl(request);
    } catch {
      response.setHeader("X-Robots-Tag", "noindex");
      send(response, method, 400, "Invalid public URL.", "text/plain; charset=utf-8");
      return;
    }
    const route = parseRoute(url.pathname);
    const redirect = getRedirectUrl(url);
    if (redirect) {
      response.setHeader("Location", redirect);
      send(response, method, 308, "");
      return;
    }
    try {
      const renderer = await loadRenderer();
      if (url.pathname === "/sitemap.xml") {
        const specialMenuItems = await readWithDeadline(readSpecial);
        send(response, method, 200, renderer.renderSitemap({ hasSpecialMenu: specialMenuItems.length > 0 }), "application/xml; charset=utf-8");
        return;
      }
      const today = getRestaurantDate(now());
      const initialData = { pathname: url.pathname, page: route.page, language: route.language, today, specialMenuItems: [], dailyMenuItems: [] };
      if (route.page !== "notFound") {
        // A broken live offer must not masquerade as an intentionally empty one
        // on its own landing page. Static content stays available during an
        // unrelated menu-storage outage; its transient fallback is never cached.
        const needsDaily = route.language === "cs" && ["home", "daily"].includes(route.page);
        const [special, daily] = await Promise.allSettled([
          readWithDeadline(readSpecial),
          needsDaily ? readWithDeadline(() => readDaily(today)) : Promise.resolve([])
        ]);
        if (special.status === "fulfilled") initialData.specialMenuItems = special.value;
        else if (route.page === "special") throw special.reason;
        if (daily.status === "fulfilled") initialData.dailyMenuItems = daily.value;
        else if (route.page === "daily") throw daily.reason;
      }
      const template = await readTemplate(route.language);
      const html = renderer.renderDocument(template, route, initialData);
      if (route.page === "notFound") response.setHeader("X-Robots-Tag", "noindex, follow");
      send(response, method, route.page === "notFound" ? 404 : 200, html);
    } catch {
      // Rendering/storage error details may contain connection information.
      // Keep them out of the public response.
      unavailable(response, method, route.language);
    }
  };
}
