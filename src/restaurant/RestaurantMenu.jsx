import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Wine } from "lucide-react";
import { routeHref } from "./routes.js";
import "./restaurant-menu.css";

const text = {
  cs: { title: ["Na co máte", "dnes chuť?"], intro: "Od prvního sousta až po poslední espresso. Objevte naši Itálii, talíř po talíři.", browse: "Vybrat si z menu", lunch: "Dnes na oběd", lunchText: "Všední dny · 11:00–14:30", special: "Speciální menu", specialText: "Něco navíc ke stálému menu", offers: "Naše nabídky", categories: "Kategorie jídelního lístku", allSpecial: "Celá speciální nabídka", specialReady: "Aktuálně v nabídce", specialEmpty: "Další speciální nabídku připravujeme.", specialLoading: "Načítáme speciální nabídku…", specialError: "Nabídku se nepodařilo načíst. Podrobnosti najdete zde.", open: "Prohlédnout", wine: "Ke každému soustu dobrá sklenka.", pasta: "Vidličku do ruky. A buon appetito.", pizza: "Ještě jeden kousek?", dessert: "Na sladkou tečku je vždycky místo.", menu: "Jídelní lístek" },
  en: { title: ["What are you", "craving today?"], intro: "From the first bite to the last espresso. Discover our Italy, one plate at a time.", browse: "Explore the menu", lunch: "Join us for lunch", lunchText: "Weekdays · 11:00–14:30 · Czech menu", special: "Special menu", specialText: "Something extra alongside our classics", offers: "Our menus", categories: "Menu categories", allSpecial: "Explore all specials", specialReady: "On the menu now", specialEmpty: "Our next special menu is on its way.", specialLoading: "Loading the special menu…", specialError: "We could not load the specials. Find details here.", open: "Explore", wine: "A good glass with every bite.", pasta: "Pick up your fork. Buon appetito.", pizza: "One more slice?", dessert: "There is always room for something sweet.", menu: "Our menu" },
  it: { title: ["Di cosa avete", "voglia oggi?"], intro: "Dal primo boccone all’ultimo espresso. Scoprite la nostra Italia, un piatto alla volta.", browse: "Scopri il menù", lunch: "A pranzo da noi", lunchText: "Giorni feriali · 11:00–14:30 · Menù in ceco", special: "Menù speciale", specialText: "Qualcosa in più accanto ai nostri classici", offers: "I nostri menù", categories: "Categorie del menù", allSpecial: "Tutte le specialità", specialReady: "Oggi nel menù", specialEmpty: "Stiamo preparando il prossimo menù speciale.", specialLoading: "Caricamento del menù speciale…", specialError: "Impossibile caricare le specialità. Trovate i dettagli qui.", open: "Scopri", wine: "Un buon calice con ogni boccone.", pasta: "Forchetta alla mano. Buon appetito.", pizza: "Ancora una fetta?", dessert: "C’è sempre spazio per un dolce.", menu: "Il menù" },
};

const menuVisuals = {
  soups: { name: "Zuppa di pesce", src: "/images/menu-2026-soup-cutout-v2.webp" },
  salads: { name: "Insalata Caprese", src: "/images/menu-2026-caprese-v1.webp" },
  starters: { name: "Burrata con rucola e pomodorini", src: "/images/menu-2026-burrata-v1.webp" },
  pasta: { name: "Spaghetti alla carbonara", src: "/images/menu-2026-carbonara-v1.webp" },
  pizza: { name: "Bufalina", src: "/images/menu-2026-bufalina-v1.webp" },
  meat: { name: "Tagliata di manzo", src: "/images/menu-2026-tagliata-cutout-v2.webp" },
  seafood: { name: "Calmaretti alla griglia", src: "/images/menu-2026-calamari-cutout-v2.webp" },
  sides: { name: "Focaccia", src: "/images/menu-2026-focaccia-v2.webp" },
  desserts: { name: "Tiramisu", src: "/images/menu-2026-tiramisu-v1.webp" },
  drinks: { name: "Espresso", src: "/images/menu-2026-espresso-v1.webp" },
  wine: { name: "Primitivo Manduria Cantolio", src: "/images/menu-2026-mandonion-v2.webp" },
  spirits: { name: "Grappa la Bianca", src: "/images/menu-2026-grappa-v1.webp" },
};
const imageLabels = { cs: "Ilustrační fotografie", en: "Illustrative photograph", it: "Fotografia illustrativa" };

