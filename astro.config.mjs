import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://poirotw66.github.io',
  output: 'static',
  integrations: [sitemap()],
});
