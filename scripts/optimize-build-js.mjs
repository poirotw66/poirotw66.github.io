import fs from 'node:fs/promises';
import path from 'node:path';
import { minify } from 'terser';

for (const name of ['blog-index.js', 'paper-reading-index.js', 'paper-archive-loader.js', 'search-index-codec.js']) {
  const jsFile = path.resolve('dist/js', name);
  if (!(await fs.stat(jsFile).catch(() => null))) continue;
  const code = await fs.readFile(jsFile, 'utf8');
  const result = await minify(code, {
    module: name !== 'blog-index.js',
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
}
