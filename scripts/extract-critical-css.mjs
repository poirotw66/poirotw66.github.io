import { generate } from 'critical';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

async function extractCriticalCSS() {
  console.log('🎨 開始提取 Critical CSS...\n');

  try {
    // 只處理關鍵頁面以避免 socket hang up 問題
    const criticalPages = [
      'index.html',
      'en/index.html',
      'blog/index.html',
      'en/blog/index.html',
      'projects/index.html',
      'en/projects/index.html',
      'contact/index.html',
      'en/contact/index.html',
    ];

    console.log(`將處理 ${criticalPages.length} 個關鍵頁面\n`);

    let successCount = 0;
    let failCount = 0;

    // 處理每個關鍵頁面
    for (const htmlFile of criticalPages) {
      try {
        console.log(`處理: ${htmlFile}`);

        await generate({
          inline: true,
          base: DIST_DIR,
          src: htmlFile,
          target: htmlFile,
          width: 1300,
          height: 900,
          penthouse: {
            timeout: 30000,
            forceInclude: [
              '.nav',
              '.nav-logo',
              '.theme-switcher',
              '.lang-switcher',
            ],
          },
          ignore: {
            atrule: ['@font-face'],
            decl: (node, value) => {
              // 保留主題相關的 CSS 變數
              if (node.prop.startsWith('--')) {
                return false;
              }
              return false;
            },
          },
        });

        console.log(`  ✓ 完成\n`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ 失敗: ${error.message}\n`);
        failCount++;
        // 繼續處理其他檔案，不中斷流程
      }
    }

    console.log('──────────────────────────────────────────────────');
    console.log('📊 Critical CSS 提取結果:');
    console.log(`   成功: ${successCount} 個檔案`);
    console.log(`   失敗: ${failCount} 個檔案`);
    console.log('──────────────────────────────────────────────────\n');

    if (failCount > 0) {
      console.warn('⚠️  部分檔案處理失敗，但不影響其他檔案。');
    } else {
      console.log('✅ 所有檔案處理完成！');
    }

    console.log('\n💡 提示: 使用 Lighthouse 測試效能改善效果。');
  } catch (error) {
    console.error('❌ Critical CSS 提取失敗:', error);
    process.exit(1);
  }
}

extractCriticalCSS();

// Made with Bob
