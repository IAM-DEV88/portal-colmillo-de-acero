// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url),
  }),
  integrations: [tailwind()],
  server: {
    port: 3000,
  },
  site: 'https://colmillo.netlify.app',
});
