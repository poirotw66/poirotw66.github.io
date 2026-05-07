# 優化腳本使用指南

本目錄包含用於網站效能優化的各種腳本。

## 📦 安裝依賴

首先，安裝所需的依賴套件：

```bash
npm install
```

這將安裝：
- `sharp` - 圖片處理和優化
- `terser` - JavaScript 壓縮
- `mermaid` - 圖表渲染庫

## 🖼️ 圖片優化

### optimize-images.mjs

將 PNG/JPG 圖片轉換為 WebP 格式，大幅減少檔案大小。

**使用方式：**
```bash
npm run optimize:images
```

**功能：**
- 遞迴掃描 `public/` 目錄
- 轉換 PNG/JPG/JPEG 為 WebP
- 保留原始檔案（安全）
- 跳過已存在的 WebP 檔案
- 顯示詳細的優化統計

**配置：**
- WebP 品質：85
- 最小處理檔案大小：10KB
- 排除目錄：node_modules, .git, .tmp

**範例輸出：**
```
🖼️  開始圖片優化...

掃描目錄: /path/to/public

✓ title_image.png
  原始: 1024.5KB → WebP: 512.3KB
  節省: 512.2KB (50.0%)

✓ screenshot.jpg
  原始: 856.7KB → WebP: 428.4KB
  節省: 428.3KB (50.0%)

──────────────────────────────────────────────────
📊 優化結果統計:
   已轉換: 2 個檔案
   已跳過: 0 個檔案
   失敗: 0 個檔案
   總節省: 0.92MB
──────────────────────────────────────────────────

💡 提示: 原始 PNG/JPG 檔案已保留，您可以在確認 WebP 正常後手動刪除。
💡 建議: 更新程式碼使用 WebP 格式以獲得更好的效能。
```

**注意事項：**
- 原始檔案會被保留，不會被刪除
- 如果 WebP 已存在，會自動跳過
- 建議在轉換後測試圖片顯示是否正常

## ⚡ JavaScript 優化

### minify-js.mjs

壓縮 JavaScript 檔案，減少檔案大小和載入時間。

**使用方式：**
```bash
npm run optimize:js
```

**功能：**
- 壓縮 `public/js/theme.js`
- 壓縮 `public/js/mermaid.js`
- 生成 `.min.js` 版本
- 移除註解和不必要的空白
- 變數名稱混淆（保留必要的名稱）

**配置：**
- 保留 console.log（方便除錯）
- 移除 debugger 語句
- 保留函數參數名稱
- 移除所有註解

**範例輸出：**
```
🗜️  開始 JavaScript 壓縮...

✓ theme.js
  原始: 3.45KB → 壓縮: 1.89KB
  節省: 1.56KB (45.2%)

✓ mermaid.js
  原始: 2.12KB → 壓縮: 1.23KB
  節省: 0.89KB (42.0%)

──────────────────────────────────────────────────
📊 壓縮結果統計:
   已處理: 2 個檔案
   總節省: 2.45KB
──────────────────────────────────────────────────

💡 提示: 請更新 HTML 中的引用，使用 .min.js 版本以獲得更好的效能。
```

**使用建議：**
- 開發時使用原始檔案（`.js`）方便除錯
- 生產環境使用壓縮版本（`.min.js`）
- 更新腳本後記得重新壓縮

## 🎨 CSS 分析

### analyze-css.mjs

分析 CSS 檔案，提供優化建議。

**使用方式：**
```bash
npm run analyze:css
```

**功能：**
- 統計 CSS 檔案資訊（行數、大小、選擇器等）
- 分析主題配置（root, dark, warm）
- 識別可能未使用的類別
- 提供具體的優化建議
- 預估壓縮後的檔案大小

**範例輸出：**
```
🔍 開始分析 CSS...

📊 CSS 統計資訊:
──────────────────────────────────────────────────
  總行數: 1250
  檔案大小: 45.67KB
  選擇器數量: 342
  媒體查詢: 15
  動畫關鍵幀: 3
  CSS 變數: 28
  註解數量: 12
  唯一類別: 156
──────────────────────────────────────────────────

🎨 主題配置:
──────────────────────────────────────────────────
  Root 變數: ✓
  Dark 主題: ✓
  Warm 主題: ✓
──────────────────────────────────────────────────

⚠️  可能未使用的類別（僅供參考）:
──────────────────────────────────────────────────
  .unused-class-1
  .unused-class-2
  ... 還有 48 個
──────────────────────────────────────────────────

💡 優化建議:
──────────────────────────────────────────────────
  1. 考慮移除生產環境的註解以減少檔案大小
  2. 使用 PurgeCSS 或類似工具自動移除未使用的 CSS
  3. 考慮使用 CSS Modules 或 Scoped Styles 避免全域污染
  4. 實作 Critical CSS 內聯以改善首次渲染速度
──────────────────────────────────────────────────

📦 壓縮預估:
──────────────────────────────────────────────────
  原始大小: 45.67KB
  壓縮後: 32.45KB
  節省: 13.22KB (28.9%)
──────────────────────────────────────────────────
```

**注意事項：**
- 「可能未使用的類別」僅供參考，需手動驗證
- 某些動態生成的類別可能被誤判為未使用
- 建議配合瀏覽器開發工具進行驗證

## 🚀 批次優化

### 一鍵優化所有資源

```bash
npm run optimize:all
```

這個命令會依序執行：
1. 圖片優化（`optimize:images`）
2. JavaScript 壓縮（`optimize:js`）

**建議的工作流程：**

```bash
# 1. 開發完成後，執行優化
npm run optimize:all

# 2. 分析 CSS（可選）
npm run analyze:css

# 3. 建置網站
npm run build

# 4. 預覽結果
npm run preview
```

## 📋 完整命令列表

