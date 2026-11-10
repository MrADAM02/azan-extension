// Generates store screenshots (1280×800) and the small promo tile (440×280) into store/.
// Run: npm run screenshots   (builds first; needs Edge or Chrome, see tests/e2e/launch.mjs)
import { mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { fakeNow, launch, RIYADH, seedSettings, sleep } from '../tests/e2e/launch.mjs';

const OUT = 'store/screenshots';
mkdirSync(OUT, { recursive: true });
const W = 1280;
const H = 800;

const base = { location: RIYADH, method: 'UmmAlQura' };
const shots = [
  // Friday 11:20 in Riyadh: next prayer is Jumu'ah
  { file: '1-newtab.png', page: 'newtab.html', at: '2026-11-13T08:20:00Z', settings: {} },
  // Ramadan day 13, 16:50: Iftar countdown, Arabic interface
  {
    file: '2-ramadan-arabic.png',
    page: 'newtab.html',
    at: '2027-02-20T13:50:00Z',
    settings: { display: { language: 'ar' }, location: { city: 'الرياض', country: 'السعودية' } },
  },
  // Evening, with the toolbar popup on top (composited below)
  { file: '3-popup.png', page: 'newtab.html', at: '2026-11-12T16:40:00Z', settings: {}, popup: true },
  { file: '4-settings.png', page: 'options.html', at: '2026-11-12T16:40:00Z', settings: {} },
  { file: '5-timetable.png', page: 'timetable.html', at: '2027-02-20T09:00:00Z', settings: {} },
];

const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a[k] ?? {}, v) : v;
  return out;
};

const { browser, url } = await launch();
try {
  const setup = await browser.newPage();
  await setup.goto(url('options.html'));

  for (const shot of shots) {
    await seedSettings(setup, merge(base, shot.settings));
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await fakeNow(page, shot.at);
    await page.goto(url(shot.page), { waitUntil: 'networkidle0' });
    await sleep(1500); // weather, fonts and the content card
    const png = await page.screenshot({ type: 'png' });

    if (shot.popup) {
      const pop = await browser.newPage();
      await pop.setViewport({ width: 320, height: 700, deviceScaleFactor: 1 });
      await fakeNow(pop, shot.at);
      await pop.goto(url('popup.html'), { waitUntil: 'networkidle0' });
      await sleep(800);
      const box = await pop.$eval('#root > *', (el) => {
        const r = el.getBoundingClientRect();
        return { x: 0, y: 0, width: Math.ceil(r.width), height: Math.ceil(r.height) };
      });
      const popPng = await pop.screenshot({ type: 'png', clip: box });
      await pop.close();
      const { width, height } = box;
      const r = 12;
      const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" fill="#fff"/></svg>`);
      const rounded = await sharp(popPng).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
      const shadow = await sharp({
        create: { width: width + 40, height: height + 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: Buffer.from(`<svg width="${width + 40}" height="${height + 40}"><rect x="20" y="24" width="${width}" height="${height}" rx="${r}" fill="rgba(0,0,0,.45)"/></svg>`) }])
        .blur(10)
        .png()
        .toBuffer();
      const left = W - width - 40;
      await sharp(png)
        .composite([
          { input: shadow, left: left - 20, top: 8 - 20 },
          { input: rounded, left, top: 8 },
        ])
        .toFile(`${OUT}/${shot.file}`);
    } else {
      await sharp(png).toFile(`${OUT}/${shot.file}`);
    }
    await page.close();
    console.log(`${OUT}/${shot.file}`);
  }

  // Small promo tile, 440×280
  const icon = readFileSync('assets/icon/icon-512.png').toString('base64');
  const tile = await browser.newPage();
  await tile.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });
  await tile.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:440px;height:280px;display:flex;align-items:center;gap:22px;padding:0 32px;box-sizing:border-box;
      background:linear-gradient(160deg,#052e25 0%,#0f5132 55%,#1f7a5a 100%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif">
      <img src="data:image/png;base64,${icon}" width="120" height="120" style="flex:none;margin:-12px">
      <div>
        <div style="font-size:34px;font-weight:700;line-height:1.1">Azan Tab</div>
        <div style="font-size:17px;opacity:.9;margin-top:8px;line-height:1.35">Prayer times, azan &amp; Hijri date on every new tab</div>
        <div style="font-size:20px;margin-top:10px;color:#fcd34d" dir="rtl">مواقيت الصلاة والأذان</div>
      </div>
    </div></body></html>`);
  await sleep(300);
  await tile.screenshot({ path: 'store/promo-small-440x280.png', type: 'png' });
  console.log('store/promo-small-440x280.png');
} finally {
  await browser.close();
}
