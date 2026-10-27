# Ověření běžícího webu — 24. října 2026

Aktuální výstup je React aplikace spuštěná přes Vite na `http://127.0.0.1:5173/`. Starší soubory v `preview/` a HTML šablona nejsou vstup do webu.

## Ověřeno

- Produkční sestavení Vite prošlo.
- 32 testů existujícího menu a nového lokálního API prošlo; dalších 10 testů rout a pražského data prošlo. Celkem 42.
- Browser kontrola skutečné aplikace na šířkách 320, 360 a 1440 px: úvod, mobilní navigace, denní nabídka, jídelní lístek a galerie. Kontrolované mobilní stránky nepřetékají vodorovně.
- Jídelní lístek obsahuje všech 164 položek, fotografie a logo se načítají z projektu.
- Galerie: otevření fotografie, další fotografie šipkou na klávesnici a zavření klávesou Escape.
- Jazyková podstránka `/en/galerie` funguje po přepnutí i přímém obnovení.
- Denní menu ukazuje datum restaurace v Praze a v sobotu správně víkendový stav. Datum a přechody letního času jsou ověřené samostatnými testy.
- Lokální API obou menu vrací HTTP 200 a čte vlastní soubor; produkční Redis nebyl použit.
- Skutečná administrace: přihlášení, přepnutí na speciální nabídku, vyplnění CZ/EN/IT a ceny, úspěšné uložení přes formulář a zobrazení této položky na veřejné podstránce. Ověřen i anglický překlad a cena CZK.
- Po obnovení původní prázdné nabídky zmizí speciální menu z navigace a podstránka zobrazí prázdný stav.
- Testovací data byla vrácena do původního stavu a testovací přihlášení odhlášeno.

## Opravy během ověření

Obnoven chybějící helper ukládání jazyka, opraveny staré jazykové URL a nestandardní hash hodnoty. Na mobilu je denní/speciální nabídka před dekorativní fotografií. Zvětšeny drobné texty navigace, tlačítek a jídelního lístku; tlumená barva ztmavena pro čitelnost.

## Rozsah

Rezervace používá existující Choice URL; žádná rezervace nebyla odeslaná. Google sekce odkazuje na profil restaurace, není napojený zdroj skutečných recenzí pro carousel. Administrace a tiskové komponenty zůstaly zachované; náhled tisku je v administraci viditelný, nový PDF soubor se při této kontrole negeneroval. Web nebyl nasazen do produkce.


## Luxury depth iteration — 25 October 2026

- Production build passed after final hook correction. Existing 42 tests passed.
- Browser verified at 1440 px (Czech), 1024 px (Italian) and 320 px (Czech and English); document width equalled viewport width.
- The centred vertical amatriciana fork loads locally at 1024 × 1536. Pointer input changed the actual rendered transform to a 3D matrix.
- Photo card opens the gallery, Next changes the photograph, Escape closes it.
- Mobile navigation reaches daily menu; current weekend state renders correctly and menu paper is above the decorative photo.
- Browser error log empty during final language checks. Reduced-motion and touch fallbacks reviewed in CSS and hook; no claim of browser media-emulation testing.
- Figma final output contains 22 editable text nodes, five component instances and five content-image nodes. Source capture removed after image transfer.

## Cropped hero and integrated food — 25 October 2026

- Latest production build passed (2.22 s); 42 existing tests passed. `git diff --check` passed.
- Desktop 1440 px: centred headline remains readable behind enlarged amatriciana fork; long handle is clipped. Document has no horizontal overflow.
- Click check: hero plane transform was `matrix(1, 0, 0, 1, 0, 0.792)` both before and after clicking the visible pasta. No rotation. Source contains no pointer listeners or rotation transforms.
- Mobile checked at 360 px and 320 px. At 320 px document width is 320 px and all food/hero motion transforms compute to `none`.
- Italian version reviewed at 1024 px with the centred headline and side content.
- All three transparent food images loaded successfully. Pizza and pasta open the correct cutout in the native lightbox; Escape closes and returns focus.
- No browser warnings/errors during final checks. Reduced-motion fallback reviewed in CSS and JS; browser media-emulation not claimed.
- Figma MCP rejected the latest updates because the Starter-account call limit was reached; its existing previous design remains unchanged. The local website and DESIGN.md contain the current iteration.

## Google review cards — 25 October 2026 (initial manual version)

