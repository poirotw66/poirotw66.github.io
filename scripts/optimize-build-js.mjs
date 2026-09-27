import fs from 'node:fs/promises';
import path from 'node:path';
import { minify } from 'terser';

const jsFile = path.resolve('dist/js/blog-index.js');

try {
  const code = await fs.readFile(jsFile, 'utf8');
  const result = await minify(code, {
    compress: {
      dead_code: true,
      drop_debugger: true,
    },
    mangle: true,
    format: { comments: false },
  });
  if (result.code) {
    const before = Buffer.byteLength(code, 'utf8');
    const after = Buffer.byteLength(result.code, 'utf8');
    await fs.writeFile(jsFile, result.code, 'utf8');
    const savedPercent = before === 0 ? 0 : ((before - after) / before) * 100;
    console.log(
      `Build JS optimized: ${(before / 1024).toFixed(1)}KB → ${(after / 1024).toFixed(1)}KB (${savedPercent.toFixed(1)}% smaller).`,
    );
  }
} catch {
  // If dist/js/blog-index.js does not exist in the current run, skip gracefully.
}
