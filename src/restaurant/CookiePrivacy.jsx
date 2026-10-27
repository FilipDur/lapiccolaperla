import { useEffect, useRef } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { routeHref } from "./routes.js";
import "./cookie-privacy.css";

export const privacyUi = {
  cs: {
    title: "Cookies a soukromí", heading: "Jen to nezbytné.",
    intro: "Do prohlížeče ukládáme jen zavření tohoto oznámení. Analytické ani reklamní cookies nepoužíváme.",
    acknowledge: "Rozumím", details: "Podrobnosti", policy: "Ochrana soukromí", close: "Zavřít informace o cookies",
    description: "Přehled toho, co tento web ukládá do vašeho prohlížeče. Nejde o souhlas se sledováním.",
    necessary: "Funkční úložiště", necessaryText: "Zapamatování zavření tohoto oznámení. Bez automatické expirace, do smazání dat webu v prohlížeči.", active: "Používáme",
    analytics: "Analytika", analyticsText: "Nenasazujeme analytické cookies ani nástroje pro měření návštěvnosti.", unused: "Nepoužíváme",
    marketing: "Reklama", marketingText: "Bez reklamních cookies a sledování napříč weby.",
    note: "Oznámení můžete kdykoli znovu otevřít přes odkaz Cookies a soukromí v patičce. Úložiště spravujete v nastavení svého prohlížeče.",
  },
  en: {
    title: "Cookies & privacy", heading: "Just the essentials.",
    intro: "We only store that you closed this notice in your browser. We do not use analytics or advertising cookies.",
    acknowledge: "Got it", details: "Details", policy: "Privacy policy", close: "Close cookie information",
    description: "A clear overview of what this website stores in your browser. This is not consent to tracking.",
    necessary: "Functional storage", necessaryText: "Acknowledgement of this notice. No automatic expiry; retained until you clear this site's browser data.", active: "In use",
    analytics: "Analytics", analyticsText: "We do not use analytics cookies or visitor measurement tools.", unused: "Not used",
    marketing: "Advertising", marketingText: "No advertising cookies or cross-site tracking.",
    note: "You can reopen this information from Cookies & privacy in the footer. Manage stored data in your browser settings.",
  },
  it: {
    title: "Cookie e privacy", heading: "Solo l’essenziale.",
    intro: "Nel browser ricordiamo solo la chiusura di questo avviso. Non usiamo cookie analitici o pubblicitari.",
    acknowledge: "Ho capito", details: "Dettagli", policy: "Informativa privacy", close: "Chiudi le informazioni sui cookie",
    description: "Una panoramica dei dati che questo sito conserva nel browser. Non è un consenso al tracciamento.",
    necessary: "Archiviazione funzionale", necessaryText: "Presa visione di questo avviso. Nessuna scadenza automatica: resta fino alla cancellazione dei dati del sito nel browser.", active: "In uso",
    analytics: "Analisi", analyticsText: "Non usiamo cookie analitici né strumenti per misurare le visite.", unused: "Non utilizzati",
    marketing: "Pubblicità", marketingText: "Nessun cookie pubblicitario o tracciamento tra siti.",
    note: "Puoi riaprire queste informazioni da Cookie e privacy nel piè di pagina. Gestisci i dati salvati nelle impostazioni del browser.",
  },
};

export default function CookiePrivacy({ language, noticeAccepted, onAcknowledge, detailsOpen, onOpenDetails, onCloseDetails, hideNotice = false }) {
  const t = privacyUi[language] || privacyUi.cs;
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (detailsOpen && !dialog.open) dialog.showModal();
    else if (!detailsOpen && dialog.open) dialog.close();
    if (!detailsOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [detailsOpen]);

  const acknowledge = () => { onAcknowledge(); onCloseDetails(); };
  return <>
    {!noticeAccepted && !hideNotice && <aside className="cp-notice" aria-labelledby="cp-notice-title">
      <button className="cp-close" type="button" aria-label={t.close} onClick={onAcknowledge}><X size={18} aria-hidden="true" /></button>
      <div className="cp-notice-heading"><span className="cp-mark" aria-hidden="true"><ShieldCheck size={22} strokeWidth={1.5} /></span><div><p>{t.title}</p><h2 id="cp-notice-title">{t.heading}</h2></div></div>
      <p className="cp-intro">{t.intro}</p>
      <div className="cp-notice-actions"><button className="cp-details" type="button" onClick={onOpenDetails}>{t.details}</button><button className="r-button" type="button" onClick={onAcknowledge}>{t.acknowledge}<Check size={16} aria-hidden="true" /></button></div>
    </aside>}
    <dialog className="cp-dialog" ref={dialogRef} aria-labelledby="cp-dialog-title" aria-describedby="cp-dialog-description" onCancel={onCloseDetails} onClose={onCloseDetails} onClick={(event) => { if (event.target === event.currentTarget) onCloseDetails(); }}>
      <div className="cp-dialog-inner">
        <button className="cp-close" type="button" aria-label={t.close} onClick={onCloseDetails} autoFocus><X size={20} aria-hidden="true" /></button>
        <ShieldCheck className="cp-dialog-mark" size={32} strokeWidth={1.25} aria-hidden="true" />
        <p className="cp-label">La Piccola Perla</p><h2 id="cp-dialog-title">{t.title}</h2><p id="cp-dialog-description" className="cp-intro">{t.description}</p>
        <dl className="cp-categories">
          <div><dt>{t.necessary}<span className="cp-status cp-status-active">{t.active}</span></dt><dd>{t.necessaryText}</dd></div>
          <div><dt>{t.analytics}<span className="cp-status">{t.unused}</span></dt><dd>{t.analyticsText}</dd></div>
          <div><dt>{t.marketing}<span className="cp-status">{t.unused}</span></dt><dd>{t.marketingText}</dd></div>
        </dl>
        <p className="cp-note">{t.note}</p>
        <div className="cp-dialog-actions"><a className="cp-details" href={routeHref("privacy", language)} onClick={onCloseDetails}>{t.policy}</a><button className="r-button" type="button" onClick={acknowledge}>{t.acknowledge}<Check size={16} aria-hidden="true" /></button></div>
      </div>
    </dialog>
  </>;
}
