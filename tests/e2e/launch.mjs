// Launches Edge or Chrome with the built extension (.output/chrome-mv3) for e2e tests and screenshots.
// Set BROWSER_PATH to use a specific browser.
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/microsoft-edge',
  '/usr/bin/chromium',
];

export const EXT_DIR = resolve('.output/chrome-mv3');

export async function launch({ headless = true } = {}) {
  const executablePath = CANDIDATES.find((p) => p && existsSync(p));
  if (!executablePath) throw new Error('No Edge/Chrome found. Set BROWSER_PATH.');
  if (!existsSync(join(EXT_DIR, 'manifest.json'))) throw new Error('Run `npm run build` first.');
  const browser = await puppeteer.launch({
    executablePath,
    headless,
    pipe: true,
    userDataDir: mkdtempSync(join(tmpdir(), 'azan-e2e-')),
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`, '--no-first-run', '--mute-audio'],
  });
  const sw = await browser.waitForTarget((t) => t.type() === 'service_worker', { timeout: 20_000 });
  const id = new URL(sw.url()).host;
  return { browser, id, url: (page) => `chrome-extension://${id}/${page}` };
}

/** Saves settings into the extension's sync storage (from any extension page). */
export const seedSettings = (page, settings) =>
  page.evaluate((s) => chrome.storage.sync.set({ settings: s }), settings);

/**
 * Makes the page think it is `iso` (the clock keeps ticking from there).
 * Must be called before navigation.
 */
export const fakeNow = (page, iso) =>
  page.evaluateOnNewDocument((target) => {
    const Real = Date;
    const delta = new Real(target).getTime() - Real.now();
    class FakeDate extends Real {
      constructor(...a) {
        if (a.length === 0) super(Real.now() + delta);
        else super(...a);
      }
      static now() {
        return Real.now() + delta;
      }
    }
    globalThis.Date = FakeDate;
  }, iso);

export const RIYADH = { lat: 24.7136, lng: 46.6753, city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', timezone: 'Asia/Riyadh' };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
