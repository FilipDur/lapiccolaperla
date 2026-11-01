import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createLocalMenuReaders, localMenuApiPlugin } from "./scripts/local-menu-api.mjs";
import { createPublicPageHandler } from "./lib/publicPageServer.js";

function publicPages() {
  let config;
  let readers;
  const routeMiddleware = (server, preview = false) => async (request, response, next) => {
    const url = new URL(request.url, "http://localhost");
    const pathname = url.pathname;
    if (/^\/google260a340fd746cdf3(?:\.html)?$/.test(pathname)) {
      request.url = "/google260a340fd746cdf3.html";
      return next();
    }
    if (!["GET", "HEAD"].includes(request.method) || /^\/(?:api|src|node_modules|assets|images|@[^/]*)(?:\/|$)/.test(pathname)) return next();
    if (/^\/admin(?:\.html)?\/?$/.test(pathname)) {
      request.url = "/admin.html";
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
      return next();
    }
    if (pathname.endsWith(".html") && existsSync(resolve(config.publicDir, "." + pathname))) return next();
    if (pathname.includes(".") && !pathname.endsWith(".html") && pathname !== "/sitemap.xml") return next();
    return createPublicPageHandler({
      loadRenderer: () => preview
        ? import(pathToFileURL(resolve(config.root, ".server/entry-server.js")).href)
        : server.ssrLoadModule("/src/entry-server.jsx"),
      readTemplate: async (language) => {
        if (preview) return readFile(resolve(config.root, `.server/templates/${language}.html`), "utf8");
        const source = await readFile(resolve(config.root, language === "cs" ? "index.html" : `${language}.html`), "utf8");
        return server.transformIndexHtml(request.url, source);
      },
      ...readers,
    })(request, response);
  };
  return {
    name: "perla-public-pages",
    configResolved(resolved) {
      config = resolved;
      readers = createLocalMenuReaders({ storePath: resolve(config.root, ".local/menus.json") });
    },
    configureServer(server) { server.middlewares.use(routeMiddleware(server)); },
    configurePreviewServer(server) { server.middlewares.use(routeMiddleware(server, true)); },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), ...(!isSsrBuild ? [localMenuApiPlugin(), publicPages()] : [])],
  server: { host: "127.0.0.1", watch: { ignored: ["**/.local/**"] } },
  preview: { host: "127.0.0.1" },
  build: isSsrBuild ? {} : {
    rollupOptions: {
      input: {
        main: resolve("index.html"),
        admin: resolve("admin.html"),
        en: resolve("en.html"),
        it: resolve("it.html")
      }
    }
  }
}));
