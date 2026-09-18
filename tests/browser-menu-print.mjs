// Local-only print regression checks. Requires Playwright, Python with pypdf,
// and Poppler (pdfinfo/pdftoppm). Optional executable overrides:
// PLAYWRIGHT_MODULE_PATH, PDF_PYTHON, PDFTOPPM_BIN, TEST_BASE_URL.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseURL).hostname), "Only local test servers are allowed.");
const playwright = process.env.PLAYWRIGHT_MODULE_PATH
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href)
  : await import("playwright");
const python = process.env.PDF_PYTHON || "python";
const pdftoppm = process.env.PDFTOPPM_BIN || "pdftoppm";
const testKinds = process.env.TEST_PRINT_KINDS?.split(",") || ["special", "daily"];
const testCounts = process.env.TEST_PRINT_COUNTS?.split(",").map(Number) || [1, 8, 12];
assert.ok(testKinds.every((kind) => ["daily", "special"].includes(kind)));
assert.ok(testCounts.every((count) => [1, 8, 12].includes(count)));
const artifactDirectory = process.env.TEST_ARTIFACT_DIRECTORY || join(tmpdir(), `perla-menu-print-${Date.now()}`);
await mkdir(artifactDirectory, { recursive: true });

const fixtures = (count, kind) => Array.from({ length: count }, (_, index) => {
  const marker = `DISH${String(index + 1).padStart(2, "0")}`;
  const long = count > 1;
  return {
    id: `print-${index + 1}`,
    name: `${marker} ${long ? "Risotto s čerstvými hříbky, lanýžem, parmazánem a bylinkami podle tradičního italského receptu" : "Lanýžové risotto"}`,
    ...(kind === "daily" ? { description: long ? "Krémové italské risotto připravené z vybrané rýže, čerstvých hříbků a sezonních surovin, dokončené máslem, parmazánem a aromatickým lanýžem. Podáváme s pečenou zeleninou, čerstvými bylinkami a jemnou omáčkou podle tradiční receptury našeho šéfkuchaře." : "Krémové risotto s čerstvým lanýžem." } : {}),
    price: `${395 + index * 10} Kč`,
    translations: {
      en: {
        name: `${marker} ${long ? "Creamy risotto with fresh porcini mushrooms, aromatic truffle, aged Parmesan cheese and seasonal herbs" : "Truffle risotto"}`,
        ...(kind === "daily" ? { description: long ? "Traditional Italian risotto with selected rice, fresh porcini mushrooms and seasonal ingredients, finished with butter, aged Parmesan and aromatic truffle. Served with roasted vegetables, fresh herbs and a delicate sauce prepared by our chef." : "Creamy risotto with fresh truffle." } : {})
      },
      it: {
        name: `${marker} ${long ? "Risotto cremoso con funghi porcini freschi, tartufo aromatico, parmigiano stagionato ed erbe di stagione" : "Risotto al tartufo"}`,
        ...(kind === "daily" ? { description: long ? "Risotto italiano tradizionale con riso selezionato, funghi porcini freschi e ingredienti di stagione, mantecato con burro, parmigiano e tartufo aromatico. Servito con verdure arrosto, erbe fresche e una delicata salsa preparata secondo la ricetta dello chef." : "Risotto cremoso al tartufo fresco." } : {})
      }
    }
  };
});

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "cs-CZ", reducedMotion: "reduce" });
let items = fixtures(1, testKinds[0]);
const errors = [];
context.on("page", (page) => {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
});
await context.route("**/api/**", async (route) => {
  assert.equal(route.request().method(), "GET", "Print checks must not write menus");
  await route.fulfill({ json: { items } });
});
await context.route(/https:\/\//, (route) => route.fulfill({ status: 204, body: "" }));
const page = await context.newPage();
const results = [];

async function assertCopiesAndBounds(kind, phase) {
  const special = kind === "special";
  const copies = page.locator(special ? ".special-print-sheet .special-print-page" : ".daily-print-sheet .daily-print-preview");
  const copyCount = special ? 1 : 2;
  assert.equal(await copies.count(), copyCount, `${kind} ${phase} should contain ${copyCount} complete ${copyCount === 1 ? "copy" : "copies"}`);
  if (special) {
    assert.equal(await page.locator(".special-print-sheet").getAttribute("data-print-layout"), "single-a4");
    assert.equal(await copies.first().getAttribute("data-print-copy"), "1");
    assert.deepEqual(await copies.locator("h2").allTextContents(), ["I nostri piatti speciali"]);
    assert.equal(await copies.getByRole("img", { name: "La Piccola Perla", exact: true }).count(), 1);
    assert.equal(await copies.getByRole("img", { name: "La Piccola Perla", exact: true }).count(), 1);
    assert.equal(await copies.locator(".special-print-art").evaluate((image) => image.complete && image.naturalWidth > 0), true);
    assert.equal(await page.getByLabel("Jazyk náhledu").count(), 0);
    assert.equal(await copies.locator(".special-print-items[data-menu-print-fit]").count(), 1);
  }
  for (let index = 0; index < copyCount; index += 1) {
    const copy = copies.nth(index);
    if (special) {
      assert.equal(await copy.locator(".special-print-dish").count(), items.length);
      for (let dishIndex = 0; dishIndex < items.length; dishIndex += 1) {
        const dish = copy.locator(".special-print-dish").nth(dishIndex);
        const item = items[dishIndex];
        assert.deepEqual(await dish.locator("h3").allTextContents(), [item.translations.it.name, item.name, item.translations.en.name]);
        assert.equal(await dish.locator("strong.special-print-price").count(), 1);
        assert.equal(await dish.locator("strong.special-print-price").innerText(), item.price);
        assert.equal(await dish.locator("p").count(), 0, "Special print contains no dish descriptions");
      }
    } else {
      assert.deepEqual(await copy.locator(".print-menu-items h3").allTextContents(), items.map((item) => item.name));
      assert.deepEqual(await copy.locator(".print-menu-items p").allTextContents(), items.map((item) => item.description));
      assert.equal(await copy.locator(".print-menu-items strong").count(), items.length);
    }
  }
  const clipping = await copies.evaluateAll((elements) => elements.flatMap((copy, copyIndex) => {
    const issues = [];
    const frame = copy.getBoundingClientRect();
    const viewport = (copy.querySelector(".menu-print-items-viewport") || copy.querySelector(".print-menu-items, .special-print-items")).getBoundingClientRect();
    const contains = (outer, inner) => inner.left >= outer.left - 2 && inner.right <= outer.right + 2 && inner.top >= outer.top - 2 && inner.bottom <= outer.bottom + 2;
    copy.querySelectorAll("h2,h3,p,strong,small,img").forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (element.matches(".print-menu-items h3, .print-menu-items p, .special-print-items h3") && parseFloat(getComputedStyle(element).fontSize) < 5) {
        issues.push(`Copy ${copyIndex + 1} has near-zero type: ${element.textContent.slice(0, 45)}`);
      }
      if (!contains(frame, bounds)) issues.push(`Copy ${copyIndex + 1} outside frame: ${element.textContent.slice(0, 45)}`);
      if (element.closest(".print-menu-items, .special-print-items") && !contains(viewport, bounds)) issues.push(`Copy ${copyIndex + 1} outside items viewport: ${element.textContent.slice(0, 45)}`);
    });
    return issues;
  }));
  assert.deepEqual(clipping, [], `${kind}, ${items.length} dishes, ${phase}: no text clipping`);
}

