import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoute } from '../src/restaurant/routes.js';
import { getPageSeo, getRedirectUrl, publicRoutes, SITE_URL } from '../src/restaurant/seo.js';

const localizedSlugs = ['', 'menu', 'specialni-menu', 'o-nas', 'galerie', 'kontakt', 'ochrana-soukromi'];
const expectedPaths = [
  ...localizedSlugs.map(slug => `/${slug}`),
  '/denni-menu',
  ...['en', 'it'].flatMap(language => localizedSlugs.map(slug => `/${language}${slug ? `/${slug}` : ''}`))
];

test('current restaurant publishes exactly its 22 canonical pages, with reservations on contact pages', () => {
  assert.equal(publicRoutes.length, 22);
  assert.deepEqual(publicRoutes.map(route => route.path).sort(), [...expectedPaths].sort());
  assert.equal(new Set(publicRoutes.map(route => route.path)).size, 22);
  for (const route of publicRoutes) {
    assert.deepEqual(parseRoute(route.path), { page: route.page, language: route.language });
    assert.equal(getRedirectUrl(route.path), null, route.path);
  }
  assert.equal(publicRoutes.some(route => route.page === 'reservation'), false);
});

test('every canonical page has distinct title and description and its own canonical URL', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { page, language, path } of publicRoutes) {
    const seo = getPageSeo(page, language);
    assert.equal(seo.path, path);
    assert.equal(seo.canonical, `${SITE_URL}${path}`);
    assert.equal(seo.htmlLang, language);
    assert.equal(seo.locale, { cs: 'cs_CZ', en: 'en_US', it: 'it_IT' }[language]);
    assert.ok(seo.title.trim(), `${path} title`);
    assert.ok(seo.description.trim(), `${path} description`);
    assert.equal(titles.has(seo.title), false, `Duplicate title at ${path}: ${seo.title}`);
    assert.equal(descriptions.has(seo.description), false, `Duplicate description at ${path}`);
    titles.add(seo.title);
    descriptions.add(seo.description);
  }
  assert.equal(titles.size, 22);
  assert.equal(descriptions.size, 22);
});

test('hreflang points to reciprocal canonical translations of the same page', () => {
  for (const { page, language } of publicRoutes.filter(route => route.page !== 'daily')) {
    const seo = getPageSeo(page, language);
    assert.deepEqual(seo.alternates.map(alternate => alternate.language), ['cs', 'en', 'it']);
    for (const alternate of seo.alternates) {
      const translatedRoute = parseRoute(new URL(alternate.href).pathname);
      assert.deepEqual(translatedRoute, { page, language: alternate.language });
      const translatedSeo = getPageSeo(page, alternate.language);
      assert.equal(alternate.href, translatedSeo.canonical);
      assert.deepEqual(translatedSeo.alternates, seo.alternates);
    }
  }
});

test('daily SEO is Czech only even when requested through a legacy translated URL', () => {
  for (const language of ['cs', 'en', 'it']) {
    const seo = getPageSeo('daily', language);
    assert.equal(seo.htmlLang, 'cs');
    assert.equal(seo.canonical, `${SITE_URL}/denni-menu`);
    assert.deepEqual(seo.alternates, [{ language: 'cs', href: `${SITE_URL}/denni-menu` }]);
  }
  assert.equal(getRedirectUrl('/en/denni-menu?lang=it&campaign=lunch'), '/denni-menu?campaign=lunch');
});

test('missing pages have no canonical or alternate language targets and cannot become home redirects', () => {
  for (const [path, language] of [['/missing', 'cs'], ['/en/missing', 'en'], ['/it/missing', 'it']]) {
    assert.deepEqual(parseRoute(path), { page: 'notFound', language });
    for (const page of ['notFound', 'unknown-page', 'constructor']) {
      const seo = getPageSeo(page, language, { hasSpecialMenu: true });
      assert.equal(seo.canonical, null);
      assert.deepEqual(seo.alternates, []);
      assert.equal(seo.robots, 'noindex, follow');
      assert.ok(seo.title && seo.description);
    }
    assert.equal(getRedirectUrl(`${path}.html?lang=en&utm_source=search`), null);
  }
});

