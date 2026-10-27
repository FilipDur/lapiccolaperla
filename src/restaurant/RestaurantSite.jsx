import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, ArrowLeft, Menu, X, Phone, MapPin, Clock, CalendarDays, ChevronDown, Plus, Pause, Play } from "lucide-react";
import { parseRoute, routeHref } from "./routes.js";
import { usePhotoDepth } from "./usePhotoDepth.js";
import GoogleReviews from "./GoogleReviews.jsx";
import RestaurantMenu, { MenuOffers } from "./RestaurantMenu.jsx";
import SpecialMenuPage from "./SpecialMenuPage.jsx";
import "./restaurant.css";

const BOOKING = "https://la-piccola-perla.choiceqr.com/takeaway/booking";
const GOOGLE = "https://www.google.com/maps?cid=218766933573814212";
const SITE_URL = "https://lapiccolaperla.cz";
const UI = {
  cs: {
    pages: { home: "Úvod", menu: "Jídelní lístek", daily: "Denní menu", special: "Speciální menu", about: "O restauraci", gallery: "Galerie", contact: "Kontakt", notFound: "Stránka nenalezena" },
    skip: "Přejít na obsah", reserve: "Rezervovat stůl", open: "Otevřít navigaci", close: "Zavřít", next: "Další fotografie", previous: "Předchozí fotografie", language: "Vybrat jazyk", dailyNote: "Pondělí–pátek · 11:00–14:30", specialNote: "Něco navíc k našemu menu", menuNote: "Chutě Itálie, které máte rádi", heroKicker: "Ristorante italiano · Praha 1", hero: ["Chutná jako", "Itálie."], kitchenTitle: "Z naší kuchyně.", heroDish: "Těstoviny s mořskými plody", heroText: "Dobré jídlo, sklenka vína a čas strávený spolu.", discover: "Objevte naši kuchyni", welcome: "Benvenuti alla Piccola Perla", intro: "U nás jste vždy vítáni.", introText: "Jen pár kroků od Staroměstského náměstí se pražské uličky potkávají s italskou kuchyní. Zastavte se na pastu, křupavou pizzu nebo večeři, kterou není třeba uspěchat.", story: "Náš příběh", tableKicker: "A tavola", tableTitle: "Dobré chvíle začínají u stolu.", tableText: "Oběd ve dvou, rodinné setkání nebo dlouhý večer s přáteli. Najděte si svůj oblíbený stůl v Perlové ulici.", galleryTitle: "Nahlédněte k nám.", galleryLink: "Celá galerie", foodTitle: "Po italsku. S chutí.", foodText: "Pasta a rizota, pizza, maso i mořské plody. Vyberte si podle chuti ze stálého jídelního lístku.", menuIntro: "Od prvního sousta až po poslední espresso. Vyberte si z našich italských klasik.", category: "Kategorie jídelního lístku", reviewKicker: "Le vostre parole", reviewTitle: "Vaše zážitky. Vaše slova.", reviewText: "Aktuální hodnocení a zkušenosti našich hostů najdete přímo na Google.", reviewLink: "Přečíst recenze na Google", bookingKicker: "Ci vediamo a tavola", bookingTitle: "Váš stůl už se těší.", bookingText: "Naplánujte si příjemný oběd nebo večer u nás. Rezervujte online, nebo nám zavolejte.", daily: "Každý všední den něco dobrého.", loading: "Načítáme aktuální nabídku…", loadError: "Aktuální nabídku se nepodařilo načíst. Zkuste stránku obnovit nebo nám zavolejte.", specialEmpty: "Právě připravujeme další speciální nabídku. Mezitím si vyberte z našeho stálého menu.", specialIntro: "Něco navíc pro chvíle, kdy chcete ochutnat něco jiného.", contactTitle: "Najdete nás v Perlové.", contactText: "V centru Prahy, jen pár kroků od Staroměstského náměstí. Přijďte, rádi vás uvidíme.", address: "Adresa", hours: "Otevřeno každý den", phone: "Zavolejte nám", map: "Otevřít mapu", galleryIntro: "Náš interiér, naše kuchyně a malé detaily, které tvoří La Piccola Perla.", enlarge: "Zvětšit fotografii", back: "Zpět na úvod", notFound: "Tuhle stránku u nás nenajdete.", notFoundText: "Vyberte si z našeho menu nebo se vraťte na úvodní stránku.", cookie: "Používáme pouze technické cookies a místní úložiště pro fungování webu a volbu jazyka. Bez reklamních a analytických cookies.", accept: "Rozumím", footer: "Italská kuchyně v srdci Prahy.", all: "Prohlédnout menu", allergy: "Informace o alergenech vám rádi poskytneme na vyžádání.", photo: "Fotografie"
  },
  en: {
    pages: { home: "Home", menu: "Our menu", daily: "Lunch menu", special: "Special menu", about: "Our restaurant", gallery: "Gallery", contact: "Contact", notFound: "Page not found" },
    skip: "Skip to content", reserve: "Book a table", open: "Open navigation", close: "Close", next: "Next photo", previous: "Previous photo", language: "Choose language", dailyNote: "Monday–Friday · 11:00–14:30", specialNote: "Something a little special", menuNote: "The Italian flavours you love", heroKicker: "Ristorante italiano · Prague 1", hero: ["A taste of", "Italy."], kitchenTitle: "From our kitchen.", heroDish: "Seafood pasta", heroText: "Good food, a glass of wine and time spent together.", discover: "Discover our kitchen", welcome: "Benvenuti alla Piccola Perla", intro: "There is always a place for you.", introText: "Just steps from Old Town Square, Prague's streets meet Italian cooking. Join us for pasta, crisp pizza or a dinner with no need to rush.", story: "Our story", tableKicker: "A tavola", tableTitle: "Good moments begin at the table.", tableText: "Lunch for two, a family gathering or a long evening with friends. Find your favourite table on Perlová Street.", galleryTitle: "Take a look inside.", galleryLink: "Explore the gallery", foodTitle: "Italian at heart.", foodText: "Pasta and risotto, pizza, meat and seafood. Follow your appetite through our menu.", menuIntro: "From the first bite to the last espresso. Discover our Italian classics.", category: "Menu categories", reviewKicker: "Le vostre parole", reviewTitle: "Your moments. Your words.", reviewText: "Read the latest ratings and experiences shared by our guests directly on Google.", reviewLink: "Read our Google reviews", bookingKicker: "Ci vediamo a tavola", bookingTitle: "A table with your name on it.", bookingText: "Plan a relaxed lunch or an evening with us. Book online or give us a call.", daily: "Something delicious every weekday.", loading: "Loading the current menu…", loadError: "We couldn't load the current menu. Please refresh the page or call us.", specialEmpty: "Our next special menu is on its way. In the meantime, explore our regular menu.", specialIntro: "A little extra for those moments when you feel like something different.", contactTitle: "Find us on Perlová Street.", contactText: "In the heart of Prague, just steps from Old Town Square. We look forward to welcoming you.", address: "Address", hours: "Open every day", phone: "Give us a call", map: "Open the map", galleryIntro: "Our dining room, our kitchen and the small details that make La Piccola Perla.", enlarge: "Enlarge photo", back: "Back to home", notFound: "This page isn't on our menu.", notFoundText: "Explore our menu or return to the home page.", cookie: "We only use technical cookies and local storage for website features and your language preference. No advertising or analytics cookies.", accept: "Got it", footer: "Italian cooking in the heart of Prague.", all: "Explore the menu", allergy: "Please ask our team for information about allergens.", photo: "Photo"
  },
  it: {
    pages: { home: "Home", menu: "Il menù", daily: "Menù del giorno", special: "Menù speciale", about: "Il ristorante", gallery: "Galleria", contact: "Contatti", notFound: "Pagina non trovata" },
    skip: "Vai al contenuto", reserve: "Prenota un tavolo", open: "Apri la navigazione", close: "Chiudi", next: "Foto successiva", previous: "Foto precedente", language: "Scegli la lingua", dailyNote: "Lunedì–venerdì · 11:00–14:30", specialNote: "Qualcosa di speciale", menuNote: "I sapori italiani che ami", heroKicker: "Ristorante italiano · Praga 1", hero: ["Il gusto", "d’Italia."], kitchenTitle: "Dalla nostra cucina.", heroDish: "Pasta ai frutti di mare", heroText: "Buon cibo, un calice di vino e il piacere di stare insieme.", discover: "Scopri la nostra cucina", welcome: "Benvenuti alla Piccola Perla", intro: "Qui siete sempre i benvenuti.", introText: "A pochi passi dalla Piazza della Città Vecchia, le vie di Praga incontrano la cucina italiana. Fermatevi per una pasta, una pizza croccante o una cena senza fretta.", story: "La nostra storia", tableKicker: "A tavola", tableTitle: "I bei momenti iniziano a tavola.", tableText: "Un pranzo per due, una riunione di famiglia o una lunga serata con gli amici. Trovate il vostro tavolo preferito in via Perlová.", galleryTitle: "Date un’occhiata dentro.", galleryLink: "Tutta la galleria", foodTitle: "Italiano. Con gusto.", foodText: "Pasta e risotti, pizza, carne e pesce. Seguite il vostro appetito attraverso il nostro menù.", menuIntro: "Dal primo boccone all’ultimo espresso. Scoprite i nostri classici italiani.", category: "Categorie del menù", reviewKicker: "Le vostre parole", reviewTitle: "I vostri momenti. Le vostre parole.", reviewText: "Le valutazioni aggiornate e le esperienze dei nostri ospiti sono disponibili direttamente su Google.", reviewLink: "Leggi le recensioni su Google", bookingKicker: "Ci vediamo a tavola", bookingTitle: "Il vostro tavolo vi aspetta.", bookingText: "Organizzate un pranzo o una piacevole serata da noi. Prenotate online o chiamateci.", daily: "Qualcosa di buono ogni giorno feriale.", loading: "Caricamento del menù…", loadError: "Non è stato possibile caricare il menù. Aggiornate la pagina o chiamateci.", specialEmpty: "Stiamo preparando il prossimo menù speciale. Nel frattempo, scoprite il nostro menù alla carta.", specialIntro: "Qualcosa in più per quando avete voglia di provare un piatto diverso.", contactTitle: "Ci trovate in via Perlová.", contactText: "Nel centro di Praga, a pochi passi dalla Piazza della Città Vecchia. Vi aspettiamo.", address: "Indirizzo", hours: "Aperto tutti i giorni", phone: "Chiamateci", map: "Apri la mappa", galleryIntro: "Il nostro locale, la nostra cucina e i piccoli dettagli che fanno La Piccola Perla.", enlarge: "Ingrandisci la foto", back: "Torna alla home", notFound: "Questa pagina non è nel nostro menù.", notFoundText: "Scoprite il nostro menù o tornate alla pagina iniziale.", cookie: "Utilizziamo solo cookie tecnici e archiviazione locale per il sito e la lingua preferita. Nessun cookie pubblicitario o di analisi.", accept: "Ho capito", footer: "Cucina italiana nel cuore di Praga.", all: "Scopri il menù", allergy: "Per informazioni sugli allergeni, rivolgetevi al nostro personale.", photo: "Foto"
  }
};

