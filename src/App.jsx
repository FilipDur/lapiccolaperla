import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  LogOut,
  Phone,
  Printer,
  Save,
  Trash2,
  Wine,
  X
} from "lucide-react";
import { menuCategories as baseMenuCategories } from "./data/menu";
import { seededDailyMenus } from "./data/dailyMenuSeed";
import SpecialMenuEditor from "./components/SpecialMenuEditor";
import MenuPrintSheet, { MenuPrintItems } from "./components/MenuPrintSheet";
import RestaurantSite from "./restaurant/RestaurantSite.jsx";
import { parseRoute } from "./restaurant/routes.js";
import { usePublicMenus } from "./lib/usePublicMenus.js";
import { getRestaurantDate } from "./lib/restaurantDate.js";
import { DAILY_MENU_REVISION_KEY, invalidateDailyMenuReads, readDailyMenuItems, writeDailyMenuItems } from "./lib/dailyMenu";

const imageAssets = import.meta.glob("../images/webp/**/*.webp", {
  eager: true,
  import: "default"
});

const getImage = (fileName) => imageAssets[`../images/webp/${fileName}`];
const getThumb = (fileName) => imageAssets[`../images/webp/thumbs/${fileName}`] || getImage(fileName);
const logo = "/logo-transparent.png";
const printLogo = getImage("Logos.webp");

// Keep original identifiers for localized captions and lightbox navigation.
// The originals remain available; retouched photos have separate web/thumbnail assets.
const retouchedPhotos = {
  "_DSR0003.webp": "retouched/entrance-v1.webp",
  "_DSR0014.webp": "retouched/winebar-v1.webp",
  "4.webp": "retouched/seafood-pasta-v1.webp",
  "1.webp": "retouched/pizza-v1.webp",
  "_DSR0090.webp": "retouched/berry-dessert-v1.webp"
};

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
  { file: "1.webp", title: "Pizza s prosciuttem a rukolou", tone: "Kuchyně" },
  { file: "2.webp", title: "Tagliata di manzo", tone: "Maso" },
  { file: "3.webp", title: "Calamaretti alla griglia", tone: "Mořské plody" },
  { file: "4.webp", title: "Těstoviny s mořskými plody", tone: "Kuchyně" },
  { file: "5.webp", title: "Soufflé", tone: "Dolce" },
  { file: "6.webp", title: "Výběr italských chutí", tone: "La Perla" }
].map((photo, index) => {
  const editedFile = retouchedPhotos[photo.file];
  const imageFile = editedFile && getImage(editedFile) ? editedFile : photo.file;
  return {
    ...photo,
    id: photo.file,
    index,
    src: getImage(imageFile),
    thumbSrc: getThumb(imageFile)
  };
});

const languageCodes = ["cs", "en", "it"];
const SITE_URL = "https://lapiccolaperla.cz";
const SEO_IMAGE_URL = `${SITE_URL}/og-la-piccola-perla.webp`;
const LANGUAGE_PREFERENCE_KEY = "la-piccola-perla-language";

const saveStoredLanguage = (language) => {
  try {
    window.localStorage?.setItem(LANGUAGE_PREFERENCE_KEY, language);
  } catch {
    // URL-based language selection also works without local storage.
  }
};

