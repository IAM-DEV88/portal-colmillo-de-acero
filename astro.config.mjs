// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [tailwind()],

  server: {
    port: 3000,
  },

  // Reemplaza con tu URL de Netlify
  site: 'https://tuguild.netlify.app',

  adapter: netlify()
});