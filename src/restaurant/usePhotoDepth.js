import { useEffect } from "react";

/** Gentle scroll movement only: pointer position and clicks never rotate photos. */
export function usePhotoDepth(rootRef, page) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 761px)");
    const surfaces = [...root.querySelectorAll("[data-depth]")];
    const hero = root.querySelector(".r-hero");
    const visibility = hero ? new IntersectionObserver(([entry]) => {
      hero.dataset.inView = String(entry.isIntersecting);
    }, { threshold: 0.02 }) : null;
    if (hero) visibility.observe(hero);
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (preference.matches || !desktop.matches) return;
      const height = window.innerHeight;
      for (const surface of surfaces) {
        if (surface.closest('[data-motion="paused"]')) continue;
        const box = surface.getBoundingClientRect();
        if (box.bottom >= -100 && box.top <= height + 100) {
          const progress = Math.min(1, Math.max(-1, (height / 2 - box.top - box.height / 2) / height));
          surface.style.setProperty("--depth-scroll", progress.toFixed(3));
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const configure = () => {
      surfaces.forEach((surface) => surface.style.setProperty("--depth-scroll", "0"));
      schedule();
    };
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    preference.addEventListener("change", configure);
    desktop.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame);
      visibility?.disconnect();
      if (hero) delete hero.dataset.inView;
      surfaces.forEach((surface) => surface.style.removeProperty("--depth-scroll"));
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", configure);
      desktop.removeEventListener("change", configure);
    };
  }, [rootRef, page]);
}
