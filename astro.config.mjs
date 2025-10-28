// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Habilita el modo servidor para endpoints de API
  integrations: [tailwind()],
  server: {
    port: 3000,
  },
});
