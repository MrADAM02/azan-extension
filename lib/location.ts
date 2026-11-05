import type { SavedLocation, Settings } from './settings';

export interface CityResult extends SavedLocation {
  id: number;
  region?: string;
}

/** Browser geolocation + reverse geocode for a display name. Uses the device timezone. */
export async function detectLocation(lang: Settings['display']['language']): Promise<SavedLocation> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 10 * 60_000,
    }),
  );
  const lat = Number(pos.coords.latitude.toFixed(4));
  const lng = Number(pos.coords.longitude.toFixed(4));
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let city = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  let country: string | undefined;
  let countryCode: string | undefined;
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${lang}`,
    );
    if (r.ok) {
      const j = await r.json();
      city = j.city || j.locality || j.principalSubdivision || city;
      country = j.countryName || undefined;
      countryCode = j.countryCode || undefined;
    }
  } catch {
    /* keep coordinates as the name */
  }
  return { lat, lng, city, country, countryCode, timezone };
}

export async function searchCities(
  query: string,
  lang: Settings['display']['language'],
  signal?: AbortSignal,
): Promise<CityResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${lang}&format=json`,
    { signal },
  );
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results ?? []).map(
    (c: any): CityResult => ({
      id: c.id,
      lat: c.latitude,
      lng: c.longitude,
      city: c.name,
      region: c.admin1,
      country: c.country,
      countryCode: c.country_code,
      timezone: c.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  );
}