function Picture({ photo, className = "", eager = false, thumbnail = false, ...props }) {
  if (!photo?.src) return null;
  return <img className={className} src={thumbnail ? photo.thumbSrc || photo.src : photo.src} alt={photo.title || "La Piccola Perla"} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" {...props} />;
}

function SectionHeading({ kicker, title, text, centered = false }) {
  return <div className={`r-section-heading${centered ? " r-centered" : ""}`}><p className="r-eyebrow">{kicker}</p><h2>{title}</h2>{text && <p className="r-section-intro">{text}</p>}</div>;
}

function Booking({ t, photo }) {
  return <section className="r-booking r-booking-editorial" aria-labelledby="r-booking-heading">
    <div className="r-booking-visual"><Picture photo={photo} className="r-booking-photo" /></div>
    <div className="r-booking-inner"><p className="r-eyebrow">{t.bookingKicker}</p><h2 id="r-booking-heading">{t.bookingTitle}</h2><p>{t.bookingText}</p><div className="r-actions"><a className="r-button r-button-light" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={18} /></a><a className="r-phone-link" href="tel:+420224282537"><Phone size={17} />+420 224 282 537</a></div></div>
  </section>;
}

function PhotoCarousel({ photos, t, openPhoto }) {
  const [index, setIndex] = useState(0);
  const selection = photos;
  const active = selection[index % Math.max(selection.length, 1)];
  if (!active) return null;
  return <div className="r-carousel" aria-roledescription="carousel" aria-label={t.galleryTitle}><button className="r-carousel-photo" onClick={() => openPhoto(active)} aria-label={`${t.enlarge}: ${active.title}`}><Picture photo={active} /><span className="r-photo-expand"><Plus size={20} /></span></button><div className="r-carousel-controls"><span aria-live="polite">{String(index + 1).padStart(2, "0")}<span className="r-count-separator" />{String(selection.length).padStart(2, "0")}</span><div><button className="r-icon-button" aria-label={t.previous} onClick={() => setIndex((value) => (value - 1 + selection.length) % selection.length)}><ArrowLeft size={19} /></button><button className="r-icon-button" aria-label={t.next} onClick={() => setIndex((value) => (value + 1) % selection.length)}><ArrowRight size={19} /></button></div></div></div>;
}

