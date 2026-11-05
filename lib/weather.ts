import { storage } from 'wxt/utils/storage';
import type { SavedLocation, Settings } from './settings';

export interface Weather {
  temp: number;
  feelsLike: number;
  min: number;
  max: number;
  code: number;
  isDay: boolean;
  units: 'c' | 'f';
}

interface Cache {
  key: string;
  at: number;
  data: Weather;
}

const cacheItem = storage.defineItem<Cache | null>('local:weatherCache', { fallback: null });
const TTL = 30 * 60_000;

export async function getWeather(loc: SavedLocation, units: 'c' | 'f'): Promise<Weather> {
  const key = `${loc.lat},${loc.lng},${units}`;
  const cached = await cacheItem.getValue();
  if (cached && cached.key === key && Date.now() - cached.at < TTL) return cached.data;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lng),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    timezone: 'auto',
    temperature_unit: units === 'f' ? 'fahrenheit' : 'celsius',
  }).toString();
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Weather HTTP ${r.status}`);
  const j = await r.json();
  const data: Weather = {
    temp: j.current.temperature_2m,
    feelsLike: j.current.apparent_temperature,
    code: j.current.weather_code,
    isDay: j.current.is_day === 1,
    min: j.daily.temperature_2m_min[0],
    max: j.daily.temperature_2m_max[0],
    units,
  };
  await cacheItem.setValue({ key, at: Date.now(), data });
  return data;
}

type Lang = Settings['display']['language'];
const W: Record<number, [string, string, string]> = {
  0: ['☀️', 'Clear', 'صافٍ'],
  1: ['🌤️', 'Mainly clear', 'صافٍ غالباً'],
  2: ['⛅', 'Partly cloudy', 'غائم جزئياً'],
  3: ['☁️', 'Overcast', 'غائم'],
  45: ['🌫️', 'Fog', 'ضباب'],
  48: ['🌫️', 'Fog', 'ضباب'],
  51: ['🌦️', 'Light drizzle', 'رذاذ خفيف'],
  53: ['🌦️', 'Drizzle', 'رذاذ'],
  55: ['🌧️', 'Heavy drizzle', 'رذاذ كثيف'],
  56: ['🌧️', 'Freezing drizzle', 'رذاذ متجمد'],
  57: ['🌧️', 'Freezing drizzle', 'رذاذ متجمد'],
  61: ['🌦️', 'Light rain', 'مطر خفيف'],
  63: ['🌧️', 'Rain', 'مطر'],
  65: ['🌧️', 'Heavy rain', 'مطر غزير'],
  66: ['🌧️', 'Freezing rain', 'مطر متجمد'],
  67: ['🌧️', 'Freezing rain', 'مطر متجمد'],
  71: ['🌨️', 'Light snow', 'ثلج خفيف'],
  73: ['🌨️', 'Snow', 'ثلج'],
  75: ['❄️', 'Heavy snow', 'ثلج كثيف'],
  77: ['🌨️', 'Snow grains', 'حبيبات ثلج'],
  80: ['🌦️', 'Showers', 'زخات مطر'],
  81: ['🌧️', 'Showers', 'زخات مطر'],
  82: ['⛈️', 'Violent showers', 'زخات غزيرة'],
  85: ['🌨️', 'Snow showers', 'زخات ثلج'],
  86: ['🌨️', 'Snow showers', 'زخات ثلج'],
  95: ['⛈️', 'Thunderstorm', 'عاصفة رعدية'],
  96: ['⛈️', 'Thunderstorm, hail', 'عاصفة رعدية مع برد'],
  99: ['⛈️', 'Thunderstorm, hail', 'عاصفة رعدية مع برد'],
};

export function describeWeather(w: Weather, lang: Lang) {
  const [icon, en, ar] = W[w.code] ?? ['🌡️', '', ''];
  const night = !w.isDay && (w.code === 0 || w.code === 1);
  return { icon: night ? '🌙' : icon, label: lang === 'ar' ? ar : en };
}
