import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  site: 'https://www.bloss0m.com',
  output: 'static',
  compressHTML: true,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Keep old blog URLs working after renames:
  // - Option B: 37/38/39 Meta Muse & OpenWiki -> 61/62/63
  // - Typo fix: 11-harness-enginnering -> 11-harness-engineering
  redirects: {
    '/blog/11-harness-enginnering': '/blog/11-harness-engineering',
    '/blog/11-harness-enginnering/': '/blog/11-harness-engineering/',
    '/en/blog/11-harness-enginnering': '/en/blog/11-harness-engineering',
    '/en/blog/11-harness-enginnering/': '/en/blog/11-harness-engineering/',
    '/blog/37-meta-muse-spark': '/blog/61-meta-muse-spark',
    '/blog/37-meta-muse-spark/': '/blog/61-meta-muse-spark/',
    '/en/blog/37-meta-muse-spark': '/en/blog/61-meta-muse-spark',
    '/en/blog/37-meta-muse-spark/': '/en/blog/61-meta-muse-spark/',

    '/blog/38-meta-muse-image': '/blog/62-meta-muse-image',
    '/blog/38-meta-muse-image/': '/blog/62-meta-muse-image/',
    '/en/blog/38-meta-muse-image': '/en/blog/62-meta-muse-image',
    '/en/blog/38-meta-muse-image/': '/en/blog/62-meta-muse-image/',

    '/blog/39-langchain-openwiki': '/blog/63-langchain-openwiki',
    '/blog/39-langchain-openwiki/': '/blog/63-langchain-openwiki/',
    '/en/blog/39-langchain-openwiki': '/en/blog/63-langchain-openwiki',
    '/en/blog/39-langchain-openwiki/': '/en/blog/63-langchain-openwiki/',
  },
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGfm, remarkMath],
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