function inspectPdf(path, verifyText, kind) {
  const inspection = JSON.parse(execFileSync(python, ["-c", "import json,sys; from pypdf import PdfReader; r=PdfReader(sys.argv[1]); print(json.dumps({'pages':len(r.pages),'size':[float(r.pages[0].mediabox.width),float(r.pages[0].mediabox.height)],'text':'\\n'.join(p.extract_text() or '' for p in r.pages)}))", path], { encoding: "utf8" }));
  assert.equal(inspection.pages, 1, `${path} must have exactly one page`);
  assert.ok(Math.abs(inspection.size[0] - 595.28) < 1.5 && Math.abs(inspection.size[1] - 841.89) < 1.5, `${path} must be portrait A4`);
  if (verifyText) {
    const markerCount = kind === "special" ? 3 : 2;
    items.forEach((_, index) => {
      const marker = `DISH${String(index + 1).padStart(2, "0")}`;
      assert.equal(inspection.text.split(marker).length - 1, markerCount, `Native ${kind} PDF must contain ${marker} ${markerCount} times`);
    });
    if (kind === "special") {
      const text = inspection.text.replace(/\s+/g, " ");
      assert.equal(text.split("I nostri piatti speciali").length - 1, 1, "Special PDF contains its Italian heading once");
    }
  }
  execFileSync(pdftoppm, ["-singlefile", "-scale-to", "1800", "-png", path, path.replace(/\.pdf$/, "")], { stdio: "pipe" });
  return { pages: inspection.pages, size: inspection.size };
}

