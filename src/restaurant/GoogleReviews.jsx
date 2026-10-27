import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import { googleReviews } from "./googleReviews.js";

const copy = {
  cs: { title: "Co o nás říkají hosté", selection: "Vaše spokojenost je pro nás tou největší odměnou.", count: "recenzí", onGoogle: "na Google", all: "Všechny recenze na Google", source: "Otevřít recenzi na Google", previous: "Předchozí recenze", next: "Další recenze", checked: "Ověřeno", stars: "z 5 hvězdiček", note: "Výběr úryvků z recenzí s hodnocením 5/5. Celkové hodnocení je uvedeno výše." },
  en: { title: "What our guests say", selection: "Your satisfaction is our greatest reward.", count: "reviews", onGoogle: "on Google", all: "All reviews on Google", source: "Open review on Google", previous: "Previous review", next: "Next review", checked: "Checked on", stars: "out of 5 stars", note: "Selected excerpts from 5/5 reviews. The overall rating is shown above." },
  it: { title: "Cosa dicono i nostri ospiti", selection: "La vostra soddisfazione è la nostra ricompensa più grande.", count: "recensioni", onGoogle: "su Google", all: "Tutte le recensioni su Google", source: "Apri recensione su Google", previous: "Recensione precedente", next: "Recensione successiva", checked: "Verificato il", stars: "su 5 stelle", note: "Una selezione di estratti da recensioni con 5/5. La valutazione complessiva è riportata sopra." },
};

const controls = {
  cs: { pause: "Pozastavit recenze", play: "Spustit recenze", carousel: "Karusel recenzí", slide: "recenze", of: "z" },
  en: { pause: "Pause reviews", play: "Play reviews", carousel: "Review carousel", slide: "review", of: "of" },
  it: { pause: "Pausa recensioni", play: "Avvia recensioni", carousel: "Carosello delle recensioni", slide: "recensione", of: "di" },
};
const PIXELS_PER_SECOND = 32;
// Keep the verified source data intact; this carousel is explicitly a 5-star selection.
const fiveStarReviews = googleReviews.excerpts.filter((review) => review.rating === 5);
const visibleCards = () => window.innerWidth <= 760 ? 1 : window.innerWidth <= 1100 ? 2 : 3;

function Stars({ rating, label }) {
  return <span className="r-review-stars" role="img" aria-label={`${rating} ${label}`}>
    {[0, 1, 2, 3, 4].map((index) => <span className="r-review-star" key={index} aria-hidden="true">
      <Star size={17} strokeWidth={1.3} />
      <span style={{ width: `${Math.max(0, Math.min(1, rating - index)) * 100}%` }}><Star size={17} strokeWidth={1.3} fill="currentColor" /></span>
    </span>)}
  </span>;
}

function GoogleMark() {
  return <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
    <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.2H24v8h11c-.5 2.6-1.9 4.8-4.1 6.3v5.2h6.6c3.8-3.5 6.1-8.7 6.1-15.3Z" />
    <path fill="#34A853" d="M24 44c5.4 0 9.9-1.8 13.2-4.9l-6.6-5.2c-1.8 1.2-4 1.9-6.6 1.9-5.2 0-9.6-3.5-11.2-8.2H6v5.3C9.3 39.5 16.1 44 24 44Z" />
    <path fill="#FBBC05" d="M12.8 27.6a12 12 0 0 1 0-7.2v-5.3H6a20 20 0 0 0 0 17.8l6.8-5.3Z" />
    <path fill="#EA4335" d="M24 12.2c2.9 0 5.5 1 7.5 2.9l5.6-5.6C33.8 6.1 29.4 4 24 4 16.1 4 9.3 8.5 6 15.1l6.8 5.3c1.6-4.7 6-8.2 11.2-8.2Z" />
  </svg>;
}

