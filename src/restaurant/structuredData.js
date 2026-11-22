import { routeHref } from "./routes.js";
import { newYearCopy, newYearDate, newYearMenuPrice } from "./newYearCopy.js";

/** Shared by browser navigation and server HTML; never mutate the base graph. */
export function getStructuredData(source, { page, language }, seo, siteUrl) {
  const data = source && typeof source === "object" ? JSON.parse(JSON.stringify(source)) : { "@context": "https://schema.org" };
  const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [];
  const previousPage = graph.find((entity) => entity["@type"] === "WebPage") || {};
  data["@graph"] = graph.filter((entity) => entity["@type"] !== "WebPage" && entity["@type"] !== "Event");
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
  // The New Year's Eve dinner as an Event, so Google can show the date and price
  // for "silvestr praha restaurace" / "new years eve dinner prague" queries.
  if (page === "newYear" && seo.canonical) {
    data["@graph"].push({
      "@type": "Event",
      "@id": `${seo.canonical}#event`,
      name: (newYearCopy[language] || newYearCopy.cs).eventName,
      description: seo.description,
      startDate: newYearDate,
      endDate: newYearDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      inLanguage: (seo.locale || seo.htmlLang).replace("_", "-"),
      url: seo.canonical,
      image: [`${siteUrl}/images/capodanno-pour.webp`],
      location: {
        "@type": "Restaurant",
        "@id": `${siteUrl}/#restaurant`,
        name: "La Piccola Perla",
        address: { "@type": "PostalAddress", streetAddress: "Perlová 412/1", addressLocality: "Praha 1", postalCode: "110 00", addressCountry: "CZ" },
      },
      organizer: { "@type": "Organization", name: "La Piccola Perla", url: siteUrl },
      offers: {
        "@type": "Offer",
        price: newYearMenuPrice,
        priceCurrency: "CZK",
        url: seo.canonical,
      },
    });
  }
  return data;
}