const seoByLanguage = {
  cs: {
    path: "/",
    htmlLang: "cs",
    locale: "cs_CZ",
    title: "Italská restaurace Praha 1 | La Piccola Perla",
    description: "Italská restaurace v Praze 1 u Staroměstského náměstí. Užijte si pastu, pizzu, mořské plody a víno. Prohlédněte si menu a rezervujte stůl."
  },
  en: {
    path: "/en",
    htmlLang: "en",
    locale: "en_US",
    title: "Italian Restaurant in Prague | La Piccola Perla",
    description: "Italian restaurant in Prague Old Town near Old Town Square. Enjoy pasta, pizza, seafood and Italian wine. Explore the menu and book your table online."
  },
  it: {
    path: "/it",
    htmlLang: "it",
    locale: "it_IT",
    title: "Ristorante italiano a Praga | La Piccola Perla",
    description: "Ristorante italiano nel centro storico di Praga, vicino alla Piazza della Città Vecchia. Pasta, pizza, pesce e vini italiani. Prenota online."
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
  document.title = "Administrace menu | La Piccola Perla";
  setMetaTag("name", "robots", "noindex, nofollow");
  setLinkTag('link[rel="canonical"]', { rel: "canonical", href: `${SITE_URL}/admin` });
};

const publicCopy = {
  cs: {
    locale: "cs-CZ",
    title: "Italská restaurace Praha 1 | La Piccola Perla",
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
      eyebrow: "La Piccola Perla · Staré Město",
      title: "Italská restaurace v srdci Prahy",
      text: "Poctivá pasta, křupavá pizza, mořské plody a italské víno jen pár kroků od Staroměstského náměstí. Přijďte na oběd, rande nebo dlouhou večeři v Praze 1.",
      reserve: "Rezervovat stůl",
      menu: "Projít menu"
    },
    stats: ["hodnocení hostů", "recenzí online", "otevřeno denně", "Perlová 412/1"],
    about: {
      eyebrow: "Od roku 2012",
      title: "Italská energie v pražských uličkách",
      text: [
        "La Piccola Perla vznikla z chuti přenést do centra Prahy atmosféru rodinných italských restaurací: živý stůl, dobré víno, voňavou omáčku a servis, který nechá večer plynout.",
        "V Perlové ulici na Starém Městě vaříme z italských surovin, s respektem k jednoduchosti a s důrazem na jídla, kvůli kterým se hosté rádi vracejí."
      ],
      imageAlts: ["Útulný interiér italské restaurace La Piccola Perla v Praze 1", "Tagliata di manzo v restauraci La Piccola Perla"],
      link: "Podívat se dovnitř"
    },
    experiences: {
      eyebrow: "Proč přijít",
      title: "Proč přijít do La Piccola Perla",
      text: "Italské klasiky, pečlivě vybrané víno a útulný interiér v centru Prahy tvoří místo pro rychlý oběd i dlouhou večeři.",
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
      text: "Prohlédněte si náš interiér v Perlové ulici, italská jídla, víno i dezerty ještě před návštěvou."
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
      title: "Italská restaurace v Praze 1 na Starém Městě",
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
      vatId: "DIČ",
      email: "E-mail"
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
    title: "Italian Restaurant in Prague | La Piccola Perla",
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
      eyebrow: "La Piccola Perla · Prague Old Town",
      title: "Italian restaurant in the heart of Prague",
      text: "Fresh pasta, crisp pizza, seafood and Italian wine just a few steps from Old Town Square. Join us for lunch, a date or a long dinner in Prague 1.",
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
      imageAlts: ["Cosy interior of La Piccola Perla Italian restaurant in Prague", "Tagliata di manzo at La Piccola Perla"],
      link: "Step inside"
    },
    experiences: {
      eyebrow: "Why come",
      title: "Why visit La Piccola Perla",
      text: "Italian classics, carefully selected wine and a cosy Prague Old Town interior make this a place for a quick lunch or a long dinner.",
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
      text: "Explore our Perlova Street interior, Italian dishes, wine and desserts before your visit."
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
      title: "Italian restaurant in Prague 1 Old Town",
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
      vatId: "VAT ID",
      email: "E-mail"
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
      "1.webp": ["Pizza with prosciutto and rocket", "Kitchen"],
      "4.webp": ["Seafood pasta", "Kitchen"],
      "2.webp": ["Tagliata di manzo", "Meat"],
      "3.webp": ["Calamaretti alla griglia", "Seafood"],
      "5.webp": ["Soufflé", "Dolce"],
      "6.webp": ["Selection of Italian flavours", "La Perla"]
    }
  },
  it: {
    locale: "it-IT",
    title: "Ristorante italiano a Praga | La Piccola Perla",
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
      eyebrow: "La Piccola Perla · Città Vecchia di Praga",
      title: "Ristorante italiano nel cuore di Praga",
      text: "Pasta, pizza croccante, pesce e vini italiani a pochi passi dalla Piazza della Città Vecchia. Vieni per pranzo, un appuntamento o una lunga cena a Praga 1.",
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
      imageAlts: ["Interno accogliente del ristorante italiano La Piccola Perla a Praga", "Tagliata di manzo alla La Piccola Perla"],
      link: "Guarda l’interno"
    },
    experiences: {
      eyebrow: "Perché venire",
      title: "Perché scegliere La Piccola Perla",
      text: "Classici italiani, vini selezionati e un interno accogliente nel centro storico di Praga: perfetto per un pranzo veloce o una lunga cena.",
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
      text: "Scopri gli interni di via Perlova, i piatti italiani, i vini e i dolci prima della tua visita."
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
      title: "Ristorante italiano a Praga 1, Città Vecchia",
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
      vatId: "Partita IVA",
      email: "E-mail"
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
      "1.webp": ["Pizza con prosciutto e rucola", "Cucina"],
      "4.webp": ["Pasta ai frutti di mare", "Cucina"],
      "2.webp": ["Tagliata di manzo", "Carne"],
      "3.webp": ["Calamaretti alla griglia", "Frutti di mare"],
      "5.webp": ["Soufflé", "Dolce"],
      "6.webp": ["Selezione di sapori italiani", "La Perla"]
    }
  }
};

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
      sides: ["French fries", "Roasted potatoes", "Spinach with garlic", "Green beans", "Grilled vegetables", "Thin pizza bread with olive oil and oregano"],
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
      sides: ["Patatine fritte", "Patate al forno", "Spinaci all’aglio", "Fagiolini verdi", "Verdure alla griglia", "Focaccia sottile con olio d’oliva e origano"],
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
const COOKIE_NOTICE_STORAGE_KEY = "la-piccola-perla-cookie-notice";
const ADMIN_SESSION_KEY = "la-piccola-perla-admin-session";
const ADMIN_AUTH_STORAGE_KEY = "la-piccola-perla-admin-auth";

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