const localItem = (item, language) => language === "cs" ? item : item.translations?.[language] || item;
const price = (value, language) => language === "cs" ? value : String(value || "").replace(/Kč/gi, "CZK");
const offerName = (item, language) => {
  const name = localItem(item, language).name || "";
  const locale = language === "cs" ? "cs-CZ" : language;
  return name === name.toLocaleUpperCase(locale) ? name.charAt(0) + name.slice(1).toLocaleLowerCase(locale) : name;
};

export function MenuOffers({ language, specialItems = [], specialStatus = "loading", home = false }) {
  const t = text[language] || text.cs;
  const available = specialStatus === "ready" && specialItems.length > 0;
  const status = specialStatus === "loading" ? t.specialLoading : specialStatus === "error" ? t.specialError : t.specialEmpty;
  const selected = available && specialItems.find((item) => item.name.toLocaleLowerCase("cs-CZ").includes("tatarák z tuňáka s avokádem"));
  const imageLabel = imageLabels[language] || imageLabels.cs;
  return <section className={`rm-offers r-container${home ? " rm-offers-home" : ""}`} id={home ? "r-home-menu" : undefined} aria-label={t.offers}>
    <a className="rm-lunch" href={routeHref("daily", language)}><div className="rm-offer-topline"><span className="rm-offer-index" aria-hidden="true">01</span><span className="rm-offer-kicker">{t.lunchText}</span></div><h2>{t.lunch}</h2><i className="rm-lunch-signature" aria-hidden="true">Buon pranzo.</i><span className="rm-lunch-link">{t.open}<span className="rm-offer-arrow"><ArrowUpRight size={20} strokeWidth={1.4} /></span></span></a>
    <div className={`rm-special${selected ? " rm-special-with-photo" : ""}`}><div className="rm-offer-topline"><span className="rm-offer-index" aria-hidden="true">02</span><span className="rm-offer-kicker">{available ? t.specialReady : t.specialText}</span></div>
      <div className="rm-special-content"><div className="rm-special-copy"><h2><a href={routeHref("special", language)}>{t.special}</a></h2>
        {available ? <ul>{specialItems.slice(0, 3).map((item) => <li key={item.id || item.name}><span>{offerName(item, language)}</span><strong>{price(item.price, language)}</strong></li>)}</ul> : <p className="rm-special-status" role={specialStatus === "error" ? "alert" : "status"}>{status}</p>}
      </div>{selected && <figure className="rm-special-photo"><img src="/images/menu-2026-tuna-tartare-v1.webp" alt={`${offerName(selected, language)} · ${imageLabel}`} width="1536" height="1024" loading="lazy" decoding="async" /><figcaption><span>{offerName(selected, language)}</span><small>{imageLabel}</small></figcaption></figure>}</div>
      <a className="rm-special-link" href={routeHref("special", language)}>{t.allSpecial}<span className="rm-offer-arrow"><ArrowUpRight size={20} strokeWidth={1.4} /></span></a>
    </div>
  </section>;
}

function DishList({ category, language }) {
  return <div className="rm-dishes">{category.items.map((item, index) => <article className="rm-dish" id={`rm-dish-${category.id}-${index}`} key={item.id || `${item.name}-${index}`}><div className="rm-dish-line"><h3>{item.name}</h3><span aria-hidden="true" /><strong>{price(item.price, language)}</strong></div>{item.description && <p>{item.description}</p>}</article>)}</div>;
}

