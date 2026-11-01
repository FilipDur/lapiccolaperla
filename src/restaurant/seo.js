import { restaurantRoutes, parseRoute, routeHref } from './routes.js';
import { getStructuredData } from './structuredData.js';
export const SITE_URL = 'https://lapiccolaperla.cz';
export const publicLanguages = ['cs', 'en', 'it'];
export const routeLabels = {
  cs: { home: "Úvod", about: "O nás", menu: "Jídelní lístek", daily: "Denní menu", gallery: "Galerie", reservation: "Rezervace", contact: "Kontakt", special: "Speciální nabídka", privacy: "Ochrana soukromí", notFound: "Stránka nenalezena" },
  en: { home: "Home", about: "Our story", menu: "Menu", daily: "Lunch menu", gallery: "Gallery", reservation: "Reservations", contact: "Contact", special: "Special menu", privacy: "Privacy", notFound: "Page not found" },
  it: { home: "Home", about: "Il ristorante", menu: "Menù", daily: "Menù del pranzo", gallery: "Galleria", reservation: "Prenotazioni", contact: "Contatti", special: "Specialità", privacy: "Informativa sulla privacy", notFound: "Pagina non trovata" }
};

const homeTitles = {
  cs: "Italská restaurace Praha 1 | La Piccola Perla",
  en: "Italian Restaurant in Prague | La Piccola Perla",
  it: "Ristorante italiano a Praga | La Piccola Perla"
};

const pageTitles = {
  cs: { menu: "Jídelní lístek a ceny v Praze 1", daily: "Denní menu Praha 1", reservation: "Rezervace stolu v Praze 1", contact: "Kontakt a cesta do restaurace v Praze 1", special: "Speciální menu v Praze 1" },
  en: { menu: "Italian Menu and Prices in Prague 1", reservation: "Book a Table in Prague 1", contact: "Contact and Directions in Prague 1", special: "Special Menu in Prague 1" },
  it: { menu: "Menù italiano e prezzi a Praga 1", reservation: "Prenota un tavolo a Praga 1", contact: "Contatti e indicazioni a Praga 1", special: "Menù speciale a Praga 1" }
};

const descriptions = {
  cs: {
    home: "Italská kuchyně v Perlové ulici v centru Prahy. Objevte naši pastu, pizzu, mořské plody a vína. Prohlédněte si menu a rezervujte si stůl.",
    about: "Poznejte La Piccola Perla, italskou restauraci v pražském Starém Městě. Náš příběh, kuchyně a místo pro společné chvíle u stolu.",
    menu: "Jídelní a nápojový lístek La Piccola Perla v Praze 1 s cenami: pasta, pizza, ryby, maso, dezerty a italská vína. Vyberte si a rezervujte stůl.",
    daily: "Dnešní polední nabídka La Piccola Perla v Praze 1. Denní menu podáváme od pondělí do pátku od 11:00 do 14:30.",
    gallery: "Prohlédněte si fotografie interiéru, italských jídel a atmosféry restaurace La Piccola Perla v Perlové ulici v Praze.",
    reservation: "Rezervujte si stůl v italské restauraci La Piccola Perla v Perlové ulici v Praze 1. Online rezervace nebo telefon +420 224 282 537, denně 11:00–23:00.",
    contact: "Najdete nás na adrese Perlová 412/1, Praha 1. Telefon +420 224 282 537, otevírací doba denně 11:00–23:00. Mapa a kontaktní údaje.",
    special: "Aktuální speciální nabídka italské restaurace La Piccola Perla v Praze 1. Sezonní speciality s cenami doplňující naše stálé menu.",
    privacy: "Informace o ochraně soukromí na webu La Piccola Perla: provozovatel, údaje návštěvníků, místní úložiště, externí služby a kontakt pro dotazy.",
    notFound: "Tuto stránku jsme nenašli. Prohlédněte si menu, rezervujte stůl nebo navštivte úvodní stránku La Piccola Perla."
  },
  en: {
    home: "Italian food on Perlova Street in central Prague. Discover pasta, pizza, seafood and Italian wines. Explore our menu and book your table.",
    about: "Meet La Piccola Perla, an Italian restaurant in Prague Old Town. Discover our story, our food and a place to enjoy time around the table.",
    menu: "Explore the food and drinks menu with prices at La Piccola Perla in Prague 1: pasta, pizza, seafood, desserts and Italian wines. Book your table online.",
    gallery: "Explore photographs of our restaurant, Italian dishes and the atmosphere at La Piccola Perla on Perlova Street in Prague.",
    reservation: "Book a table at La Piccola Perla, an Italian restaurant on Perlova Street in Prague 1. Reserve online or call +420 224 282 537. Open daily 11:00–23:00.",
    contact: "Find La Piccola Perla at Perlova 412/1, Prague 1. Call +420 224 282 537. Open every day 11:00–23:00. Directions and contact details.",
    special: "Discover the current special menu at La Piccola Perla in Prague. Seasonal Italian dishes with prices, alongside our regular menu.",
    privacy: "Privacy information for the La Piccola Perla website: the operator, visitor data, browser storage, external services and contact details for enquiries.",
    notFound: "We could not find this page. Explore the menu, book a table or visit the La Piccola Perla home page."
  },
  it: {
    home: "Cucina italiana in via Perlová, nel centro di Praga. Scopri pasta, pizza, pesce e vini italiani. Consulta il menù e prenota un tavolo.",
    about: "Conosci La Piccola Perla, ristorante italiano nel centro storico di Praga. La nostra storia, la cucina e il piacere di stare a tavola.",
    menu: "Consulta il menù con prezzi di La Piccola Perla a Praga 1: pasta, pizza, pesce, carne, dolci, vini italiani e bevande. Scegli e prenota un tavolo.",
    gallery: "Guarda le fotografie del ristorante, dei piatti italiani e dell’atmosfera di La Piccola Perla in via Perlová a Praga.",
    reservation: "Prenota un tavolo al ristorante italiano La Piccola Perla in via Perlová, Praga 1. Online o al +420 224 282 537. Aperto ogni giorno dalle 11:00 alle 23:00.",
    contact: "La Piccola Perla si trova in Perlová 412/1, Praga 1. Telefono +420 224 282 537. Aperto ogni giorno 11:00–23:00. Mappa e contatti.",
    special: "Scopri le specialità del momento di La Piccola Perla a Praga. Piatti italiani stagionali con prezzi, accanto al nostro menù abituale.",
    privacy: "Informazioni sulla privacy del sito La Piccola Perla: gestore, dati dei visitatori, memoria del browser, servizi esterni e contatti per le richieste.",
    notFound: "Questa pagina non è stata trovata. Consulta il menù, prenota un tavolo o visita la pagina iniziale di La Piccola Perla."
  }
};


