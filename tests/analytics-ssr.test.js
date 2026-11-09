import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

test("current-site privacy stays readable without JS while consent controls wait for the client", async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL("../", import.meta.url)),
    plugins: [react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: "custom", logLevel: "error",
  });
  try {
    const { default: CookiePrivacy, PrivacySettingsButton } = await server.ssrLoadModule("/src/restaurant/CookiePrivacy.jsx");
    const { default: PrivacyPage } = await server.ssrLoadModule("/src/restaurant/PrivacyPage.jsx");
    for (const language of ["cs", "en", "it"]) {
      assert.equal(renderToString(React.createElement(CookiePrivacy, { language, pathname: "/", noticeAccepted: true })), "");
      assert.equal(renderToString(React.createElement(PrivacySettingsButton, { language })), "");
      const html = renderToString(React.createElement(PrivacyPage, { language }));
      assert.match(html, /B &amp; D DINAMIC, s\.r\.o\./);
      assert.match(html, /26764776/);
      assert.match(html, /la-piccola-perla-analytics-consent-v2/);
      assert.match(html, /Google Analytics 4/);
      assert.match(html, /Vercel Web Analytics/);
      assert.match(html, /2026-11-09/);
      assert.doesNotMatch(html, /<script[^>]+googletagmanager\.com|<iframe/);
    }
  } finally {
    await server.close();
  }
});
