export const restaurantRoutes = Object.freeze({
  home: "", menu: "menu", daily: "denni-menu", special: "specialni-menu",
  about: "o-nas", gallery: "galerie", contact: "kontakt", privacy: "ochrana-soukromi"
});

const hashPages = {
  "daily-menu": "daily", "special-menu": "special", reservation: "contact",
  about: "about", gallery: "gallery", menu: "menu", contact: "contact"
};

/** Resolve public URLs without browser globals; daily offers are Czech only. */
export function parseRoute(pathname = "/", hash = "") {
  let value = String(pathname || "/");
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    value = url.pathname;
    hash = hash || url.hash;
  }
  const hashIndex = value.indexOf("#");
  if (hashIndex !== -1) {
    hash = hash || value.slice(hashIndex);
    value = value.slice(0, hashIndex);
  }
  value = value.split("?")[0];
  try { value = decodeURIComponent(value); } catch { return { page: "notFound", language: "cs" }; }
  const clean = value.replace(/^\/+|\/+$/g, "");
  const legacy = /^(?:index-)?(en|it|de)(?:\.html)?$/.exec(clean);
  let language = legacy?.[1] === "de" ? "it" : legacy?.[1] || "cs";
  let parts = clean.split("/").filter(Boolean);
  if (["en", "it", "cs"].includes(parts[0])) language = parts.shift();
  let slug = legacy || ["index.html", "index-en.html", "index-it.html"].includes(clean) ? "" : parts.join("/");
  if (slug === "index.html") slug = "";
  let page = Object.entries(restaurantRoutes).find(([, path]) => path === slug)?.[0] || "notFound";
  const hashKey = String(hash).replace(/^#/, "");
  const alias = Object.hasOwn(hashPages, hashKey) ? hashPages[hashKey] : undefined;
  if (alias && page !== "notFound") page = alias;
  if (page === "daily") language = "cs";
  return { page, language };
}

export function routeHref(page = "home", language = "cs") {
  const code = ["en", "it"].includes(language) && page !== "daily" ? language : "cs";
  const slug = restaurantRoutes[page] ?? "";
  const prefix = code === "cs" ? "" : `/${code}`;
  return `${prefix}/${slug}`.replace(/\/$/, "") || "/";
}