- Source checked directly in Google Maps: correct restaurant, 4.5/5, 6,366 reviews, three attributed short excerpts. The website explicitly identifies the selection as manually checked and dated.
- Sapore Vero reference inspected in browser: centred aggregate, author-first cards, rating row and carousel. The same content hierarchy is implemented in Perla's palette.
- Desktop 1440 px shows all three cards; mobile 360 px shows one card and working next/previous controls. Counter moved 01 → 02 → 03, the final Next button became disabled, and Previous moved backwards. The second card aligned inside the rail after smooth scrolling settled.
- At 360 px document width equalled viewport width; final browser warning/error log was empty.
- Production build passed (2.40 s), all 42 existing tests passed, git diff whitespace check passed.
- Live refresh is not connected. Google Places API requires account/API configuration; no account, billing or third-party widget was created.

## Automatic Google review carousel — 25 October 2026

- Expanded the dated selection from three to eight real excerpts. Five additional individual reviews, author names and 5-star ratings were checked directly in the public Google Maps UI; their cards link to the corresponding individual reviews. Source notes are in `design/google-reviews-source.md`.
- Cards rotate automatically after 4.8 seconds, with a 650 ms slide and an infinite cycle without duplicate cards. The existing wine/cream design is retained.
- Browser verified automatic index changes on desktop and mobile, manual previous wrapping 01 → 08, then automatic continuation beyond 08 back to the beginning after Play.
- Pause held the same index beyond one autoplay interval; Play resumed while its button retained keyboard focus. Desktop shows three cards, tablet at 900 px shows two, and mobile at 320 px shows one. Eight distinct review cards exist, with offscreen cards hidden from assistive technology and keyboard tab order.
- Horizontal drag on the mobile card advanced the selection and switched autoplay to the paused state. Manual controls remain available.
- Hover/focus, document visibility, intersection and reduced-motion behavior were reviewed in the component. Reduced-motion media emulation was not available; no browser-emulation claim is made.
- All 42 existing tests and the git diff whitespace check passed.
- Final production build passed (2.45 s). Browser warning/error log was empty. Document width matched the viewport at 320, 900 and 1440 px; the mobile counter stays on one line after the final spacing adjustment.

## Five-star selection and closer Sapore Vero layout — 25 October 2026

- Re-inspected Sapore Vero directly in the browser. Its desktop cards measure 288 × 240 px, with 16 px corners and gaps, a compact sans-serif heading, author/avatar/Google header and arrows beside the row.
- Perla now uses that geometry and hierarchy in the existing wine/cream palette. The entire card opens its Google source. Compact pause/play remains below the row; the numeric counter is available to assistive technology.
- The UI filters the eight preserved source entries to seven reviews rated exactly 5/5. All seven card rating labels were checked in the browser. The actual overall aggregate stays 4.5/5 with 6,366 reviews, and the selection is explicitly labelled.
- Browser checks at 1440 and 320 px: no horizontal document overflow, desktop cards exactly 288 × 240 px, three desktop cards / one mobile card, side-arrow navigation advances the review and pauses playback. Four-line excerpts end cleanly with ellipsis when needed.
- Final production build passed (2.24 s), all 42 existing tests passed. No menu or backend code changed.

## Menu categories, individual photographs and restored specials — 26 October 2026

- The regular menu preserves all 164 original items, prices and descriptions across 12 categories in CS/EN/IT. Each category has one distinct photograph matched to an actual menu item; its caption links to that item and reads its current price from the same menu data. Browser confirmed all 12 category photos load.
- Generated 11 illustrative assets with built-in image_gen, using 10 in the final design. The original pizza cutout on the wine-red background remains in the menu introduction at the user's request. Antipasto is retained only as an unused alternative. Prompts and provenance: `design/menu-photos-2026/README.md`.
- Special-menu links remain visible on the homepage, regular menu and main navigation. The local menu store had an empty special list; restored the seven complete published entries from the restaurant's public API, retaining the old local data backup and all daily data. Source/verification notes: `design/special-menu-restored-2026-10-26.md`. This is a local snapshot, not automatic synchronization with production.
- Special menu uses the original botanical artwork, double paper border, logo and serif list. Its tuna/avocado illustration appears only while the matching dish exists in the ready API response. Loading, error and empty states remain explicit; admin and PDF implementations are unchanged.
- Browser verified 164 items and 12 matched category photos in all three languages, and seven specials with translated names/prices in all three languages. Desktop 1440 px, tablet 1024 px and mobile 360/320 px show no horizontal overflow. Mobile retains the special-menu photo and stacks the paper below it.
- Wine-category navigation lands at 190 px on desktop and 165 px on mobile, below both sticky bars. The observer highlights the category visible in the reading band. Dish-caption anchors highlight the selected item via :target. Reduced-motion arrival-animation fallback remains in CSS.
- All 42 existing tests passed, including local persistence, API validation, empty specials, translations and routes. No live administrative writes were used for verification.
- Final production build passed (2.71 s); `git diff --check` passed. Clicking the carbonara caption selected the correct original dish and price. Final browser log retained one historical Vite hot-reload error from a transient edit; the final source builds and renders successfully. Screenshot: `design/menu-photos-2026/preview/menu-pasta-desktop.jpg`. The local menu tab remains open.