const fetchDailyMenuItems = async (dateValue, options) => {
  try {
    const items = await readDailyMenuItems(dateValue, options);
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
    const savedItems = await writeDailyMenuItems(dateValue, items, getAdminAuthHeaders());
    saveDailyMenuItemsLocal(dateValue, savedItems);
    try {
      window.localStorage?.setItem(DAILY_MENU_REVISION_KEY, JSON.stringify({ date: dateValue, revision: `${Date.now()}-${Math.random()}` }));
    } catch {
      // Same-tab refresh still works when browser storage is unavailable.
    }
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

const getTodayDate = getRestaurantDate;

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
  const isAdminRoute = typeof window !== "undefined" && ["/admin", "/admin.html"].includes(window.location.pathname.replace(/\/$/, ""));
  return isAdminRoute ? <AdminPage /> : <PublicSite />;
}

function PublicSite() {
  const [language, setLanguage] = useState(() => parseRoute(window.location.pathname, window.location.hash).language);
  const copy = publicCopy[language];
  const photos = useMemo(() => getLocalizedPhotos(language), [language]);
  const menuCategories = useMemo(() => getLocalizedMenuCategories(language), [language]);
  const menus = usePublicMenus(language);
  const [cookieNoticeAccepted, setCookieNoticeAccepted] = useState(getCookieNoticeAccepted);
  const handleLanguageSelect = useCallback((code) => {
    if (!languageCodes.includes(code)) return;
    saveStoredLanguage(code);
    setLanguage(code);
  }, []);
  const acceptCookieNotice = () => {
    saveCookieNoticeAccepted();
    setCookieNoticeAccepted(true);
  };

  return (
    <RestaurantSite
      language={language}
      applyLanguageSeo={applyPublicSeo}
      copy={copy}
      photos={photos}
      menuCategories={menuCategories}
      {...menus}
      onLanguageSelect={handleLanguageSelect}
      cookieNoticeAccepted={cookieNoticeAccepted}
      onAcceptCookies={acceptCookieNotice}
    />
  );
}

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true" && Boolean(window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY))
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginRequestRef = useRef(null);
  const [dateValue, setDateValue] = useState(getTodayDate());
  const [items, setItems] = useState(() => loadDailyMenuItems(getTodayDate()));
  const [draft, setDraft] = useState({ name: "", description: "", price: "" });
  const [syncMessage, setSyncMessage] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [specialBusy, setSpecialBusy] = useState(false);
  const printSheetRef = useRef(null);

  const weekend = isWeekendDate(dateValue);

  useEffect(() => {
    applyAdminSeo();
    document.body.classList.remove("is-locked");
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isSpecial) {
      return undefined;
    }

    let isActive = true;
    setItems(loadDailyMenuItems(dateValue));
    setDraft({ name: "", description: "", price: "" });
    setSyncMessage("");

    fetchDailyMenuItems(dateValue, { scope: "admin", authHeaders: getAdminAuthHeaders() }).then((serverItems) => {
      if (isActive) {
        setItems(serverItems);
      }
    });

    return () => {
      isActive = false;
    };
  }, [dateValue, isAuthenticated, isSpecial]);

  useEffect(() => () => {
    loginRequestRef.current?.abort();
    loginRequestRef.current = null;
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loginRequestRef.current) return;
    const username = loginForm.username.trim().toLowerCase();
    const password = loginForm.password;
    if (!username || !password) {
      setLoginError("Vyplňte jméno a heslo.");
      return;
    }
    const controller = new AbortController();
    loginRequestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "X-Admin-User": username, "X-Admin-Password": password },
        cache: "no-store",
        signal: controller.signal
      });
      if (loginRequestRef.current !== controller) return;
      if (response.status === 401) {
        setLoginError("Zadané jméno nebo heslo nesedí.");
        return;
      }
      if (!response.ok || (await response.json()).authenticated !== true) throw new Error("Authentication unavailable");
      if (loginRequestRef.current !== controller) return;
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({ username, password }));
      setIsAuthenticated(true);
      setLoginForm({ username: "", password: "" });
    } catch {
      if (loginRequestRef.current === controller) setLoginError("Přihlášení se nepodařilo ověřit. Zkuste to prosím znovu.");
    } finally {
      window.clearTimeout(timeout);
      if (loginRequestRef.current === controller) {
        loginRequestRef.current = null;
        setIsLoggingIn(false);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isSpecial) {
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
  }, [dateValue, isAuthenticated, isSpecial, items, weekend]);

  const handleRemoveItem = async (itemId) => {
    const nextItems = items.filter((item) => item.id !== itemId);
    setItems(nextItems);
    setSyncMessage("Ukladam zmenu...");
    const synced = await saveDailyMenuItems(dateValue, nextItems);
    setSyncMessage(synced ? "Zmena je ulozena na webu pro vsechna zarizeni." : "Zmena se ulozila jen v tomto prohlizeci. Pro zobrazeni na jinych zarizenich nastavte Vercel KV / Upstash.");
  };

  const handleMoveItem = async (itemId, direction) => {
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[currentIndex], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[currentIndex]];

    setItems(nextItems);
    setSyncMessage("Ukladam poradi menu...");
    const synced = await saveDailyMenuItems(dateValue, nextItems);
    setSyncMessage(synced ? "Poradi menu je ulozene na webu pro vsechna zarizeni." : "Poradi se ulozilo jen v tomto prohlizeci. Pro zobrazeni na jinych zarizenich nastavte Vercel KV / Upstash.");
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setLoginForm({ username: "", password: "" });
    setSyncMessage("");
  };

  const handleDownloadPdf = async () => {
    const sourceSheet = printSheetRef.current;

    if (!sourceSheet || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const { downloadMenuPdf } = await import("./lib/menuPrint");
      await downloadMenuPdf(sourceSheet, `denni-menu-${dateValue}.pdf`);
    } catch (error) {
      console.error("Daily menu PDF download failed:", error);
      setSyncMessage("PDF se nepodařilo stáhnout. Zkuste prosím Tisk / PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card" aria-label="Přihlášení do administrace">
          <a className="admin-logo" href="/#hero" aria-label="Zpět na La Piccola Perla">
            <img src={logo} alt="La Piccola Perla" />
          </a>
          <span className="eyebrow">Administrace menu</span>
          <h1>Přihlášení</h1>
          <p>Po přihlášení můžete upravit denní menu i speciální nabídku ve všech jazycích.</p>

          <form className="admin-login-form" onSubmit={handleLogin} aria-busy={isLoggingIn}>
            <label>
              Jméno
              <input
                name="username"
                autoComplete="username"
                disabled={isLoggingIn}
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
                disabled={isLoggingIn}
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            {loginError ? <p className="admin-error" role="alert">{loginError}</p> : null}
            <button className="button button-primary" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? "Ověřuji přihlášení…" : "Přihlásit se"}
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
          <a className="button button-light" href={isSpecial ? "/#special-menu" : "/#daily-menu"}>
            Zpět na web
          </a>
          <button className="icon-button" type="button" aria-label="Odhlásit se" onClick={handleLogout} disabled={specialBusy}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="admin-menu-mode">
        <label><input type="checkbox" checked={isSpecial} onChange={(event) => setIsSpecial(event.target.checked)} disabled={specialBusy || isDownloadingPdf} />Speciální menu</label>
        <p>{isSpecial ? "Upravujete nabídku pro všechny jazyky." : "Upravujete denní menu pro vybrané datum."}</p>
      </div>

      {isSpecial ? <SpecialMenuEditor logo={logo} getAuthHeaders={getAdminAuthHeaders} onBusyChange={setSpecialBusy} /> : (
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
              items.map((item, index) => (
                <article key={item.id}>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <strong>{item.price}</strong>
                  </div>
                  <div className="admin-item-actions">
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Posunout ${item.name} nahoru`}
                      disabled={index === 0}
                      onClick={() => void handleMoveItem(item.id, -1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Posunout ${item.name} dolu`}
                      disabled={index === items.length - 1}
                      onClick={() => void handleMoveItem(item.id, 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Smazat ${item.name}`}
                      onClick={() => void handleRemoveItem(item.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="admin-empty">Zatím tu není žádné jídlo pro vybrané datum.</p>
            )}
          </div>
        </section>

        <section className="admin-preview-card" aria-label="Náhled denního menu">
          <div className="admin-preview-actions">
            <button className="button button-light" type="button" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
              <Download aria-hidden="true" />
              {isDownloadingPdf ? "Připravuji..." : "Stáhnout PDF"}
            </button>
            <button className="button button-light" type="button" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Tisk / PDF
            </button>
          </div>

          <MenuPrintSheet ref={printSheetRef} lang="cs">
            <DailyPrintMenu dateValue={dateValue} items={items} weekend={weekend} />
          </MenuPrintSheet>
        </section>
      </div>
      )}
    </main>
  );
}

function DailyPrintMenu({ dateValue, items, weekend }) {
  return (
    <div className="daily-print-content">
        <img src={printLogo} alt="La Piccola Perla" />
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
          <MenuPrintItems items={items} />
        ) : (
          <div className="print-empty">
            <h3>Denní menu zatím dopisujeme.</h3>
            <p>Prosíme, chvíli počkejte.</p>
          </div>
        )}

        <small>La Piccola Perla | Perlová 412/1, Praha 1</small>
    </div>
  );
}

export default App;
