# Obnova lokální speciální nabídky

- Zdroj: [veřejné API La Piccola Perla](https://lapiccolaperla.cz/api/special-menu).
- Převzato 26. 10. 2026, ověřeno přibližně v 07:36 UTC.
- Obnoveno přesně 7 položek do `.local/menus.json.special`, v původním pořadí, se shodnými ID, českými názvy, anglickými a italskými překlady a cenami.
- Předchozí lokální `special` bylo prázdné. Celý původní soubor je beze změny uložen v `.local/menus-before-special-restore-2026-10-26.json`.
- `daily` i všechna ostatní pole byla zachována. Produkční API, úložiště, administrace ani backend nebyly upraveny; vzdálený zdroj byl pouze přečten.
- Lokální `GET http://127.0.0.1:5173/api/special-menu` po obnově úspěšně vrátil všech 7 položek. Jejich obsah a pořadí byly porovnány s právě staženou odpovědí a přesně souhlasí.

SHA-256 původní stažené JSON odpovědi: `c428995c56dda1470ccec4acffc7023c9cec899f2db3d1a2038090a1c79eb4cc`.

Jde o lokální snapshot pro náhled redesignu, nikoli o trvalé propojení s produkcí. Lokální změny se nadále ukládají stávajícím mechanismem; záměrné vyprázdnění nabídky se nenahrazuje starými daty. Odkazy a stránka speciální nabídky zůstávají dostupné i pro prázdný stav. Tento záznam potvrzuje API a datovou obnovu; vizuální kontrolu provádí hlavní úloha samostatně.
