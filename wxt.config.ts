import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'Azan Tab – Prayer Times',
    description:
      'Prayer times on every new tab, with azan, notifications, Hijri date, Qibla and weather.',
    permissions: ['alarms', 'notifications', 'offscreen', 'storage', 'geolocation'],
    host_permissions: [
      'https://api.open-meteo.com/*',
      'https://geocoding-api.open-meteo.com/*',
      'https://api.bigdatacloud.net/*',
    ],
    action: { default_title: 'Prayer times' },
  },
});
