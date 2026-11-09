/** Numeric Umm al-Qura Hijri date of instant `d` in timezone `tz`, with a ±day correction. */
export function hijriParts(d: Date, tz: string, offsetDays = 0) {
  const shifted = new Date(d.getTime() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    timeZone: tz,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(shifted);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '', 10);
  return { year: get('year') || get('relatedYear'), month: get('month'), day: get('day') };
}