## Cutout consistency, pizza-style focaccia and Cantolio bottle — 26 October 2026

- Replaced the incorrect thick focaccia pieces with a new round thin pizza bread, olive oil and dried oregano. Updated only its description in CS/EN/IT according to the owner; its price remains 99 Kč.
- Replaced the three remaining rectangular menu photographs (soup, tagliata and calamari) with image_gen edits of the original restaurant photographs. Full plates, ingredients and portions retained; no photographic frames remain in the menu. All 12 category images have real alpha, contain their full subject, and receive consistent small rotations and shadows. Special-menu tuna photograph shares the angled treatment.
- Replaced Chianti glass/carafe with Primitivo Manduria Cantolio bottle plus glass. Reference is the producer's Mandonion photograph at https://cantolio.it/prodotto/mandonion/, selected from the original menu's producer and owner's orange-lettered-label description. Actual menu item and original bottle price 849 Kč are used; the exact variant is an inferred visual match, not an independently confirmed inventory claim.
- Independent data review confirmed all 12 mappings match exactly one item across CS/EN/IT, with 164 items and unchanged prices. Image paths and alpha verified.
- Browser checks at 1440 and 320 px: no horizontal overflow, corrected focaccia displayed, bottle label and full bottle/glass visible, category navigation still works. Production build passed in 2.26 s; all 42 existing tests and git diff whitespace check passed.
- New source images, prompts and provenance are in `design/menu-photos-2026/v2/`; the asset index is `design/menu-photos-2026/README.md`. Built-in image_gen only; WebP conversion preserves native alpha and dimensions.

## Wine-red backgrounds behind every menu photograph — 26 October 2026

- Added rounded wine-red #67140b shapes behind every remaining category cutout, echoing the original pizza hero. Pasta and wine retain their existing full wine-red panels. Special-menu tuna receives the same rounded red background.
- CSS-only change; photographs, menu contents and behavior remain unchanged. Isolated stacking contexts keep shapes behind the images and text; mobile shapes are anchored to the photo area so translated headings stay readable.
- Browser confirmed all 12 categories have a wine-red shape or panel. Desktop 1440 and mobile 320 show no horizontal overflow; the mobile focaccia remains fully visible with its red background. Build and whitespace checks passed.

## Full red panels matching pasta — 26 October 2026

- Supersedes the preceding rounded-shape treatment: every category now has a full rectangular #67140b panel behind both copy and photograph, exactly matching the pasta background. Removed all category ::before shapes and cream/transparent panel overrides. Original hero remains unchanged.
- Headings, eyebrow labels, captions and focus outlines use ivory. Independent CSS review measured ivory contrast 11.50:1, champagne 4.85:1 and muted caption 6.27:1 on the wine background. Special-menu photo/caption is a matching full red panel.
- Browser confirmed all 12 panels have the same background and ivory headings, with no residual pseudo-shapes. Desktop 1440 and mobile 320 show no document overflow; all 164 items remain present. Mobile stacks copy and photo. Build and whitespace validation passed; CSS-only task required no new tests.

## Transparent footer logo — 26 October 2026

- Removed the ivory CSS background behind the existing transparent PNG logo in the footer. A footer-scoped CSS brightness/invert filter renders the unchanged logo silhouette white for contrast on the dark footer; the header logo and original asset stay unchanged.
- Removed horizontal padding from the former badge on desktop and mobile. Production build passed (2.40 s), git diff whitespace check passed. CSS-only presentation change.

## Distinct About and Contact photographs — 26 October 2026

