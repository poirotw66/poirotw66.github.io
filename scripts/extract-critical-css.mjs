import { generate } from 'critical';
import { glob } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

async function extractCriticalCSS() {
  console.log('🎨 開始提取 Critical CSS...\n');

  try {
    // 找出所有 HTML 檔案
    const htmlFiles = await glob('**/*.html', {
      cwd: DIST_DIR,
      absolute: false,
    });

    if (htmlFiles.length === 0) {
      console.error('❌ 找不到任何 HTML 檔案。請先執行 npm run build。');
      process.exit(1);
    }

    console.log(`找到 ${htmlFiles.length} 個 HTML 檔案\n`);

    let successCount = 0;
    let failCount = 0;

    // 處理每個 HTML 檔案
    for (const htmlFile of htmlFiles) {
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
