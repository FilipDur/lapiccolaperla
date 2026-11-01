import { routeHref } from "./routes.js";

/** Shared by browser navigation and server HTML; never mutate the base graph. */
export function getStructuredData(source, { page, language }, seo, siteUrl) {
  const data = source && typeof source === "object" ? JSON.parse(JSON.stringify(source)) : { "@context": "https://schema.org" };
  const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [];
  const previousPage = graph.find((entity) => entity["@type"] === "WebPage") || {};
  data["@graph"] = graph.filter((entity) => entity["@type"] !== "WebPage");
  const restaurant = data["@graph"].find((entity) => entity["@type"] === "Restaurant");
  if (restaurant) restaurant.menu = `${siteUrl}${routeHref("menu", language)}`;
  if (page !== "notFound" && seo.canonical) {
    data["@graph"].push({
      ...previousPage,
      "@type": "WebPage",
      "@id": `${seo.canonical}#webpage`,
      url: seo.canonical,
      name: seo.title,
      description: seo.description,
      inLanguage: (seo.locale || seo.htmlLang).replace("_", "-"),
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#restaurant` },
      mainEntity: { "@id": `${siteUrl}/#restaurant` },
    });
  }
  return data;
}
