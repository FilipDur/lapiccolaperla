import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getPageSeo, publicRoutes, routeLabels, SITE_URL } from "../src/restaurant/seo.js";
import { routeHref } from "../src/restaurant/routes.js";
import { getStructuredData } from "../src/restaurant/structuredData.js";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const serializeJson = (data) => JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
export const routeFileName = (path) => path === "/" ? "index.html" : `${path.slice(1)}.html`;

export function renderRouteHtml(template, route, options = {}) {
  const { page, language } = route;
  const seo = getPageSeo(page, language, { hasSpecialMenu: Boolean(options.hasSpecialMenu) });
  let html = template.replace(/<html\b[^>]*>/i, `<html lang="${seo.htmlLang}">`)
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  const meta = (attribute, name, value) => {
    const tag = `<meta ${attribute}="${name}" content="${escapeHtml(value)}" />`;
    const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${name}["'])[^>]*>`, "i");
    html = pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
  };
  meta("name", "description", seo.description);
  ["robots", "googlebot", "bingbot", "slurp"].forEach((name) => meta("name", name, seo.robots));
  meta("property", "og:title", seo.title);
  meta("property", "og:description", seo.description);
  meta("property", "og:locale", seo.locale);
  meta("name", "twitter:title", seo.title);
  meta("name", "twitter:description", seo.description);
  html = html.replace(/\s*<link\b(?=[^>]*rel=["'](?:canonical|alternate)["'])[^>]*>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*property=["'](?:og:url|og:locale:alternate)["'])[^>]*>/gi, "");
  const links = [];
  if (seo.canonical) {
    meta("property", "og:url", seo.canonical);
    links.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`);
  }
  for (const { language: code, href } of seo.alternates) {
    links.push(`<link rel="alternate" hreflang="${code}" href="${escapeHtml(href)}" />`);
    if (code !== seo.htmlLang) links.push(`<meta property="og:locale:alternate" content="${getPageSeo(page, code).locale}" />`);
  }
  if (seo.alternates.length) links.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${routeHref(page, "cs")}" />`);
  html = html.replace("</head>", `    ${links.join("\n    ")}\n  </head>`);
  html = html.replace(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/i, (_, source) =>
    `<script type="application/ld+json">${serializeJson(getStructuredData(JSON.parse(source), route, seo, SITE_URL))}</script>`);
  if (typeof options.markup === "string") {
    // Serialize public data only. Escaping '<' prevents script-tag injection.
    const bootstrap = serializeJson({ initialData: options.initialData || {} });
    html = html.replace(/<div id="root">[\s\S]*?<\/div><!--perla-root-end-->|<div id="root"><\/div>/, () => `<div id="root">${options.markup}</div><!--perla-root-end-->`);
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, "")
      .replace(/<script id="perla-initial-data"[^>]*>[\s\S]*?<\/script>/, "");
    return html.replace("</body>", () => `<script id="perla-initial-data" type="application/json">${bootstrap}</script>\n</body>`);
  }
  const labels = routeLabels[seo.htmlLang];
  const navigation = ["home", "about", "menu", ...(seo.htmlLang === "cs" ? ["daily"] : []), "gallery", "contact", "privacy"]
    .map((key) => `<a href="${routeHref(key, seo.htmlLang)}">${escapeHtml(labels[key])}</a>`).join(" · ");
  const fallback = `<noscript><main><h1>${escapeHtml(seo.title)}</h1><p>${escapeHtml(seo.description)}</p><p>La Piccola Perla · Perlová 412/1, Praha 1 · 11:00–23:00</p><p><a href="tel:+420224282537">+420 224 282 537</a> · <a href="https://la-piccola-perla.choiceqr.com/takeaway/booking">${escapeHtml(labels.reservation)}</a></p><nav>${navigation}</nav></main></noscript>`;
  return html.replace(/<noscript>[\s\S]*?<\/noscript>/i, fallback);
}

export function renderSitemap({ hasSpecialMenu = false } = {}) {
  const urls = publicRoutes.filter(({ page, language }) => !getPageSeo(page, language, { hasSpecialMenu }).robots.includes("noindex")).map(({ page, language, path }) => {
    const seo = getPageSeo(page, language, { hasSpecialMenu });
    const alternates = [...seo.alternates, { language: "x-default", href: `${SITE_URL}${routeHref(page, "cs")}` }];
    return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <changefreq>${page === "daily" ? "daily" : "monthly"}</changefreq>\n    ${alternates.map(({ language: code, href }) => `<xhtml:link rel="alternate" hreflang="${code}" href="${escapeHtml(href)}" />`).join("\n    ")}\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export async function writePublicPages(outputDirectory, renderDocument = renderRouteHtml) {
  const templates = Object.fromEntries(await Promise.all(["cs", "en", "it"].map(async (language) => [language, await readFile(resolve(outputDirectory, language === "cs" ? "index.html" : `${language}.html`), "utf8")])));
  for (const route of publicRoutes) {
    const target = resolve(outputDirectory, routeFileName(route.path));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, renderDocument(templates[route.language], route), "utf8");
  }
  await writeFile(resolve(outputDirectory, "404.html"), renderDocument(templates.cs, { page: "notFound", language: "cs" }), "utf8");
  await writeFile(resolve(outputDirectory, "sitemap.xml"), renderSitemap(), "utf8");
}
