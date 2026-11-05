import { storage } from 'wxt/utils/storage';
import { suggestMethod, withDefaults, type SavedLocation, type Settings } from './schema';

export * from './schema';

export const settingsItem = storage.defineItem<Partial<Settings>>('sync:settings', {
  fallback: {},
});

export async function getSettings(): Promise<Settings> {
  return withDefaults(await settingsItem.getValue());
}

export async function updateSettings(fn: (s: Settings) => Settings): Promise<Settings> {
  const next = fn(await getSettings());
  await settingsItem.setValue(next);
  return next;
}

/** Save a new location and switch to that country's official calculation method, if known. */
export function setLocation(location: SavedLocation) {
  return updateSettings((x) => ({ ...x, location, method: suggestMethod(location.countryCode) ?? x.method }));
}
