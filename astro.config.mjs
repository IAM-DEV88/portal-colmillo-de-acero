// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Switch to static output for Netlify
  integrations: [tailwind()],
  server: {
    port: 3000,
  },
});
