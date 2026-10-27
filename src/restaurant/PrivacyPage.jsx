import { ArrowUpRight, ChevronDown } from "lucide-react";
import privacyCopy from "./privacyCopy.js";
import "./privacy.css";

const sectionId = (key) => `privacy-${key}`;

function PolicySection({ sectionKey, title, children }) {
  return <section className="privacy-section" id={sectionId(sectionKey)} aria-labelledby={`${sectionId(sectionKey)}-heading`}>
    <h2 id={`${sectionId(sectionKey)}-heading`}>{title}</h2>
    {children}
  </section>;
}

function ContactLinks() {
  return <div className="privacy-contact-links">
    <a href="mailto:la.piccola.perla@email.cz">la.piccola.perla@email.cz</a>
    <a href="tel:+420224282537">+420 224 282 537</a>
  </div>;
}

export default function PrivacyPage({ language = "cs" }) {
  const t = privacyCopy[language] || privacyCopy.cs;
  return <div className="privacy-page">
    <div className="privacy-overview">
      <div className="privacy-overview-copy">
        <p className="privacy-lead">{t.lead}</p>
        <p>{t.intro}</p>
        <time dateTime="2026-10-27">{t.updated}</time>
      </div>
      <ul className="privacy-facts">{t.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
    </div>

    <div className="privacy-layout">
      <aside className="privacy-sidebar">
        <nav aria-label={t.index}>
          <p className="privacy-index-title">{t.index}</p>
          <ul>{Object.entries(t.sections).filter(([key]) => key !== "admin").map(([key, title]) => <li key={key}><a href={`#${sectionId(key)}`}>{title}</a></li>)}</ul>
        </nav>
        <div className="privacy-sidebar-contact">
          <p>{t.questions}</p>
          <a href="mailto:la.piccola.perla@email.cz">{t.contactAction}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </aside>

      <div className="privacy-document">
        <PolicySection sectionKey="controller" title={t.sections.controller}>
          <p>{t.controllerIntro}</p>
          <address className="privacy-controller">
            <strong>B &amp; D DINAMIC, s.r.o.</strong>
            <dl>
              <div><dt>{t.registeredOffice}</dt><dd>Perlová 1020/8, Praha 1</dd></div>
              <div><dt>{t.companyId}</dt><dd>26764776</dd></div>
            </dl>
            <ContactLinks />
          </address>
          <p>{t.restaurant}</p>
        </PolicySection>

        <PolicySection sectionKey="processing" title={t.sections.processing}>
          {t.processing.map((item) => <div className="privacy-topic" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}
        </PolicySection>

        <PolicySection sectionKey="storage" title={t.sections.storage}>
          <p>{t.storageIntro}</p>
          <div className="privacy-table-wrap">
            <table className="privacy-storage-table">
              <caption>{t.tableCaption}</caption>
              <thead><tr>{t.tableHeaders.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
              <tbody>
                <tr><th scope="row" data-label={t.tableHeaders[0]}><code>la-piccola-perla-cookie-notice</code></th><td data-label={t.tableHeaders[1]}>{t.noticePurpose}</td><td data-label={t.tableHeaders[2]}>{t.storageDuration}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="privacy-acknowledgement"><h3>{t.acknowledgementTitle}</h3><p>{t.acknowledgement}</p></div>
          <p>{t.clearing}</p>
        </PolicySection>

        <PolicySection sectionKey="services" title={t.sections.services}>
          <p>{t.servicesIntro}</p>
          {t.services.map((service) => <div className="privacy-topic" key={service.title}>
            <h3>{service.title}</h3><p>{service.text}</p>
            <div className="privacy-source-links">{service.links.map((link) => <a href={link.href} key={link.href}>{link.label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</div>
          </div>)}
        </PolicySection>

        <PolicySection sectionKey="retention" title={t.sections.retention}>
          {t.retention.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </PolicySection>

        <PolicySection sectionKey="rights" title={t.sections.rights}>
          <p>{t.rightsIntro}</p>
          <ul className="privacy-rights-list">{t.rights.map((right) => <li key={right}>{right}</li>)}</ul>
          <p>{t.rightsContact}</p>
          <ContactLinks />
          <p>{t.complaint}</p>
          <a className="privacy-authority-link" href="https://uoou.gov.cz">{t.complaintLink}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </PolicySection>

        <details className="privacy-admin" id={sectionId("admin")}>
          <summary>{t.sections.admin}<ChevronDown size={18} aria-hidden="true" /></summary>
          <div><p>{t.adminIntro}</p><ul>{t.admin.map((paragraph) => <li key={paragraph}>{paragraph}</li>)}</ul></div>
        </details>
      </div>
    </div>
  </div>;
}
