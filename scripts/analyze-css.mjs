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
const SHEETS = ['base.css', 'layout.css', 'home.css', 'hub.css', 'article.css'];

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
  console.log('\nPer-page load (base + layout + page, uncompressed):');
  for (const page of ['home.css', 'hub.css', 'article.css']) {
    const part = parts.find((p) => p.name === page);
    const sourceKb = part.size / 1024;
    const productionKb = part.productionSize / 1024;
    console.log(
      `  ${page.replace('.css', '')}: ${(baseLayoutSource + sourceKb).toFixed(1)}KB source / ${(baseLayoutProduction + productionKb).toFixed(1)}KB production`,
    );
  }
  console.log(`Selectors: ${stats.selectors}, media queries: ${stats.mediaQueries}`);
}

analyzeCss().catch(console.error);
