import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://poirotw66.github.io',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});
