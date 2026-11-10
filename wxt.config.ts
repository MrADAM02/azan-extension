import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    // Translated in public/_locales/{en,ar}/messages.json
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    homepage_url: 'https://github.com/MrADAM02/azan-extension',
    permissions: ['alarms', 'notifications', 'offscreen', 'storage', 'geolocation'],
    host_permissions: [
      'https://api.open-meteo.com/*',
      'https://geocoding-api.open-meteo.com/*',
      'https://api.bigdatacloud.net/*',
    ],
  },
});