- Removed repeated photography within and between About and Contact. About uses the back dining room (`_DSR0023`) in its hero, three original food photographs (`6`, `_DSR0076`, `3`) in its kitchen carousel, and the long dining table (`_DSR0022`) beside booking. Contact uses the entrance-view retouch once and a different intimate seating photograph (`_DSR0026`) beside booking.
- PhotoCarousel now uses the caller's curated set. Homepage retains exactly its previous four photographs and order. About's enlarged gallery and counter stay within its three kitchen photographs.
- Independent audit confirmed five unique About photographs, two unique Contact photographs, no overlap between the two sets and all assets present. No invented exterior or newly generated restaurant imagery.
- Browser verified loaded photos, carousel navigation and lightbox wraparound (2/3 → 3/3 → 1/3), desktop 1440 px and mobile 390 px with no horizontal overflow. Production build passed (2.35 s), git diff whitespace check passed. Menu, specials, daily menu, prices and booking/map links remain unchanged.

## Hero motion and special-menu teaser — 26 October 2026

- Main homepage hero keeps the centered headline behind the enlarged amatriciana fork. Added staggered text/photo entrances, a slow 10 px fork float, separate floating tomato/pecorino cutouts, a drawn annotation and a small scroll cue. No click-driven rotation. New decorative photos use built-in image_gen; original PNGs, exact prompts and exported WebP provenance are in `design/hero-motion-2026/assets-provenance.json`.
- Pause toggle stops continuous motion without trapping entrance animations at opacity zero. Verified pause → About → Home leaves headline/text/fork visible, with the float paused. Hero animations pause when the whole section leaves the viewport; IntersectionObserver and scroll listeners are cleaned up. Existing reduced-motion CSS disables all animations and transitions; the new toggle is hidden for that preference. This reduced-motion behavior was reviewed statically because the available browser controls do not expose preference emulation.
- MenuOffers uses restrained numbering, cream panels, wine accents, larger headings and a current tuna-tartare photo instead of the sparkle icon. The photo appears only when that dish is present in the ready API response. Preview remains three actual dishes and prices, and its link opens the full seven-item local special menu. Daily-menu navigation remains available.
- Browser checked hero at 1440, 390 and 320 px, and menu teaser at 1440 and 390 px: images load and no horizontal overflow. Verified pause/resume, visible content after route changes, offscreen animation pause, one scroll anchor, and teaser → special-menu navigation. Mobile decorative labels are suppressed to avoid overlapping the fork.
- Independent SSR review checked all 12 language/status combinations (CS/EN/IT × ready/loading/error/empty) plus ready without the pictured dish. All 42 existing tests passed. Final production build passed in 2.19 s and includes both transparent ingredient assets; git diff whitespace check passed. No menu data, prices or administrative state were changed.


## Continuous white Google review cards — 27 October 2026

- Replaced the delayed one-card transition with a continuous 32 px/s rail. Recycles existing review nodes at each card boundary without cloned reviews or an empty end gap. Hover pauses at the exact offset and pointer leave resumes from that offset. Manual pause, keyboard focus, document visibility, viewport visibility and reduced-motion preference remain independent controls.
- White cards use 24–26 px corners, soft shadows, neutral text, gold stars and a multicolour Google symbol. Existing seven selected five-star excerpts, original links, source date, aggregate rating and review count remain unchanged.
- Browser verified hover freeze at -220.916 px across separate calls and build time, followed by continued motion at -237.448 px after leaving. Verified manual Pause/Play, automatic recycling, responsive 3/1-card layouts at 1440/390 px and no horizontal overflow. Entering partial cards retain pointer access without adding offscreen links to the Tab order. Pointer cancellation checks the active pointer ID.
- Independent review covered RAF cleanup, reduced-motion and gesture lifecycle; build and git whitespace checks passed. Native drag tooling did not reliably emulate a full pointer swipe, so touch swipe is code-reviewed rather than claimed as a browser-verified gesture.

## GitHub publication and server-side sign-in — 27 October 2026

- Removed the inherited hardcoded admin credential comparison from the client bundle. The sign-in form now validates with POST /api/admin-auth using the existing server-side authorization contract; it handles pending, empty, unauthorized and unavailable responses without creating a client session on failure. Menu writes retain their existing authorization.
- Added the production endpoint and the corresponding local route. They do not read or mutate menu storage. Five additional tests use random temporary credentials and cover valid/invalid/empty headers, method restrictions, no-store and storage independence.
- Browser verified empty, incorrect and valid sign-in, followed by logout, on an isolated loopback Vite server with temporary test credentials. No menu saves were performed. The temporary server was stopped after verification.
- Production build passed in 2.51 s and all 47 tests passed. The final GitHub tree excludes the original client credential literals, local admin data and image-generation working files.
