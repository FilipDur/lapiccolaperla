import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { routeHref } from "./routes.js";
import "./special-menu-page.css";

const copy = {
  cs: { title: "Speciální menu.", intro: "Něco výjimečného ke stálému menu. Aktuální výběr naší kuchyně, od prvního sousta až po sladkou tečku.", back: "Jídelní lístek", reserve: "Rezervovat stůl", selected: "Z aktuální nabídky", illustration: "Ilustrační fotografie", loading: "Načítáme aktuální nabídku…", error: "Aktuální nabídku se nepodařilo načíst. Obnovte stránku nebo nám zavolejte.", empty: "Právě připravujeme další speciální nabídku. Mezitím si vyberte z našeho stálého menu." },
  en: { title: "Something special.", intro: "A little extra alongside our classics. The current selection from our kitchen, from the first bite to something sweet.", back: "Our menu", reserve: "Book a table", selected: "On the menu now", illustration: "Illustrative photograph", loading: "Loading the current specials…", error: "We could not load the specials. Refresh the page or give us a call.", empty: "Our next special menu is on its way. In the meantime, explore our regular menu." },
  it: { title: "Qualcosa di speciale.", intro: "Qualcosa in più accanto ai nostri classici. Le proposte della nostra cucina, dal primo boccone al dolce.", back: "Il menù", reserve: "Prenota un tavolo", selected: "Oggi nel menù", illustration: "Fotografia illustrativa", loading: "Caricamento delle specialità…", error: "Impossibile caricare le specialità. Aggiornate la pagina o chiamateci.", empty: "Stiamo preparando il prossimo menù speciale. Nel frattempo, scoprite il nostro menù alla carta." },
};

const displayName = (name = "", language) => name === name.toLocaleUpperCase(language === "cs" ? "cs-CZ" : language) ? name.charAt(0) + name.slice(1).toLocaleLowerCase(language === "cs" ? "cs-CZ" : language) : name;
const itemName = (item, language) => displayName(language === "cs" ? item.name : item.translations?.[language]?.name || item.name, language);
const itemPrice = (item, language) => language === "cs" ? item.price : item.price.replace(/Kč/gi, "CZK");

export default function SpecialMenuPage({ items, status, language, allergy }) {
  const t = copy[language] || copy.cs;
  const selected = status === "ready" && items.find((item) => item.name.toLocaleLowerCase("cs-CZ").includes("tatarák z tuňáka s avokádem"));
  return <div className="sp-page r-container">
    <div className="sp-intro"><a className="r-text-link sp-back" href={routeHref("menu", language)}><ArrowLeft size={16} />{t.back}</a><p className="r-eyebrow">Qualcosa di speciale</p><h1>{t.title}</h1><p className="sp-description">{t.intro}</p>
      {selected && <figure className="sp-dish"><span className="sp-dish-circle" aria-hidden="true" /><img src="/images/menu-2026-tuna-tartare-v1.webp" alt={`${itemName(selected, language)} · ${t.illustration}`} width="1536" height="1024" fetchPriority="high" /><figcaption><span>{t.selected}</span><strong>{itemName(selected, language)}</strong><b>{itemPrice(selected, language)}</b><small>{t.illustration}</small></figcaption></figure>}
      <a className="r-text-link" href="https://la-piccola-perla.choiceqr.com/takeaway/booking" target="_blank" rel="noopener noreferrer">{t.reserve}<ArrowUpRight size={17} /></a>
    </div>
    <section className="sp-paper" aria-label={t.title}>
      <span className="sp-botanical sp-botanical-top" aria-hidden="true"><img src="/special-menu-botanicals.webp" alt="" /></span><span className="sp-botanical sp-botanical-bottom" aria-hidden="true"><img src="/special-menu-botanicals.webp" alt="" /></span>
      <header className="sp-paper-heading"><img src="/logo-transparent.png" alt="La Piccola Perla" width="1200" height="190" /><p>I nostri piatti speciali</p><span aria-hidden="true">✦</span></header>
      {status === "loading" ? <p className="sp-state" role="status">{t.loading}</p> : status === "error" ? <p className="sp-state" role="alert">{t.error}</p> : items.length ? <ol className="sp-list">{items.map((item, index) => <li className="sp-item" key={item.id || item.name}><span className="sp-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h2>{itemName(item, language)}</h2><strong>{itemPrice(item, language)}</strong></li>)}</ol> : <div className="sp-state"><p>{t.empty}</p><a className="r-text-link" href={routeHref("menu", language)}>{t.back}<ArrowUpRight size={17} /></a></div>}
      <p className="sp-allergy">{allergy}</p>
    </section>
  </div>;
}
