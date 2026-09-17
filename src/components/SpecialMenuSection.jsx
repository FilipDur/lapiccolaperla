import React from "react";
import "./special-menu.css";

export const specialMenuCopy = {
  cs: {
    navLabel: "Speciální menu",
    title: "Speciální menu",
    eyebrow: "Něco výjimečného",
    intro: "Něco navíc k našemu stálému menu. Objevte aktuální speciality La Piccola Perla.",
    allergy: "Informace o alergenech vám rádi poskytneme na vyžádání."
  },
  en: {
    navLabel: "Special menu",
    title: "Special menu",
    eyebrow: "Something special",
    intro: "A little extra alongside our regular menu. Discover the current specials at La Piccola Perla.",
    allergy: "Please ask our team for information about allergens."
  },
  it: {
    navLabel: "Menù speciale",
    title: "Menù speciale",
    eyebrow: "Qualcosa di speciale",
    intro: "Qualcosa in più rispetto al nostro menù abituale. Scopri le specialità del momento di La Piccola Perla.",
    allergy: "Per informazioni sugli allergeni, rivolgiti al nostro personale."
  }
};

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

export const getCompleteSpecialMenuItems = (items) => (
  Array.isArray(items)
    ? items.filter((item) => item
      && hasText(item.name)
      && hasText(item.description)
      && hasText(item.price)
      && ["en", "it"].every((language) => (
        hasText(item.translations?.[language]?.name)
        && hasText(item.translations?.[language]?.description)
      )))
    : []
);

export default function SpecialMenuSection({ items, language = "cs" }) {
  const locale = Object.hasOwn(specialMenuCopy, language) ? language : "cs";
  const copy = specialMenuCopy[locale];
  const completeItems = getCompleteSpecialMenuItems(items);

  if (completeItems.length === 0) return null;

  return (
    <section
      className="special-menu-section section-pad"
      id="special-menu"
      aria-labelledby="special-menu-title"
    >
      <div className="special-menu-shell">
        <header className="special-menu-heading">
          <span className="special-menu-eyebrow">{copy.eyebrow}</span>
          <h2 id="special-menu-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </header>

        <div className="special-menu-frame">
          <span className="special-menu-signature" aria-hidden="true">La Piccola Perla</span>
          <ul className="special-menu-list">
            {completeItems.map((item) => {
              const content = locale === "cs" ? item : item.translations[locale];
              const price = locale === "cs" ? item.price : item.price.replace(/Kč/gi, "CZK");

              return (
                <li className="special-menu-item" key={item.id}>
                  <div className="special-menu-dish">
                    <h3>{content.name}</h3>
                    <p>{content.description}</p>
                  </div>
                  <strong className="special-menu-price">{price}</strong>
                </li>
              );
            })}
          </ul>
          <p className="special-menu-allergy">{copy.allergy}</p>
        </div>
      </div>
    </section>
  );
}
