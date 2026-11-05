import type { PrayerKey } from './settings';

export const BACKGROUNDS: { id: string; css: string }[] = [
  { id: 'night', css: 'linear-gradient(160deg,#0b1026 0%,#1b2a4a 55%,#2c5364 100%)' },
  { id: 'dawn', css: 'linear-gradient(160deg,#2b3a67 0%,#6c5b7b 55%,#e0a37f 100%)' },
  { id: 'emerald', css: 'linear-gradient(160deg,#052e25 0%,#0f5132 55%,#1f7a5a 100%)' },
  { id: 'desert', css: 'linear-gradient(160deg,#5a3825 0%,#a0683f 55%,#d9a96a 100%)' },
  { id: 'ocean', css: 'linear-gradient(160deg,#0f2027 0%,#0e4d64 55%,#137a8f 100%)' },
  { id: 'dusk', css: 'linear-gradient(160deg,#1d1135 0%,#5b2a6e 55%,#c0576b 100%)' },
];

/** Gradient that follows the time of day, based on the current prayer period. */
const DYNAMIC: Record<PrayerKey | 'none', string> = {
  fajr: 'dawn',
  sunrise: 'ocean',
  dhuhr: 'ocean',
  asr: 'desert',
  maghrib: 'dusk',
  isha: 'night',
  none: 'ocean',
};

export function backgroundCss(id: string, period: PrayerKey | null): string {
  const real = id === 'dynamic' ? DYNAMIC[period ?? 'none'] : id;
  return (BACKGROUNDS.find((b) => b.id === real) ?? BACKGROUNDS[0]!).css;
}
