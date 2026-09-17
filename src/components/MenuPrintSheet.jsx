import React, { forwardRef, useLayoutEffect, useRef } from "react";
import { fitMenuPrintSheet } from "../lib/menuPrintLayout";
import "./menu-print-sheet.css";

// Both menu editors use the same two-copy A4 sheet and the existing daily layout.
const MenuPrintSheet = forwardRef(function MenuPrintSheet({ children, className = "", lang }, forwardedRef) {
  const sheetRef = useRef(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const fit = () => fitMenuPrintSheet(sheet);
    fit();
    let active = true;
    document.fonts?.ready.then(() => { if (active) fit(); });
    const observer = new ResizeObserver(fit);
    observer.observe(sheet);
    window.addEventListener("beforeprint", fit);
    window.addEventListener("afterprint", fit);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("afterprint", fit);
    };
  }, [children]);

  return (
    <div className={`daily-print-sheet ${className}`.trim()} lang={lang} ref={(node) => {
      sheetRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }}>
      {[1, 2].map((copy) => <div className="daily-print-preview" data-print-copy={copy} key={copy}>{children}</div>)}
    </div>
  );
});

export default MenuPrintSheet;

export function MenuPrintItems({ items, className = "" }) {
  return (
    <div className="menu-print-items-viewport">
      <div className={`print-menu-items menu-print-items-adaptive${items.length >= 7 ? " is-eight" : ""} ${className}`.trim()} data-menu-print-fit>
        {items.map((item, index) => (
          <article key={item.id}>
            <svg className="menu-print-number" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9.25" fill="#6b7f5e" />
              <text x="10" y="10" dy=".35em" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#fff5e8">{String(index + 1).padStart(2, "0")}</text>
            </svg>
            <div><h3>{item.name}</h3><p>{item.description}</p></div>
            <strong>{item.price}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}
