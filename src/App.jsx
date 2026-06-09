import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Camera,
  ChefHat,
  Clock,
  ExternalLink,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  Phone,
  Printer,
  Save,
  ShoppingBag,
  Star,
  Trash2,
  Utensils,
  Wine,
  X
} from "lucide-react";
import { featuredPicks, menuCategories as baseMenuCategories } from "./data/menu";
import { seededDailyMenus } from "./data/dailyMenuSeed";

const imageAssets = import.meta.glob("../images/webp/**/*.webp", {
  eager: true,
  import: "default"
});

const getImage = (fileName) => imageAssets[`../images/webp/${fileName}`];
const getThumb = (fileName) => imageAssets[`../images/webp/thumbs/${fileName}`] || getImage(fileName);
const logo = getImage("Logos.webp");

const photoData = [
  { file: "_DSR0014.webp", title: "Večer u vinného baru", tone: "Interiér", featured: true },
  { file: "_DSR0003.webp", title: "Prostřený sál v Perlové", tone: "Atmosféra", featured: true },
  { file: "_DSR0022.webp", title: "Dlouhý stůl pro setkání", tone: "Rezervace", featured: true },
  { file: "_DSR0023.webp", title: "Klidný salonek", tone: "Interiér", featured: true },
  { file: "_DSR0026.webp", title: "Intimní posezení", tone: "Praha 1" },
  { file: "_DSR0048.webp", title: "Espresso a panák grappy", tone: "Po obědě" },
  { file: "_DSR0057.webp", title: "Zuppa di pesce", tone: "Specialita", featured: true },
  { file: "_DSR0076.webp", title: "Scallopina di vitello alla valdostana", tone: "Specialita" },
  { file: "_DSR0080.webp", title: "Smažené kalamáry", tone: "Mořské plody", featured: true },
  { file: "_DSR0090.webp", title: "Dezert s ovocem", tone: "Dolce" },
  { file: "1.webp", title: "Signature talíř", tone: "Kuchyně" },
  { file: "2.webp", title: "Tagliata di manzo", tone: "Maso" },
  { file: "3.webp", title: "Calamaretti alla griglia", tone: "Mořské plody" },
  { file: "4.webp", title: "Chef selection", tone: "Menu" },
  { file: "5.webp", title: "Soufflé", tone: "Dolce" },
  { file: "6.webp", title: "Výběr italských chutí", tone: "La Perla" }
].map((photo, index) => ({
  ...photo,
  id: photo.file,
  index,
  src: getImage(photo.file),
  thumbSrc: getThumb(photo.file)
}));

const languageCodes = ["cs", "en", "it"];
const SITE_URL = "https://lapiccolaperla.cz";
const SEO_IMAGE_URL = `${SITE_URL}/og-la-piccola-perla.webp`;
const LANGUAGE_PREFERENCE_KEY = "la-piccola-perla-language";

const seoByLanguage = {
  cs: {
    path: "/",
    htmlLang: "cs",
    locale: "cs_CZ",
    title: "La Piccola Perla | Italska restaurace Praha 1",
    description: "La Piccola Perla je italska restaurace v centru Prahy 1 u Staromestskeho namesti. Pasta, pizza, morske plody, vino, denni menu a online rezervace."
  },
  en: {
    path: "/en",
    htmlLang: "en",
    locale: "en_US",
    title: "La Piccola Perla | Italian Restaurant in Prague Old Town",
    description: "La Piccola Perla is an Italian restaurant in Prague 1 near Old Town Square. Pasta, pizza, seafood, wine and online table reservations."
  },
  it: {
    path: "/it",
    htmlLang: "it",
    locale: "it_IT",
    title: "La Piccola Perla | Ristorante italiano a Praga 1",
    description: "La Piccola Perla e un ristorante italiano nel centro di Praga 1 vicino alla Piazza della Citta Vecchia. Pasta, pizza, pesce, vino e prenotazioni online."
  }
};

const getCanonicalUrl = (language) => `${SITE_URL}${seoByLanguage[language].path}`;

const setMetaTag = (attribute, key, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

const setLinkTag = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
};

