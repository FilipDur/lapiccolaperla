import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Phone, X } from "lucide-react";
import { newYearCopy, newYearDate, newYearMenuPrice } from "./newYearCopy.js";
import { newYearCourses } from "./newYearMenu.js";
import { routeHref } from "./routes.js";
import NewYearReservation from "./NewYearReservation.jsx";
import "./new-year.css";

const invitationStorageKey = `perla-silvestr-invitation-${newYearDate}`;
const menuPrice = new Intl.NumberFormat("cs-CZ").format(newYearMenuPrice);

function CampaignPhoto({ alt, sizes, loading }) {
  return (
    <img
      src="/images/silvestr-perlova.webp"
      srcSet="/images/silvestr-perlova-small.webp 560w, /images/silvestr-perlova.webp 1120w"
      sizes={sizes}
      width="1120"
      height="1400"
      alt={alt}
      loading={loading}
      decoding="async"
    />
  );
}

export function NewYearPromotion({ language }) {
  const text = newYearCopy[language];
  return (
    <a className="r-new-year-feature r-container" href={routeHref("newYear", language)}>
      <span className="r-new-year-feature-photo">
        <CampaignPhoto alt="" sizes="(max-width: 560px) 38vw, 330px" loading="lazy" />
      </span>
      <span className="r-new-year-feature-copy">
        <time className="r-eyebrow" dateTime={newYearDate}>{text.date}</time>
        <span className="r-new-year-feature-title">{text.event}</span>
        <span className="r-new-year-feature-link">{text.label}<ArrowUpRight size={16} aria-hidden="true" /></span>
      </span>
    </a>
  );
}

export function NewYearInvitation({ language, eligible }) {
  const text = newYearCopy[language];
  const dialogRef = useRef(null);
  const checkedEntry = useRef(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!eligible) setShow(false);
    if (checkedEntry.current) return;
    checkedEntry.current = true;
    if (!eligible) return;
    try {
      if (window.sessionStorage.getItem(invitationStorageKey)) return;
    } catch { /* The in-memory mark also works with storage disabled. */ }
    setShow(true);
  }, [eligible]);

  useEffect(() => {
    if (!eligible || !show) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    try {
      window.sessionStorage.setItem(invitationStorageKey, "1");
    } catch { /* Keep the current visit usable with storage disabled. */ }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [eligible, show]);

  if (!eligible || !show) return null;
  const close = () => {
    dialogRef.current?.close();
    setShow(false);
  };

  return (
    <dialog
      className="r-new-year-dialog"
      ref={dialogRef}
      aria-labelledby="new-year-invitation-title"
      aria-describedby="new-year-invitation-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="r-new-year-dialog-layout">
        <div className="r-new-year-dialog-photo">
          <CampaignPhoto alt="" sizes="(max-width: 560px) 100vw, 440px" />
        </div>
        <div className="r-new-year-invitation">
          <button className="r-new-year-close" type="button" aria-label={text.close} onClick={close} autoFocus>
            <X size={22} aria-hidden="true" />
          </button>
          <img className="r-new-year-invitation-logo" src="/logo-transparent.png" alt="La Piccola Perla" width="1200" height="190" />
          <p className="r-eyebrow"><time dateTime={newYearDate}>{text.date}</time></p>
          <h2 id="new-year-invitation-title">{text.heading[0]} <em>{text.heading[1]}</em></h2>
          <p id="new-year-invitation-description">{text.invite}</p>
          <a className="r-button" href={routeHref("newYear", language)} onClick={close}>
            {text.discover}<ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <button className="r-new-year-continue" type="button" onClick={close}>{text.continue}</button>
        </div>
      </div>
    </dialog>
  );
}

export default function NewYearPage({ language, allergy, showReservation }) {
  const text = newYearCopy[language];

  return (
    <article className="r-container r-new-year">
      <div className="r-new-year-hero">
        <picture className="r-new-year-hero-photo">
          <source media="(max-width: 680px)" srcSet="/images/capodanno-pour-mobile.webp" />
          <img src="/images/capodanno-pour.webp" width="1536" height="1024" alt="" fetchPriority="high" />
        </picture>
        <header className="r-new-year-intro">
          <time className="r-new-year-date" dateTime={newYearDate}>{text.date}</time>
          <h1>{text.pageHeading[0]} <em>{text.pageHeading[1]}</em></h1>
          <p className="r-new-year-description">{text.intro}</p>
          <p className="r-new-year-cover-price"><data value={newYearMenuPrice}>{menuPrice} Kč</data></p>
          <div className="r-new-year-actions">
            <a className="r-button" href="#silvestrovske-menu">
              {text.viewMenu}<ArrowDown size={17} aria-hidden="true" />
            </a>
            {showReservation ? (
              <a className="r-text-link" href="#silvestrovska-rezervace">
                {text.reserve}<ArrowUpRight size={17} aria-hidden="true" />
              </a>
            ) : (
              <a className="r-text-link" href="tel:+420224282537">
                {text.call}<Phone size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </header>
      </div>

      <aside className="r-new-year-information">
        <div><h2>{text.depositLabel}</h2><p>{text.depositTerms}</p></div>
        <p>{showReservation ? text.reservationInfo : text.booking}</p>
      </aside>

      <section className="r-new-year-paper" id="silvestrovske-menu" aria-labelledby="r-new-year-menu-title">
        <header className="r-new-year-menu-heading">
          <img className="r-new-year-poster-art" src="/images/silvestr-konfety.webp" width="1050" height="700" alt="" loading="lazy" decoding="async" />
          <div className="r-new-year-poster-content">
            <img className="r-new-year-menu-logo" src="/logo-transparent.png" alt="La Piccola Perla" width="1200" height="190" />
            <h2 id="r-new-year-menu-title" lang="en">
              <em>New Years Eve</em>{" "}
              <strong>MENU</strong>
            </h2>
            <p className="r-new-year-menu-price">
              <data value={newYearMenuPrice}>{menuPrice} Kč</data>
            </p>
          </div>
        </header>
        <div className="r-new-year-flyer-body">
          <ul className="r-new-year-list">
            {newYearCourses.map((course) => (
              <li key={course.it}>
                <h3>
                  <span lang="it">{course.it}</span>
                  <span className="r-new-year-course-slash" aria-hidden="true">/</span>
                  <small lang="en">{course.en}</small>
                </h3>
                <div className={`r-new-year-dishes${course.dishes.length > 1 ? " r-new-year-dishes-paired" : ""}`}>
                  {course.dishes.map((dish, index) => (
                    <Fragment key={dish.it}>
                      {index > 0 && (
                        <span className="r-new-year-menu-or">
                          <span lang="it">o</span><span aria-hidden="true">/</span><span lang="en">or</span>
                        </span>
                      )}
                      <div className="r-new-year-dish-option">
                        <p lang="it">{dish.it}</p>
                        {dish.en && <p lang="en">{dish.en}</p>}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <footer className="r-new-year-paper-footer">
            <a href={routeHref("home", language)}>www.lapiccolaperla.cz</a>
          </footer>
        </div>
      </section>
      <p className="r-new-year-allergy">{allergy}</p>
      {showReservation && <NewYearReservation language={language} />}
    </article>
  );
}
