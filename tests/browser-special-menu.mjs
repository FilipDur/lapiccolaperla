// Run against a local Vite server: node tests/browser-special-menu.mjs
// Set PLAYWRIGHT_MODULE_PATH to an absolute Playwright module path if it is not
// installed in this project. All menu API requests use the isolated fixture below.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseURL).hostname), "Browser tests must run against a local server.");
const playwright = process.env.PLAYWRIGHT_MODULE_PATH
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href)
  : await import("playwright");
const artifactDirectory = process.env.TEST_ARTIFACT_DIRECTORY || join(tmpdir(), `perla-special-menu-${Date.now()}`);
await mkdir(artifactDirectory, { recursive: true });

const firstDish = {
  cs: { name: "Lanýžové risotto", description: "Krémové risotto s čerstvým lanýžem." },
  en: { name: "Truffle risotto", description: "Creamy risotto with fresh truffle." },
  it: { name: "Risotto al tartufo", description: "Risotto cremoso al tartufo fresco." },
  price: "395"
};
const secondDish = {
  cs: { name: "Mořský vlk", description: "Pečený mořský vlk se sezonní zeleninou." },
  en: { name: "Sea bass", description: "Roast sea bass with seasonal vegetables." },
  it: { name: "Branzino", description: "Branzino arrosto con verdure di stagione." },
  price: "485"
};

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "cs-CZ", reducedMotion: "reduce" });
const fixture = { items: [], writes: 0, dailyWrites: 0, failNextWrite: false, failReads: false };
const pageErrors = [];
const responsiveIssues = [];
context.on("page", (page) => page.on("pageerror", (error) => pageErrors.push(error.message)));
await context.addInitScript((origin) => {
  if (window.top === window.self && window.location.origin === origin) {
    localStorage.setItem("la-piccola-perla-cookie-notice", "accepted");
  }
}, new URL(baseURL).origin);
await context.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.origin !== new URL(baseURL).origin && !["data:", "blob:"].includes(url.protocol)) {
    await route.fulfill({ status: 204, body: "" });
    return;
  }
  await route.continue();
});
await context.route("**/api/daily-menu?*", async (route) => {
  assert.equal(route.request().method(), "GET");
  await route.fulfill({ json: { items: [] } });
});
await context.route("**/api/daily-menu", async (route) => {
  if (route.request().method() !== "GET") fixture.dailyWrites += 1;
  await route.fulfill({ json: { items: [] } });
});
await context.route("**/api/special-menu", async (route) => {
  if (route.request().method() === "GET") {
    if (fixture.failReads) {
      await route.fulfill({ status: 503, json: { error: "Test: loading temporarily unavailable" } });
      return;
    }
    await route.fulfill({ json: { items: fixture.items } });
    return;
  }
  assert.equal(route.request().method(), "PUT");
  assert.equal(route.request().headers()["x-admin-user"], "perla");
  assert.equal(route.request().headers()["x-admin-password"], "la perla");
  fixture.writes += 1;
  if (fixture.failNextWrite) {
    fixture.failNextWrite = false;
    await route.fulfill({ status: 503, json: { error: "Test: storage temporarily unavailable" } });
    return;
  }
  fixture.items = structuredClone(route.request().postDataJSON().items);
  await route.fulfill({ json: { items: fixture.items } });
});

