import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getPageSeo, publicRoutes, SITE_URL } from '../src/restaurant/seo.js';
import { routeHref } from '../src/restaurant/routes.js';
import { menuNames } from '../src/data/menuNames.js';

// Read-only GET verification. Production requires an explicit flag and the exact
// authorized origin. Redirect responses are inspected without following them.
const { values, positionals } = parseArgs({
  options: { production: { type: 'boolean', default: false }, output: { type: 'string' } },
  allowPositionals: true,
});
if (positionals.length > 1) throw new Error('Expected at most one base URL.');
const base = new URL(positionals[0] || 'http://127.0.0.1:4180');
const cleanOrigin = base.pathname === '/' && !base.search && !base.hash && !base.username && !base.password;
const isProduction = values.production && base.origin === SITE_URL && cleanOrigin;
const isLocal = !values.production && ['http:', 'https:'].includes(base.protocol)
  && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && cleanOrigin;
if (!isProduction && !isLocal) {
  throw new Error(`Use a local preview origin, or ${SITE_URL} with --production.`);
}
if (isProduction && !values.output) throw new Error('Production verification requires an explicit --output under artifacts/.');
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const artifactsRoot = resolve(repositoryRoot, 'artifacts');
const output = resolve(repositoryRoot, values.output || 'artifacts/current-site-seo-2026-10-31/http-verification.json');
const outputRelative = relative(artifactsRoot, output);
if (!outputRelative || outputRelative === '..' || outputRelative.startsWith('..\\') || outputRelative.startsWith('../')
  || isAbsolute(outputRelative) || !output.toLowerCase().endsWith('.json')) {
  throw new Error('The output must be a JSON file inside this repository artifacts/ directory.');
}
const startedAt = new Date().toISOString();
const failures = [];
let checkCount = 0;

function check(scope, condition, message) {
  checkCount += 1;
  if (!condition) failures.push({ scope, message });
}

