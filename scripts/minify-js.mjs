/**
 * JavaScript 壓縮腳本
 * 壓縮 public/js 目錄下的 JavaScript 檔案
 * 使用方式: node scripts/minify-js.mjs
 */

import { minify } from 'terser';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JS_DIR = join(__dirname, '../public/js');

const FILES_TO_MINIFY = ['theme.js', 'mermaid.js'];

const TERSER_OPTIONS = {
  compress: {
    dead_code: true,
    drop_console: false,
    drop_debugger: true,
    keep_classnames: false,
    keep_fargs: true,
    keep_fnames: false,
    keep_infinity: true,
  },
  mangle: {
    keep_classnames: false,
    keep_fnames: false,
  },
  format: {
    comments: false,
    beautify: false,
  },
};

async function minifyFile(fileName) {
  const inputPath = join(JS_DIR, fileName);
  const outputPath = join(JS_DIR, fileName.replace('.js', '.min.js'));
  
  try {
    const code = await readFile(inputPath, 'utf-8');
    const result = await minify(code, TERSER_OPTIONS);
    
    if (result.code) {
      await writeFile(outputPath, result.code, 'utf-8');
      
      const originalSize = Buffer.byteLength(code, 'utf-8');
      const minifiedSize = Buffer.byteLength(result.code, 'utf-8');
      const savedBytes = originalSize - minifiedSize;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
      
      console.log(`✓ ${fileName}`);
      console.log(`  原始: ${(originalSize / 1024).toFixed(2)}KB → 壓縮: ${(minifiedSize / 1024).toFixed(2)}KB`);
      console.log(`  節省: ${(savedBytes / 1024).toFixed(2)}KB (${savedPercent}%)\n`);
      
      return { success: true, savedBytes };
    }
  } catch (error) {
    console.error(`✗ ${fileName}: ${error.message}\n`);
    return { success: false, savedBytes: 0 };
  }
}

async function main() {
  console.log('🗜️  開始 JavaScript 壓縮...\n');
  
  let totalSaved = 0;
  let processed = 0;
  
  for (const fileName of FILES_TO_MINIFY) {
    const result = await minifyFile(fileName);
    if (result.success) {
      processed++;
      totalSaved += result.savedBytes;
    }
  }
  
  console.log('─'.repeat(50));
  console.log('📊 壓縮結果統計:');
  console.log(`   已處理: ${processed} 個檔案`);
  console.log(`   總節省: ${(totalSaved / 1024).toFixed(2)}KB`);
  console.log('─'.repeat(50));
  
  if (processed > 0) {
    console.log('\n💡 提示: 請更新 HTML 中的引用，使用 .min.js 版本以獲得更好的效能。');
  }
}

main().catch(console.error);

// Made with Bob