const paths = { cs: "/", en: "/en", it: "/it" };
const titles = { cs: "Speciální menu", en: "Special menu", it: "Menù speciale" };
const logs = [];
const pass = (label) => { logs.push(label); console.log(`PASS ${label}`); };
const eventually = async (assertion) => {
  const deadline = Date.now() + 8000;
  while (true) {
    try { return await assertion(); }
    catch (error) {
      if (Date.now() > deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
};
const openPublic = async (language) => {
  const page = await context.newPage();
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/special-menu" && response.request().method() === "GET");
  await page.goto(`${baseURL}${paths[language]}`);
  await loaded;
  await page.locator("h1").waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), language);
  assert.equal(await page.locator("vite-error-overlay").count(), 0);
  return page;
};
const assertHiddenEverywhere = async () => {
  for (const language of Object.keys(paths)) {
    const page = await openPublic(language);
    await eventually(async () => assert.equal(await page.locator("#special-menu, a[href='#special-menu']").count(), 0));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".mobile-toggle").click();
    assert.equal(await page.locator(".mobile-menu a[href='#special-menu']").count(), 0);
    await page.close();
  }
};
const fillDish = async (page, dish) => {
  for (const language of Object.keys(paths)) {
    await page.locator(`[name='name-${language}']`).fill(dish[language].name);
    await page.locator(`[name='description-${language}']`).fill(dish[language].description);
  }
  await page.locator("[name='price']").fill(dish.price);
};
const save = async (page, name = "Přidat a uložit") => {
  const response = page.waitForResponse((result) => new URL(result.url()).pathname === "/api/special-menu" && result.request().method() === "PUT");
  await page.getByRole("button", { name, exact: true }).click();
  return response;
};
const assertPublicDishes = async (dishes, capture = false) => {
  for (const language of Object.keys(paths)) {
    const page = await openPublic(language);
    const section = page.locator("#special-menu");
    await section.waitFor();
    assert.equal(await section.locator("h2").innerText(), titles[language]);
    assert.equal(await page.locator(".desktop-nav a[href='#special-menu']").innerText(), titles[language]);
    assert.deepEqual(await section.locator(".special-menu-dish h3").allTextContents(), dishes.map((dish) => dish[language].name));
    assert.deepEqual(await section.locator(".special-menu-dish p").allTextContents(), dishes.map((dish) => dish[language].description));
    assert.match(await section.locator(".special-menu-price").first().innerText(), language === "cs" ? /Kč/ : /CZK/);
    if (capture) await section.screenshot({ path: join(artifactDirectory, `special-${language}-desktop.png`) });
    if (capture) {
      for (const width of [1050, 1100, 1200, 1201, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        if (await page.locator(".desktop-nav").isVisible()) {
          const brand = await page.locator(".brand").boundingBox();
          const nav = await page.locator(".desktop-nav").boundingBox();
          const actions = await page.locator(".header-actions").boundingBox();
          assert.ok(brand.x + brand.width <= nav.x + 1, `${language} header logo/nav overlap at ${width}px`);
          assert.ok(nav.x + nav.width <= actions.x + 1, `${language} header nav/actions overlap at ${width}px`);
          const links = await page.locator(".desktop-nav a").evaluateAll((elements) => elements.map((element) => {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return { left: box.left, right: box.right, height: box.height, lineHeight: parseFloat(style.lineHeight), label: element.textContent };
          }));
          await page.locator(".site-header").screenshot({ path: join(artifactDirectory, `header-${language}-${width}.png`) });
          links.forEach((link, index) => {
            if (link.height > link.lineHeight + 2) responsiveIssues.push(`${language} ${link.label} wraps at ${width}px`);
            if (index) assert.ok(links[index - 1].right <= link.left, `${language} navigation links overlap at ${width}px`);
          });
        } else {
          assert.equal(await page.locator(".mobile-toggle").isVisible(), true);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".mobile-toggle").click();
    const mobileLink = page.locator(".mobile-menu a[href='#special-menu']");
    assert.equal(await mobileLink.innerText(), titles[language]);
    await mobileLink.click();
    await eventually(async () => assert.equal(await page.locator(".mobile-menu").getAttribute("aria-hidden"), "true"));
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflows, false, `${language} mobile page must not overflow horizontally`);
    if (capture) await section.screenshot({ path: join(artifactDirectory, `special-${language}-mobile.png`) });
    await page.close();
  }
};

let admin;
try {
  await assertHiddenEverywhere();
  pass("Empty menu is absent from page, desktop navigation and mobile navigation in all three languages");

  admin = await context.newPage();
  await admin.goto(`${baseURL}/admin`);
  await admin.locator("[name='username']").fill("perla");
  await admin.locator("[name='password']").fill("la perla");
  await admin.getByRole("checkbox", { name: "Speciální menu", exact: true }).waitFor();
  fixture.failReads = true;
  await admin.getByRole("checkbox", { name: "Speciální menu", exact: true }).check();
  await admin.getByRole("button", { name: "Zkusit znovu", exact: true }).waitFor();
  assert.equal(await admin.locator("[name='name-cs']").isDisabled(), true);
  assert.equal(await admin.getByRole("button", { name: "Přidat a uložit", exact: true }).isDisabled(), true);
  assert.equal(fixture.writes, 0);
  fixture.failReads = false;
  await admin.getByRole("button", { name: "Zkusit znovu", exact: true }).click();
  await eventually(async () => assert.equal(await admin.locator("[name='name-cs']").isEnabled(), true));
  pass("An initial API failure blocks editing until a successful retry");
  await admin.locator("[name='name-cs']").waitFor();
  await fillDish(admin, firstDish);
  await save(admin);
  await eventually(async () => assert.equal(await admin.locator("[name='name-cs']").inputValue(), ""));
  assert.equal(fixture.items.length, 1);
  await assertPublicDishes([firstDish], true);
  pass("Admin checkbox publishes Czech, English and Italian content with localized public navigation and mobile layout");
  await admin.getByLabel("Jazyk náhledu").selectOption("it");
  assert.deepEqual(await admin.locator(".special-print-sheet h3").allTextContents(), [firstDish.it.name, firstDish.it.name]);
  await admin.screenshot({ path: join(artifactDirectory, "special-admin-desktop.png"), fullPage: true });
  const downloadEvent = admin.waitForEvent("download");
  await admin.getByRole("button", { name: "Stáhnout PDF", exact: true }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), "specialni-menu-it.pdf");
  const pdfPath = join(artifactDirectory, download.suggestedFilename());
  await download.saveAs(pdfPath);
  const pdf = await readFile(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 1000);
  await eventually(async () => assert.equal(await admin.getByRole("button", { name: "Stáhnout PDF", exact: true }).isEnabled(), true));
  await admin.emulateMedia({ media: "print" });
  assert.equal(await admin.locator(".special-print-sheet").isVisible(), true);
  assert.equal(await admin.locator(".special-admin-form").isVisible(), false);
  await admin.screenshot({ path: join(artifactDirectory, "special-print-preview.png"), fullPage: true });
  await admin.emulateMedia({ media: "screen" });
  pass("Preview language, downloadable PDF and print styling work");

  await admin.reload();
  await admin.getByRole("checkbox", { name: "Speciální menu", exact: true }).check();
  await admin.getByRole("button", { name: `Smazat ${firstDish.cs.name}`, exact: true }).waitFor();
  pass("Saved menu is restored from the API after reloading the administration page");

  await fillDish(admin, secondDish);
  fixture.failNextWrite = true;
  assert.equal((await save(admin)).status(), 503);
  await eventually(async () => assert.equal(await admin.locator("[name='name-cs']").inputValue(), secondDish.cs.name));
  for (const language of Object.keys(paths)) {
    assert.equal(await admin.locator(`[name='description-${language}']`).inputValue(), secondDish[language].description);
  }
  assert.equal(fixture.items.length, 1);
  await assertPublicDishes([firstDish]);
  pass("Failed publication retains all draft translations and leaves the published menu unchanged");

  await save(admin);
  await eventually(async () => assert.equal(await admin.locator("[name='name-cs']").inputValue(), ""));
  assert.equal(fixture.items.length, 2);
  await admin.getByRole("button", { name: `Posunout ${secondDish.cs.name} nahoru`, exact: true }).click();
  await eventually(async () => assert.equal(fixture.items[0].name, secondDish.cs.name));
  await assertPublicDishes([secondDish, firstDish]);
  pass("Reordering updates the saved menu and public display across languages");

  await admin.getByRole("button", { name: `Upravit ${secondDish.cs.name}`, exact: true }).click();
  const editedDish = structuredClone(secondDish);
  editedDish.en.name = "Sea bass with seasonal vegetables";
  await admin.locator("[name='name-en']").fill(editedDish.en.name);
  await save(admin, "Uložit změny");
  await assertPublicDishes([editedDish, firstDish]);
  pass("Editing one translation updates only the intended content");

  const writesBeforeToggle = fixture.writes;
  await admin.getByRole("checkbox", { name: "Speciální menu", exact: true }).uncheck();
  await admin.locator("[name='dishName']").waitFor();
  await admin.getByRole("checkbox", { name: "Speciální menu", exact: true }).check();
  await admin.getByRole("button", { name: `Smazat ${firstDish.cs.name}`, exact: true }).waitFor();
  assert.equal(fixture.writes, writesBeforeToggle);
  assert.equal(fixture.dailyWrites, 0);
  pass("Switching menu modes keeps special and daily menu writes separate");

  for (const dish of [editedDish, firstDish]) {
    const response = admin.waitForResponse((result) => new URL(result.url()).pathname === "/api/special-menu" && result.request().method() === "PUT");
    await admin.getByRole("button", { name: `Smazat ${dish.cs.name}`, exact: true }).click();
    await response;
    await eventually(async () => assert.equal(await admin.getByRole("button", { name: `Smazat ${dish.cs.name}`, exact: true }).count(), 0));
  }
  assert.deepEqual(fixture.items, []);
  await assertHiddenEverywhere();
  pass("Deleting the final item removes the section and both navigations in every language");

  assert.deepEqual(pageErrors, [], "No unhandled browser errors are expected");
  assert.deepEqual(responsiveIssues, [], "Header links should fit on one line");
  console.log(`\n${logs.length} browser scenarios passed. Screenshots: ${artifactDirectory}`);
} catch (error) {
  if (admin && !admin.isClosed()) await admin.screenshot({ path: join(artifactDirectory, "failure-admin.png"), fullPage: true });
  console.error(`Browser artifacts: ${artifactDirectory}`);
  throw error;
} finally {
  await context.close();
  await browser.close();
}
