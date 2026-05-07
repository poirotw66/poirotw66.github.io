/**
 * 替換程式碼中的圖片引用
 * 將 .png, .jpg, .jpeg 改為 .webp
 * 使用方式: node scripts/replace-image-refs.mjs
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../src');

// 配置
const CONFIG = {
  // 要處理的檔案類型
  fileExtensions: ['.astro', '.md', '.ts', '.js', '.mjs'],
  // 要排除的目錄
  excludeDirs: ['node_modules', '.git', 'dist', '.astro'],
  // 是否執行替換（false 為預覽模式）
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
 * 檢查 WebP 檔案是否存在
 */
function checkWebPExists(imagePath) {
  // 處理相對路徑
  const publicPath = join(__dirname, '../public', imagePath.replace(/^\//, ''));
  const webpPath = publicPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  return existsSync(webpPath);
}

/**
 * 替換檔案中的圖片引用
 */
async function replaceImageRefs(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const ext = extname(filePath);
  
  if (!CONFIG.fileExtensions.includes(ext)) {
    return { changed: false };
  }
  
  // 匹配圖片路徑的正則表達式
  // 匹配: "/path/to/image.png", '/path/to/image.jpg', "/path/to/image.jpeg"
  const imageRegex = /(['"])([^'"]*?\.(png|jpg|jpeg))(['"])/gi;
  
  let newContent = content;
  let replacements = [];
  let skipped = [];
  
  // 找出所有匹配
  const matches = [...content.matchAll(imageRegex)];
  
  for (const match of matches) {
    const fullMatch = match[0];
    const quote = match[1];
    const imagePath = match[2];
    const ext = match[3];
    
    // 跳過外部 URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      skipped.push({ path: imagePath, reason: '外部 URL' });
      continue;
    }
    
    // 檢查 WebP 是否存在
    if (!checkWebPExists(imagePath)) {
      skipped.push({ path: imagePath, reason: 'WebP 不存在' });
      continue;
    }
    
    // 替換為 .webp
    const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const newMatch = `${quote}${webpPath}${quote}`;
    
    newContent = newContent.replace(fullMatch, newMatch);
    replacements.push({ from: imagePath, to: webpPath });
  }
  
  // 如果有變更
  if (replacements.length > 0) {
    if (!CONFIG.dryRun) {
      await writeFile(filePath, newContent, 'utf-8');
    }
    return { changed: true, replacements, skipped };
  }
  
  return { changed: false, skipped };
}

/**
 * 主函數
 */
async function main() {
  console.log('🔄 開始替換圖片引用...\n');
  
  if (CONFIG.dryRun) {
    console.log('⚠️  預覽模式：不會實際修改檔案\n');
  } else {
    console.log('⚠️  實際修改模式：將永久修改檔案\n');
  }
  
  console.log(`掃描目錄: ${SRC_DIR}\n`);
  
  let filesProcessed = 0;
  let filesChanged = 0;
  let totalReplacements = 0;
  let totalSkipped = 0;
  const allSkipped = [];
  
  for await (const filePath of walkDirectory(SRC_DIR)) {
    const ext = extname(filePath);
    if (!CONFIG.fileExtensions.includes(ext)) {
      continue;
    }
    
    filesProcessed++;
    const result = await replaceImageRefs(filePath);
    
    if (result.changed) {
      filesChanged++;
      const fileName = filePath.replace(SRC_DIR, '');
      const status = CONFIG.dryRun ? '🔍' : '✓';
      
      console.log(`${status} ${fileName}`);
      result.replacements.forEach(r => {
        console.log(`  ${r.from} → ${r.to}`);
        totalReplacements++;
      });
      
      if (result.skipped && result.skipped.length > 0) {
        result.skipped.forEach(s => {
          console.log(`  ⊘ ${s.path} (${s.reason})`);
          allSkipped.push(s);
          totalSkipped++;
        });
      }
      console.log();
    } else if (result.skipped && result.skipped.length > 0) {
      result.skipped.forEach(s => {
        allSkipped.push(s);
        totalSkipped++;
      });
    }
  }
  
  console.log('─'.repeat(50));
  console.log('📊 替換結果統計:');
  console.log(`   已處理: ${filesProcessed} 個檔案`);
  console.log(`   已修改: ${filesChanged} 個檔案`);
  console.log(`   已替換: ${totalReplacements} 個引用`);
  console.log(`   已跳過: ${totalSkipped} 個引用`);
  console.log('─'.repeat(50));
  
  if (totalSkipped > 0) {
    console.log('\n⚠️  跳過的圖片引用:');
    console.log('─'.repeat(50));
    
    // 按原因分組
    const skippedByReason = {};
    allSkipped.forEach(s => {
      if (!skippedByReason[s.reason]) {
        skippedByReason[s.reason] = [];
      }
      skippedByReason[s.reason].push(s.path);
    });
    
    Object.entries(skippedByReason).forEach(([reason, paths]) => {
      console.log(`\n${reason} (${paths.length} 個):`);
      // 只顯示前 10 個
      paths.slice(0, 10).forEach(p => {
        console.log(`  - ${p}`);
      });
      if (paths.length > 10) {
        console.log(`  ... 還有 ${paths.length - 10} 個`);
      }
    });
    console.log('─'.repeat(50));
  }
  
  if (CONFIG.dryRun && filesChanged > 0) {
    console.log('\n💡 這是預覽模式，沒有實際修改檔案。');
    console.log('💡 若要實際替換，請編輯腳本將 dryRun 設為 false。');
  } else if (!CONFIG.dryRun && filesChanged > 0) {
    console.log('\n✅ 圖片引用已成功替換。');
    console.log('💡 建議執行以下命令驗證：');
    console.log('   git diff  # 檢查變更');
    console.log('   npm run build  # 測試建置');
  }
  
  if (totalSkipped > 0) {
    console.log('\n⚠️  有些圖片引用被跳過，請檢查：');
    console.log('   1. WebP 檔案是否存在');
    console.log('   2. 是否需要先執行 npm run optimize:images');
    console.log('   3. 外部 URL 無需替換');
  }
}

main().catch(console.error);

// Made with Bob