const applyPublicSeo = (language) => {
  const seo = seoByLanguage[language] || seoByLanguage.cs;
  const canonicalUrl = getCanonicalUrl(language);

  document.documentElement.lang = seo.htmlLang;
  document.title = seo.title;

  setMetaTag("name", "description", seo.description);
  setMetaTag("name", "robots", "index, follow, max-image-preview:large");
  setMetaTag("property", "og:title", seo.title);
  setMetaTag("property", "og:description", seo.description);
  setMetaTag("property", "og:url", canonicalUrl);
  setMetaTag("property", "og:locale", seo.locale);
  setMetaTag("property", "og:image", SEO_IMAGE_URL);
  setMetaTag("name", "twitter:title", seo.title);
  setMetaTag("name", "twitter:description", seo.description);
  setMetaTag("name", "twitter:image", SEO_IMAGE_URL);

  setLinkTag('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });
  languageCodes.forEach((code) => {
    setLinkTag(`link[rel="alternate"][hreflang="${code}"]`, {
      rel: "alternate",
      hreflang: code,
      href: getCanonicalUrl(code)
    });
  });
  setLinkTag('link[rel="alternate"][hreflang="x-default"]', {
    rel: "alternate",
    hreflang: "x-default",
    href: getCanonicalUrl("cs")
  });
};

const applyAdminSeo = () => {
  document.documentElement.lang = "cs";
  document.title = "Administrace denniho menu | La Piccola Perla";
  setMetaTag("name", "robots", "noindex, nofollow");
  setLinkTag('link[rel="canonical"]', { rel: "canonical", href: `${SITE_URL}/admin` });
};

const publicCopy = {
  cs: {
    locale: "cs-CZ",
    title: "La Piccola Perla | Italská restaurace Praha 1",
    navAria: "Hlavní navigace",
    footerAria: "Patička",
    languageAria: "Jazyk",
    openMenu: "Otevřít menu",
    closeMenu: "Zavřít menu",
    reservation: "Rezervace",
    nav: {
      daily: "Denní menu",
      about: "Příběh",
      menu: "Menu",
      gallery: "Galerie",
      contact: "Kontakt"
    },
    hero: {
      eyebrow: "Italská restaurace v srdci Starého Města",
      text: "Místo pro poctivou pastu, víno a dlouhé večeře jen pár kroků od Staroměstského náměstí. Přijďte na oběd, rande nebo večer, který má chutnat jako Itálie.",
      reserve: "Rezervovat stůl",
      menu: "Projít menu"
    },
    stats: ["hodnocení hostů", "recenzí online", "otevřeno denně", "Perlová 412/1"],
    about: {
      eyebrow: "Od roku 2012",
      title: "Italská energie v pražských uličkách",
      text: [
        "La Piccola Perla vznikla z chuti přenést do Prahy atmosféru rodinných italských podniků: živý stůl, dobré víno, voňavou omáčku a servis, který nechá večer plynout.",
        "Vaříme z italských surovin, s respektem k jednoduchosti a s důrazem na jídla, kvůli kterým se lidé rádi vracejí."
      ],
      link: "Podívat se dovnitř"
    },
    experiences: {
      eyebrow: "Proč přijít",
      title: "Večeře, která se dobře prodává sama",
      text: "Kombinace fotogenického interiéru, italských klasik a rychlé online rezervace pomáhá hostům rozhodnout se hned.",
      cards: [
        ["Ručně laděná kuchyně", "Pasta, rizota, mořské plody i pizza připravené ve stylu, který ctí italskou jednoduchost."],
        ["Víno k večeři i na večer", "Sklenky i lahve z Itálie, od lehkého prosecca až po velká červená z Toskánska."],
        ["Místo pro rande i partu", "Útulný interiér v centru Prahy, který funguje pro rychlý oběd i dlouhou večeři."]
      ]
    },
    menu: {
      eyebrow: "Menu",
      title: "Nejoblíbenější italské klasiky na jednom místě",
      text: "Vyberte kategorii a rychle najděte přesně to, kvůli čemu má smysl udělat rezervaci ještě dnes.",
      tabsAria: "Kategorie menu",
      picksAria: "Doporučení",
      allergy: "Informace o alergenech vám rádi poskytneme na vyžádání."
    },
    gallery: {
      eyebrow: "Galerie",
      title: "Fotky, které dělají chuť",
      text: "Interiér, jídla, víno i dezert. Použité jsou všechny dostupné fotografie z projektu."
    },
    reservationBlock: {
      eyebrow: "Rezervace a objednávky",
      title: "Stůl v centru Prahy za pár kliknutí",
      text: "Přijďte na italský oběd, večerní menu nebo objednejte oblíbená jídla online.",
      book: "Rezervovat stůl",
      order: "Objednat online"
    },
    contact: {
      eyebrow: "Kontakt",
      title: "Najdete nás v Perlové ulici",
      addressTitle: "Adresa",
      phoneTitle: "Telefon",
      hoursTitle: "Otevírací doba",
      address: ["Perlová 412/1, Staré Město", "110 00 Praha 1"],
      hours: ["Po-Ne", "11:00-23:00"]
    },
    footer: "© 2026 La Piccola Perla. Italská kuchyně v centru Prahy.",
    footerCredit: "Web vytvořil",
    legal: {
      operator: "Provozovatel",
      registeredOffice: "Sídlo",
      companyId: "IČO",
      vatId: "DIČ"
    },
    lightbox: {
      close: "Zavřít galerii",
      previous: "Předchozí fotka",
      next: "Další fotka"
    },
    cookieNotice: {
      text: "Pouzivame pouze technicke cookies a mistni ulozeni pro jazyk webu a denni menu. Nepouzivame reklamni ani analyticke cookies.",
      accept: "Rozumim"
    },
    photos: {}
  },
  en: {
    locale: "en-US",
    title: "La Piccola Perla | Italian Restaurant in Prague Old Town",
    navAria: "Main navigation",
    footerAria: "Footer navigation",
    languageAria: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    reservation: "Reservation",
    nav: {
      about: "Story",
      menu: "Menu",
      gallery: "Gallery",
      contact: "Contact"
    },
    hero: {
      eyebrow: "Italian restaurant in the heart of Old Town",
      text: "A place for honest pasta, Italian wine and long dinners just a few steps from Old Town Square. Come for lunch, a date or an evening that tastes like Italy.",
      reserve: "Book a table",
      menu: "Explore menu"
    },
    stats: ["guest rating", "online reviews", "open daily", "Perlova 412/1"],
    about: {
      eyebrow: "Since 2012",
      title: "Italian energy in Prague’s little streets",
      text: [
        "La Piccola Perla was born from the desire to bring the atmosphere of family-run Italian restaurants to Prague: a lively table, good wine, fragrant sauce and service that lets the evening flow.",
        "We cook with Italian ingredients, respect for simplicity and a focus on dishes guests love coming back for."
      ],
      link: "Step inside"
    },
    experiences: {
      eyebrow: "Why come",
      title: "A dinner that sells itself",
      text: "Photogenic interiors, Italian classics and quick online booking help guests decide right away.",
      cards: [
        ["Carefully tuned kitchen", "Pasta, risotto, seafood and pizza prepared in a style that respects Italian simplicity."],
        ["Wine for dinner and the evening", "Italian glasses and bottles, from light prosecco to bold Tuscan reds."],
        ["A place for dates and groups", "A cosy Prague centre interior that works for a quick lunch and a long dinner."]
      ]
    },
    menu: {
      eyebrow: "Menu",
      title: "Favourite Italian classics in one place",
      text: "Choose a category and quickly find exactly what makes a reservation worth making today.",
      tabsAria: "Menu categories",
      picksAria: "Recommended dishes",
      allergy: "Allergen information is available on request."
    },
    gallery: {
      eyebrow: "Gallery",
      title: "Photos that make you hungry",
      text: "Interior, dishes, wine and dessert. All available project photos are used."
    },
    reservationBlock: {
      eyebrow: "Reservations and orders",
      title: "A table in central Prague in a few clicks",
      text: "Come for an Italian lunch, an evening menu or order your favourite dishes online.",
      book: "Book a table",
      order: "Order online"
    },
    contact: {
      eyebrow: "Contact",
      title: "Find us on Perlova Street",
      addressTitle: "Address",
      phoneTitle: "Phone",
      hoursTitle: "Opening hours",
      address: ["Perlova 412/1, Old Town", "110 00 Prague 1"],
      hours: ["Mon-Sun", "11:00-23:00"]
    },
    footer: "© 2026 La Piccola Perla. Italian cuisine in the centre of Prague.",
    footerCredit: "Website by",
    legal: {
      operator: "Operator",
      registeredOffice: "Registered office",
      companyId: "Company ID",
      vatId: "VAT ID"
    },
    lightbox: {
      close: "Close gallery",
      previous: "Previous photo",
      next: "Next photo"
    },
    cookieNotice: {
      text: "We only use technical cookies and local storage for the site language and daily menu. We do not use advertising or analytics cookies.",
      accept: "Got it"
    },
    photos: {
      "_DSR0014.webp": ["Evening at the wine bar", "Interior"],
      "_DSR0003.webp": ["Set dining room in Perlova", "Atmosphere"],
      "_DSR0022.webp": ["Long table for gatherings", "Reservations"],
      "_DSR0023.webp": ["Quiet salon", "Interior"],
      "_DSR0026.webp": ["Intimate seating", "Prague 1"],
      "_DSR0048.webp": ["Espresso and a shot of grappa", "After lunch"],
      "_DSR0080.webp": ["Fried calamari", "Seafood"],
      "_DSR0090.webp": ["Fruit dessert", "Dolce"],
      "1.webp": ["Signature plate", "Kitchen"],
      "2.webp": ["Tagliata di manzo", "Meat"],
      "3.webp": ["Calamaretti alla griglia", "Seafood"],
      "5.webp": ["Soufflé", "Dolce"],
      "6.webp": ["Selection of Italian flavours", "La Perla"]
    }
  },
  it: {
    locale: "it-IT",
    title: "La Piccola Perla | Ristorante Italiano a Praga",
    navAria: "Navigazione principale",
    footerAria: "Navigazione del footer",
    languageAria: "Lingua",
    openMenu: "Apri menu",
    closeMenu: "Chiudi menu",
    reservation: "Prenotazione",
    nav: {
      about: "Storia",
      menu: "Menu",
      gallery: "Galleria",
      contact: "Contatti"
    },
    hero: {
      eyebrow: "Ristorante italiano nel cuore della Città Vecchia",
      text: "Un luogo per pasta sincera, vino italiano e lunghe cene a pochi passi dalla Piazza della Città Vecchia. Vieni per pranzo, per un appuntamento o per una serata che sappia d’Italia.",
      reserve: "Prenota un tavolo",
      menu: "Sfoglia il menu"
    },
    stats: ["valutazione ospiti", "recensioni online", "aperto ogni giorno", "Perlova 412/1"],
    about: {
      eyebrow: "Dal 2012",
      title: "Energia italiana nelle vie di Praga",
      text: [
        "La Piccola Perla nasce dal desiderio di portare a Praga l’atmosfera dei ristoranti italiani di famiglia: tavoli vivi, buon vino, sughi profumati e un servizio che lascia scorrere la serata.",
        "Cuciniamo con ingredienti italiani, rispetto per la semplicità e attenzione ai piatti per cui gli ospiti amano tornare."
      ],
      link: "Guarda l’interno"
    },
    experiences: {
      eyebrow: "Perché venire",
      title: "Una cena che si racconta da sola",
      text: "Interni fotogenici, classici italiani e prenotazione online veloce aiutano gli ospiti a scegliere subito.",
      cards: [
        ["Cucina curata a mano", "Pasta, risotti, frutti di mare e pizza preparati con rispetto per la semplicità italiana."],
        ["Vino per cena e per la serata", "Calici e bottiglie dall’Italia, dal prosecco leggero ai grandi rossi toscani."],
        ["Un posto per coppie e compagnie", "Un interno accogliente nel centro di Praga, perfetto per un pranzo veloce o una lunga cena."]
      ]
    },
    menu: {
      eyebrow: "Menu",
      title: "I classici italiani più amati in un solo posto",
      text: "Scegli una categoria e trova subito il piatto per cui vale la pena prenotare oggi.",
      tabsAria: "Categorie del menu",
      picksAria: "Piatti consigliati",
      allergy: "Le informazioni sugli allergeni sono disponibili su richiesta."
    },
    gallery: {
      eyebrow: "Galleria",
      title: "Foto che fanno venire fame",
      text: "Interni, piatti, vino e dolci. Sono utilizzate tutte le fotografie disponibili del progetto."
    },
    reservationBlock: {
      eyebrow: "Prenotazioni e ordini",
      title: "Un tavolo nel centro di Praga in pochi clic",
      text: "Vieni per un pranzo italiano, una cena o ordina online i tuoi piatti preferiti.",
      book: "Prenota un tavolo",
      order: "Ordina online"
    },
    contact: {
      eyebrow: "Contatti",
      title: "Ci trovi in via Perlova",
      addressTitle: "Indirizzo",
      phoneTitle: "Telefono",
      hoursTitle: "Orari di apertura",
      address: ["Perlova 412/1, Città Vecchia", "110 00 Praga 1"],
      hours: ["Lun-Dom", "11:00-23:00"]
    },
    footer: "© 2026 La Piccola Perla. Cucina italiana nel centro di Praga.",
    footerCredit: "Sito realizzato da",
    legal: {
      operator: "Gestore",
      registeredOffice: "Sede legale",
      companyId: "Numero aziendale",
      vatId: "Partita IVA"
    },
    lightbox: {
      close: "Chiudi galleria",
      previous: "Foto precedente",
      next: "Foto successiva"
    },
    cookieNotice: {
      text: "Usiamo solo cookie tecnici e archiviazione locale per la lingua del sito e il menu del giorno. Non usiamo cookie pubblicitari o analitici.",
      accept: "Ho capito"
    },
    photos: {
      "_DSR0014.webp": ["Sera al wine bar", "Interno"],
      "_DSR0003.webp": ["Sala apparecchiata in Perlova", "Atmosfera"],
      "_DSR0022.webp": ["Tavolo lungo per incontrarsi", "Prenotazioni"],
      "_DSR0023.webp": ["Saletta tranquilla", "Interno"],
      "_DSR0026.webp": ["Posti intimi", "Praga 1"],
      "_DSR0048.webp": ["Espresso e bicchierino di grappa", "Dopo pranzo"],
      "_DSR0080.webp": ["Calamari fritti", "Frutti di mare"],
      "_DSR0090.webp": ["Dessert alla frutta", "Dolce"],
      "1.webp": ["Piatto signature", "Cucina"],
      "2.webp": ["Tagliata di manzo", "Carne"],
      "3.webp": ["Calamaretti alla griglia", "Frutti di mare"],
      "5.webp": ["Soufflé", "Dolce"],
      "6.webp": ["Selezione di sapori italiani", "La Perla"]
    }
  }
};

const languageLinks = [
  { code: "cs", label: "CZ", href: "/" },
  { code: "en", label: "EN", href: "/en" },
  { code: "it", label: "IT", href: "/it" }
];

const getLanguageFromHostname = () => {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.startsWith("en.")) {
    return "en";
  }

  if (hostname.startsWith("it.")) {
    return "it";
  }

  if (hostname.startsWith("cs.")) {
    return "cs";
  }

  return null;
};

