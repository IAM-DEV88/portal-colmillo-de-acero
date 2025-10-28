// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // @ts-ignore - Ignorar error de tipo temporalmente
  adapter: netlify({}),
  site: 'https://colmillo.netlify.app',
  integrations: [tailwind()],
  server: {
    port: 3000,
  },
  build: {
    format: 'file',
  },
});