test('special-menu indexability follows published content without changing its canonical identity', () => {
  for (const language of ['cs', 'en', 'it']) {
    const absent = getPageSeo('special', language);
    const empty = getPageSeo('special', language, { hasSpecialMenu: false });
    const active = getPageSeo('special', language, { hasSpecialMenu: true });
    assert.equal(absent.robots, 'noindex, follow');
    assert.equal(empty.robots, 'noindex, follow');
    assert.equal(active.robots, 'index, follow, max-image-preview:large');
    assert.equal(active.canonical, empty.canonical);
    assert.deepEqual(active.alternates, empty.alternates);
  }
  for (const route of publicRoutes.filter(route => route.page !== 'special')) {
    assert.equal(getPageSeo(route.page, route.language).robots, 'index, follow, max-image-preview:large');
  }
});

test('historical Google menu and gallery URLs resolve directly to canonical pages, including HTML variants', () => {
  for (const [alias, canonical] of [
    ['/copy-of-home', '/menu'], ['/gallery', '/galerie'],
    ['/specialni-nabidka', '/specialni-menu'],
    ['/en/gallery', '/en/galerie'], ['/it/galleria', '/it/galerie'],
    ['/rezervace', '/kontakt'], ['/en/reservation', '/en/kontakt'], ['/it/prenotazioni', '/it/kontakt']
  ]) {
    for (const suffix of ['', '/', '.html', '.html/']) {
      const input = `${alias}${suffix}?utm_source=google&category=pasta#details`;
      const target = `${canonical}?utm_source=google&category=pasta#details`;
      assert.equal(getRedirectUrl(input), target, input);
      assert.deepEqual(parseRoute(`${alias}${suffix}`), parseRoute(canonical));
      assert.equal(getRedirectUrl(target), null, `${input} must not loop`);
    }
  }
});

test('old language entry points and canonical HTML paths need at most one redirect', () => {
  for (const [input, target] of [
    ['/index', '/'], ['/index.html', '/'],
    ['/index-en', '/en'], ['/index-en.html', '/en'], ['/en.html', '/en'],
    ['/index-it', '/it'], ['/index-it.html', '/it'], ['/it.html', '/it'],
    ['/index-de', '/it'], ['/index-de.html', '/it']
  ]) {
    assert.equal(getRedirectUrl(input), target, input);
    assert.equal(getRedirectUrl(target), null);
  }
  for (const { path } of publicRoutes.filter(route => route.path !== '/')) {
    for (const suffix of ['/', '.html', '.html/']) {
      assert.equal(getRedirectUrl(`${path}${suffix}`), path);
    }
  }
});

test('recognized lang translates the same page while preserving unrelated repeated parameters and fragments', () => {
  const cases = [
    ['/menu?lang=en&category=pizza&utm_source=maps', '/en/menu?category=pizza&utm_source=maps'],
    ['/en/o-nas?lang=it', '/it/o-nas'],
    ['/it/kontakt?lang=cs', '/kontakt'],
    ['/gallery.html?lang=it&x=1&x=2#photos', '/it/galerie?x=1&x=2#photos'],
    ['/copy-of-home?lang=en', '/en/menu'],
    ['/en/reservation.html?lang=it', '/it/kontakt'],
    ['/ochrana-soukromi?lang=en', '/en/ochrana-soukromi'],
    ['/en/menu?lang=en&lang=it&x=1', '/en/menu?x=1'],
    ['/menu?lang=de&category=wine', null],
    ['/gallery?lang=de', '/galerie?lang=de'],
    ['/en/menu?category=wine#details', null],
    ['/en/unknown?lang=cs', null]
  ];
  for (const [input, expected] of cases) {
    assert.equal(getRedirectUrl(input), expected, input);
    if (expected) assert.equal(getRedirectUrl(expected), null, input);
  }
  const url = new URL(`${SITE_URL}/en/gallery.html?lang=it&campaign=a%20b`);
  const original = url.href;
  assert.equal(getRedirectUrl(url), '/it/galerie?campaign=a+b');
  assert.equal(url.href, original, 'the caller URL must not be mutated');
});
