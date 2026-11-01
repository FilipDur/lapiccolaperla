import { build } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writePublicPages } from "./site-pages.mjs";

await build();
await build({ build: {
  ssr: "src/entry-server.jsx", outDir: ".server", emptyOutDir: true,
  rollupOptions: { input: resolve("src/entry-server.jsx"), output: { entryFileNames: "entry-server.js" } }
} });
await mkdir(".server/templates", { recursive: true });
for (const language of ["cs", "en", "it"]) {
  const file = language === "cs" ? "index.html" : `${language}.html`;
  await writeFile(`.server/templates/${language}.html`, await readFile(`dist/${file}`, "utf8"));
}
const { renderDocument } = await import(pathToFileURL(resolve(".server/entry-server.js")).href);
await writePublicPages(resolve("dist"), renderDocument);
console.log("Prerendered public documents; dynamic renderer and templates ready in .server.");