const getLanguageFromPath = () => {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "");

  if (path.includes("index-en") || path === "/en") {
    return "en";
  }

  if (path.includes("index-it") || path === "/it") {
    return "it";
  }

  if (path.includes("index-de")) {
    return "it";
  }

  return null;
};

const getStoredLanguage = () => {
  try {
    const storedLanguage = window.localStorage?.getItem(LANGUAGE_PREFERENCE_KEY);
    return languageCodes.includes(storedLanguage) ? storedLanguage : null;
  } catch {
    return null;
  }
};

const saveStoredLanguage = (language) => {
  try {
    window.localStorage?.setItem(LANGUAGE_PREFERENCE_KEY, language);
  } catch {
    // Language choice is a convenience only; navigation still works without storage.
  }
};

const getBrowserPreferredLanguage = () => {
  const primaryLanguage = (navigator.languages?.[0] || navigator.language || "").toLowerCase();

  if (primaryLanguage.startsWith("it")) {
    return "it";
  }

  if (primaryLanguage.startsWith("cs")) {
    return "cs";
  }

  return primaryLanguage ? "en" : null;
};

const isLikelyCrawler = () => /bot|crawler|spider|crawling|google|bing|yandex|duckduck|baidu|facebookexternalhit|twitterbot|linkedinbot/i.test(navigator.userAgent || "");

const getLanguageRedirectTarget = () => {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isRootPath = path === "/";

  if (!isRootPath || isLikelyCrawler() || getLanguageFromHostname() || getLanguageFromPath()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);

  if (languageCodes.includes(params.get("lang"))) {
    return null;
  }

  const preferredLanguage = getStoredLanguage() || getBrowserPreferredLanguage();

  if (!preferredLanguage || preferredLanguage === "cs") {
    return null;
  }

  return `${seoByLanguage[preferredLanguage].path}${window.location.search || ""}${window.location.hash || ""}`;
};

const getLanguageFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");
  const hostLanguage = getLanguageFromHostname();
  const pathLanguage = getLanguageFromPath();

  if (hostLanguage) {
    return hostLanguage;
  }

  if (languageCodes.includes(queryLanguage)) {
    return queryLanguage;
  }

  if (pathLanguage) {
    return pathLanguage;
  }

  return "cs";
};

const getNavItems = (language, copy) => {
  const items = language === "cs" ? [{ label: copy.nav.daily, href: "#daily-menu" }] : [];

  return [
    ...items,
    { label: copy.nav.about, href: "#about" },
    { label: copy.nav.menu, href: "#menu" },
    { label: copy.nav.gallery, href: "#gallery" },
    { label: copy.nav.contact, href: "#contact" }
  ];
};

const getExperiences = (copy) => [
  {
    icon: ChefHat,
    title: copy.experiences.cards[0][0],
    text: copy.experiences.cards[0][1],
    image: getImage("3.webp")
  },
  {
    icon: Wine,
    title: copy.experiences.cards[1][0],
    text: copy.experiences.cards[1][1],
    image: getImage("_DSR0076.webp")
  },
  {
    icon: Utensils,
    title: copy.experiences.cards[2][0],
    text: copy.experiences.cards[2][1],
    image: getImage("_DSR0023.webp")
  }
];

const getStats = (copy) => [
  { value: "4.5", label: copy.stats[0], icon: Star },
  { value: "6 000+", label: copy.stats[1], icon: Camera },
  { value: "11-23", label: copy.stats[2], icon: Clock },
  { value: "Praha 1", label: copy.stats[3], icon: MapPin }
];

const getLocalizedPhotos = (language) => {
  const copy = publicCopy[language];

  return photoData.map((photo) => {
    const translatedPhoto = copy.photos[photo.file];
    return translatedPhoto ? { ...photo, title: translatedPhoto[0], tone: translatedPhoto[1] } : photo;
  });
};