try {
  await page.goto(`${baseURL}/admin`);
  await page.locator("[name='username']").fill("perla");
  await page.locator("[name='password']").fill("la perla");
  await page.getByRole("checkbox", { name: "Speciální menu", exact: true }).waitFor();

  for (const kind of testKinds) {
    for (const count of testCounts) {
      items = fixtures(count, kind);
      await page.reload();
      const language = kind === "special" ? "it-cs-en" : "cs";
      if (kind === "special") {
        await page.getByRole("checkbox", { name: "Speciální menu", exact: true }).check();
        await page.locator(".special-admin-workspace [name='name-cs']").waitFor();
      } else {
        await page.locator("input[type='date']").fill("2026-09-17");
      }
      const sheet = page.locator(kind === "special" ? ".special-print-sheet" : ".daily-print-sheet");
      const dishes = kind === "special"
        ? sheet.locator(".special-print-dish")
        : sheet.locator(".daily-print-preview").first().locator(".print-menu-items article");
      await dishes.nth(count - 1).waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      await assertCopiesAndBounds(kind, "screen preview");
      const stem = `${kind}-${count}-${language}`;
      await sheet.screenshot({ path: join(artifactDirectory, `${stem}-preview.png`) });

      const downloaded = page.waitForEvent("download");
      await page.getByRole("button", { name: "Stáhnout PDF", exact: true }).click();
      const download = await downloaded;
      if (kind === "special") assert.equal(download.suggestedFilename(), "specialni-menu.pdf");
      const downloadPath = join(artifactDirectory, `${stem}-download.pdf`);
      await download.saveAs(downloadPath);
      const downloadedMetadata = inspectPdf(downloadPath, false, kind);
      await page.getByRole("button", { name: "Stáhnout PDF", exact: true }).waitFor();

      await page.emulateMedia({ media: "print" });
      await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
      await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      await assertCopiesAndBounds(kind, "browser print");
      const nativePath = join(artifactDirectory, `${stem}-native.pdf`);
      await page.pdf({ path: nativePath, format: "A4", preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      const nativeMetadata = inspectPdf(nativePath, true, kind);
      await page.emulateMedia({ media: "screen" });
      const result = { kind, count, language, download: downloadedMetadata, native: nativeMetadata };
      results.push(result);
      const layout = kind === "special" ? "one trilingual menu" : "two complete copies";
      console.log(`PASS ${kind} ${count} dishes (${language}): ${layout}, no clipping, downloaded and browser PDF each one A4 page`);
    }
  }
  assert.deepEqual(errors, [], "No runtime errors");
  await writeFile(join(artifactDirectory, "results.json"), JSON.stringify(results, null, 2));
  console.log(`\n${results.length} print scenarios passed. Rendered PDF evidence: ${artifactDirectory}`);
} catch (error) {
  await page.screenshot({ path: join(artifactDirectory, "failure.png"), fullPage: true });
  console.error(`Print artifacts: ${artifactDirectory}`);
  throw error;
} finally {
  await context.close();
  await browser.close();
}
