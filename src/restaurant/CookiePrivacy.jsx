import { useEffect, useRef, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { routeHref } from "./routes.js";
import { getAnalytics } from "../lib/analytics.js";
import { privacyUi } from "./analyticsCopy.js";
import "./cookie-privacy.css";

export { privacyUi } from "./analyticsCopy.js";

// A control requiring JavaScript is not rendered into a document without it.
export function PrivacySettingsButton({ language = "cs", onClick }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? <button type="button" onClick={onClick}>{(privacyUi[language] || privacyUi.cs).title}</button> : null;
}

export default function CookiePrivacy({ language, pathname, detailsOpen, onOpenDetails, onCloseDetails, hideNotice = false }) {
  const t = privacyUi[language] || privacyUi.cs;
  const [consent, setConsent] = useState(null);
  const dialogRef = useRef(null);
  const ready = consent !== null;

  // The legacy notice acknowledgement never grants analytics consent.
  useEffect(() => getAnalytics().mount({
    pathname: pathname || window.location.pathname,
    onConsentChange: setConsent,
  }), [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (detailsOpen && !dialog.open) dialog.showModal();
    else if (!detailsOpen && dialog.open) dialog.close();
    if (!detailsOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [detailsOpen, ready]);

  if (!ready) return null;
  const choose = (choice) => { getAnalytics().setConsent(choice); onCloseDetails(); };
  const choices = <div className="cp-consent-choices">
    <button className="r-button" type="button" onClick={() => choose("denied")}>{t.deny}</button>
    <button className="r-button" type="button" onClick={() => choose("granted")}>{t.allow}</button>
  </div>;

  return <>
    {consent === "unknown" && !hideNotice && <aside className="cp-notice" aria-labelledby="cp-notice-title">
      <div className="cp-notice-heading"><span className="cp-mark" aria-hidden="true"><ShieldCheck size={22} strokeWidth={1.5} /></span><div><p>{t.title}</p><h2 id="cp-notice-title">{t.heading}</h2></div></div>
      <p className="cp-intro">{t.intro}</p>
      {choices}
      <div className="cp-notice-actions"><button className="cp-details" type="button" onClick={onOpenDetails}>{t.details}</button><a className="cp-details" href={routeHref("privacy", language)}>{t.policy}</a></div>
    </aside>}
    <dialog className="cp-dialog" ref={dialogRef} aria-labelledby="cp-dialog-title" aria-describedby="cp-dialog-description" onCancel={onCloseDetails} onClose={onCloseDetails} onClick={(event) => { if (event.target === event.currentTarget) onCloseDetails(); }}>
      <div className="cp-dialog-inner">
        <button className="cp-close" type="button" aria-label={t.close} onClick={onCloseDetails} autoFocus><X size={20} aria-hidden="true" /></button>
        <ShieldCheck className="cp-dialog-mark" size={32} strokeWidth={1.25} aria-hidden="true" />
        <p className="cp-label">La Piccola Perla</p><h2 id="cp-dialog-title">{t.title}</h2><p id="cp-dialog-description" className="cp-intro">{t.description}</p>
        <dl className="cp-categories">
          <div><dt>{t.necessary}<span className="cp-status cp-status-active">{t.active}</span></dt><dd>{t.necessaryText}</dd></div>
          <div><dt>{t.analytics}<span className={`cp-status${consent === "granted" ? " cp-status-active" : ""}`} role="status">{t[consent]}</span></dt><dd>{t.analyticsText}</dd></div>
          <div><dt>{t.marketing}<span className="cp-status">{t.unused}</span></dt><dd>{t.marketingText}</dd></div>
        </dl>
        <p className="cp-note">{t.note}</p>
        {choices}
        <div className="cp-dialog-actions"><a className="cp-details" href={routeHref("privacy", language)} onClick={onCloseDetails}>{t.policy}</a></div>
      </div>
    </dialog>
  </>;
}