export default function RestaurantMenu({ categories, language, specialItems, specialStatus, allergy }) {
  const t = text[language] || text.cs;
  const contentRef = useRef(null);
  const [active, setActive] = useState(categories[0]?.id || "");
  const imageLabel = imageLabels[language] || imageLabels.cs;

  useEffect(() => {
    const elements = [...contentRef.current.querySelectorAll("[data-menu-category]")];
    let observer;
    const observe = () => {
      observer?.disconnect();
      const intersecting = new Map();
      const header = document.querySelector(".r-header")?.getBoundingClientRect().height || 96;
      const bar = document.querySelector(".rm-category-bar")?.getBoundingClientRect().height || 68;
      const top = Math.min(header + bar + 16, window.innerHeight / 2);
      const bottom = Math.max(0, window.innerHeight - top - 160);
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => intersecting.set(entry.target, entry.isIntersecting));
        const visible = elements.filter((element) => intersecting.get(element)).at(-1);
        if (visible) setActive(visible.dataset.menuCategory);
      }, { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 });
      elements.forEach((element) => observer.observe(element));
    };
    observe();
    window.addEventListener("resize", observe, { passive: true });
    return () => { observer?.disconnect(); window.removeEventListener("resize", observe); };
  }, [categories]);

  return <div className="rm-page">
    <header className="rm-hero r-container">
      <div className="rm-hero-copy"><p className="r-eyebrow">La nostra cucina · {t.menu}</p><h1>{t.title[0]} <em>{t.title[1]}</em></h1><p className="rm-hero-intro">{t.intro}</p><a className="r-text-link" href="#rm-categories">{t.browse}<ArrowDown size={18} /></a></div>
      <div className="rm-hero-art"><span className="rm-hero-circle" aria-hidden="true" /><img className="rm-hero-dish" src="/images/editorial-pizza-cutout-v3.webp" alt="Pizza · La Piccola Perla" width="1536" height="1024" fetchPriority="high" /><span className="rm-hero-signature" aria-hidden="true">Buon<br />appetito!</span><span className="rm-hero-caption">La nostra pizza.<br /><span>Fatta con passione.</span></span></div>
    </header>
    <MenuOffers language={language} specialItems={specialItems} specialStatus={specialStatus} />
    <nav className="rm-category-bar" aria-label={t.categories} id="rm-categories"><div className="r-container">{categories.map((category) => <a key={category.id} href={`#r-category-${category.id}`} aria-current={active === category.id ? "location" : undefined} onClick={() => setActive(category.id)}>{category.label}</a>)}</div></nav>
    <div className="rm-chapters r-container" ref={contentRef}>
      {categories.map((category, index) => {
        const featured = ["pasta", "pizza", "desserts"].includes(category.id);
        const visual = menuVisuals[category.id];
        const itemIndex = category.items.findIndex((item) => item.name === visual?.name);
        const illustratedItem = category.items[itemIndex];
        const imageSrc = illustratedItem && visual.src;
        const isWine = category.id === "wine";
        return <section className={`rm-chapter rm-chapter-${category.id}${featured ? " rm-chapter-featured" : ""}${isWine ? " rm-chapter-wine" : ""}${imageSrc && !featured && !isWine ? " rm-chapter-photo" : ""}`} id={`r-category-${category.id}`} data-menu-category={category.id} aria-labelledby={`r-heading-${category.id}`} key={category.id}>
          <header className="rm-chapter-heading"><div><span className="rm-chapter-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p className="r-eyebrow">{category.accent}</p><h2 id={`r-heading-${category.id}`}>{category.label}</h2>{featured && <p className="rm-chapter-description">{t[category.id === "desserts" ? "dessert" : category.id]}</p>}{isWine && <p className="rm-chapter-description"><Wine size={20} strokeWidth={1.2} />{t.wine}</p>}{illustratedItem && <a className="rm-illustrated-dish" href={`#rm-dish-${category.id}-${itemIndex}`}><span>{illustratedItem.name}</span><strong>{price(illustratedItem.price, language)}</strong><ArrowDown size={14} /></a>}{imageSrc && visual.src && <small className="rm-image-note">{imageLabel}</small>}</div>
            {imageSrc && <img src={imageSrc} alt={`${illustratedItem.name}${visual.src ? ` · ${imageLabel}` : ""}`} width="1536" height="1024" loading="lazy" decoding="async" />}
          </header>
          <DishList category={category} language={language} />
        </section>;
      })}
      <p className="rm-allergy">{allergy}</p>
    </div>
  </div>;
}
