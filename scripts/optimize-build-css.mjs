import fs from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'lightningcss';

const cssDir = path.resolve('dist/css');
const entries = await fs.readdir(cssDir, { withFileTypes: true });
let before = 0;
let after = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
  const filePath = path.join(cssDir, entry.name);
  const source = await fs.readFile(filePath);
  const result = transform({
    filename: entry.name,
    code: source,
    minify: true,
  });
  before += source.byteLength;
  after += result.code.byteLength;
  await fs.writeFile(filePath, result.code);
}

const savedPercent = before === 0 ? 0 : ((before - after) / before) * 100;
console.log(
  `Build CSS optimized: ${(before / 1024).toFixed(1)}KB → ${(after / 1024).toFixed(1)}KB (${savedPercent.toFixed(1)}% smaller).`,
);
