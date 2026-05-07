import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://www.bloss0m.com',
  output: 'static',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
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
          // 手動分割 chunks
          manualChunks: (id) => {
            // 將 node_modules 中的依賴分割到 vendor chunk
            if (id.includes('node_modules')) {
              if (id.includes('mermaid')) {
                return 'mermaid';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    // 優化依賴預構建
    optimizeDeps: {
      include: ['mermaid'],
    },
  },
});
