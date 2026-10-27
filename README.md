# La Piccola Perla

React + Vite web restaurace. Redesign je součástí aplikace v `src/restaurant/`, nikoli exportovaný HTML prototyp. Vychází z komponent Sapore Vero a postupů OpenDesign; používá vlastní fotografie a logo restaurace.

## Lokální spuštění

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Otevřete http://127.0.0.1:5173/. Dev server zůstává dostupný pouze na tomto počítači.

- `/` – úvod
- `/menu` – stálý jídelní lístek
- `/denni-menu` – aktuální denní nabídka, pondělí–pátek 11:00–14:30
- `/specialni-menu` – speciální nabídka včetně prázdného stavu
- `/o-nas`, `/galerie`, `/kontakt`
- `/en` a `/it` – jazykové verze včetně podstránek
- `/admin` – stávající administrace a tisk/PDF

Vite obsluhuje lokální API `/api/daily-menu` a `/api/special-menu`. Ukládají do ignorovaného `.local/menus.json`; nečtou ani nemění produkční Redis. Administrace ověřuje přihlášení na serveru přes `POST /api/admin-auth` a používá stejné oprávnění jako ukládání menu. Klientský kód neobsahuje správné přihlašovací hodnoty. Datum denní nabídky se řídí časovým pásmem Europe/Prague. Odkazy na speciální menu a jeho stránka zůstávají dostupné i při prázdné nabídce; stránka v takovém případě zobrazí prázdný stav bez jídel.

Pracovní kopie použitá při návrhu obsahovala sedm skutečných položek převzatých 26. 10. 2026 z veřejného API původního webu. Tento lokální snapshot ani záloha nejsou součástí Gitu; nový checkout začíná s prázdnou speciální nabídkou. Jde o přesný lokální snapshot v původním pořadí včetně cen a překladů, který se automaticky neobnovuje z produkce. Předchozí lokální stav je zálohovaný v `.local/menus-before-special-restore-2026-10-26.json`; denní nabídka a ostatní pole zůstala zachována. Původ a ověření popisuje `design/special-menu-restored-2026-10-26.md`.

Produkční API v `api/` zůstává samostatné a zachovává své existující nastavení úložiště. Dev middleware se do produkčního buildu nepřidává.

## Ověření

```sh
npm test
npm run build
```

Testy pokrývají menu API, souběžné čtení, lokální úložiště, routy a datum restaurace. Google sekce zobrazuje výběr sedmi skutečných pětihvězdičkových recenzí z osmi ověřených záznamů. Všech osm původních záznamů zůstává v `src/restaurant/googleReviews.js`; zobrazení vybírá pouze hodnocení 5/5. Souhrn 4,5 / 6 366 recenzí ověřený na profilu restaurace 25. 10. 2026 zůstává celkovým hodnocením na Googlu a nepočítá se ze zobrazovaného výběru. Jde o datovaný ručně ověřený výběr, nikoli automatický feed. Bílé zaoblené karty se plynule posouvají dokola na počítači, tabletu i mobilu. Najetí myší je zastaví na aktuální pozici a odjetí pokračuje ze stejného místa. Klávesnicový fokus, ruční pauza, skrytá karta prohlížeče a nastavení omezeného pohybu mají vlastní pozastavení; ruční šipky zůstávají dostupné. Každá karta odkazuje na konkrétní Google recenzi, pokud je odkaz dostupný, jinak na profil restaurace. Rezervace vede do existujícího systému Choice.

Aktuální web spouštějte přes Vite. Návrhové originály PNG, staré prototypy a lokální náhledy nejsou pro běh aplikace potřeba; web používá optimalizované soubory v `public/images/` a `images/webp/`. Vygenerované fotografie jídel jsou označené jako ilustrační. Produkční data menu se nadále načítají z existujícího API.