function GalleryGrid({ photos, t, openPhoto, compact = false }) {
  return <div className={`r-gallery-grid${compact ? " r-gallery-compact" : ""}`}>{photos.map((photo) => <button className="r-gallery-photo" key={photo.file || photo.src} onClick={() => openPhoto(photo)} aria-label={`${t.enlarge}: ${photo.title}`}><Picture photo={photo} thumbnail={!compact} /><span className="r-gallery-caption"><span>{photo.title}</span><Plus size={19} aria-hidden="true" /></span></button>)}</div>;
}

function MenuRows({ items, language }) {
  return <div className="r-menu-rows">{items.map((item, index) => {
    const content = language && language !== "cs" && item.translations ? item.translations[language] || item : item;
    return <article className="r-menu-row" key={item.id || `${item.name}-${index}`}><div><h3>{content.name}</h3>{content.description && <p>{content.description}</p>}</div><span className="r-menu-price">{language && language !== "cs" ? String(item.price || "").replace(/Kč/gi, "CZK") : item.price}</span></article>;
  })}</div>;
}

function DailyMenu({ items, status, today, t, language, photo }) {
  const date = new Date(`${today}T12:00:00Z`);
  const valid = !Number.isNaN(date.getTime());
  const weekend = valid && [0, 6].includes(date.getUTCDay());
  const dateText = valid ? new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Prague" }).format(date) : "";
  return <div className="r-container r-section r-daily-layout">
    <div className="r-daily-aside"><Picture photo={photo} /><p className="r-eyebrow">Buon appetito</p><p>{t.daily}</p></div>
    <section className="r-menu-paper r-daily-paper" aria-label="Aktuální denní menu">
      <header className="r-daily-heading">
        <p className="r-eyebrow">La Piccola Perla</p>
        <h2 lang="it">Il menù del giorno</h2>
        {valid && <p className="r-daily-date"><CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" /><time dateTime={today}>{dateText}</time></p>}
        <p className="r-daily-hours"><Clock size={15} strokeWidth={1.5} aria-hidden="true" />{t.dailyNote}</p>
      </header>
      <div className="r-daily-menu-content">
        {weekend ? <div className="r-menu-state"><h2>O víkendech denní menu nepodáváme.</h2><p>Rádi vám připravíme něco z našeho stálého jídelního lístku. Na denní menu se těšíme zase v pondělí.</p><a className="r-text-link" href={routeHref("menu", language)}>Prohlédnout jídelní lístek<ArrowRight size={18} /></a></div> : status === "loading" ? <p className="r-menu-state" role="status">{t.loading}</p> : status === "error" ? <p className="r-menu-state" role="alert">{t.loadError}</p> : items.length ? <MenuRows items={items} /> : <div className="r-menu-state"><h2>Dnešní menu právě připravujeme.</h2><p>Jakmile bude nabídka hotová, najdete ji tady. Mezitím se podívejte na náš stálý jídelní lístek.</p><a className="r-text-link" href={routeHref("menu", language)}>Jídelní lístek<ArrowRight size={18} /></a></div>}
        <footer className="r-daily-footer"><span lang="it">Buon appetito!</span><p className="r-allergy">{t.allergy}</p></footer>
      </div>
    </section>
  </div>;
}

function ContactDetails({ t, copy, large = false }) {
  return <div className={`r-contact-details${large ? " r-contact-large" : ""}`}><div><MapPin size={21} strokeWidth={1.5} /><p className="r-detail-label">{t.address}</p><p>Perlová 412/1<br />110 00 Praha 1</p><a className="r-text-link" href={GOOGLE} target="_blank" rel="noopener noreferrer">{t.map}<ArrowUpRight size={17} /></a></div><div><Clock size={21} strokeWidth={1.5} /><p className="r-detail-label">{t.hours}</p><p>11:00–23:00</p></div><div><Phone size={21} strokeWidth={1.5} /><p className="r-detail-label">{t.phone}</p><a className="r-contact-phone" href="tel:+420224282537">+420 224 282 537</a><a className="r-text-link" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={17} /></a></div></div>;
}

export default function RestaurantSite({ language = "cs", copy = {}, menuCategories = [], photos = [], dailyItems = [], dailyStatus = "loading", specialItems = [], specialStatus = "loading", today, onLanguageSelect, cookieNoticeAccepted, onAcceptCookies, applyLanguageSeo }) {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname, window.location.hash));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroMotionPaused, setHeroMotionPaused] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const dialogRef = useRef(null);
  const menuToggleRef = useRef(null);
  const mainRef = useRef(null);
  const siteRef = useRef(null);
  usePhotoDepth(siteRef, route.page);
  const callbackRef = useRef(onLanguageSelect);
  callbackRef.current = onLanguageSelect;
  const activeLanguage = route.language || language;
  const t = UI[activeLanguage] || UI.cs;
  const href = (page) => routeHref(page, activeLanguage);
  const findPhoto = (file) => photos.find((photo) => photo.file === file) || photos[0];
  const selectPhotos = (files) => files.map((file) => photos.find((photo) => photo.file === file)).filter(Boolean);
  const homeStoryPhotos = selectPhotos(["_DSR0014.webp", "_DSR0003.webp", "_DSR0022.webp", "_DSR0026.webp"]);
  const aboutKitchenPhotos = selectPhotos(["6.webp", "_DSR0076.webp", "3.webp"]);
  const lightboxPhotos = route.page === "about" ? aboutKitchenPhotos : photos;
  const selectedGallery = ["_DSR0014.webp", "_DSR0003.webp", "_DSR0026.webp"].map(findPhoto).filter(Boolean);
  const navPages = ["home", ...(activeLanguage === "cs" ? ["daily"] : []), "menu", "special", "about", "gallery", "contact"];

  useEffect(() => {
    const syncRoute = () => {
      const next = parseRoute(window.location.pathname, window.location.hash);
      setRoute(next);
      setMobileOpen(false);
      setActivePhoto(null);
      callbackRef.current?.(next.language);
      const aliases = ["#daily-menu", "#special-menu", "#reservation", "#about", "#gallery", "#menu", "#contact"];
      if (next.page !== "notFound" && (aliases.includes(window.location.hash) || next.page === "daily" && window.location.pathname !== "/denni-menu")) window.history.replaceState({}, "", routeHref(next.page, next.language));
    };
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => { window.removeEventListener("popstate", syncRoute); window.removeEventListener("hashchange", syncRoute); };
  }, []);

  useEffect(() => {
    applyLanguageSeo?.(activeLanguage);
    document.documentElement.lang = activeLanguage;
    const title = route.page === "home" ? (copy.title || "La Piccola Perla — Ristorante italiano, Praha") : `${t.pages[route.page]} | La Piccola Perla`;
    document.title = title;
    const canonical = `${SITE_URL}${routeHref(route.page, activeLanguage)}`;
    const setHead = (selector, tag, attrs) => {
      let element = document.head.querySelector(selector);
      if (!element) { element = document.createElement(tag); document.head.appendChild(element); }
      Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
    };
    setHead('link[rel="canonical"]', "link", { rel: "canonical", href: canonical });
    setHead('meta[property="og:title"]', "meta", { property: "og:title", content: title });
    setHead('meta[property="og:url"]', "meta", { property: "og:url", content: canonical });
    setHead('meta[name="robots"]', "meta", { name: "robots", content: route.page === "notFound" ? "noindex, follow" : "index, follow, max-image-preview:large" });
    for (const code of ["cs", "en", "it", "x-default"]) {
      setHead(`link[rel="alternate"][hreflang="${code}"]`, "link", { rel: "alternate", hreflang: code, href: `${SITE_URL}${routeHref(route.page, code)}` });
    }
  }, [route.page, activeLanguage, copy.title, applyLanguageSeo, t]);

  useEffect(() => {
    if (!mobileOpen) return;
    const escape = (event) => { if (event.key === "Escape") { setMobileOpen(false); menuToggleRef.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [mobileOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activePhoto && dialog && !dialog.open) dialog.showModal();
    else if (!activePhoto && dialog?.open) dialog.close();
    if (!activePhoto) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [activePhoto]);

  function navigate(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return;
    if (url.hash && url.pathname === window.location.pathname && !["#daily-menu", "#special-menu", "#reservation"].includes(url.hash)) return;
    const next = parseRoute(url.pathname, url.hash);
    if (next.page === "notFound") return;
    event.preventDefault();
    const destination = routeHref(next.page, next.language);
    if (window.location.pathname !== destination || window.location.hash) window.history.pushState({}, "", destination);
    setRoute(next);
    callbackRef.current?.(next.language);
    setMobileOpen(false);
    setActivePhoto(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }

  const nextPhoto = (direction) => {
    const index = lightboxPhotos.findIndex((photo) => photo.file === activePhoto?.file);
    setActivePhoto(lightboxPhotos[(index + direction + lightboxPhotos.length) % lightboxPhotos.length]);
  };

  return <div ref={siteRef} className="restaurant-site" onClick={navigate}>
    <a className="r-skip-link" href="#r-main">{t.skip}</a>
    <header className="r-header">
      <a className="r-logo" href={href("home")} aria-label="La Piccola Perla — home"><img src="/logo-transparent.png" width="1200" height="190" alt="La Piccola Perla" /></a>
      <nav className={`r-navigation${mobileOpen ? " is-open" : ""}`} id="r-navigation" aria-label={copy.navAria || t.open}>{navPages.map((page) => <a key={page} href={href(page)} aria-current={route.page === page ? "page" : undefined}>{t.pages[page]}</a>)}<a className="r-nav-booking" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={17} /></a></nav>
      <div className="r-header-actions"><div className="r-languages" aria-label={t.language}>{["cs", "en", "it"].map((code) => <a key={code} href={routeHref(route.page === "daily" && code !== "cs" ? "menu" : route.page, code)} lang={code} aria-label={{ cs: "Čeština", en: "English", it: "Italiano" }[code]} aria-current={activeLanguage === code ? "true" : undefined}>{code === "cs" ? "CZ" : code.toUpperCase()}</a>)}</div><a className="r-button r-header-booking" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={16} /></a><button ref={menuToggleRef} className="r-mobile-toggle r-icon-button" aria-label={mobileOpen ? t.close : t.open} aria-expanded={mobileOpen} aria-controls="r-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button></div>
    </header>

    <main id="r-main" ref={mainRef} tabIndex={-1}>
      {route.page === "home" ? <>
        <section className="r-hero r-hero-editorial" aria-labelledby="r-hero-title" data-motion={heroMotionPaused ? "paused" : "playing"}>
          <div className="r-hero-inner r-container">
            <div className="r-hero-copy">
              <p className="r-eyebrow">{t.heroKicker}</p>
              <h1 id="r-hero-title"><span>{t.hero[0]}</span>{" "}<em>{t.hero[1]}</em></h1>
            </div>
            <div className="r-hero-ingredient r-hero-pecorino" aria-hidden="true"><img src="/images/hero-pecorino-v1.webp" width="512" height="512" alt="" decoding="async" /><span>Pecorino.</span></div>
            <div className="r-hero-ingredient r-hero-tomato" aria-hidden="true"><img src="/images/hero-tomato-v1.webp" width="512" height="512" alt="" decoding="async" /><span>Pomodoro.</span></div>
            <div className="r-hero-intro">
              <p className="r-hero-description">{t.heroText}</p>
              <div className="r-actions"><a className="r-button" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={18} /></a><a className="r-text-link" href={href("menu")}>{t.all}<ArrowRight size={18} /></a></div>
            </div>
            <div className="r-hero-visual r-hero-depth" data-depth>
              <div className="r-hero-halo" aria-hidden="true"><img src="/images/hero-halo.svg" width="480" height="480" alt="" /></div>
              <div className="r-hero-fork-plane"><img className="r-hero-fork" src="/images/luxury-fork-amatriciana-v2.webp" width="1024" height="1536" alt={{ cs: "Vidlička s těstovinami amatriciana", en: "A fork of amatriciana pasta", it: "Una forchetta di pasta all’amatriciana" }[activeLanguage]} loading="eager" fetchPriority="high" decoding="async" /></div>
            </div>
            <div className="r-hero-side"><svg className="r-hero-note-line" viewBox="0 0 150 60" fill="none" aria-hidden="true"><path pathLength="1" d="M145 8C117 47 61 52 7 23M7 23L24 22M7 23L15 39" /></svg><div className="r-hero-detail"><span>AMATRICIANA</span><p>La dolce vita.</p></div></div>
          </div>
          <div className="r-hero-bottom r-container"><span>Perlová 412/1 · Praha 1</span><a href="#r-home-menu">{t.discover}<ChevronDown size={18} /></a><div className="r-hero-bottom-end"><span>11:00 — 23:00</span><button className="r-hero-motion-toggle" type="button" onClick={() => setHeroMotionPaused((paused) => !paused)} aria-pressed={heroMotionPaused} aria-label={{ cs: "Pozastavit animace", en: "Pause animations", it: "Metti in pausa le animazioni" }[activeLanguage]}>{heroMotionPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}</button></div></div>
        </section>
        <MenuOffers language={activeLanguage} specialItems={specialItems} specialStatus={specialStatus} home />
        <section className="r-editorial-story"><div className="r-editorial-story-inner r-container"><div className="r-editorial-story-copy"><SectionHeading kicker={t.welcome} title={t.intro} text={t.introText} /><a className="r-text-link" href={href("about")}>{t.story}<ArrowUpRight size={19} /></a><span className="r-story-signature">La dolce vita.</span></div><div className="r-editorial-story-image"><PhotoCarousel photos={homeStoryPhotos} t={t} openPhoto={setActivePhoto} /></div></div></section>
        <section className="r-kitchen r-container r-section">
          <div className="r-heading-row"><SectionHeading kicker="Fatto con amore" title={t.kitchenTitle} text={t.foodText} /><a className="r-text-link" href={href("menu")}>{t.all}<ArrowUpRight size={19} /></a></div>
          <div className="r-food-composition">
            {[
              { file: "1.webp", name: "Pizza.", kind: "pizza", src: "/images/editorial-pizza-cutout-v3.webp" },
              { file: "4.webp", name: "Pasta.", kind: "pasta", src: "/images/tuscany-pasta-cutout-v1.webp" },
              { file: "_DSR0090.webp", name: "Dolce.", kind: "dolce", src: "/images/editorial-dessert-cutout-v3.webp" },
            ].map(({ file, name, kind, src }, index) => {
              const photo = { ...findPhoto(file), src, thumbSrc: src };
              return <button className={`r-food-piece r-food-${kind}`} data-depth key={file} onClick={() => setActivePhoto(photo)} aria-label={`${t.enlarge}: ${photo.title}`}>
                <span className="r-food-stage"><img src={src} width="1536" height="1024" alt={photo.title} loading="lazy" decoding="async" /><span className="r-photo-expand"><Plus size={20} /></span></span>
                <span className="r-food-caption"><span className="r-food-number">{String(index + 1).padStart(2, "0")}</span><span className="r-food-name">{name}</span><span className="r-food-description">{photo.title}</span><ArrowUpRight size={22} strokeWidth={1.3} /></span>
              </button>;
            })}
          </div>
        </section>
        <section className="r-gallery-section r-section"><div className="r-container r-heading-row"><SectionHeading kicker="La Piccola Perla" title={t.galleryTitle} /><a className="r-text-link" href={href("gallery")}>{t.galleryLink}<ArrowUpRight size={18} /></a></div><div className="r-container"><GalleryGrid photos={selectedGallery} t={t} openPhoto={setActivePhoto} compact /></div></section>
        <GoogleReviews language={activeLanguage} /><Booking t={t} photo={findPhoto("_DSR0014.webp")} />
      </> : <>
        {!["menu", "special"].includes(route.page) && <header className={`r-page-heading${route.page === "about" ? " r-page-heading-photo" : ""}`}>{route.page === "about" && <Picture photo={findPhoto("_DSR0023.webp")} eager />}<div className="r-container"><p className="r-eyebrow">{route.page === "menu" ? "La nostra cucina" : route.page === "daily" ? "Buon appetito" : route.page === "special" ? "Qualcosa di speciale" : "La Piccola Perla"}</p><h1>{route.page === "contact" ? t.contactTitle : route.page === "about" ? t.tableTitle : t.pages[route.page]}</h1><p>{route.page === "menu" ? t.menuIntro : route.page === "gallery" ? t.galleryIntro : route.page === "contact" ? t.contactText : route.page === "special" ? t.specialIntro : route.page === "daily" ? t.dailyNote : route.page === "notFound" ? t.notFoundText : t.tableText}</p></div></header>}
        {route.page === "menu" && <RestaurantMenu categories={menuCategories} language={activeLanguage} specialItems={specialItems} specialStatus={specialStatus} allergy={copy.menu?.allergy || t.allergy} />}
        {route.page === "daily" && <DailyMenu items={dailyItems} status={dailyStatus} today={today} t={UI.cs} language="cs" photo={findPhoto("6.webp")} />}
        {route.page === "special" && <SpecialMenuPage items={specialItems} status={specialStatus} language={activeLanguage} allergy={copy.menu?.allergy || t.allergy} />}
        {route.page === "about" && <><section className="r-about-intro r-container r-section"><p className="r-eyebrow">{t.welcome}</p><h2>{t.intro}</h2><div>{(copy.about?.text || [t.introText]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section><section className="r-story r-container r-section"><PhotoCarousel photos={aboutKitchenPhotos} t={t} openPhoto={setActivePhoto} /><div className="r-story-copy"><SectionHeading kicker="La nostra cucina" title={t.foodTitle} text={t.foodText} /><a className="r-button" href={href("menu")}>{t.all}<ArrowRight size={18} /></a></div></section><Booking t={t} photo={findPhoto("_DSR0022.webp")} /></>}
        {route.page === "gallery" && <section className="r-container r-section"><GalleryGrid photos={photos} t={t} openPhoto={setActivePhoto} /></section>}
        {route.page === "contact" && <><section className="r-container r-section"><ContactDetails t={t} copy={copy} large /><a className="r-contact-image" href={GOOGLE} target="_blank" rel="noopener noreferrer"><Picture photo={findPhoto("_DSR0003.webp")} /><span><MapPin size={23} />Perlová 412/1, Praha 1<ArrowUpRight size={23} /></span></a></section><Booking t={t} photo={findPhoto("_DSR0026.webp")} /></>}
        {route.page === "notFound" && <div className="r-container r-not-found r-section"><h2>{t.notFound}</h2><a className="r-button" href={href("home")}>{t.back}<ArrowRight size={18} /></a></div>}
      </>}
    </main>

    <footer className="r-footer"><div className="r-container"><div className="r-footer-top"><a className="r-footer-logo" href={href("home")}><img src="/logo-transparent.png" alt="La Piccola Perla" width="1200" height="190" /></a><p>{t.footer}</p><a className="r-text-link" href={BOOKING} target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={18} /></a></div><ContactDetails t={t} copy={copy} /><div className="r-footer-bottom"><p>© {new Date().getFullYear()} La Piccola Perla</p><nav aria-label={copy.footerAria || t.pages.contact}>{["menu", "about", "gallery", "contact"].map((page) => <a key={page} href={href(page)}>{t.pages[page]}</a>)}</nav></div><div className="r-footer-legal"><span>{copy.legal?.operator || "Provozovatel"}: B &amp; D DINAMIC, s.r.o.</span><span>{copy.legal?.registeredOffice || "Sídlo"}: Perlová 1020/8, Praha 1</span><span>{copy.legal?.companyId || "IČO"}: 26764776 · {copy.legal?.vatId || "DIČ"}: CZ26764776</span><a href="mailto:la.piccola.perla@email.cz">la.piccola.perla@email.cz</a></div></div></footer>

    {!cookieNoticeAccepted && <aside className="r-cookie-notice" aria-label="Cookies"><p>{t.cookie}</p><button className="r-button" onClick={onAcceptCookies}>{t.accept}</button></aside>}

    <dialog ref={dialogRef} className="r-lightbox" aria-label={t.pages.gallery} onCancel={(event) => { event.preventDefault(); setActivePhoto(null); }} onClose={() => setActivePhoto(null)} onClick={(event) => { if (event.target === event.currentTarget) setActivePhoto(null); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); nextPhoto(-1); } if (event.key === "ArrowRight") { event.preventDefault(); nextPhoto(1); } }}>
      {activePhoto && <><button className="r-lightbox-close r-icon-button" aria-label={t.close} onClick={() => setActivePhoto(null)} autoFocus><X size={24} /></button><button className="r-lightbox-prev r-icon-button" aria-label={t.previous} onClick={() => nextPhoto(-1)}><ArrowLeft /></button><figure><Picture photo={activePhoto} eager /><figcaption>{activePhoto.title}<span>{lightboxPhotos.findIndex((photo) => photo.file === activePhoto.file) + 1} / {lightboxPhotos.length}</span></figcaption></figure><button className="r-lightbox-next r-icon-button" aria-label={t.next} onClick={() => nextPhoto(1)}><ArrowRight /></button></>}
    </dialog>
  </div>;
}
