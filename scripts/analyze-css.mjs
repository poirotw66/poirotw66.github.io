/**
 * CSS 分析腳本
 * 分析 CSS 使用情況並提供優化建議
 * 使用方式: node scripts/analyze-css.mjs
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_FILE = join(__dirname, '../public/css/style.css');

async function analyzeCss() {
  console.log('🔍 開始分析 CSS...\n');
  
  const css = await readFile(CSS_FILE, 'utf-8');
  
  // 統計資訊
  const stats = {
    totalLines: css.split('\n').length,
    totalSize: Buffer.byteLength(css, 'utf-8'),
    selectors: (css.match(/[^{}]+(?=\{)/g) || []).length,
    mediaQueries: (css.match(/@media[^{]+\{/g) || []).length,
    keyframes: (css.match(/@keyframes[^{]+\{/g) || []).length,
    customProperties: (css.match(/--[a-zA-Z-]+:/g) || []).length,
    comments: (css.match(/\/\*[\s\S]*?\*\//g) || []).length,
  };
  
  // 分析主題變數
  const themes = {
    root: (css.match(/:root[^}]+\}/g) || [])[0] || '',
    dark: (css.match(/\[data-theme="dark"\][^}]+\}/g) || [])[0] || '',
    warm: (css.match(/\[data-theme="warm"\][^}]+\}/g) || [])[0] || '',
  };
  
  // 提取所有 CSS 類別
  const classSelectors = css.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
  
  // 分析可能未使用的選擇器（簡單啟發式）
  const potentiallyUnused = uniqueClasses.filter(cls => {
    const count = classSelectors.filter(c => c === `.${cls}`).length;
    return count === 1; // 只出現一次的類別可能未使用
  });
  
  console.log('📊 CSS 統計資訊:');
  console.log('─'.repeat(50));
  console.log(`  總行數: ${stats.totalLines}`);
  console.log(`  檔案大小: ${(stats.totalSize / 1024).toFixed(2)}KB`);
  console.log(`  選擇器數量: ${stats.selectors}`);
  console.log(`  媒體查詢: ${stats.mediaQueries}`);
  console.log(`  動畫關鍵幀: ${stats.keyframes}`);
  console.log(`  CSS 變數: ${stats.customProperties}`);
  console.log(`  註解數量: ${stats.comments}`);
  console.log(`  唯一類別: ${uniqueClasses.length}`);
  console.log('─'.repeat(50));
  
  console.log('\n🎨 主題配置:');
  console.log('─'.repeat(50));
  console.log(`  Root 變數: ${themes.root ? '✓' : '✗'}`);
  console.log(`  Dark 主題: ${themes.dark ? '✓' : '✗'}`);
  console.log(`  Warm 主題: ${themes.warm ? '✓' : '✗'}`);
  console.log('─'.repeat(50));
  
  if (potentiallyUnused.length > 0) {
    console.log('\n⚠️  可能未使用的類別（僅供參考）:');
    console.log('─'.repeat(50));
    potentiallyUnused.slice(0, 20).forEach(cls => {
      console.log(`  .${cls}`);
    });
    if (potentiallyUnused.length > 20) {
      console.log(`  ... 還有 ${potentiallyUnused.length - 20} 個`);
    }
    console.log('─'.repeat(50));
  }
  
  console.log('\n💡 優化建議:');
  console.log('─'.repeat(50));
  
  const suggestions = [];
  
  if (stats.comments > 10) {
    suggestions.push('考慮移除生產環境的註解以減少檔案大小');
  }
  
  if (stats.totalSize > 50 * 1024) {
    suggestions.push('CSS 檔案較大，考慮分割為多個檔案或使用 Critical CSS');
  }
  
  if (potentiallyUnused.length > 50) {
    suggestions.push(`發現 ${potentiallyUnused.length} 個可能未使用的類別，建議審查並移除`);
  }
  
  suggestions.push('使用 PurgeCSS 或類似工具自動移除未使用的 CSS');
  suggestions.push('考慮使用 CSS Modules 或 Scoped Styles 避免全域污染');
  suggestions.push('實作 Critical CSS 內聯以改善首次渲染速度');
  
  suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s}`);
  });
  console.log('─'.repeat(50));
  
  // 計算壓縮後的預估大小
  const minifiedSize = css
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除註解
    .replace(/\s+/g, ' ') // 壓縮空白
    .replace(/\s*([{}:;,])\s*/g, '$1') // 移除符號周圍空白
    .length;
  
  const savings = stats.totalSize - minifiedSize;
  const savingsPercent = ((savings / stats.totalSize) * 100).toFixed(1);
  
  console.log('\n📦 壓縮預估:');
  console.log('─'.repeat(50));
  console.log(`  原始大小: ${(stats.totalSize / 1024).toFixed(2)}KB`);
  console.log(`  壓縮後: ${(minifiedSize / 1024).toFixed(2)}KB`);
  console.log(`  節省: ${(savings / 1024).toFixed(2)}KB (${savingsPercent}%)`);
  console.log('─'.repeat(50));
}

analyzeCss().catch(console.error);

// Made with Bob