const menuLocalization = {
  en: {
    priceOnRequest: "by offer",
    categoryMeta: {
      soups: ["Soups", "Light starters"],
      salads: ["Salads", "Fresh plates"],
      starters: ["Starters", "For wine and sharing"],
      pasta: ["Pasta & risotto", "Italian classics"],
      pizza: ["Pizza", "From the oven to the table"],
      meat: ["Meat", "Italian mains"],
      seafood: ["Fish & seafood", "The sea Italian style"],
      sides: ["Sides", "For a good plate"],
      desserts: ["Desserts", "Sweet finale"],
      drinks: ["Drinks", "Coffee, soft drinks, beer"],
      wine: ["Wine", "Glasses and bottles"],
      spirits: ["Spirits", "Digestifs after dinner"]
    },
    itemDescriptions: {
      soups: ["Chicken broth", "Tomato cream soup", "Traditional vegetable soup", "Venetian bean soup", "Asparagus cream", "Fish soup"],
      salads: [
        "Mixed seasonal salad",
        "Mozzarella with tomatoes and basil",
        "Seasonal salad, tuna, egg and olives",
        "Salad with chicken breast",
        "Spinach salad with grilled salmon",
        "Marinated peppers with feta cheese",
        "Rocket with cherry tomatoes and parmesan",
        "Seasonal salad with grilled prawns"
      ],
      starters: [
        "Homemade bread with tomato, basil and garlic",
        "Toasted bread with Parma ham and mushrooms",
        "Tuna carpaccio",
        "Beef tenderloin carpaccio with rocket and pesto",
        "Parma ham with melon",
        "Veal slices with tuna sauce",
        "Burrata with rocket and tomatoes",
        "Mixed Italian cured meats platter",
        "Mixed Italian cheese platter",
        "Large selection of Italian appetizers"
      ],
      pasta: [
        "Garlic, olive oil and chilli",
        "Parmesan, egg and Italian bacon",
        "Basil pesto",
        "With vongole clams",
        "Bacon, peppers, onion and tomatoes",
        "Seafood",
        "Pork tenderloin, bacon and basil pesto",
        "Meat sauce",
        "Parma ham, porcini and cream",
        "Mushrooms, peas, ham, cream and tomatoes",
        "Prawns, garlic and olive oil",
        "Garlic, tomato sauce and chilli",
        "Fresh salmon and tomatoes",
        "Chicken, spinach and cream",
        "Homemade Italian lasagne",
        "Gnocchi with four cheeses",
        "Porcini and truffle butter",
        "Prawns and courgette",
        "Seafood"
      ],
      pizza: [
        "Tomato sauce, mozzarella and fresh basil",
        "Tomato sauce, garlic, mozzarella and anchovies",
        "Tomato sauce, mozzarella and mushrooms",
        "Tomato sauce, mozzarella, pineapple and ham",
        "Tomato sauce, mozzarella, ham, salami and mushrooms",
        "Tomato sauce, mozzarella, ham, mushrooms and olives",
        "Tomato sauce, mozzarella, mushrooms, ham and olives",
        "Tomato sauce, mozzarella and Tyrolean bacon",
        "Tomato sauce, mozzarella, tuna and onion",
        "Peppers, onion, courgette, aubergine and mozzarella",
        "Spicy salami, mozzarella and chilli peppers",
        "Cream and four cheeses",
        "Parma ham, mozzarella and rocket",
        "Tomato sauce, mozzarella, rocket and parmesan",
        "Tomato sauce, mozzarella, ham, onion and pepper",
        "Tomato sauce, mozzarella and seafood",
        "Beef tenderloin, rocket and parmesan",
        "Buffalo mozzarella, cherry tomatoes and basil",
        "Mozzarella, gorgonzola, salami, Parma ham and pepper"
      ],
      meat: [
        "Pork tenderloin with rocket and gorgonzola sauce",
        "Chicken breast with lemon and rosemary",
        "Veal cutlet Milanese style",
        "Veal with Parma ham and sage",
        "Gratinated veal slices with mozzarella",
        "Grilled beef sirloin",
        "Grilled beef tenderloin",
        "Mixed grilled meats La Piccola Perla",
        "Grilled lamb chops",
        "Daily special according to offer"
      ],
      seafood: [
        "Mussels in white wine",
        "Grilled baby squid with garlic",
        "Grilled octopus",
        "Salmon with prosecco sauce",
        "Grilled prawns and calamari",
        "Prawns, tomato sauce, garlic and pepper",
        "Baked sea bream or sea bass",
        "Mixed grilled fish and seafood"
      ],
      sides: ["French fries", "Roasted potatoes", "Spinach with garlic", "Green beans", "Grilled vegetables", "Focaccia bread"],
      desserts: [
        "Classic Italian tiramisu",
        "Delicate panna cotta",
        "Chocolate soufflé",
        "Selection of ice creams",
        "Warm raspberries with ice cream",
        "Warm forest fruit with mascarpone",
        "Lemon sorbet"
      ],
      drinks: [
        "",
        "",
        "",
        "",
        "",
        "Decaffeinated coffee",
        "Hot chocolate",
        "Tea",
        "Fresh mint or ginger tea",
        "Mulled wine",
        "",
        "",
        "",
        "",
        "Sparkling water",
        "Still water",
        "",
        "",
        "Carafe of water",
        "Lemonade",
        "",
        "Beer",
        "Beer",
        "Non-alcoholic beer",
        ""
      ],
      wine: [
        "Sparkling, Veneto",
        "White, Veneto",
        "White",
        "White",
        "White",
        "Red, Toscana",
        "Red, Piemonte",
        "Red, Abruzzo",
        "Red, Puglia",
        "White, Veneto, bottle",
        "White, Veneto, bottle",
        "White, Toscana, bottle",
        "White, Piemonte, bottle",
        "White, Trentino, bottle",
        "Sparkling, bottle",
        "Sparkling, bottle",
        "Champagne",
        "Red, Veneto, bottle",
        "Red, Veneto, bottle",
        "Red, Puglia, bottle",
        "Red, Toscana, bottle",
        "Red, Toscana, bottle",
        "Red, Toscana, bottle",
        "Red, Toscana, bottle",
        "Red, Piemonte, bottle"
      ],
      spirits: [
        "Pear brandy",
        "Plum brandy",
        "",
        "Barrique aged",
        "",
        "Liqueur",
        "Liqueur",
        "Liqueur",
        "Liqueur",
        "Liqueur",
        "",
        "Gin",
        "Gin",
        "Whiskey",
        "Single malt",
        "Bourbon",
        "Vodka",
        "Rum",
        "Rum",
        "Cognac",
        "Tequila"
      ]
    }
  },
  it: {
    priceOnRequest: "secondo offerta",
    categoryMeta: {
      soups: ["Zuppe", "Inizi leggeri"],
      salads: ["Insalate", "Piatti freschi"],
      starters: ["Antipasti", "Per il vino e da condividere"],
      pasta: ["Pasta e risotti", "Classici italiani"],
      pizza: ["Pizza", "Dal forno alla tavola"],
      meat: ["Carne", "Secondi italiani"],
      seafood: ["Pesce e frutti di mare", "Il mare all’italiana"],
      sides: ["Contorni", "Per accompagnare il piatto"],
      desserts: ["Dolci", "Finale dolce"],
      drinks: ["Bevande", "Caffè, analcolici e birra"],
      wine: ["Vini", "Calici e bottiglie"],
      spirits: ["Distillati", "Digestivi dopo cena"]
    },
    itemDescriptions: {
      soups: ["Brodo di pollo", "Crema di pomodoro", "Minestrone tradizionale di verdure", "Zuppa veneziana di fagioli", "Crema di asparagi", "Zuppa di pesce"],
      salads: [
        "Insalata mista di stagione",
        "Mozzarella, pomodori e basilico",
        "Insalata di stagione, tonno, uovo e olive",
        "Insalata con petto di pollo",
        "Insalata di spinaci con salmone alla griglia",
        "Peperoni marinati con feta",
        "Rucola con pomodorini e parmigiano",
        "Insalata di stagione con gamberi alla griglia"
      ],
      starters: [
        "Pane fatto in casa, pomodoro, basilico e aglio",
        "Crostini con prosciutto di Parma e funghi",
        "Carpaccio di tonno",
        "Carpaccio di filetto di manzo con rucola e pesto",
        "Prosciutto di Parma con melone",
        "Fettine di vitello con salsa tonnata",
        "Burrata con rucola e pomodorini",
        "Tagliere di salumi italiani",
        "Tagliere di formaggi italiani",
        "Grande selezione di antipasti italiani"
      ],
      pasta: [
        "Aglio, olio extravergine e peperoncino",
        "Parmigiano, uova e pancetta italiana",
        "Pesto al basilico",
        "Con vongole",
        "Pancetta, peperoni, cipolla e pomodori",
        "Frutti di mare",
        "Filetto di maiale, pancetta e pesto al basilico",
        "Ragù di carne",
        "Prosciutto di Parma, porcini e panna",
        "Funghi, piselli, prosciutto, panna e pomodori",
        "Gamberi, aglio e olio extravergine",
        "Aglio, salsa di pomodoro e peperoncino",
        "Salmone fresco e pomodori",
        "Pollo, spinaci e panna",
        "Lasagne italiane fatte in casa",
        "Gnocchi ai quattro formaggi",
        "Porcini e burro al tartufo",
        "Gamberi e zucchine",
        "Frutti di mare"
      ],
      pizza: [
        "Salsa di pomodoro, mozzarella e basilico fresco",
        "Salsa di pomodoro, aglio, mozzarella e acciughe",
        "Salsa di pomodoro, mozzarella e funghi",
        "Salsa di pomodoro, mozzarella, ananas e prosciutto",
        "Salsa di pomodoro, mozzarella, prosciutto, salame e funghi",
        "Salsa di pomodoro, mozzarella, prosciutto, funghi e olive",
        "Salsa di pomodoro, mozzarella, funghi, prosciutto e olive",
        "Salsa di pomodoro, mozzarella e speck tirolese",
        "Salsa di pomodoro, mozzarella, tonno e cipolla",
        "Peperoni, cipolla, zucchine, melanzane e mozzarella",
        "Salame piccante, mozzarella e peperoncini",
        "Panna e quattro tipi di formaggio",
        "Prosciutto di Parma, mozzarella e rucola",
        "Salsa di pomodoro, mozzarella, rucola e parmigiano",
        "Salsa di pomodoro, mozzarella, prosciutto, cipolla e peperone",
        "Salsa di pomodoro, mozzarella e frutti di mare",
        "Filetto di manzo, rucola e parmigiano",
        "Mozzarella di bufala, pomodorini e basilico",
        "Mozzarella, gorgonzola, salame, prosciutto di Parma e peperone"
      ],
      meat: [
        "Filetto di maiale con rucola e salsa al gorgonzola",
        "Petto di pollo con limone e rosmarino",
        "Cotoletta di vitello alla milanese",
        "Vitello con prosciutto di Parma e salvia",
        "Fettine di vitello gratinate con mozzarella",
        "Controfiletto di manzo alla griglia",
        "Filetto di manzo alla griglia",
        "Misto di carni alla griglia La Piccola Perla",
        "Costolette d’agnello alla griglia",
        "Specialità del giorno secondo offerta"
      ],
      seafood: [
        "Cozze al vino bianco",
        "Calamaretti alla griglia con aglio",
        "Polpo alla griglia",
        "Salmone con salsa al prosecco",
        "Gamberi e calamari alla griglia",
        "Gamberi con salsa di pomodoro, aglio e peperone",
        "Orata o branzino al forno",
        "Misto di pesce e frutti di mare alla griglia"
      ],
      sides: ["Patatine fritte", "Patate al forno", "Spinaci all’aglio", "Fagiolini verdi", "Verdure alla griglia", "Pane focaccia"],
      desserts: [
        "Tiramisù classico italiano",
        "Panna cotta delicata",
        "Soufflé al cioccolato",
        "Selezione di gelati",
        "Lamponi caldi con gelato",
        "Frutti di bosco caldi con mascarpone",
        "Sorbetto al limone"
      ],
      drinks: [
        "",
        "",
        "",
        "",
        "",
        "Caffè decaffeinato",
        "Cioccolata calda",
        "Tè",
        "Tè fresco alla menta o allo zenzero",
        "Vin brulé",
        "",
        "",
        "",
        "",
        "Acqua frizzante",
        "Acqua naturale",
        "",
        "",
        "Caraffa d’acqua",
        "Limonata",
        "",
        "Birra",
        "Birra",
        "Birra analcolica",
        ""
      ],
      wine: [
        "Spumante, Veneto",
        "Bianco, Veneto",
        "Bianco",
        "Bianco",
        "Bianco",
        "Rosso, Toscana",
        "Rosso, Piemonte",
        "Rosso, Abruzzo",
        "Rosso, Puglia",
        "Bianco, Veneto, bottiglia",
        "Bianco, Veneto, bottiglia",
        "Bianco, Toscana, bottiglia",
        "Bianco, Piemonte, bottiglia",
        "Bianco, Trentino, bottiglia",
        "Spumante, bottiglia",
        "Spumante, bottiglia",
        "Champagne",
        "Rosso, Veneto, bottiglia",
        "Rosso, Veneto, bottiglia",
        "Rosso, Puglia, bottiglia",
        "Rosso, Toscana, bottiglia",
        "Rosso, Toscana, bottiglia",
        "Rosso, Toscana, bottiglia",
        "Rosso, Toscana, bottiglia",
        "Rosso, Piemonte, bottiglia"
      ],
      spirits: [
        "Distillato di pera",
        "Distillato di prugna",
        "",
        "Invecchiata in barrique",
        "",
        "Liquore",
        "Liquore",
        "Liquore",
        "Liquore",
        "Liquore",
        "",
        "Gin",
        "Gin",
        "Whiskey",
        "Single malt",
        "Bourbon",
        "Vodka",
        "Rum",
        "Rum",
        "Cognac",
        "Tequila"
      ]
    }
  }
};