export const publicRoutes = publicLanguages.flatMap(language => Object.keys(restaurantRoutes)
  .filter(page => language === 'cs' || page !== 'daily')
  .map(page => ({page, language, path: routeHref(page, language)})));

export function getRedirectUrl(input) {
  const original = input instanceof URL ? input : new URL(input, SITE_URL);
  const url = new URL(original.href);
  const route = parseRoute(url.pathname);
  if (route.page === 'notFound') return null;
  const requestedLanguage = url.searchParams.get('lang');
  const hasLanguage = publicLanguages.includes(requestedLanguage);
  const path = routeHref(route.page, hasLanguage ? requestedLanguage : route.language);
  if (hasLanguage) url.searchParams.delete('lang');
  const target = path + url.search + url.hash;
  return target === original.pathname + original.search + original.hash ? null : target;
}

export function getPageSeo(page, language = 'cs', {hasSpecialMenu = false} = {}) {
  const locale = page === 'daily' ? 'cs' : publicLanguages.includes(language) ? language : 'cs';
  const knownPage = Object.hasOwn(restaurantRoutes, page) ? page : 'notFound';
  const path = routeHref(knownPage, locale);
  return {
    title: knownPage === 'home' ? homeTitles[locale] : (pageTitles[locale][knownPage] || routeLabels[locale][knownPage]) + ' | La Piccola Perla',
    description: descriptions[locale][knownPage], path,
    canonical: knownPage === 'notFound' ? null : SITE_URL + path,
    htmlLang: locale, locale: {cs:'cs_CZ',en:'en_US',it:'it_IT'}[locale],
    robots: knownPage === 'notFound' || (knownPage === 'special' && !hasSpecialMenu) ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    alternates: knownPage === 'notFound' ? [] : (knownPage === 'daily' ? ['cs'] : publicLanguages).map(code => ({language:code,href:SITE_URL+routeHref(knownPage,code)}))
  };
}

export function applyPageSeo(page, language, options) {
  const seo = getPageSeo(page, language, options);
  document.documentElement.lang = seo.htmlLang;
  document.title = seo.title;
  const setMeta = (attribute, key, value) => {
    let element = document.head.querySelector('meta[' + attribute + '="' + key + '"]');
    if (!element) { element = document.createElement('meta'); element.setAttribute(attribute,key); document.head.appendChild(element); }
    element.setAttribute('content', value);
  };
  for (const key of ['robots','googlebot','bingbot','slurp']) setMeta('name',key,seo.robots);
  setMeta('name','description',seo.description);
  for (const [attribute,key,value] of [
    ['property','og:title',seo.title],['property','og:description',seo.description],
    ['property','og:locale',seo.locale],
    ['name','twitter:title',seo.title],['name','twitter:description',seo.description]
  ]) setMeta(attribute,key,value);
  document.head.querySelectorAll('meta[property="og:locale:alternate"],meta[property="og:url"]').forEach(element=>element.remove());
  if (seo.canonical) setMeta('property','og:url',seo.canonical);
  for (const alternate of seo.alternates.filter(entry=>entry.language!==seo.htmlLang)) {
    const element=document.createElement('meta');
    element.setAttribute('property','og:locale:alternate');
    element.setAttribute('content',getPageSeo(page,alternate.language,options).locale);
    document.head.appendChild(element);
  }
  document.head.querySelectorAll('link[rel="canonical"],link[rel="alternate"][hreflang]').forEach(element=>element.remove());
  const addLink = attrs => { const element=document.createElement('link'); Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,value));document.head.appendChild(element); };
  if (seo.canonical) addLink({rel:'canonical',href:seo.canonical});
  for (const alternate of seo.alternates) addLink({rel:'alternate',hreflang:alternate.language,href:alternate.href});
  if (seo.alternates.length) addLink({rel:'alternate',hreflang:'x-default',href:seo.alternates.find(entry=>entry.language==='cs').href});
  const schema=document.head.querySelector('script[type="application/ld+json"]');
  if (schema) { try { schema.textContent=JSON.stringify(getStructuredData(JSON.parse(schema.textContent),{page,language:seo.htmlLang},seo,SITE_URL)); } catch {} }
}
