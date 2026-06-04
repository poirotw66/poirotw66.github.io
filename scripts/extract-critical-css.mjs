import { generate } from 'critical';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

// Blog listing pages are large (20+ cards) and often hang penthouse in CI.
const criticalPages = [
  'index.html',
  'en/index.html',
  'projects/index.html',
  'en/projects/index.html',
  'contact/index.html',
  'en/contact/index.html',
];

function shouldSkipCriticalCss() {
  if (process.env.SKIP_CRITICAL_CSS === '1') {
    return true;
  }
  // GitHub Actions: bundled Chromium is often missing (ENOENT). Opt-in via PUPPETEER_EXECUTABLE_PATH.
  if (process.env.CI === 'true' && !process.env.PUPPETEER_EXECUTABLE_PATH) {
    return true;
  }
  return false;
}

function attachUnhandledRejectionGuard(onReject) {
  const handler = (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    onReject(message);
  };
  process.on('unhandledRejection', handler);
  return () => process.off('unhandledRejection', handler);
}

async function extractPage(htmlFile) {
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
      decl: () => false,
    },
  });
}

async function extractCriticalCSS() {
  if (shouldSkipCriticalCss()) {
    console.log(
      'ℹ️  略過 Critical CSS 提取（CI 或未設定 PUPPETEER_EXECUTABLE_PATH）。',
    );
    console.log(
      '   本機可執行：PUPPETEER_EXECUTABLE_PATH=/path/to/chrome npm run extract:critical\n',
    );
    return;
  }

  console.log('🎨 開始提取 Critical CSS...\n');
  console.log(`將處理 ${criticalPages.length} 個關鍵頁面\n`);

  let successCount = 0;
  let failCount = 0;
  const detachGuard = attachUnhandledRejectionGuard((message) => {
    console.error(`  ✗ 未捕獲的 penthouse 錯誤: ${message}`);
    failCount += 1;
  });

  try {
    for (const htmlFile of criticalPages) {
      try {
        console.log(`處理: ${htmlFile}`);
        await extractPage(htmlFile);
        console.log('  ✓ 完成\n');
        successCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ 失敗: ${message}\n`);
        failCount += 1;
      }
    }

    console.log('──────────────────────────────────────────────────');
    console.log('📊 Critical CSS 提取結果:');
    console.log(`   成功: ${successCount} 個檔案`);
    console.log(`   失敗: ${failCount} 個檔案`);
    console.log('──────────────────────────────────────────────────\n');

    if (failCount > 0) {
      console.warn('⚠️  部分檔案處理失敗；不阻斷 build / deploy。');
    } else {
      console.log('✅ 所有檔案處理完成！');
    }

    console.log('\n💡 提示: 使用 Lighthouse 測試效能改善效果。');
  } finally {
    detachGuard();
  }

  // Penthouse may reject after the loop; exit before stray async errors fail CI.
  process.exit(0);
}

extractCriticalCSS().catch((error) => {
  console.error('❌ Critical CSS 提取失敗:', error);
  process.exit(1);
});