export default function GoogleReviews({ language }) {
  const t = copy[language] || copy.cs;
  const c = controls[language] || controls.cs;
  const locale = { cs: "cs-CZ", en: "en-GB", it: "it-IT" }[language] || "cs-CZ";
  const reviews = fiveStarReviews;
  const count = reviews.length;
  const carouselRef = useRef(null);
  const viewportRef = useRef(null);
  const railRef = useRef(null);
  const playRef = useRef(null);
  const gestureRef = useRef(null);
  const suppressClickRef = useRef(false);
  const offsetRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [slots, setSlots] = useState(visibleCards);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const shown = Math.min(slots, Math.max(1, count));
  const canMove = count > shown;
  const autoplay = playing && !reducedMotion && inView && !hidden && canMove && !hovered && !focused && !dragging;
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${googleReviews.checkedOn}T12:00:00Z`));

  const alignCards = useCallback(() => {
    offsetRef.current = 0;
    if (railRef.current) railRef.current.style.transform = "translate3d(0,0,0)";
    if (viewportRef.current) viewportRef.current.scrollLeft = 0;
  }, []);
  const select = useCallback((direction) => {
    if (!canMove) return;
    alignCards();
    setCurrent((value) => (value + direction + count) % count);
  }, [canMove, count, alignCards]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => {
      setReducedMotion(media.matches);
      if (media.matches) { setPlaying(false); alignCards(); }
    };
    const resize = () => setSlots(visibleCards());
    const visibility = () => setHidden(document.hidden);
    preference();
    media.addEventListener("change", preference);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(carouselRef.current);
    return () => {
      media.removeEventListener("change", preference);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, [alignCards]);

  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      const card = rail?.firstElementChild;
      if (!card) return;
      alignCards();
      setStep(card.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || "0"));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewportRef.current);
    measure();
    return () => observer.disconnect();
  }, [shown, count, alignCards]);

  useLayoutEffect(() => {
    if (!autoplay || !step) return;
    let frame = 0;
    let previousTime = null;
    const advance = (time) => {
      // Cap elapsed time after a stalled frame; visibility/hover pauses retain the exact offset.
      const elapsed = previousTime === null ? 0 : Math.min(time - previousTime, 64);
      previousTime = time;
      offsetRef.current += elapsed * PIXELS_PER_SECOND / 1000;
      if (offsetRef.current >= step) {
        offsetRef.current -= step;
        // Recycle the departing card before paint, so the loop has no clone seam or empty gap.
        flushSync(() => setCurrent((value) => (value + 1) % count));
      }
      if (railRef.current) railRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [autoplay, step, count]);

  const pointerDown = (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    setDragging(true);
    gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
    suppressClickRef.current = false;
  };
  const pointerMove = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const x = event.clientX - gesture.x;
    const y = event.clientY - gesture.y;
    if (!gesture.horizontal && Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.3) {
      gesture.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (gesture.horizontal) event.preventDefault();
  };
  const pointerUp = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    gestureRef.current = null;
    setDragging(false);
    if (!gesture.horizontal) return;
    suppressClickRef.current = true;
    if (Math.abs(event.clientX - gesture.x) > 40) select(event.clientX < gesture.x ? 1 : -1);
  };
  const ordered = Array.from({ length: count }, (_, index) => ({ review: reviews[(current + index) % count], originalIndex: (current + index) % count }));

  return <section className="r-reviews-section r-section" aria-labelledby="r-reviews-title" id="recenze">
    <div className="r-container">
      <div className="r-reviews-heading"><h2 id="r-reviews-title">{t.title}</h2><p className="r-section-intro">{t.selection}</p></div>
      <a className="r-rating-summary" href={googleReviews.url} target="_blank" rel="noopener noreferrer">
        <span className="r-rating-title"><GoogleMark /><strong>{new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(googleReviews.rating)} / 5 {t.onGoogle}</strong></span>
        <span className="r-rating-row"><Stars rating={googleReviews.rating} label={t.stars} /><span>({new Intl.NumberFormat(locale).format(googleReviews.reviewCount)} {t.count})</span></span>
      </a>
      <div className="r-reviews-carousel" ref={carouselRef} role="region" aria-roledescription={c.carousel} aria-label={`${t.title} · 5/5`} style={{ "--review-visible": shown }} data-moving={autoplay ? "true" : "false"}
        onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
        onPointerLeave={(event) => { if (event.pointerType !== "touch") setHovered(false); if (gestureRef.current?.id === event.pointerId && !gestureRef.current.horizontal) { gestureRef.current = null; setDragging(false); } }}
        onPointerDownCapture={() => setFocused(false)}
        onFocusCapture={(event) => { if (event.target !== playRef.current && event.target.matches(":focus-visible")) { setFocused(true); alignCards(); } }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="r-reviews-slider">
          <div className="r-reviews-viewport" id="r-reviews-viewport" ref={viewportRef} tabIndex={canMove ? 0 : undefined} aria-label={c.carousel}
            onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={(event) => { if (gestureRef.current?.id === event.pointerId) { gestureRef.current = null; setDragging(false); } }}
            onClickCapture={(event) => { if (suppressClickRef.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } suppressClickRef.current = false; }}
            onKeyDown={(event) => { if (event.target === event.currentTarget && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); setFocused(true); select(event.key === "ArrowRight" ? 1 : -1); } }}>
            <div className="r-reviews-rail" ref={railRef}>
              {ordered.map(({ review, originalIndex }, index) => {
                const visible = index < shown;
                return <article className="r-review-card" key={`${review.author}-${originalIndex}`} aria-label={`${originalIndex + 1} ${c.of} ${count}: ${review.author}`} aria-roledescription={c.slide} aria-hidden={!visible || undefined} inert={index > shown || undefined}>
                  <div className="r-review-card-top"><div className="r-review-person"><span className="r-review-avatar" aria-hidden="true" data-tone={originalIndex % 4}>{review.initials}</span><h3>{review.author}</h3></div><span className="r-review-google" aria-hidden="true"><GoogleMark /></span></div>
                  <div className="r-review-card-stars"><span aria-hidden="true">{review.rating}/5</span><Stars rating={review.rating} label={t.stars} /></div>
                  <blockquote lang={review.language}>{review.text}</blockquote>
                  <a className="r-review-source" href={review.url || googleReviews.url} target="_blank" rel="noopener noreferrer" tabIndex={visible ? undefined : -1} aria-label={`${t.source} · ${review.author}`} />
                </article>;
              })}
            </div>
          </div>
          {canMove && <><button className="r-review-arrow r-review-prev" type="button" aria-label={t.previous} aria-controls="r-reviews-viewport" onClick={() => select(-1)}><ChevronLeft size={18} /></button><button className="r-review-arrow r-review-next" type="button" aria-label={t.next} aria-controls="r-reviews-viewport" onClick={() => select(1)}><ChevronRight size={18} /></button></>}
        </div>
        {canMove && <div className="r-reviews-controls"><span className="r-review-counter" aria-live={autoplay ? "off" : "polite"} aria-atomic="true">{current + 1} {c.of} {count}</span>
          {!reducedMotion && <button ref={playRef} className="r-review-play" type="button" onClick={() => { setPlaying((value) => !value); setFocused(false); }} aria-label={playing ? c.pause : c.play} title={playing ? c.pause : c.play} aria-controls="r-reviews-viewport">{playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}</button>}
        </div>}
      </div>
      <p className="r-reviews-note">{t.note}</p>
      <p className="r-rating-date">{t.checked} <time dateTime={googleReviews.checkedOn}>{date}</time><span aria-hidden="true"> · </span><a href={googleReviews.url} target="_blank" rel="noopener noreferrer">{t.all}</a></p>
    </div>
  </section>;
}
