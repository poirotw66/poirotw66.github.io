import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkHuahuaCallout from './src/utils/remarkHuahuaCallout.mjs';
import remarkImageDimensions from './src/utils/remarkImageDimensions.mjs';
import { TAG_SLUG_MAP } from './src/utils/tag.ts';
import { buildLegacyRedirects } from './src/data/legacyRedirects.mjs';

const paperFilenames = fs
  .readdirSync(fileURLToPath(new URL('./src/content/paperReading', import.meta.url)))
  .filter((name) => name.endsWith('.md'));

export default defineConfig({
  site: 'https://www.bloss0m.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Keep old URLs working after renames, tag slug migration, and case folding.
  // Only define trailing-slash keys — Astro treats `/path` and `/path/` as the same route.
  redirects: buildLegacyRedirects({ tagSlugMap: TAG_SLUG_MAP, paperFilenames }),
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '');
        if (pathname.includes('/404')) return false;
        if (pathname.includes('/search/')) return false;
        if (pathname.endsWith('.md')) return false;
        if (pathname.endsWith('/feed.xml')) return false;
        if (pathname.endsWith('/index.json')) return false;
        if (/\.(json|xml)$/i.test(pathname)) return false;
        return true;
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGfm, remarkMath, remarkHuahuaCallout, remarkImageDimensions],
      rehypePlugins: [rehypeSlug, rehypeKatex],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
  image: {
    // 圖片優化配置
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
    // 預設圖片格式和品質
    formats: ['webp', 'avif'],
    quality: 80,
  },
  vite: {
    build: {
      // CSS 程式碼分割
      cssCodeSplit: true,
      // 資源內聯限制（小於 4KB 的資源會被內聯）
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  },
});
