/**
 * 清理原始圖片腳本
 * 檢查 WebP 圖片是否存在且正常，然後刪除對應的 PNG/JPG 原始檔案
 * 使用方式: node scripts/cleanup-original-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');

// 配置
const CONFIG = {
  // 原始圖片格式
  originalExtensions: ['.png', '.jpg', '.jpeg'],
  // 要排除的目錄
  excludeDirs: ['node_modules', '.git', '.tmp'],
  // 要排除的特定檔案（保留 PNG 格式）
  excludeFiles: ['favicon.png', 'bloom-mark-180.png', 'og.png'],
  // 是否執行刪除（false 為預覽模式）
  dryRun: false,
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
 * 檢查 WebP 檔案是否有效
 */
async function isValidWebP(webpPath) {
  try {
    const metadata = await sharp(webpPath).metadata();
    return metadata.format === 'webp' && metadata.width > 0 && metadata.height > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 檢查是否可以安全刪除原始檔案
 */
async function canSafelyDelete(originalPath) {
  const ext = extname(originalPath).toLowerCase();
  if (!CONFIG.originalExtensions.includes(ext)) {
    return { canDelete: false, reason: '不是目標格式' };
  }
  
  // 檢查是否在排除列表中
  const fileName = originalPath.split('/').pop();
  if (CONFIG.excludeFiles.includes(fileName)) {
    return { canDelete: false, reason: '保留檔案（favicon／Apple touch icon 等）' };
  }
  
  // 檢查對應的 WebP 是否存在
  const webpPath = originalPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  if (!existsSync(webpPath)) {
    return { canDelete: false, reason: 'WebP 不存在' };
  }
  
  // 檢查 WebP 是否有效
  const isValid = await isValidWebP(webpPath);
  if (!isValid) {
    return { canDelete: false, reason: 'WebP 無效或損壞' };
  }
  
  // 檢查 WebP 檔案大小（應該小於原始檔案）
  const originalStats = await stat(originalPath);
  const webpStats = await stat(webpPath);
  
  if (webpStats.size >= originalStats.size) {
    return { 
      canDelete: false, 
      reason: `WebP 更大 (${(webpStats.size / 1024).toFixed(1)}KB vs ${(originalStats.size / 1024).toFixed(1)}KB)` 
    };
  }
  
  return { 
    canDelete: true, 
    originalSize: originalStats.size,
    webpSize: webpStats.size,
    savedBytes: originalStats.size - webpStats.size
  };
}

/**
 * 刪除檔案
 */
async function deleteFile(filePath) {
  if (CONFIG.dryRun) {
    return { success: true, dryRun: true };
  }
  
  try {
    await unlink(filePath);
    return { success: true, dryRun: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🗑️  開始清理原始圖片...\n');
  
  if (CONFIG.dryRun) {
    console.log('⚠️  預覽模式：不會實際刪除檔案\n');
  } else {
    console.log('⚠️  實際刪除模式：將永久刪除檔案\n');
  }
  
  console.log(`掃描目錄: ${PUBLIC_DIR}\n`);
  
  let checked = 0;
  let deleted = 0;
  let skipped = 0;
  let failed = 0;
  let totalSaved = 0;
  const skippedReasons = {};
  
  for await (const filePath of walkDirectory(PUBLIC_DIR)) {
    const ext = extname(filePath).toLowerCase();
    if (!CONFIG.originalExtensions.includes(ext)) {
      continue;
    }
    
    checked++;
    const fileName = filePath.replace(PUBLIC_DIR, '');
    const result = await canSafelyDelete(filePath);
    
    if (result.canDelete) {
      const deleteResult = await deleteFile(filePath);
      
      if (deleteResult.success) {
        deleted++;
        totalSaved += result.savedBytes;
        const status = deleteResult.dryRun ? '🔍' : '✓';
        console.log(`${status} ${fileName}`);
        console.log(`  原始: ${(result.originalSize / 1024).toFixed(1)}KB → WebP: ${(result.webpSize / 1024).toFixed(1)}KB`);
        console.log(`  節省: ${(result.savedBytes / 1024).toFixed(1)}KB\n`);
      } else {
        failed++;
        console.log(`✗ ${fileName}`);
        console.log(`  錯誤: ${deleteResult.error}\n`);
      }
    } else {
      skipped++;
      skippedReasons[result.reason] = (skippedReasons[result.reason] || 0) + 1;
    }
  }
  
  console.log('─'.repeat(50));
  console.log('📊 清理結果統計:');
  console.log(`   已檢查: ${checked} 個檔案`);
  console.log(`   已刪除: ${deleted} 個檔案`);
  console.log(`   已跳過: ${skipped} 個檔案`);
  console.log(`   失敗: ${failed} 個檔案`);
  console.log(`   總節省: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
  console.log('─'.repeat(50));
  
  if (skipped > 0) {
    console.log('\n📋 跳過原因統計:');
    console.log('─'.repeat(50));
    Object.entries(skippedReasons).forEach(([reason, count]) => {
      console.log(`   ${reason}: ${count} 個檔案`);
    });
    console.log('─'.repeat(50));
  }
  
  if (CONFIG.dryRun && deleted > 0) {
    console.log('\n💡 這是預覽模式，沒有實際刪除檔案。');
    console.log('💡 若要實際刪除，請編輯腳本將 dryRun 設為 false。');
  } else if (!CONFIG.dryRun && deleted > 0) {
    console.log('\n✅ 原始檔案已成功刪除。');
    console.log('💡 建議執行 git status 檢查變更。');
  }
  
  if (failed > 0) {
    console.log('\n⚠️  有些檔案刪除失敗，請檢查錯誤訊息。');
  }
}

main().catch(console.error);

// Made with Bob