| 命令 | 說明 |
|------|------|
| `npm run optimize:images` | 優化圖片（PNG/JPG → WebP） |
| `npm run optimize:js` | 壓縮 JavaScript |
| `npm run analyze:css` | 分析 CSS 並提供建議 |
| `npm run optimize:all` | 執行所有優化（圖片 + JS） |

## 🔧 進階配置

### 自訂圖片優化設定

編輯 `scripts/optimize-images.mjs`：

```javascript
const CONFIG = {
  extensions: ['.png', '.jpg', '.jpeg'],  // 要處理的格式
  webpQuality: 85,                        // WebP 品質 (0-100)
  minFileSize: 10 * 1024,                 // 最小處理大小 (bytes)
  excludeDirs: ['node_modules', '.git'],  // 排除目錄
};
```

### 自訂 JavaScript 壓縮設定

編輯 `scripts/minify-js.mjs`：

```javascript
const TERSER_OPTIONS = {
  compress: {
    drop_console: false,  // 改為 true 可移除 console.log
    drop_debugger: true,
  },
  mangle: {
    keep_classnames: false,
    keep_fnames: false,
  },
};
```

## 🐛 疑難排解

### 圖片優化失敗

**問題：** Sharp 安裝失敗或無法執行

**解決方案：**
```bash
# 清除 node_modules 並重新安裝
rm -rf node_modules package-lock.json
npm install

# 或使用 --force 重新安裝 sharp
npm install sharp --force
```

### JavaScript 壓縮錯誤

**問題：** 壓縮後的 JS 無法執行

**解決方案：**
1. 檢查原始 JS 是否有語法錯誤
2. 調整 Terser 配置，保留更多名稱
3. 使用瀏覽器開發工具檢查錯誤訊息

### Mermaid 載入失敗

**問題：** 圖表無法渲染

**解決方案：**
1. 確認 mermaid 已安裝：`npm list mermaid`
2. 檢查路徑是否正確
3. 考慮回退到 CDN 版本（臨時方案）

## 📚 相關文檔

- [PERFORMANCE_OPTIMIZATION.md](../PERFORMANCE_OPTIMIZATION.md) - 完整的效能優化指南
- [Sharp 文檔](https://sharp.pixelplumbing.com/) - 圖片處理庫
- [Terser 文檔](https://terser.org/) - JavaScript 壓縮工具

## 💡 最佳實踐

1. **定期優化**：每次添加新圖片或更新 JS 後執行優化
2. **版本控制**：將優化後的檔案加入 Git（.min.js, .webp）
3. **測試驗證**：優化後務必測試功能是否正常
4. **效能監控**：使用 Lighthouse 追蹤效能改善
5. **漸進式優化**：先優化影響最大的資源

## 🤝 貢獻

如果您有改進建議或發現問題，歡迎：
1. 提交 Issue
2. 發送 Pull Request
3. 分享您的優化經驗

---

最後更新：2026-05-07

## 🗑️ 清理原始圖片

### cleanup-original-images.mjs

在確認 WebP 圖片正常後，刪除原始的 PNG/JPG 檔案以節省空間。

**使用方式（預覽模式）：**
```bash
npm run cleanup:images:preview
```

**功能：**
- 掃描所有 PNG/JPG/JPEG 檔案
- 檢查對應的 WebP 是否存在且有效
- 驗證 WebP 檔案大小是否更小
- 預覽模式：只顯示將刪除的檔案，不實際刪除
- 實際刪除模式：永久刪除原始檔案

**安全檢查：**
- ✓ WebP 檔案必須存在
- ✓ WebP 檔案必須有效（可正常讀取）
- ✓ WebP 檔案大小必須小於原始檔案
- ✓ 跳過不符合條件的檔案

**範例輸出：**
```
🗑️  開始清理原始圖片...

⚠️  預覽模式：不會實際刪除檔案

掃描目錄: /path/to/public

🔍 /blog/title_image.png
  原始: 1024.5KB → WebP: 512.3KB
  節省: 512.2KB

🔍 /projects/screenshot.jpg
  原始: 856.7KB → WebP: 428.4KB
  節省: 428.3KB

──────────────────────────────────────────────────
📊 清理結果統計:
   已檢查: 150 個檔案
   已刪除: 2 個檔案
   已跳過: 148 個檔案
   失敗: 0 個檔案
   總節省: 0.92MB
──────────────────────────────────────────────────

📋 跳過原因統計:
──────────────────────────────────────────────────
   WebP 不存在: 145 個檔案
   WebP 無效或損壞: 2 個檔案
   WebP 更大: 1 個檔案
──────────────────────────────────────────────────

💡 這是預覽模式，沒有實際刪除檔案。
💡 若要實際刪除，請編輯腳本將 dryRun 設為 false。
```

**實際刪除步驟：**

1. **先執行預覽模式**：
   ```bash
   npm run cleanup:images:preview
   ```

2. **檢查輸出結果**：
   - 確認 WebP 檔案都正常
   - 檢查跳過的檔案原因
   - 確認要刪除的檔案列表

3. **修改腳本啟用刪除**：
   編輯 `scripts/cleanup-original-images.mjs`，將第 18 行改為：
   ```javascript
   dryRun: false,  // 改為 false 啟用實際刪除
   ```

4. **執行實際刪除**：
   ```bash
   npm run cleanup:images:preview
   ```

5. **驗證結果**：
   ```bash
   git status  # 檢查刪除的檔案
   npm run build  # 測試建置是否正常
   ```

**注意事項：**
- ⚠️ 刪除是永久性的，無法復原
- ⚠️ 建議先提交 Git 或備份重要檔案
- ⚠️ 刪除後務必測試網站功能
- ⚠️ 確認所有頁面的圖片都正常顯示
