import React, { forwardRef, useLayoutEffect, useRef } from "react";
import { fitMenuPrintSheet } from "../lib/menuPrintLayout";
import "./special-menu-print.css";

const SpecialMenuPrintSheet = forwardRef(function SpecialMenuPrintSheet({ logo, items }, forwardedRef) {
  const sheetRef = useRef(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    let active = true;
    const fit = () => { if (active) fitMenuPrintSheet(sheet); };
    fit();
    document.fonts?.ready.then(fit);
    Promise.all(Array.from(sheet.querySelectorAll("img"), (image) => image.decode().catch(() => {}))).then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(sheet);
    observer.observe(sheet.querySelector(".menu-print-items-viewport"));
    window.addEventListener("beforeprint", fit);
    window.addEventListener("afterprint", fit);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("afterprint", fit);
    };
  }, [items, logo]);

  return (
    <div className={`special-print-sheet${items.length <= 4 ? " special-print-sheet-short" : ""}`} data-print-layout="single-a4" lang="it" ref={(node) => {
      sheetRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }}>
      <div className="special-print-page" data-print-copy="1">
        <img className="special-print-art" src="/special-menu-botanicals.webp" alt="" aria-hidden="true" />
        <div className="special-print-content">
          <header className="special-print-heading">
            <img src={logo} width="1125" height="175" alt="La Piccola Perla" />
            <h2>I nostri piatti speciali</h2>
            <span className="special-print-rule" aria-hidden="true" />
          </header>
          <div className="menu-print-items-viewport">
            <div className="special-print-items" data-menu-print-fit>
              {items.map((item) => (
                <article className="special-print-dish" key={item.id}>
                  <div className="special-print-translations">
                    <div lang="it"><h3>{item.translations.it.name}</h3></div>
                    <div lang="cs"><h3>{item.name}</h3></div>
                    <div lang="en"><h3>{item.translations.en.name}</h3></div>
                  </div>
                  <strong className="special-print-price">{item.price}</strong>
                </article>
              ))}
            </div>
          </div>
          <footer className="special-print-footer"><small>La Piccola Perla | Perlová 412/1, Praha 1</small></footer>
        </div>
      </div>
    </div>
  );
});

export default SpecialMenuPrintSheet;
