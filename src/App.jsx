import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Camera,
  ChefHat,
  Clock,
  ExternalLink,
  MapPin,
  Menu as MenuIcon,
  Phone,
  ShoppingBag,
  Star,
  Utensils,
  Wine,
  X
} from "lucide-react";
import { featuredPicks, menuCategories } from "./data/menu";

const imageAssets = import.meta.glob("../images/webp/**/*.webp", {
  eager: true,
  import: "default"
});

const getImage = (fileName) => imageAssets[`../images/webp/${fileName}`];
const getThumb = (fileName) => imageAssets[`../images/webp/thumbs/${fileName}`] || getImage(fileName);
const logo = getImage("Logos.webp");

const photoData = [
  { file: "_DSR0014.webp", title: "Večer u vinného baru", tone: "Interiér", featured: true },
  { file: "_DSR0003.webp", title: "Prostřený sál v Perlové", tone: "Atmosféra", featured: true },
  { file: "_DSR0022.webp", title: "Dlouhý stůl pro setkání", tone: "Rezervace", featured: true },
  { file: "_DSR0023.webp", title: "Klidný salonek", tone: "Interiér", featured: true },
  { file: "_DSR0026.webp", title: "Intimní posezení", tone: "Praha 1" },
  { file: "_DSR0048.webp", title: "Espresso a sklenka vína", tone: "Po obědě" },
  { file: "_DSR0057.webp", title: "Mořské plody v rajčatové omáčce", tone: "Specialita", featured: true },
  { file: "_DSR0076.webp", title: "Caprese a bílé víno", tone: "Lehké menu" },
  { file: "_DSR0080.webp", title: "Pasta s burratou", tone: "Pasta", featured: true },
  { file: "_DSR0090.webp", title: "Dezert s ovocem", tone: "Dolce" },
  { file: "1.webp", title: "Signature talíř", tone: "Kuchyně" },
  { file: "2.webp", title: "Detail restaurace", tone: "Atmosféra" },
  { file: "3.webp", title: "Italský večer", tone: "Interiér" },
  { file: "4.webp", title: "Chef selection", tone: "Menu" },
  { file: "5.webp", title: "Vinný moment", tone: "Víno" },
  { file: "6.webp", title: "Výběr italských chutí", tone: "La Perla" }
].map((photo, index) => ({
  ...photo,
  id: photo.file,
  index,
  src: getImage(photo.file),
  thumbSrc: getThumb(photo.file)
}));

