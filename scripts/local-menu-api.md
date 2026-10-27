# Lokální vývoj menu

Spuštění po instalaci závislostí:

```sh
npm run dev -- --port 5173
```

Web běží na `http://127.0.0.1:5173`. Administrace je na `/admin`; česká,
anglická a italská verze na `/`, `/en` a `/it`. Ostatní veřejné podstránky
zpracovává aplikace přes běžný Vite fallback.

Vite middleware obsluhuje `/api/daily-menu` a `/api/special-menu` pouze při
vývoji. Změny z administrace zapisuje do ignorovaného `.local/menus.json`.
Nevolá Redis ani produkční web. Nový lokální projekt nemá speciální menu;
denní menu zachovává pouze existující nabídky ze `src/data/dailyMenuSeed.js`.
Přihlášení používá stejnou kontrolu oprávnění jako existující backend.

Obě nabídky jsou ve společném lokálním souboru, odděleně podle typu a data.
Zápisy se řadí za sebe a soubor se nahrazuje atomicky. Restart serveru data
zachová. Pro nový prázdný stav lze při zastaveném serveru archivovat nebo
odstranit `.local/menus.json`.

`npm run build` zachovává produkční API beze změny. `npm run preview` lokální
menu middleware nespouští; pro plnou lokální administraci používejte `dev`.

Izolované testy:

```sh
node --test tests/local-menu-api.test.js
```

Testy zapisují pouze do dočasných adresářů, které po dokončení odstraní.
Ověřují publikaci a opětovné načtení, autorizaci, validaci tří jazyků,
oddělení nabídek a souběžné zápisy. Jakýkoli pokus o vzdálený `fetch` test
ukončí chybou.
