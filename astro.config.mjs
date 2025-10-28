// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [tailwind()],
  server: {
    port: 3000,
  },
  site: 'https://colmillo.netlify.app',
  base: '/',
  build: {
    format: 'file',
  },
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js']
    }
  }
});