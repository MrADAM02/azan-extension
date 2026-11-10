import { DEFAULT_SETTINGS, type MethodKey, type SavedLocation, type Settings } from '@/lib/schema';

export const RIYADH: SavedLocation = { lat: 24.7136, lng: 46.6753, city: 'Riyadh', timezone: 'Asia/Riyadh' };

export const settings = (method: MethodKey = 'UmmAlQura', patch: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  method,
  ...patch,
});

/** "HH:MM" in a timezone. */
export const hm = (d: Date | undefined, tz: string) =>
  d?.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const ymd = (d: Date) => d.toISOString().slice(0, 10);