const navItems = [
  { label: "Příběh", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Galerie", href: "#gallery" },
  { label: "Kontakt", href: "#contact" }
];

const experiences = [
  {
    icon: ChefHat,
    title: "Ručně laděná kuchyně",
    text: "Pasta, rizota, mořské plody i pizza připravené ve stylu, který ctí italskou jednoduchost.",
    image: getImage("_DSR0080.webp")
  },
  {
    icon: Wine,
    title: "Víno k večeři i na večer",
    text: "Sklenky i lahve z Itálie, od lehkého prosecca až po velká červená z Toskánska.",
    image: getImage("_DSR0048.webp")
  },
  {
    icon: Utensils,
    title: "Místo pro rande i partu",
    text: "Útulný interiér v centru Prahy, který funguje pro rychlý oběd i dlouhou večeři.",
    image: getImage("_DSR0023.webp")
  }
];

const stats = [
  { value: "4.5", label: "hodnocení hostů", icon: Star },
  { value: "6 000+", label: "recenzí online", icon: Camera },
  { value: "11-23", label: "otevřeno denně", icon: Clock },
  { value: "Praha 1", label: "Perlová 412/1", icon: MapPin }
];

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState(menuCategories[0].id);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  const heroPhotos = useMemo(() => photoData.filter((photo) => photo.featured), []);
  const activeCategory = menuCategories.find((category) => category.id === activeCategoryId) || menuCategories[0];
  const activePhoto = activePhotoIndex === null ? null : photoData[activePhotoIndex];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroPhotos.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroPhotos.length]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", menuOpen || activePhoto !== null);
  }, [menuOpen, activePhoto]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const selectPhoto = (index) => setActivePhotoIndex(index);
  const showPreviousPhoto = () => setActivePhotoIndex((current) => (current === 0 ? photoData.length - 1 : current - 1));
  const showNextPhoto = () => setActivePhotoIndex((current) => (current === photoData.length - 1 ? 0 : current + 1));

  return (
    <>
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#hero" aria-label="La Piccola Perla">
          <img src={logo} alt="La Piccola Perla" />
        </a>

        <nav className="desktop-nav" aria-label="Hlavní navigace">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="language-switch" aria-label="Jazyk">
            <a className="is-active" href="/">CZ</a>
            <a href="/index-en.html">EN</a>
            <a href="/index-de.html">DE</a>
          </div>
          <a className="button button-primary header-cta" href="#reservation">
            <CalendarCheck aria-hidden="true" />
            Rezervace
          </a>
          <button
            className="icon-button mobile-toggle"
            type="button"
            aria-label="Otevřít menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="icon-button mobile-close" type="button" aria-label="Zavřít menu" onClick={() => setMenuOpen(false)}>
          <X aria-hidden="true" />
        </button>
        <img className="mobile-logo" src={logo} alt="La Piccola Perla" />
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
        <a className="button button-primary" href="#reservation" onClick={() => setMenuOpen(false)}>
          <CalendarCheck aria-hidden="true" />
          Rezervace
        </a>
      </div>

      <main>
        <section className="hero" id="hero" style={{ "--hero-image": `url(${heroPhotos[heroIndex].src})` }}>
          <div className="hero-copy">
            <span className="eyebrow">Italská restaurace v srdci Starého Města</span>
            <h1>La Piccola Perla</h1>
            <p>
              Místo pro poctivou pastu, víno a dlouhé večeře jen pár kroků od Staroměstského náměstí.
              Přijďte na oběd, rande nebo večer, který má chutnat jako Itálie.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#reservation">
                <CalendarCheck aria-hidden="true" />
                Rezervovat stůl
              </a>
              <a className="button button-light" href="#menu">
                <Utensils aria-hidden="true" />
                Projít menu
              </a>
            </div>
          </div>

          <div className="hero-photo-strip" aria-label="Ukázka restaurace">
            {heroPhotos.map((photo, index) => (
              <button
                key={photo.id}
                className={index === heroIndex ? "is-active" : ""}
                type="button"
                aria-label={photo.title}
                onClick={() => setHeroIndex(index)}
              >
                <img src={photo.thumbSrc} alt="" />
              </button>
            ))}
          </div>
        </section>

        <section className="stats-band" aria-label="Hlavní informace">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div className="stat-item" key={item.label}>
                <Icon aria-hidden="true" />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          })}
        </section>

        <section className="story-section section-pad" id="about">
          <div className="section-grid">
            <div className="story-copy">
              <span className="eyebrow">Od roku 2012</span>
              <h2>Italská energie v pražských uličkách</h2>
              <p>
                La Piccola Perla vznikla z chuti přenést do Prahy atmosféru rodinných italských podniků:
                živý stůl, dobré víno, voňavou omáčku a servis, který nechá večer plynout.
              </p>
              <p>
                Vaříme z italských surovin, s respektem k jednoduchosti a s důrazem na jídla, kvůli kterým se lidé rádi vracejí.
              </p>
              <a className="text-link" href="#gallery">
                Podívat se dovnitř
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="story-photos">
              <img className="photo-main" src={getImage("_DSR0003.webp")} alt="Interiér restaurace La Piccola Perla" loading="lazy" />
              <img className="photo-small" src={getImage("_DSR0076.webp")} alt="Caprese a víno na stole" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="experience-section section-pad" aria-label="Co u nás zažijete">
          <div className="section-heading">
            <span className="eyebrow">Proč přijít</span>
            <h2>Večeře, která se dobře prodává sama</h2>
            <p>
              Kombinace fotogenického interiéru, italských klasik a rychlé online rezervace pomáhá hostům rozhodnout se hned.
            </p>
          </div>
          <div className="experience-grid">
            {experiences.map((item) => {
              const Icon = item.icon;
              return (
                <article className="experience-card" key={item.title}>
                  <img src={item.image} alt="" loading="lazy" />
                  <div>
                    <Icon aria-hidden="true" />
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="menu-section section-pad" id="menu">
          <div className="section-heading align-left">
            <span className="eyebrow">Menu</span>
            <h2>Nejoblíbenější italské klasiky na jednom místě</h2>
            <p>
              Vyberte kategorii a rychle najděte přesně to, kvůli čemu má smysl udělat rezervaci ještě dnes.
            </p>
            <div className="featured-picks" aria-label="Doporučení">
              {featuredPicks.map((pick) => (
                <span key={pick}>{pick}</span>
              ))}
            </div>
          </div>

          <div className="menu-layout">
            <div className="menu-tabs" role="tablist" aria-label="Kategorie menu">
              {menuCategories.map((category) => (
                <button
                  key={category.id}
                  className={category.id === activeCategory.id ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={category.id === activeCategory.id}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <span>{category.label}</span>
                  <small>{category.items.length}</small>
                </button>
              ))}
            </div>

            <div className="menu-panel" role="tabpanel">
              <div className="menu-panel-head">
                <span>{activeCategory.accent}</span>
                <h3>{activeCategory.label}</h3>
              </div>
              <div className="menu-items">
                {activeCategory.items.map((item) => (
                  <article className="menu-item" key={`${activeCategory.id}-${item.name}`}>
                    <div>
                      <h4>{item.name}</h4>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                    <strong>{item.price}</strong>
                  </article>
                ))}
              </div>
              <p className="allergy-note">Informace o alergenech vám rádi poskytneme na vyžádání.</p>
            </div>
          </div>
        </section>

        <section className="gallery-section section-pad" id="gallery">
          <div className="section-heading">
            <span className="eyebrow">Galerie</span>
            <h2>Fotky, které dělají chuť</h2>
            <p>
              Interiér, jídla, víno i dezert. Použité jsou všechny dostupné fotografie z projektu.
            </p>
          </div>
          <div className="gallery-grid">
            {photoData.map((photo, index) => (
              <button
                key={photo.id}
                className={`gallery-tile tile-${(index % 7) + 1}`}
                type="button"
                onClick={() => selectPhoto(index)}
              >
                <img src={photo.thumbSrc} alt={photo.title} loading="lazy" />
                <span>
                  <small>{photo.tone}</small>
                  {photo.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="reservation-section" id="reservation" style={{ "--reservation-image": `url(${getImage("_DSR0014.webp")})` }}>
          <div>
            <span className="eyebrow">Rezervace a objednávky</span>
            <h2>Stůl v centru Prahy za pár kliknutí</h2>
            <p>
              Přijďte na italský oběd, večerní menu nebo objednejte oblíbená jídla online.
            </p>
            <div className="reservation-actions">
              <a
                className="button button-primary"
                href="https://la-piccola-perla.choiceqr.com/takeaway/booking"
                target="_blank"
                rel="noreferrer"
              >
                <CalendarCheck aria-hidden="true" />
                Rezervovat stůl
                <ExternalLink aria-hidden="true" />
              </a>
              <a
                className="button button-light"
                href="https://la-piccola-perla.choiceqr.com/takeaway/section:menu/polevky"
                target="_blank"
                rel="noreferrer"
              >
                <ShoppingBag aria-hidden="true" />
                Objednat online
                <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="section-heading">
            <span className="eyebrow">Kontakt</span>
            <h2>Najdete nás v Perlové ulici</h2>
          </div>
          <div className="contact-grid">
            <article>
              <MapPin aria-hidden="true" />
              <h3>Adresa</h3>
              <p>Perlová 412/1, Staré Město<br />110 00 Praha 1</p>
            </article>
            <article>
              <Phone aria-hidden="true" />
              <h3>Telefon</h3>
              <p><a href="tel:+420224282537">+420 224 282 537</a></p>
            </article>
            <article>
              <Clock aria-hidden="true" />
              <h3>Otevírací doba</h3>
              <p>Po-Ne<br />11:00-23:00</p>
            </article>
          </div>
          <div className="map-shell">
            <iframe
              title="Mapa La Piccola Perla"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d640.0638563384214!2d14.4213246!3d50.0835457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b94ec2af230ed%3A0x309375df444c7c4!2sLa%20Piccola%20Perla!5e0!3m2!1sen!2scz!4v1689091234567!5m2!1sen!2scz"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <img src={logo} alt="La Piccola Perla" />
        <nav aria-label="Patička">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a href="#reservation">Rezervace</a>
        </nav>
        <p>© 2026 La Piccola Perla. Italská kuchyně v centru Prahy.</p>
      </footer>

      {activePhoto ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activePhoto.title}>
          <button className="icon-button lightbox-close" type="button" aria-label="Zavřít galerii" onClick={() => setActivePhotoIndex(null)}>
            <X aria-hidden="true" />
          </button>
          <button className="icon-button lightbox-prev" type="button" aria-label="Předchozí fotka" onClick={showPreviousPhoto}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <img src={activePhoto.src} alt={activePhoto.title} />
          <div className="lightbox-caption">
            <span>{activePhoto.tone}</span>
            <strong>{activePhoto.title}</strong>
          </div>
          <button className="icon-button lightbox-next" type="button" aria-label="Další fotka" onClick={showNextPhoto}>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}

export default App;
