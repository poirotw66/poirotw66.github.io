/**
 * 圖片優化腳本
 * 將 PNG/JPG 圖片轉換為 WebP 格式，並保留原始檔案
 * 使用方式: npm run optimize:images
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');

// 配置
const CONFIG = {
  // 要處理的圖片格式
  extensions: ['.png', '.jpg', '.jpeg'],
  // WebP 品質設定
  webpQuality: 85,
  // 要排除的目錄
  excludeDirs: ['node_modules', '.git', '.tmp'],
  // 最小檔案大小（bytes），小於此大小的檔案不處理
  minFileSize: 10 * 1024, // 10KB
};

/**
 * 遞迴掃描目錄
 */
async function* walkDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        yield* walkDirectory(fullPath);
      }
    } else {
      yield fullPath;
    }
  }
}

/**
 * 檢查檔案是否需要優化
 */
async function shouldOptimize(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!CONFIG.extensions.includes(ext)) {
    return false;
  }
  
  // 檢查是否已有對應的 WebP 檔案
  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  try {
    await stat(webpPath);
    return false; // WebP 已存在，跳過
  } catch {
    // WebP 不存在，需要轉換
  }
  
  // 檢查檔案大小
  const stats = await stat(filePath);
  return stats.size >= CONFIG.minFileSize;
}

/**
 * 轉換圖片為 WebP
 */
async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const fileName = basename(inputPath);
  
  try {
    const info = await sharp(inputPath)
      .webp({ quality: CONFIG.webpQuality })
      .toFile(outputPath);
    
    const originalStats = await stat(inputPath);
    const savedBytes = originalStats.size - info.size;
    const savedPercent = ((savedBytes / originalStats.size) * 100).toFixed(1);
    
    console.log(`✓ ${fileName}`);
    console.log(`  原始: ${(originalStats.size / 1024).toFixed(1)}KB → WebP: ${(info.size / 1024).toFixed(1)}KB`);
    console.log(`  節省: ${(savedBytes / 1024).toFixed(1)}KB (${savedPercent}%)\n`);
    
    return { success: true, savedBytes };
  } catch (error) {
    console.error(`✗ ${fileName}: ${error.message}\n`);
    return { success: false, savedBytes: 0 };
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🖼️  開始圖片優化...\n');
  console.log(`掃描目錄: ${PUBLIC_DIR}\n`);
  
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let totalSaved = 0;
  
  for await (const filePath of walkDirectory(PUBLIC_DIR)) {
    if (await shouldOptimize(filePath)) {
      const result = await convertToWebP(filePath);
      if (result.success) {
        processed++;
        totalSaved += result.savedBytes;
      } else {
        failed++;
      }
    } else {
      const ext = extname(filePath).toLowerCase();
      if (CONFIG.extensions.includes(ext)) {
        skipped++;
      }
    }
  }
  
  console.log('─'.repeat(50));
  console.log('📊 優化結果統計:');
  console.log(`   已轉換: ${processed} 個檔案`);
  console.log(`   已跳過: ${skipped} 個檔案`);
  console.log(`   失敗: ${failed} 個檔案`);
  console.log(`   總節省: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
  console.log('─'.repeat(50));
  
  if (processed > 0) {
    console.log('\n💡 提示: 原始 PNG/JPG 檔案已保留，您可以在確認 WebP 正常後手動刪除。');
    console.log('💡 建議: 更新程式碼使用 WebP 格式以獲得更好的效能。');
  }
}

main().catch(console.error);

// Made with Bob