const localizePrice = (price, language) => {
  if (language === "cs") {
    return price;
  }

  if (price.toLowerCase().includes("dle")) {
    return menuLocalization[language].priceOnRequest;
  }

  return price.replace(/\s*Kč/g, " CZK");
};

const getLocalizedMenuCategories = (language) => {
  if (language === "cs") {
    return baseMenuCategories;
  }

  const localization = menuLocalization[language];

  return baseMenuCategories.map((category) => {
    const categoryMeta = localization.categoryMeta[category.id];
    const descriptions = localization.itemDescriptions[category.id] || [];

    return {
      ...category,
      label: categoryMeta?.[0] || category.label,
      accent: categoryMeta?.[1] || category.accent,
      items: category.items.map((item, index) => ({
        ...item,
        description: descriptions[index] ?? item.description,
        price: localizePrice(item.price, language)
      }))
    };
  });
};

const DAILY_MENU_STORAGE_KEY = "la-piccola-perla-daily-menu";
const DAILY_MENU_COOKIE_KEY = "la_piccola_perla_daily_menu";
const DAILY_MENU_API_PATH = "/api/daily-menu";
const COOKIE_NOTICE_STORAGE_KEY = "la-piccola-perla-cookie-notice";
const ADMIN_SESSION_KEY = "la-piccola-perla-admin-session";
const ADMIN_AUTH_STORAGE_KEY = "la-piccola-perla-admin-auth";
const ADMIN_USER = "perla";
const ADMIN_PASSWORD = "la perla";

const parseDailyMenuData = (value) => {
  try {
    const parsed = value ? JSON.parse(value) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const readDailyMenuCookie = () => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${DAILY_MENU_COOKIE_KEY}=`));

  return cookie ? parseDailyMenuData(decodeURIComponent(cookie.split("=").slice(1).join("="))) : {};
};

const writeDailyMenuCookie = (menus) => {
  document.cookie = `${DAILY_MENU_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(menus))}; path=/; max-age=31536000; SameSite=Lax`;
};

const readStoredDailyMenus = () => {
  try {
    const stored = window.localStorage?.getItem(DAILY_MENU_STORAGE_KEY);
    if (stored) {
      return parseDailyMenuData(stored);
    }
  } catch {
    return readDailyMenuCookie();
  }

  return readDailyMenuCookie();
};

const loadDailyMenuItems = (dateValue) => {
  const menus = readStoredDailyMenus();
  return Array.isArray(menus[dateValue]) ? menus[dateValue] : seededDailyMenus[dateValue] || [];
};

const saveDailyMenuItemsLocal = (dateValue, items) => {
  const menus = readStoredDailyMenus();

  if (items.length > 0) {
    menus[dateValue] = items;
  } else {
    delete menus[dateValue];
  }

  try {
    window.localStorage?.setItem(DAILY_MENU_STORAGE_KEY, JSON.stringify(menus));
  } catch {
    // Cookie fallback below keeps the admin usable in browsers with blocked storage.
  }

  writeDailyMenuCookie(menus);
};

const fetchDailyMenuItems = async (dateValue) => {
  try {
    const response = await fetch(`${DAILY_MENU_API_PATH}?date=${encodeURIComponent(dateValue)}`, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Daily menu API is not available.");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    saveDailyMenuItemsLocal(dateValue, items);
    return items;
  } catch {
    return loadDailyMenuItems(dateValue);
  }
};

const getAdminAuthHeaders = () => {
  try {
    const auth = JSON.parse(window.sessionStorage?.getItem(ADMIN_AUTH_STORAGE_KEY) || "{}");

    if (auth.username && auth.password) {
      return {
        "X-Admin-User": auth.username,
        "X-Admin-Password": auth.password
      };
    }
  } catch {
    // Missing auth simply makes the API save fail and leaves local fallback intact.
  }

  return {};
};

const saveDailyMenuItems = async (dateValue, items) => {
  saveDailyMenuItemsLocal(dateValue, items);

  try {
    const response = await fetch(DAILY_MENU_API_PATH, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify({ date: dateValue, items })
    });

    if (!response.ok) {
      throw new Error("Daily menu API save failed.");
    }

    const data = await response.json();
    const savedItems = Array.isArray(data.items) ? data.items : items;
    saveDailyMenuItemsLocal(dateValue, savedItems);
    return true;
  } catch {
    return false;
  } finally {
    window.dispatchEvent(new Event("daily-menu-updated"));
  }
};

const getCookieNoticeAccepted = () => {
  if (typeof window === "undefined") {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.cookieEnabled === false) {
    return true;
  }

  try {
    return window.localStorage?.getItem(COOKIE_NOTICE_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
};

const saveCookieNoticeAccepted = () => {
  try {
    window.localStorage?.setItem(COOKIE_NOTICE_STORAGE_KEY, "accepted");
  } catch {
    // The banner can still be dismissed for the current session.
  }
};

const normalizePriceInput = (value) => value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, " ").trim();
const formatPrice = (value) => {
  const cleanValue = normalizePriceInput(value);
  return cleanValue ? `${cleanValue} Kč` : "";
};

const getTodayDate = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const isWeekendDate = (dateValue) => {
  const day = new Date(`${dateValue}T12:00:00`).getDay();
  return day === 0 || day === 6;
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateValue}T12:00:00`));

