import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { dicts } from '@/lib/i18n';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setLocation,
  settingsItem,
  suggestMethod,
  updateSettings,
  withDefaults,
} from '@/lib/settings';

describe('withDefaults', () => {
  it('fills missing nested fields from the defaults (settings saved by older versions)', () => {
    const s = withDefaults({ audio: { muted: true } } as never);
    expect(s.audio).toEqual({ ...DEFAULT_SETTINGS.audio, muted: true });
    expect(s.ramadan).toEqual(DEFAULT_SETTINGS.ramadan);
  });

  it('keeps saved values', () => {
    expect(withDefaults({ method: 'Egyptian' }).method).toBe('Egyptian');
  });
});

describe('suggestMethod', () => {
  it.each([
    ['SA', 'UmmAlQura'],
    ['EG', 'Egyptian'],
    ['PK', 'Karachi'],
    ['US', 'NorthAmerica'],
    ['AE', 'Dubai'],
  ])('%s -> %s', (cc, method) => expect(suggestMethod(cc)).toBe(method));

  it('returns undefined for unknown or missing countries', () => {
    expect(suggestMethod('ZZ')).toBeUndefined();
    expect(suggestMethod(undefined)).toBeUndefined();
  });
});

describe('settings storage', () => {
  beforeEach(() => fakeBrowser.reset());

  it('starts with the defaults', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('updateSettings saves the new value', async () => {
    await updateSettings((x) => ({ ...x, audio: { ...x.audio, sound: 'madinah' } }));
    expect((await getSettings()).audio.sound).toBe('madinah');
    expect((await settingsItem.getValue()).audio?.sound).toBe('madinah');
  });

  it('setLocation picks the official method for the country', async () => {
    await setLocation({ lat: 30.04, lng: 31.24, city: 'Cairo', countryCode: 'EG', timezone: 'Africa/Cairo' });
    const s = await getSettings();
    expect(s.location?.city).toBe('Cairo');
    expect(s.method).toBe('Egyptian');
  });

  it('setLocation keeps the current method for unknown countries', async () => {
    await updateSettings((x) => ({ ...x, method: 'Karachi' }));
    await setLocation({ lat: 0, lng: 0, city: 'Somewhere', timezone: 'UTC' });
    expect((await getSettings()).method).toBe('Karachi');
  });
});

describe('translations', () => {
  const keys = (o: object) => Object.keys(o).sort();

  it('English and Arabic have the same keys', () => {
    expect(keys(dicts.ar)).toEqual(keys(dicts.en));
    expect(keys(dicts.ar.methods)).toEqual(keys(dicts.en.methods));
  });

  it('no translation is empty', () => {
    for (const d of [dicts.en, dicts.ar]) {
      for (const [k, v] of Object.entries(d)) if (typeof v === 'string') expect(v.trim(), k).not.toBe('');
    }
  });
});
