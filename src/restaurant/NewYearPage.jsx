import { ArrowUpRight, Phone } from "lucide-react";
import { menuCategories } from "../data/menu.js";
import { newYearCopy } from "./newYearCopy.js";
import { routeHref } from "./routes.js";
import "./new-year.css";

const selection = [
  ["starters", "Burrata con rucola e pomodorini"],
  ["pasta", "Spaghetti ai frutti di mare"],
  ["meat", "Tagliata di manzo"],
  ["desserts", "Tiramisu"],
  ["wine", "Prosecco DOC 0,15 l"],
];

export function NewYearPromotion({ language }) {
  const text = newYearCopy[language];
  return (
    <a className="r-new-year-promotion r-container" href={routeHref("newYear", language)}>
      <span className="r-new-year-event">{text.event}</span>
      <span className="r-new-year-link">{text.label}<ArrowUpRight size={18} aria-hidden="true" /></span>
    </a>
  );
}

export default function NewYearPage({ language, categories, allergy }) {
  const text = newYearCopy[language];
  const items = selection.flatMap(([categoryId, name]) => {
    // The localized menu preserves the order of its source categories and dishes.
    const originalCategory = menuCategories.find(({ id }) => id === categoryId);
    const index = originalCategory?.items.findIndex((item) => item.name === name);
    const item = categories.find(({ id }) => id === categoryId)?.items[index];
    return item ? [{ ...item, key: name }] : [];
  });

  return (
    <article className="r-container r-new-year">
      <header className="r-new-year-intro">
        <p className="r-eyebrow">{text.event} · Perlová 412/1</p>
        <h1>{text.heading[0]} <em>{text.heading[1]}</em></h1>
        <p className="r-new-year-description">{text.intro}</p>
        <a className="r-button" href="tel:+420224282537">
          {text.call}<Phone size={16} aria-hidden="true" />
        </a>
        <p className="r-new-year-booking-note">{text.booking}</p>
      </header>

      <section className="sp-paper r-new-year-paper" aria-labelledby="r-new-year-menu-title">
        <header className="sp-paper-heading">
          <img src="/logo-transparent.png" alt="La Piccola Perla" width="1200" height="190" />
          <h2 id="r-new-year-menu-title">{text.menu}</h2>
        </header>
        <ul className="sp-list r-new-year-list">
          {items.map(({ key, name, description, price }) => (
            <li className="sp-item" key={key}>
              <div>
                <h3>{name}</h3>
                {description && <p>{description}</p>}
              </div>
              <strong>{price}</strong>
            </li>
          ))}
        </ul>
        <div className="r-new-year-paper-footer">
          <p>{allergy}</p>
          <a className="r-text-link" href={routeHref("menu", language)}>
            {text.fullMenu}<ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <figure className="r-new-year-dish">
        <img src="/images/menu-2026-tagliata-cutout-v2.webp" alt="Tagliata di manzo" width="1536" height="1024" decoding="async" />
        <figcaption>{text.imageNote}</figcaption>
      </figure>
    </article>
  );
}
