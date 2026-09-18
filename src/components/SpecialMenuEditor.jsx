import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Pencil, Printer, Save, Trash2 } from "lucide-react";
import { fetchSpecialMenuItems, saveSpecialMenuItems } from "../lib/specialMenu";
import SpecialMenuPrintSheet from "./SpecialMenuPrintSheet";
import "./special-menu-editor.css";

const languages = [{ code: "it", label: "Italiano" }, { code: "cs", label: "Čeština" }, { code: "en", label: "English" }];
const emptyDraft = () => ({ cs: { name: "" }, en: { name: "" }, it: { name: "" }, price: "" });

export default function SpecialMenuEditor({ logo, getAuthHeaders, onBusyChange }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const saveLock = useRef(false);
  const formRef = useRef(null);
  const sheetRef = useRef(null);
  const busy = saving || exporting;
  const unavailable = loading || Boolean(loadError) || busy;

  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetchSpecialMenuItems(controller.signal)
      .then(setItems)
      .catch((reason) => {
        if (!controller.signal.aborted) setLoadError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  const updateDraft = (code, field, value) => {
    setDraft((current) => ({ ...current, [code]: { ...current[code], [field]: value } }));
  };

  const persist = async (nextItems) => {
    if (saveLock.current || unavailable) return false;
    saveLock.current = true;
    setSaving(true);
    setError("");
    setMessage("Ukládám speciální menu…");
    try {
      const savedItems = await saveSpecialMenuItems(nextItems, getAuthHeaders());
      setItems(savedItems);
      setMessage(savedItems.length
        ? "Speciální menu je uložené na webu ve všech třech jazycích."
        : "Speciální menu je prázdné. Sekce i odkaz v navigaci jsou nyní skryté.");
      return true;
    } catch (reason) {
      setMessage("");
      setError(reason.message || "Změnu se nepodařilo uložit. Zkuste to znovu.");
      return false;
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const submitItem = async (event) => {
    event.preventDefault();
    if (unavailable || (!editingId && items.length >= 12)) return;
    const price = draft.price.trim().replace(/\s+/g, " ");
    if (!languages.every(({ code }) => draft[code].name.trim()) || !/^\d+(?:[,.]\d{1,2})?$/.test(price) || Number(price.replace(",", ".")) <= 0) {
      setError("Vyplňte název ve všech třech jazycích a platnou cenu vyšší než nula.");
      return;
    }
    const item = {
      id: editingId || window.crypto.randomUUID(),
      name: draft.cs.name.trim(),
      price: `${price} Kč`,
      translations: Object.fromEntries(["en", "it"].map((code) => [code, { name: draft[code].name.trim() }]))
    };
    const nextItems = editingId ? items.map((current) => current.id === editingId ? item : current) : [...items, item];
    if (await persist(nextItems)) {
      setDraft(emptyDraft());
      setEditingId(null);
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setDraft({ cs: { name: item.name }, en: { name: item.translations.en.name }, it: { name: item.translations.it.name }, price: item.price.replace(/\s*(Kč|CZK)$/i, "") });
    setError("");
    formRef.current?.querySelector("input")?.focus();
  };

  const removeItem = async (item) => {
    if (await persist(items.filter((current) => current.id !== item.id))) {
      if (editingId === item.id) {
        setEditingId(null);
        setDraft(emptyDraft());
      }
    }
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    void persist(nextItems);
  };

  const downloadPdf = async () => {
    if (!sheetRef.current || exporting) return;
    setExporting(true);
    setError("");
    try {
      const { downloadSpecialMenuPdf } = await import("../lib/specialMenuPdf");
      await downloadSpecialMenuPdf(sheetRef.current, "specialni-menu.pdf");
    } catch {
      setError("PDF se nepodařilo stáhnout. Zkuste prosím Tisk / PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-workspace special-admin-workspace" aria-busy={loading || saving}>
      <section className="admin-editor">
        <span className="eyebrow">Nabídka navíc</span>
        <h1>Speciální menu</h1>
        <p>Doplňte jídlo ve všech třech jazycích. Nabídka platí i o víkendech a zůstane na webu, dokud ji nesmažete.</p>
        <p className="admin-note">Po smazání posledního jídla zmizí z webu celá sekce i odkaz v navigaci.</p>
        {loading ? <p role="status">Načítám speciální menu…</p> : null}
        {loadError ? <div className="special-admin-error" role="alert"><p>{loadError} Úpravy jsou do načtení pozastavené.</p><button className="button button-light" type="button" onClick={() => setRetry((value) => value + 1)}>Zkusit znovu</button></div> : null}

        <form className="admin-menu-form special-admin-form" ref={formRef} onSubmit={submitItem}>
          <fieldset className="special-admin-fields" disabled={unavailable}>
            {languages.map(({ code, label }) => (
              <fieldset className="special-language-fields" key={code}>
                <legend>{label}</legend>
                <label>Název jídla ({code.toUpperCase()})
                  <input name={`name-${code}`} lang={code} value={draft[code].name} onChange={(event) => updateDraft(code, "name", event.target.value)} required maxLength={120} />
                </label>
              </fieldset>
            ))}
            <label>Cena pro všechny jazyky
              <span className="admin-price-input"><input name="price" inputMode="decimal" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} placeholder="199" required maxLength={12} /><span>Kč</span></span>
            </label>
            <div className="special-form-actions">
              <button className="button button-primary" type="submit" disabled={!editingId && items.length >= 12}><Save aria-hidden="true" />{saving ? "Ukládám…" : editingId ? "Uložit změny" : "Přidat a uložit"}</button>
              {editingId ? <button className="button button-light" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft()); setError(""); }}>Zrušit úpravu</button> : null}
            </div>
          </fieldset>
        </form>
        {items.length >= 12 ? <p className="admin-note">Menu může obsahovat nejvýše 12 jídel.</p> : null}
        <div aria-live="polite" role="status">{message ? <p className="admin-sync-note">{message}</p> : null}</div>
        {error ? <p className="special-admin-error" role="alert">{error}</p> : null}
        <div className="admin-current-list" aria-label="Uložené speciální menu">
          {items.map((item, index) => (
            <article key={item.id}>
              <div><h2>{item.name}</h2><strong>{item.price}</strong></div>
              <div className="admin-item-actions special-item-actions">
                <button className="icon-button" type="button" aria-label={`Upravit ${item.name}`} disabled={unavailable} onClick={() => editItem(item)}><Pencil aria-hidden="true" /></button>
                <button className="icon-button" type="button" aria-label={`Posunout ${item.name} nahoru`} disabled={unavailable || index === 0} onClick={() => moveItem(index, -1)}><ArrowUp aria-hidden="true" /></button>
                <button className="icon-button" type="button" aria-label={`Posunout ${item.name} dolů`} disabled={unavailable || index === items.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown aria-hidden="true" /></button>
                <button className="icon-button" type="button" aria-label={`Smazat ${item.name}`} disabled={unavailable} onClick={() => void removeItem(item)}><Trash2 aria-hidden="true" /></button>
              </div>
            </article>
          ))}
          {!loading && !loadError && items.length === 0 ? <p className="admin-empty">Zatím tu není žádné speciální menu. Na webu se nic nezobrazuje.</p> : null}
        </div>
      </section>
      <section className="admin-preview-card" aria-label="Náhled speciálního menu">
        <div className="admin-preview-actions special-preview-actions">
          <p className="special-preview-format">Jeden list A4 · italština → čeština → angličtina</p>
          <button className="button button-light" type="button" onClick={downloadPdf} disabled={unavailable || !items.length}><Download aria-hidden="true" />{exporting ? "Připravuji…" : "Stáhnout PDF"}</button>
          <button className="button button-light" type="button" onClick={() => window.print()} disabled={unavailable || !items.length}><Printer aria-hidden="true" />Tisk / PDF</button>
        </div>
        <SpecialMenuPrintSheet ref={sheetRef} logo={logo} items={items} />
      </section>
    </div>
  );
}
