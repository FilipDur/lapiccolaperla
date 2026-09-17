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
const artifactDirectory = process.env.TEST_ARTIFACT_DIRECTORY || join(tmpdir(), `perla-two-up-print-${Date.now()}`);
await mkdir(artifactDirectory, { recursive: true });

const fixtures = (count) => Array.from({ length: count }, (_, index) => {
  const marker = `DISH${String(index + 1).padStart(2, "0")}`;
  const long = count > 1;
  return {
    id: `print-${index + 1}`,
    name: `${marker} ${long ? "Risotto s čerstvými hříbky, lanýžem, parmazánem a bylinkami podle tradičního italského receptu" : "Lanýžové risotto"}`,
    description: long ? "Krémové italské risotto připravené z vybrané rýže, čerstvých hříbků a sezonních surovin, dokončené máslem, parmazánem a aromatickým lanýžem. Podáváme s pečenou zeleninou, čerstvými bylinkami a jemnou omáčkou podle tradiční receptury našeho šéfkuchaře." : "Krémové risotto s čerstvým lanýžem.",
    price: `${395 + index * 10} Kč`,
    translations: {
      en: {
        name: `${marker} ${long ? "Creamy risotto with fresh porcini mushrooms, aromatic truffle, aged Parmesan cheese and seasonal herbs" : "Truffle risotto"}`,
        description: long ? "Traditional Italian risotto with selected rice, fresh porcini mushrooms and seasonal ingredients, finished with butter, aged Parmesan and aromatic truffle. Served with roasted vegetables, fresh herbs and a delicate sauce prepared by our chef." : "Creamy risotto with fresh truffle."
      },
      it: {
        name: `${marker} ${long ? "Risotto cremoso con funghi porcini freschi, tartufo aromatico, parmigiano stagionato ed erbe di stagione" : "Risotto al tartufo"}`,
        description: long ? "Risotto italiano tradizionale con riso selezionato, funghi porcini freschi e ingredienti di stagione, mantecato con burro, parmigiano e tartufo aromatico. Servito con verdure arrosto, erbe fresche e una delicata salsa preparata secondo la ricetta dello chef." : "Risotto cremoso al tartufo fresco."
      }
    }
  };
});

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "cs-CZ", reducedMotion: "reduce" });
let items = fixtures(1);
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

async function assertTwoCopiesAndBounds(kind, language, phase) {
  const copies = page.locator(".daily-print-sheet .daily-print-preview");
  assert.equal(await copies.count(), 2, `${kind} ${phase} should contain two copies`);
  const expected = items.map((item) => kind === "daily" || language === "cs" ? item : { ...item, ...item.translations[language] });
  for (let index = 0; index < 2; index += 1) {
    const copy = copies.nth(index);
    assert.deepEqual(await copy.locator(".print-menu-items h3").allTextContents(), expected.map((item) => item.name));
    assert.deepEqual(await copy.locator(".print-menu-items p").allTextContents(), expected.map((item) => item.description));
    assert.equal(await copy.locator(".print-menu-items strong").count(), items.length);
  }
  const clipping = await copies.evaluateAll((elements) => elements.flatMap((copy, copyIndex) => {
    const issues = [];
    const frame = copy.getBoundingClientRect();
    const viewport = (copy.querySelector(".menu-print-items-viewport") || copy.querySelector(".print-menu-items")).getBoundingClientRect();
    const contains = (outer, inner) => inner.left >= outer.left - 2 && inner.right <= outer.right + 2 && inner.top >= outer.top - 2 && inner.bottom <= outer.bottom + 2;
    copy.querySelectorAll("h2,h3,p,strong,small,img").forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (element.matches(".print-menu-items h3, .print-menu-items p") && parseFloat(getComputedStyle(element).fontSize) < 5) {
        issues.push(`Copy ${copyIndex + 1} has near-zero type: ${element.textContent.slice(0, 45)}`);
      }
      if (!contains(frame, bounds)) issues.push(`Copy ${copyIndex + 1} outside frame: ${element.textContent.slice(0, 45)}`);
      if (element.closest(".print-menu-items") && !contains(viewport, bounds)) issues.push(`Copy ${copyIndex + 1} outside items viewport: ${element.textContent.slice(0, 45)}`);
    });
    return issues;
  }));
  assert.deepEqual(clipping, [], `${kind}, ${items.length} dishes, ${phase}: no text clipping`);
}

function inspectPdf(path, verifyText) {
  const inspection = JSON.parse(execFileSync(python, ["-c", "import json,sys; from pypdf import PdfReader; r=PdfReader(sys.argv[1]); print(json.dumps({'pages':len(r.pages),'size':[float(r.pages[0].mediabox.width),float(r.pages[0].mediabox.height)],'text':'\\n'.join(p.extract_text() or '' for p in r.pages)}))", path], { encoding: "utf8" }));
  assert.equal(inspection.pages, 1, `${path} must have exactly one page`);
  assert.ok(Math.abs(inspection.size[0] - 595.28) < 1.5 && Math.abs(inspection.size[1] - 841.89) < 1.5, `${path} must be portrait A4`);
  if (verifyText) {
    items.forEach((_, index) => {
      const marker = `DISH${String(index + 1).padStart(2, "0")}`;
      assert.equal(inspection.text.split(marker).length - 1, 2, `Native PDF must contain ${marker} twice`);
    });
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
      items = fixtures(count);
      await page.reload();
      const language = kind === "special" ? ({ 1: "cs", 8: "en", 12: "it" })[count] : "cs";
      if (kind === "special") {
        await page.getByRole("checkbox", { name: "Speciální menu", exact: true }).check();
        await page.locator(".special-admin-workspace [name='name-cs']").waitFor();
        await page.getByLabel("Jazyk náhledu").selectOption(language);
      } else {
        await page.locator("input[type='date']").fill("2026-09-17");
      }
      await page.locator(".daily-print-sheet .daily-print-preview").first().locator(".print-menu-items article").nth(count - 1).waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      await assertTwoCopiesAndBounds(kind, language, "screen preview");
      const stem = `${kind}-${count}-${language}`;
      await page.locator(".daily-print-sheet").screenshot({ path: join(artifactDirectory, `${stem}-preview.png`) });

      const downloaded = page.waitForEvent("download");
      await page.getByRole("button", { name: "Stáhnout PDF", exact: true }).click();
      const download = await downloaded;
      const downloadPath = join(artifactDirectory, `${stem}-download.pdf`);
      await download.saveAs(downloadPath);
      const downloadedMetadata = inspectPdf(downloadPath, false);
      await page.getByRole("button", { name: "Stáhnout PDF", exact: true }).waitFor();

      await page.emulateMedia({ media: "print" });
      await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
      await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      await assertTwoCopiesAndBounds(kind, language, "browser print");
      const nativePath = join(artifactDirectory, `${stem}-native.pdf`);
      await page.pdf({ path: nativePath, format: "A4", preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      const nativeMetadata = inspectPdf(nativePath, true);
      await page.emulateMedia({ media: "screen" });
      const result = { kind, count, language, download: downloadedMetadata, native: nativeMetadata };
      results.push(result);
      console.log(`PASS ${kind} ${count} dishes (${language}): two complete copies, no clipping, downloaded and browser PDF each one A4 page`);
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
