// End-to-end: every <select> on the Settings page must keep and save the chosen value.
// Run with `npm run test:e2e` (builds first).
import assert from 'node:assert/strict';
import { launch, RIYADH, seedSettings, sleep } from './launch.mjs';

const { browser, url } = await launch();
let failures = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url('options.html'));
  await seedSettings(page, { location: RIYADH });
  await page.reload();
  await page.waitForSelector('select');

  const count = await page.$$eval('select', (els) => els.length);
  assert.ok(count >= 10, `expected the settings selects, found ${count}`);

  for (let i = 0; i < count; i++) {
    const { before, options } = await page.evaluate((k) => {
      const el = document.querySelectorAll('select')[k];
      return { before: el.value, options: [...el.options].map((o) => o.value) };
    }, i);
    // Skip language so the rest of the page keeps the same layout.
    if (options.includes('ar') && options.includes('en')) continue;
    const pick = options.find((o) => o !== before);
    if (pick === undefined) continue;

    await (await page.$$('select'))[i].select(pick);
    await sleep(400);
    const after = await page.evaluate((k) => document.querySelectorAll('select')[k].value, i);
    const ok = after === pick;
    if (!ok) failures++;
    console.log(`${ok ? '✓' : '✗'} select #${i} ${before} → ${pick}${ok ? '' : ` (still ${after})`}`);
  }

  // The values must also survive a reload, i.e. be stored.
  const shown = await page.$$eval('select', (els) => els.map((e) => e.value));
  await page.reload();
  await page.waitForSelector('select');
  const reloaded = await page.$$eval('select', (els) => els.map((e) => e.value));
  assert.deepEqual(reloaded, shown, 'values after reload differ');
  console.log('✓ values persist after reload');

  assert.deepEqual(errors, [], 'page errors');
  for (const p of ['newtab.html', 'popup.html', 'timetable.html']) {
    const tab = await browser.newPage();
    const errs = [];
    tab.on('pageerror', (e) => errs.push(e.message));
    await tab.goto(url(p));
    await sleep(800);
    assert.deepEqual(errs, [], `${p} errors`);
    assert.ok((await tab.$eval('#root', (r) => r.childElementCount)) > 0, `${p} rendered nothing`);
    console.log(`✓ ${p} renders without errors`);
    await tab.close();
  }
} catch (e) {
  failures++;
  console.error('✗', e.message);
} finally {
  await browser.close();
}
if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll e2e checks passed');
