/**
 * CSS analysis — page-scoped sheets under public/css/
 * Usage: node scripts/analyze-css.mjs
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'lightningcss';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_DIR = join(__dirname, '../public/css');
const CORE_SHEETS = ['base.css', 'layout.css', 'home.css', 'hub.css', 'article.css'];
const HUB_ENHANCEMENTS = ['preview.css', 'blog-hub.css'];
const ARTICLE_ENHANCEMENTS = ['article-code.css', 'article-mermaid.css', 'article-math.css'];
const SHEETS = [...CORE_SHEETS, ...HUB_ENHANCEMENTS, ...ARTICLE_ENHANCEMENTS];

async function analyzeCss() {
  console.log('CSS analysis\n');

  const parts = [];
  for (const name of SHEETS) {
    const css = await readFile(join(CSS_DIR, name), 'utf-8');
    const productionSize = transform({
      filename: name,
      code: Buffer.from(css),
      minify: true,
    }).code.byteLength;
    parts.push({ name, css, size: Buffer.byteLength(css, 'utf-8'), productionSize });
  }
  const css = parts.map((p) => p.css).join('\n');

  const stats = {
    totalLines: css.split('\n').length,
    totalSize: Buffer.byteLength(css, 'utf-8'),
    selectors: (css.match(/[^{}]+(?=\{)/g) || []).length,
    mediaQueries: (css.match(/@media[^{]+\{/g) || []).length,
  };

  console.log(`Source total: ${(stats.totalSize / 1024).toFixed(1)}KB / ${stats.totalLines} lines`);
  for (const p of parts) {
    console.log(
      `  ${p.name}: ${(p.size / 1024).toFixed(1)}KB source / ${(p.productionSize / 1024).toFixed(1)}KB production`,
    );
  }

  const baseLayoutSource =
    parts
      .filter((p) => p.name === 'base.css' || p.name === 'layout.css')
      .reduce((sum, p) => sum + p.size, 0) / 1024;
  const baseLayoutProduction =
    parts
      .filter((p) => p.name === 'base.css' || p.name === 'layout.css')
      .reduce((sum, p) => sum + p.productionSize, 0) / 1024;
  console.log('\nCore per-page load (base + layout + page, uncompressed):');
  for (const page of ['home.css', 'hub.css', 'article.css']) {
    const part = parts.find((p) => p.name === page);
    const sourceKb = part.size / 1024;
    const productionKb = part.productionSize / 1024;
    console.log(
      `  ${page.replace('.css', '')}: ${(baseLayoutSource + sourceKb).toFixed(1)}KB source / ${(baseLayoutProduction + productionKb).toFixed(1)}KB production`,
    );
  }

  const hub = parts.find((p) => p.name === 'hub.css');
  const preview = parts.find((p) => p.name === 'preview.css');
  const blogHub = parts.find((p) => p.name === 'blog-hub.css');
  const previewHubSource = baseLayoutSource + (hub.size + preview.size) / 1024;
  const previewHubProduction = baseLayoutProduction + (hub.productionSize + preview.productionSize) / 1024;
  const blogHubSource = previewHubSource + blogHub.size / 1024;
  const blogHubProduction = previewHubProduction + blogHub.productionSize / 1024;

  console.log('\nConditional hub enhancements:');
  console.log(
    `  preview hub: ${previewHubSource.toFixed(1)}KB source / ${previewHubProduction.toFixed(1)}KB production`,
  );
  console.log(
    `  blog hub: ${blogHubSource.toFixed(1)}KB source / ${blogHubProduction.toFixed(1)}KB production`,
  );

  const article = parts.find((p) => p.name === 'article.css');
  const articleEnhancements = parts.filter((p) => ARTICLE_ENHANCEMENTS.includes(p.name));
  const enhancedArticleSource =
    baseLayoutSource
    + article.size / 1024
    + articleEnhancements.reduce((sum, p) => sum + p.size, 0) / 1024;
  const enhancedArticleProduction =
    baseLayoutProduction
    + article.productionSize / 1024
    + articleEnhancements.reduce((sum, p) => sum + p.productionSize, 0) / 1024;

  console.log('\nConditional article enhancements:');
  for (const enhancement of articleEnhancements) {
    console.log(
      `  + ${enhancement.name}: ${(enhancement.size / 1024).toFixed(1)}KB source / ${(enhancement.productionSize / 1024).toFixed(1)}KB production`,
    );
  }
  console.log(
    `  article + all enhancements: ${enhancedArticleSource.toFixed(1)}KB source / ${enhancedArticleProduction.toFixed(1)}KB production`,
  );
  console.log(`Selectors: ${stats.selectors}, media queries: ${stats.mediaQueries}`);
}

analyzeCss().catch(console.error);
