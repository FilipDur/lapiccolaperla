import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { parseRoute, routeHref } from '../src/restaurant/routes.js';
import { getRestaurantDate } from '../src/lib/restaurantDate.js';

test('public links resolve to the same page in every supported language', () => {
  for (const language of ['cs', 'en', 'it']) {
    for (const page of ['home', 'menu', 'special', 'about', 'gallery', 'contact']) {
      const href = routeHref(page, language);
      assert.deepEqual(parseRoute(href), { page, language }, href);
      assert.deepEqual(parseRoute(`${href}/`), { page, language }, `${href}/`);
    }
  }
  assert.equal(routeHref('menu', 'cs'), '/menu');
  assert.equal(routeHref('contact', 'en'), '/en/kontakt');
  assert.equal(routeHref('gallery', 'it'), '/it/galerie');
});

test('daily menu always resolves to the Czech version', () => {
  for (const language of ['cs', 'en', 'it']) {
    assert.equal(routeHref('daily', language), '/denni-menu');
    assert.deepEqual(parseRoute(`/${language}/denni-menu`), { page: 'daily', language: 'cs' });
    assert.deepEqual(parseRoute(`/${language}`, '#daily-menu'), { page: 'daily', language: 'cs' });
  }
});

test('existing section links reach the corresponding pages and preserve language', () => {
  const aliases = {
    'special-menu': 'special', reservation: 'contact', about: 'about',
    gallery: 'gallery', menu: 'menu', contact: 'contact'
  };
  for (const [hash, page] of Object.entries(aliases)) {
    assert.deepEqual(parseRoute('/en', `#${hash}`), { page, language: 'en' });
    assert.deepEqual(parseRoute(`/it#${hash}`), { page, language: 'it' });
  }
});

test('legacy language entry points remain usable', () => {
  assert.deepEqual(parseRoute('/index.html'), { page: 'home', language: 'cs' });
  for (const [path, language] of [
    ['/en.html', 'en'], ['/it.html', 'it'],
    ['/index-en.html', 'en'], ['/index-it.html', 'it'], ['/index-de.html', 'it'],
    ['/index-en', 'en'], ['/index-it', 'it'], ['/index-de', 'it']
  ]) {
    assert.deepEqual(parseRoute(path), { page: 'home', language }, path);
  }
});

test('URLs with queries, full origins or encoded slugs keep their intended route', () => {
  assert.deepEqual(parseRoute('/en/menu?source=header'), { page: 'menu', language: 'en' });
  assert.deepEqual(parseRoute('https://lapiccolaperla.cz/it/menu?source=footer#gallery'), { page: 'gallery', language: 'it' });
  assert.deepEqual(parseRoute('/%65n/%6denu'), { page: 'menu', language: 'en' });
});

test('unknown routes cannot be converted into valid pages by a legacy hash', () => {
  assert.deepEqual(parseRoute('/en/missing', '#menu'), { page: 'notFound', language: 'en' });
  assert.deepEqual(parseRoute('/api/daily-menu'), { page: 'notFound', language: 'cs' });
  assert.deepEqual(parseRoute('/admin'), { page: 'notFound', language: 'cs' });
  assert.deepEqual(parseRoute('/admin.html'), { page: 'notFound', language: 'cs' });
  assert.deepEqual(parseRoute('/%E0%A4%A'), { page: 'notFound', language: 'cs' });
});

test('unrecognized hash values including inherited object keys are ignored', () => {
  for (const hash of ['#unknown', '#constructor', '#toString', '#__proto__']) {
    assert.deepEqual(parseRoute('/en/menu', hash), { page: 'menu', language: 'en' }, hash);
  }
});

test('restaurant dates switch at Prague midnight rather than UTC midnight', () => {
  assert.equal(getRestaurantDate(new Date('2026-01-04T22:59:59Z')), '2026-01-04');
  assert.equal(getRestaurantDate(new Date('2026-01-04T23:00:00Z')), '2026-01-05');
  assert.equal(getRestaurantDate(new Date('2026-07-05T21:59:59Z')), '2026-07-05');
  assert.equal(getRestaurantDate(new Date('2026-07-05T22:00:00Z')), '2026-07-06');
  assert.equal(getRestaurantDate(new Date('2026-12-31T23:00:00Z')), '2027-01-01');
});

test('Prague day boundaries follow both daylight-saving transitions', () => {
  const cases = [
    ['2026-03-28T22:59:59Z', '2026-03-28'],
    ['2026-03-28T23:00:00Z', '2026-03-29'],
    ['2026-03-29T21:59:59Z', '2026-03-29'],
    ['2026-03-29T22:00:00Z', '2026-03-30'],
    ['2026-10-24T21:59:59Z', '2026-10-24'],
    ['2026-10-24T22:00:00Z', '2026-10-25'],
    ['2026-10-25T22:59:59Z', '2026-10-25'],
    ['2026-10-25T23:00:00Z', '2026-10-26']
  ];
  for (const [instant, date] of cases) assert.equal(getRestaurantDate(new Date(instant)), date, instant);
});

test('restaurant date is independent of the visitor runtime timezone', () => {
  const moduleUrl = new URL('../src/lib/restaurantDate.js', import.meta.url).href;
  const code = `import { getRestaurantDate } from ${JSON.stringify(moduleUrl)}; process.stdout.write(getRestaurantDate(new Date('2026-07-05T22:30:00Z')));`;
  for (const timeZone of ['UTC', 'America/Los_Angeles', 'Asia/Dubai']) {
    const date = execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      encoding: 'utf8', env: { ...process.env, TZ: timeZone }
    });
    assert.equal(date, '2026-07-06', timeZone);
  }
});