function App() {
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/admin";
  return isAdminRoute ? <AdminPage /> : <PublicSite />;
}

function PublicSite() {
  const language = getLanguageFromLocation();
  const copy = publicCopy[language];
  const localizedPhotos = useMemo(() => getLocalizedPhotos(language), [language]);
  const menuCategories = useMemo(() => getLocalizedMenuCategories(language), [language]);
  const navItems = useMemo(() => getNavItems(language, copy), [language, copy]);
  const experiences = useMemo(() => getExperiences(copy), [copy]);
  const stats = useMemo(() => getStats(copy), [copy]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState(baseMenuCategories[0].id);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [dailyMenuForToday, setDailyMenuForToday] = useState(() => loadDailyMenuItems(getTodayDate()));
  const [cookieNoticeAccepted, setCookieNoticeAccepted] = useState(getCookieNoticeAccepted);

  const heroPhotos = useMemo(() => localizedPhotos.filter((photo) => photo.featured), [localizedPhotos]);
  const activeCategory = menuCategories.find((category) => category.id === activeCategoryId) || menuCategories[0];
  const activePhoto = activePhotoIndex === null ? null : localizedPhotos[activePhotoIndex];

  useEffect(() => {
    const redirectTarget = getLanguageRedirectTarget();

    if (redirectTarget) {
      window.location.replace(redirectTarget);
    }
  }, []);

  useEffect(() => {
    applyPublicSeo(language);
  }, [language]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroPhotos.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroPhotos.length]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", menuOpen || activePhoto !== null);
  }, [menuOpen, activePhoto]);

  useEffect(() => {
    if (language !== "cs") {
      return undefined;
    }

    let isActive = true;
    const refreshDailyMenu = async () => {
      const items = await fetchDailyMenuItems(getTodayDate());

      if (isActive) {
        setDailyMenuForToday(items);
      }
    };

    refreshDailyMenu();
    window.addEventListener("storage", refreshDailyMenu);
    window.addEventListener("focus", refreshDailyMenu);
    window.addEventListener("daily-menu-updated", refreshDailyMenu);
    return () => {
      isActive = false;
      window.removeEventListener("storage", refreshDailyMenu);
      window.removeEventListener("focus", refreshDailyMenu);
      window.removeEventListener("daily-menu-updated", refreshDailyMenu);
    };
  }, [language]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const selectPhoto = (index) => setActivePhotoIndex(index);
  const showPreviousPhoto = () => setActivePhotoIndex((current) => (current === 0 ? localizedPhotos.length - 1 : current - 1));
  const showNextPhoto = () => setActivePhotoIndex((current) => (current === localizedPhotos.length - 1 ? 0 : current + 1));
  const handleLanguageSelect = (languageCode) => {
    saveStoredLanguage(languageCode);
    setMenuOpen(false);
  };
  const acceptCookieNotice = () => {
    saveCookieNoticeAccepted();
    setCookieNoticeAccepted(true);
  };

  return (
    <>
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#hero" aria-label="La Piccola Perla">
          <img src={logo} alt="La Piccola Perla" />
        </a>

        <nav className="desktop-nav" aria-label={copy.navAria}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="language-switch" aria-label={copy.languageAria}>
            {languageLinks.map((item) => (
              <a key={item.code} className={language === item.code ? "is-active" : ""} href={item.href} onClick={() => handleLanguageSelect(item.code)}>
                {item.label}
              </a>
            ))}
          </div>
          <a className="button button-primary header-cta" href="#reservation">
            <CalendarCheck aria-hidden="true" />
            {copy.reservation}
          </a>
          <button
            className="icon-button mobile-toggle"
            type="button"
            aria-label={copy.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="icon-button mobile-close" type="button" aria-label={copy.closeMenu} onClick={() => setMenuOpen(false)}>
          <X aria-hidden="true" />
        </button>
        <img className="mobile-logo" src={logo} alt="La Piccola Perla" />
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
        <div className="mobile-language-switch" aria-label={copy.languageAria}>
          {languageLinks.map((item) => (
            <a key={item.code} className={language === item.code ? "is-active" : ""} href={item.href} onClick={() => handleLanguageSelect(item.code)}>
              {item.label}
            </a>
          ))}
        </div>
        <a className="button button-primary" href="#reservation" onClick={() => setMenuOpen(false)}>
          <CalendarCheck aria-hidden="true" />
          {copy.reservation}
        </a>
      </div>

      <main>
        <section className="hero" id="hero" style={{ "--hero-image": `url(${heroPhotos[heroIndex].src})` }}>
          <div className="hero-copy">
            <span className="eyebrow">{copy.hero.eyebrow}</span>
            <h1>La Piccola Perla</h1>
            <p>{copy.hero.text}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#reservation">
                <CalendarCheck aria-hidden="true" />
                {copy.hero.reserve}
              </a>
              <a className="button button-light" href="#menu">
                <Utensils aria-hidden="true" />
                {copy.hero.menu}
              </a>
            </div>
          </div>

          <div className="hero-photo-strip" aria-label="Ukázka restaurace">
            {heroPhotos.map((photo, index) => (
              <button
                key={photo.id}
                className={index === heroIndex ? "is-active" : ""}
                type="button"
                aria-label={photo.title}
                onClick={() => setHeroIndex(index)}
              >
                <img src={photo.thumbSrc} alt="" />
              </button>
            ))}
          </div>
        </section>

        <section className="stats-band" aria-label="Hlavní informace">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div className="stat-item" key={item.label}>
                <Icon aria-hidden="true" />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          })}
        </section>

        {language === "cs" ? <DailyMenuSection items={dailyMenuForToday} /> : null}

        <section className="story-section section-pad" id="about">
          <div className="section-grid">
            <div className="story-copy">
              <span className="eyebrow">{copy.about.eyebrow}</span>
              <h2>{copy.about.title}</h2>
              {copy.about.text.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <a className="text-link" href="#gallery">
                {copy.about.link}
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="story-photos">
              <img className="photo-main" src={getImage("_DSR0003.webp")} alt="Interiér restaurace La Piccola Perla" loading="lazy" />
              <img className="photo-small" src={getImage("2.webp")} alt="Tagliata di manzo" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="experience-section section-pad" aria-label={copy.experiences.eyebrow}>
          <div className="section-heading">
            <span className="eyebrow">{copy.experiences.eyebrow}</span>
            <h2>{copy.experiences.title}</h2>
            <p>{copy.experiences.text}</p>
          </div>
          <div className="experience-grid">
            {experiences.map((item) => {
              const Icon = item.icon;
              return (
                <article className="experience-card" key={item.title}>
                  <img src={item.image} alt="" loading="lazy" />
                  <div>
                    <Icon aria-hidden="true" />
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="menu-section section-pad" id="menu">
          <div className="section-heading align-left">
            <span className="eyebrow">{copy.menu.eyebrow}</span>
            <h2>{copy.menu.title}</h2>
            <p>{copy.menu.text}</p>
            <div className="featured-picks" aria-label={copy.menu.picksAria}>
              {featuredPicks.map((pick) => (
                <span key={pick}>{pick}</span>
              ))}
            </div>
          </div>

          <div className="menu-layout">
            <div className="menu-tabs" role="tablist" aria-label={copy.menu.tabsAria}>
              {menuCategories.map((category) => (
                <button
                  key={category.id}
                  className={category.id === activeCategory.id ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={category.id === activeCategory.id}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <span>{category.label}</span>
                  <small>{category.items.length}</small>
                </button>
              ))}
            </div>

            <div className="menu-panel" role="tabpanel">
              <div className="menu-panel-head">
                <span>{activeCategory.accent}</span>
                <h3>{activeCategory.label}</h3>
              </div>
              <div className="menu-items">
                {activeCategory.items.map((item) => (
                  <article className="menu-item" key={`${activeCategory.id}-${item.name}`}>
                    <div>
                      <h4>{item.name}</h4>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                    <strong>{item.price}</strong>
                  </article>
                ))}
              </div>
              <p className="allergy-note">{copy.menu.allergy}</p>
            </div>
          </div>
        </section>

        <section className="gallery-section section-pad" id="gallery">
          <div className="section-heading">
            <span className="eyebrow">{copy.gallery.eyebrow}</span>
            <h2>{copy.gallery.title}</h2>
            <p>{copy.gallery.text}</p>
          </div>
          <div className="gallery-grid">
            {localizedPhotos.map((photo, index) => (
              <button
                key={photo.id}
                className={`gallery-tile tile-${(index % 7) + 1}`}
                type="button"
                onClick={() => selectPhoto(index)}
              >
                <img src={photo.thumbSrc} alt={photo.title} loading="lazy" />
                <span>
                  <small>{photo.tone}</small>
                  {photo.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="reservation-section" id="reservation" style={{ "--reservation-image": `url(${getImage("_DSR0014.webp")})` }}>
          <div>
            <span className="eyebrow">{copy.reservationBlock.eyebrow}</span>
            <h2>{copy.reservationBlock.title}</h2>
            <p>{copy.reservationBlock.text}</p>
            <div className="reservation-actions">
              <a
                className="button button-primary"
                href="https://la-piccola-perla.choiceqr.com/takeaway/booking"
                target="_blank"
                rel="noreferrer"
              >
                <CalendarCheck aria-hidden="true" />
                {copy.reservationBlock.book}
                <ExternalLink aria-hidden="true" />
              </a>
              <a
                className="button button-light"
                href="https://la-piccola-perla.choiceqr.com/takeaway/section:menu/polevky"
                target="_blank"
                rel="noreferrer"
              >
                <ShoppingBag aria-hidden="true" />
                {copy.reservationBlock.order}
                <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="section-heading">
            <span className="eyebrow">{copy.contact.eyebrow}</span>
            <h2>{copy.contact.title}</h2>
          </div>
          <div className="contact-grid">
            <article>
              <MapPin aria-hidden="true" />
              <h3>{copy.contact.addressTitle}</h3>
              <p>{copy.contact.address[0]}<br />{copy.contact.address[1]}</p>
            </article>
            <article>
              <Phone aria-hidden="true" />
              <h3>{copy.contact.phoneTitle}</h3>
              <p><a href="tel:+420224282537">+420 224 282 537</a></p>
            </article>
            <article>
              <Clock aria-hidden="true" />
              <h3>{copy.contact.hoursTitle}</h3>
              <p>{copy.contact.hours[0]}<br />{copy.contact.hours[1]}</p>
            </article>
          </div>
          <div className="map-shell">
            <iframe
              title="Mapa La Piccola Perla"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d640.0638563384214!2d14.4213246!3d50.0835457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b94ec2af230ed%3A0x309375df444c7c4!2sLa%20Piccola%20Perla!5e0!3m2!1sen!2scz!4v1689091234567!5m2!1sen!2scz"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <img src={logo} alt="La Piccola Perla" />
        <nav aria-label={copy.footerAria}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a href="#reservation">{copy.reservation}</a>
        </nav>
        <dl className="footer-legal">
          <div>
            <dt>{copy.legal.operator}</dt>
            <dd>B &amp; D DINAMIC, s.r.o.</dd>
          </div>
          <div>
            <dt>{copy.legal.registeredOffice}</dt>
            <dd>Perlová 1020/8, 110 00 Praha 1</dd>
          </div>
          <div>
            <dt>{copy.legal.companyId}</dt>
            <dd>26764776</dd>
          </div>
          <div>
            <dt>{copy.legal.vatId}</dt>
            <dd>CZ26764776</dd>
          </div>
        </dl>
        <p className="footer-copyright">
          {copy.footer} {copy.footerCredit}{" "}
          <a href="https://fimadux.com" target="_blank" rel="noreferrer">
            fimadux.com
          </a>
        </p>
      </footer>

      {!cookieNoticeAccepted ? (
        <div className="cookie-notice" role="status">
          <p>{copy.cookieNotice.text}</p>
          <button className="button button-primary" type="button" onClick={acceptCookieNotice}>
            {copy.cookieNotice.accept}
          </button>
        </div>
      ) : null}

      {activePhoto ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activePhoto.title}>
          <button className="icon-button lightbox-close" type="button" aria-label={copy.lightbox.close} onClick={() => setActivePhotoIndex(null)}>
            <X aria-hidden="true" />
          </button>
          <button className="icon-button lightbox-prev" type="button" aria-label={copy.lightbox.previous} onClick={showPreviousPhoto}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <img src={activePhoto.src} alt={activePhoto.title} />
          <div className="lightbox-caption">
            <span>{activePhoto.tone}</span>
            <strong>{activePhoto.title}</strong>
          </div>
          <button className="icon-button lightbox-next" type="button" aria-label={copy.lightbox.next} onClick={showNextPhoto}>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function DailyMenuSection({ items }) {
  const today = getTodayDate();
  const weekend = isWeekendDate(today);

  return (
    <section className="daily-menu-section section-pad" id="daily-menu" aria-label="Denní menu">
      <div className="daily-menu-shell">
        <div
          className="daily-menu-visual"
          style={{ "--daily-menu-image": `url(${getImage("_DSR0080.webp")})` }}
        >
          <span className="eyebrow">Polední nabídka</span>
          <h2>Denní menu</h2>
          <p>{formatDate(today)}</p>
        </div>

        <div className="daily-menu-panel">
          <div className="daily-menu-meta">
            <span><Clock aria-hidden="true" /> 11:00-14:30</span>
            <span><CalendarCheck aria-hidden="true" /> Pouze Po-Pá</span>
          </div>

          {weekend ? (
            <div className="daily-menu-empty">
              <h3>O víkendech denní menu nepodáváme.</h3>
              <p>Vyberte si prosím z našeho stálého menu nebo si rezervujte stůl na všední den.</p>
            </div>
          ) : items.length > 0 ? (
            <div className="daily-menu-list">
              {items.map((item) => (
                <article className="daily-menu-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <strong>{item.price}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="daily-menu-empty">
              <h3>Denní menu z dnešního dne zatím dopisujeme.</h3>
              <p>Prosíme, chvíli počkejte. Jakmile bude nabídka hotová, objeví se tady.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true" && Boolean(window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY))
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [dateValue, setDateValue] = useState(getTodayDate());
  const [items, setItems] = useState(() => loadDailyMenuItems(getTodayDate()));
  const [draft, setDraft] = useState({ name: "", description: "", price: "" });
  const [syncMessage, setSyncMessage] = useState("");

  const weekend = isWeekendDate(dateValue);

  useEffect(() => {
    applyAdminSeo();
    document.body.classList.remove("is-locked");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let isActive = true;
    setItems(loadDailyMenuItems(dateValue));
    setDraft({ name: "", description: "", price: "" });
    setSyncMessage("");

    fetchDailyMenuItems(dateValue).then((serverItems) => {
      if (isActive) {
        setItems(serverItems);
      }
    });

    return () => {
      isActive = false;
    };
  }, [dateValue, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      return undefined;
    }

    const form = document.querySelector(".admin-login-form");
    if (!form) {
      return undefined;
    }

    const loginFromForm = () => {
      const formData = new FormData(form);
      const username = String(formData.get("username") || "").trim().toLowerCase();
      const password = String(formData.get("password") || "");

      if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({ username, password }));
        setIsAuthenticated(true);
        setLoginError("");
        return true;
      }

      return false;
    };

    const submitLogin = (event) => {
      event.preventDefault();

      if (loginFromForm()) {
        return;
      }

      setLoginError("Zadané jméno nebo heslo nesedí.");
    };

    const loginWhenComplete = () => {
      loginFromForm();
    };

    const button = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", submitLogin);
    form.addEventListener("input", loginWhenComplete);
    button?.addEventListener("click", submitLogin);
    return () => {
      form.removeEventListener("submit", submitLogin);
      form.removeEventListener("input", loginWhenComplete);
      button?.removeEventListener("click", submitLogin);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const form = document.querySelector(".admin-menu-form");
    if (!form) {
      return undefined;
    }

    const addItemFromForm = async () => {
      const formData = new FormData(form);
      const name = String(formData.get("dishName") || "").trim();
      const description = String(formData.get("dishDescription") || "").trim();
      const price = formatPrice(String(formData.get("dishPrice") || ""));

      if (!name || !description || !price || weekend) {
        return false;
      }

      const nextItems = [
        ...items,
        {
          id: window.crypto?.randomUUID?.() || `${Date.now()}-${name}`,
          name,
          description,
          price
        }
      ];

      setItems(nextItems);
      setSyncMessage("Ukladam denni menu...");
      const synced = await saveDailyMenuItems(dateValue, nextItems);
      setSyncMessage(synced ? "Denni menu je ulozene na webu pro vsechna zarizeni." : "Menu se ulozilo jen v tomto prohlizeci. Pro zobrazeni na jinych zarizenich nastavte Vercel KV / Upstash.");
      setDraft({ name: "", description: "", price: "" });
      return true;
    };

    const submitItem = (event) => {
      event.preventDefault();
      void addItemFromForm();
    };

    const submitPriceOnEnter = (event) => {
      if (event.key !== "Enter" || event.target?.name !== "dishPrice") {
        return;
      }

      event.preventDefault();
      void addItemFromForm();
    };

    const button = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", submitItem);
    form.addEventListener("keydown", submitPriceOnEnter);
    button?.addEventListener("click", submitItem);
    return () => {
      form.removeEventListener("submit", submitItem);
      form.removeEventListener("keydown", submitPriceOnEnter);
      button?.removeEventListener("click", submitItem);
    };
  }, [dateValue, isAuthenticated, items, weekend]);

  const handleRemoveItem = async (itemId) => {
    const nextItems = items.filter((item) => item.id !== itemId);
    setItems(nextItems);
    setSyncMessage("Ukladam zmenu...");
    const synced = await saveDailyMenuItems(dateValue, nextItems);
    setSyncMessage(synced ? "Zmena je ulozena na webu pro vsechna zarizeni." : "Zmena se ulozila jen v tomto prohlizeci. Pro zobrazeni na jinych zarizenich nastavte Vercel KV / Upstash.");
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const list = document.querySelector(".admin-current-list");
    if (!list) {
      return undefined;
    }

    const removeFromList = (event) => {
      const button = event.target.closest("[data-remove-id]");
      if (!button) {
        return;
      }

      void handleRemoveItem(button.dataset.removeId);
    };

    const removeFromListByKey = (event) => {
      const button = event.target.closest("[data-remove-id]");
      if (!button || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      void handleRemoveItem(button.dataset.removeId);
    };

    list.addEventListener("click", removeFromList);
    list.addEventListener("keydown", removeFromListByKey);
    return () => {
      list.removeEventListener("click", removeFromList);
      list.removeEventListener("keydown", removeFromListByKey);
    };
  }, [dateValue, isAuthenticated, items]);

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setLoginForm({ username: "", password: "" });
    setSyncMessage("");
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card" aria-label="Přihlášení do administrace">
          <a className="admin-logo" href="/#hero" aria-label="Zpět na La Piccola Perla">
            <img src={logo} alt="La Piccola Perla" />
          </a>
          <span className="eyebrow">Denní menu</span>
          <h1>Přihlášení</h1>
          <p>Po přihlášení můžete upravit polední nabídku pro českou verzi webu.</p>

          <form className="admin-login-form">
            <label>
              Jméno
              <input
                name="username"
                autoComplete="username"
                value={loginForm.username}
                onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Heslo
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            {loginError ? <p className="admin-error">{loginError}</p> : null}
            <button className="button button-primary" type="submit">
              Přihlásit se
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <a className="admin-logo" href="/#hero" aria-label="Zpět na La Piccola Perla">
          <img src={logo} alt="La Piccola Perla" />
        </a>
        <div className="admin-topbar-actions">
          <a className="button button-light" href="/#daily-menu">
            Zpět na web
          </a>
          <button className="icon-button" type="button" aria-label="Odhlásit se" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="admin-workspace">
        <section className="admin-editor">
          <span className="eyebrow">Skrytá administrace</span>
          <h1>Denní menu</h1>
          <p>Vyberte datum, doplňte jídla a nabídka se uloží na českou verzi webu.</p>

          <label className="admin-date-field">
            Datum nabídky
            <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
          </label>

          <form className="admin-menu-form">
            <label>
              Název jídla
              <input
                name="dishName"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="např. Pollo alla romana"
              />
            </label>
            <label>
              Popisek
              <textarea
                name="dishDescription"
                rows="4"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="krátký popis jídla"
              />
            </label>
            <label>
              Cena
              <span className="admin-price-input">
                <input
                  name="dishPrice"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(event) => setDraft((current) => ({ ...current, price: normalizePriceInput(event.target.value) }))}
                  placeholder="199"
                />
                <span>Kč</span>
              </span>
            </label>
            <button className="button button-primary" type="submit" disabled={weekend}>
              <Save aria-hidden="true" />
              Přidat a uložit
            </button>
          </form>

          {weekend ? (
            <p className="admin-note">O víkendech se denní menu nepodává, proto je přidávání vypnuté.</p>
          ) : null}

          {syncMessage ? <p className="admin-sync-note">{syncMessage}</p> : null}

          <div className="admin-current-list" aria-label="Uložené položky">
            {items.length > 0 ? (
              items.map((item) => (
                <article key={item.id}>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <strong>{item.price}</strong>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Smazat ${item.name}`}
                    data-remove-id={item.id}
                    onClick={() => void handleRemoveItem(item.id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </article>
              ))
            ) : (
              <p className="admin-empty">Zatím tu není žádné jídlo pro vybrané datum.</p>
            )}
          </div>
        </section>

        <section className="admin-preview-card" aria-label="Náhled denního menu">
          <div className="admin-preview-actions">
            <button className="button button-light" type="button" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Tisk / PDF
            </button>
          </div>

          <div className="daily-print-sheet">
            {[0, 1].map((copyIndex) => (
              <DailyPrintMenu
                key={copyIndex}
                dateValue={dateValue}
                items={items}
                weekend={weekend}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function DailyPrintMenu({ dateValue, items, weekend }) {
  const printItemsClassName = `print-menu-items${items.length >= 7 ? " is-eight" : ""}`;

  return (
    <div className="daily-print-preview">
      <div className="daily-print-content">
        <img src={logo} alt="La Piccola Perla" />
        <div className="print-heading">
          <span>Polední nabídka</span>
          <h2>Denní menu</h2>
          <p className="print-date">{formatDate(dateValue)}</p>
          <p className="print-time">Podáváme 11:00-14:30 | pouze Po-Pá</p>
        </div>

        {weekend ? (
          <div className="print-empty">
            <h3>O víkendech denní menu nepodáváme.</h3>
            <p>Vyberte si prosím ze stálého menu.</p>
          </div>
        ) : items.length > 0 ? (
          <div className={printItemsClassName}>
            {items.map((item) => (
              <article key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <strong>{item.price}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="print-empty">
            <h3>Denní menu zatím dopisujeme.</h3>
            <p>Prosíme, chvíli počkejte.</p>
          </div>
        )}

        <small>La Piccola Perla | Perlová 412/1, Praha 1</small>
      </div>
    </div>
  );
}

export default App;