function decode(text = '') {
  return text.replace(/&(?:#(x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (entity, numeric) => {
    if (numeric) return String.fromCodePoint(numeric[0].toLowerCase() === 'x' ? parseInt(numeric.slice(1), 16) : Number(numeric));
    return { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' }[entity.toLowerCase()];
  });
}

function textContent(html = '') {
  return decode(html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    values[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
  }
  return values;
}

function parseHtml(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]));
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const root = html.match(/<div\b[^>]*\bid=["']root["'][^>]*>([\s\S]*?)<\/div><!--perla-root-end-->/i)?.[1] || '';
  const jsonLd = [];
  const jsonErrors = [];
  for (const match of head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[0].slice(0, match[0].indexOf('>') + 1)).type !== 'application/ld+json') continue;
    try { jsonLd.push(JSON.parse(match[1])); } catch (error) { jsonErrors.push(error.message); }
  }
  let initialData = null;
  let bootstrapError = null;
  const bootstrap = html.match(/<script\b(?=[^>]*\bid=["']perla-initial-data["'])[^>]*>([\s\S]*?)<\/script>/i);
  try { initialData = bootstrap ? JSON.parse(bootstrap[1]).initialData : null; } catch (error) { bootstrapError = error.message; }
  return {
    title: textContent(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    lang: attributes(html.match(/<html\b[^>]*>/i)?.[0] || '').lang,
    descriptions: meta.filter(item => item.name === 'description').map(item => item.content),
    robots: Object.fromEntries(meta.filter(item => ['robots', 'googlebot', 'bingbot', 'slurp'].includes(item.name)).map(item => [item.name, item.content])),
    canonical: links.filter(item => item.rel === 'canonical').map(item => item.href),
    alternates: links.filter(item => item.rel === 'alternate' && item.hreflang).map(item => ({ language: item.hreflang, href: item.href })),
    h1: [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => textContent(match[1])),
    h3: [...main.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)].map(match => textContent(match[1])),
    rootMarkupBytes: Buffer.byteLength(root),
    mainMarkupBytes: Buffer.byteLength(main),
    mainTextCharacters: textContent(main).length,
    mainTextSample: textContent(main).slice(0, 240),
    jsonLd, jsonErrors, initialData, bootstrapError,
    ogUrl: meta.filter(item => item.property === 'og:url').map(item => item.content),
  };
}

async function get(path) {
  const began = performance.now();
  try {
    const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const body = await response.text();
    return {
      path, status: response.status, milliseconds: Math.round(performance.now() - began),
      headers: Object.fromEntries(['content-type', 'location', 'x-robots-tag', 'cache-control'].map(key => [key, response.headers.get(key)])),
      bodyBytes: Buffer.byteLength(body), sha256: createHash('sha256').update(body).digest('hex'), body,
    };
  } catch (error) {
    check(path, false, `HTTP request failed: ${error.message}`);
    return { path, status: null, milliseconds: Math.round(performance.now() - began), error: error.message, headers: {}, body: '' };
  }
}

const types = entity => Array.isArray(entity?.['@type']) ? entity['@type'] : [entity?.['@type']];
const graphOf = data => data.flatMap(item => item['@graph'] || (Array.isArray(item) ? item : [item]));
const hasCompleteSpecial = items => Array.isArray(items) && items.some(item =>
  [item?.name, item?.price, item?.translations?.en?.name, item?.translations?.it?.name].every(value => typeof value === 'string' && value.trim()));

async function inspectPage(route, expectedStatus = 200) {
  const response = await get(route.path);
  const parsed = parseHtml(response.body);
  const scope = route.path;
  const hasSpecialMenu = hasCompleteSpecial(parsed.initialData?.specialMenuItems);
  const seo = getPageSeo(route.page, route.language, { hasSpecialMenu });
  const graph = graphOf(parsed.jsonLd);
  const webpages = graph.filter(entity => types(entity).includes('WebPage'));
  const restaurants = graph.filter(entity => types(entity).includes('Restaurant'));
  check(scope, response.status === expectedStatus, `Expected HTTP ${expectedStatus}, received ${response.status}`);
  check(scope, response.headers['content-type']?.includes('text/html'), 'Response is not HTML');
  check(scope, parsed.title === seo.title, `Unexpected title: ${parsed.title}`);
  check(scope, parsed.lang === seo.htmlLang, `Unexpected HTML language: ${parsed.lang}`);
  check(scope, parsed.h1.length === 1 && Boolean(parsed.h1[0]), `Expected one nonempty main H1, found ${parsed.h1.length}`);
  check(scope, parsed.descriptions.length === 1 && parsed.descriptions[0] === seo.description, 'Missing, duplicate or incorrect description');
  check(scope, JSON.stringify(parsed.canonical) === JSON.stringify(seo.canonical ? [seo.canonical] : []), 'Incorrect canonical links');
  check(scope, JSON.stringify(parsed.ogUrl) === JSON.stringify(seo.canonical ? [seo.canonical] : []), 'Incorrect og:url');
  const expectedAlternates = seo.alternates.length ? [...seo.alternates, { language: 'x-default', href: `${SITE_URL}${routeHref(route.page, 'cs')}` }] : [];
  const sorted = values => [...values].sort((a, b) => a.language.localeCompare(b.language));
  check(scope, JSON.stringify(sorted(parsed.alternates)) === JSON.stringify(sorted(expectedAlternates)), 'Incorrect or duplicate hreflang links');
  for (const name of ['robots', 'googlebot', 'bingbot', 'slurp']) check(scope, parsed.robots[name] === seo.robots, `Incorrect ${name} directive`);
  check(scope, parsed.rootMarkupBytes > 1000 && parsed.mainMarkupBytes > 100 && parsed.mainTextCharacters > 30, 'Real SSR root/main content is missing or empty');
  check(scope, parsed.jsonErrors.length === 0 && parsed.jsonLd.length > 0, 'Missing or invalid JSON-LD');
  check(scope, restaurants.length === 1 && restaurants[0].menu === `${SITE_URL}${routeHref('menu', seo.htmlLang)}`, 'Restaurant schema menu does not match the language');
  check(scope, webpages.length === (expectedStatus === 404 ? 0 : 1), 'Unexpected number of WebPage schema entities');
  if (webpages.length) {
    check(scope, webpages[0].url === seo.canonical && webpages[0]['@id'] === `${seo.canonical}#webpage` && webpages[0].name === seo.title, 'WebPage schema identity does not match metadata');
  }
  check(scope, parsed.initialData?.pathname === route.path && parsed.initialData?.language === route.language && !parsed.bootstrapError, 'Missing or inconsistent SSR hydration data');
  if (expectedStatus === 404) check(scope, response.headers['x-robots-tag']?.includes('noindex'), '404 lacks X-Robots-Tag noindex');
  const genericMenuTranslations = route.page === 'menu' ? Object.entries(menuNames).map(([original, translations]) => {
    const expected = route.language === 'cs' ? original : translations[route.language];
    const found = parsed.h3.includes(expected);
    check(scope, found, `Generic menu item missing from SSR dish headings: ${expected}`);
    if (route.language !== 'cs') check(scope, !parsed.h3.includes(original), `Czech generic menu name remains untranslated: ${original}`);
    return { original, expected, found };
  }) : [];
  const { body, ...http } = response;
  const { initialData, jsonLd, h3, ...metadata } = parsed;
  return { ...route, ...http, ...metadata, hasSpecialMenu, genericMenuTranslations, jsonLdTypes: graph.map(entity => entity['@type']), webpage: webpages[0] || null, restaurantMenu: restaurants[0]?.menu || null };
}

const pages = [];
// Bounded batches avoid flooding the preview or its read-only menu backend.
for (let index = 0; index < publicRoutes.length; index += 3) {
  pages.push(...await Promise.all(publicRoutes.slice(index, index + 3).map(route => inspectPage(route))));
}
check('public inventory', pages.length === 22, `Expected 22 public pages, got ${pages.length}`);
check('public inventory', new Set(pages.map(page => page.title)).size === 22, 'Public titles are not all unique');
check('public inventory', new Set(pages.flatMap(page => page.canonical)).size === 22, 'Public canonicals are not all unique');

const notFound = [];
for (const [path, language] of [['/seo-audit-missing-20261031', 'cs'], ['/en/seo-audit-missing-20261031', 'en'], ['/it/seo-audit-missing-20261031.html', 'it']]) {
  notFound.push(await inspectPage({ path, language, page: 'notFound' }, 404));
}

const redirects = [];
for (const [path, target] of [
  ['/copy-of-home', '/menu'], ['/copy-of-home.html?utm_source=maps', '/menu?utm_source=maps'],
  ['/gallery', '/galerie'], ['/gallery.html', '/galerie'],
  ['/index.html', '/'], ['/index-en.html', '/en'], ['/index-it.html', '/it'], ['/index-de.html', '/it'],
  ['/en/gallery.html?lang=it&x=1&x=2', '/it/galerie?x=1&x=2'],
  ['/menu/?lang=en&category=pasta', '/en/menu?category=pasta'],
  ['/en/denni-menu?lang=it', '/denni-menu'],
  ['/rezervace', '/kontakt'], ['/it/prenotazioni', '/it/kontakt'],
]) {
  const response = await get(path);
  const location = response.headers.location;
  const destination = location ? new URL(location, base) : null;
  check(path, response.status === 308, `Expected direct HTTP 308, received ${response.status}`);
  check(path, destination && destination.pathname + destination.search === target, `Wrong redirect target: ${location}`);
  check(path, destination && [base.origin, SITE_URL].includes(destination.origin), 'Unexpected redirect origin');
  const { body, ...record } = response;
  redirects.push({ ...record, expectedTarget: target });
}

const robotsResponse = await get('/robots.txt');
check('/robots.txt', robotsResponse.status === 200, `Expected HTTP 200, received ${robotsResponse.status}`);
check('/robots.txt', /^User-agent:\s*\*/im.test(robotsResponse.body) && /^Allow:\s*\//im.test(robotsResponse.body), 'Missing public crawl allowance');
check('/robots.txt', !/^Disallow:\s*\/\s*$/im.test(robotsResponse.body), 'Robots blocks the whole site');
check('/robots.txt', robotsResponse.body.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'Missing canonical sitemap directive');

const sitemapResponse = await get('/sitemap.xml');
const locations = [...sitemapResponse.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
const expectedLocations = pages.filter(page => !page.robots.robots?.includes('noindex')).flatMap(page => page.canonical);
check('/sitemap.xml', sitemapResponse.status === 200, `Expected HTTP 200, received ${sitemapResponse.status}`);
check('/sitemap.xml', sitemapResponse.headers['content-type']?.includes('xml'), 'Response is not XML');
check('/sitemap.xml', [19, 22].includes(locations.length), `Expected 19 or 22 sitemap URLs, got ${locations.length}`);
check('/sitemap.xml', JSON.stringify([...locations].sort()) === JSON.stringify([...expectedLocations].sort()), 'Sitemap differs from the indexable canonical pages actually served');
check('/sitemap.xml', new Set(locations).size === locations.length, 'Duplicate sitemap URLs');

const verification = await get('/google260a340fd746cdf3.html');
check(verification.path, verification.status === 200 && verification.body.trim() === 'google-site-verification: google260a340fd746cdf3.html', 'Google verification file does not pass through unchanged');

const { body: robotsBody, ...robotsHttp } = robotsResponse;
const { body: sitemapBody, ...sitemapHttp } = sitemapResponse;
const { body: verificationBody, ...verificationHttp } = verification;
const result = {
  startedAt, completedAt: new Date().toISOString(), baseUrl: base.origin, environment: isProduction ? 'production' : 'local-preview',
  method: `Read-only GET of ${isProduction ? 'the explicitly authorized production origin' : 'built local preview'} using Node fetch with redirect:manual. Raw HTML only; no browser or server-side writes. Metadata compared with source SEO contract; unique URLs/titles, content, statuses and sitemap independently checked.`,
  limitation: isProduction
    ? 'This verifies deployed HTTP responses at the recorded time and their agreement with the local SEO contract. It does not verify browser hydration, analytics event receipt, Search Console indexing or Google account state.'
    : 'This verifies the local preview and source/build agreement, not deployed hosting, browser hydration, Search Console indexing or live Google data.',
  summary: { passed: failures.length === 0, checks: checkCount, failedChecks: failures.length, publicPages: pages.length, notFoundPages: notFound.length, redirectCases: redirects.length, sitemapUrls: locations.length },
  failures, pages, notFound, redirects,
  robots: { ...robotsHttp, content: robotsBody }, sitemap: { ...sitemapHttp, locations },
  googleVerification: { ...verificationHttp, content: verificationBody.trim() },
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output, ...result.summary, failures }, null, 2));
if (failures.length) process.exitCode = 1;
