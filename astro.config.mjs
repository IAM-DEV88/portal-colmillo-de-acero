import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeFunctions: false,
    builders: false,
  }),
  site: 'https://colmillo.netlify.app',
  integrations: [tailwind()],
  server: {
    port: 3000,
  }
});