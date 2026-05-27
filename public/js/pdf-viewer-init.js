/**
 * PDF Viewer Auto-Initialization
 * 自動將帶有 data-pdf-viewer 屬性的 div 轉換為 PDF 檢視器
 */

(function() {
  'use strict';

  // 等待 DOM 載入完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPDFViewers);
  } else {
    initAllPDFViewers();
  }

  function initAllPDFViewers() {
    // 尋找所有需要初始化的 PDF 檢視器
    const pdfContainers = document.querySelectorAll('[data-pdf-viewer]');
    
    if (pdfContainers.length === 0) {
      return; // 沒有 PDF 檢視器,直接返回
    }

    // 載入必要的資源
    loadPDFResources().then(() => {
      pdfContainers.forEach(initPDFViewer);
    }).catch(error => {
      console.error('Failed to load PDF viewer resources:', error);
    });
  }

  function loadPDFResources() {
    return new Promise((resolve, reject) => {
      const resources = {
        css: '/css/pdf-viewer.css',
        pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
        controller: '/js/pdf-viewer.js'
      };

      let loadedCount = 0;
      const totalResources = 3;

      // 載入 CSS
      if (!document.querySelector(`link[href="${resources.css}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = resources.css;
        link.onload = () => checkAllLoaded();
        link.onerror = () => reject(new Error('Failed to load CSS'));
        document.head.appendChild(link);
      } else {
        checkAllLoaded();
      }

      // 載入 PDF.js
      if (!window['pdfjs-dist/build/pdf']) {
        const script1 = document.createElement('script');
        script1.src = resources.pdfjs;
        script1.onload = () => checkAllLoaded();
        script1.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script1);
      } else {
        checkAllLoaded();
      }

      // 載入控制器
      if (!window.initPDFViewer) {
        const script2 = document.createElement('script');
        script2.src = resources.controller;
        script2.onload = () => checkAllLoaded();
        script2.onerror = () => reject(new Error('Failed to load PDF controller'));
        document.head.appendChild(script2);
      } else {
        checkAllLoaded();
      }

      function checkAllLoaded() {
        loadedCount++;
        if (loadedCount === totalResources) {
          // 等待一小段時間確保所有腳本都已執行
          setTimeout(resolve, 100);
        }
      }
    });
  }

  function initPDFViewer(container) {
    const src = container.getAttribute('data-src');
    const title = container.getAttribute('data-title') || 'PDF Document';
    const height = container.getAttribute('data-height') || '800px';
    const initialScale = container.getAttribute('data-initial-scale') || 'page-width';
    const minScale = parseFloat(container.getAttribute('data-min-scale')) || 0.5;
    const maxScale = parseFloat(container.getAttribute('data-max-scale')) || 2.0;
    const showToolbar = container.getAttribute('data-show-toolbar') !== 'false';
    const allowDownload = container.getAttribute('data-allow-download') !== 'false';
    const allowFullscreen = container.getAttribute('data-allow-fullscreen') !== 'false';

    if (!src) {
      console.error('PDF viewer missing data-src attribute');
      return;
    }

    // 生成唯一 ID
    const viewerId = `pdf-viewer-${Math.random().toString(36).substr(2, 9)}`;

    // 建立 HTML 結構
    container.style.height = height;
    container.className = 'pdf-viewer-container';
    container.innerHTML = `
      <div class="pdf-viewer" id="${viewerId}">
        ${showToolbar ? `
        <div class="pdf-toolbar" role="toolbar" aria-label="PDF 控制工具列">
          <div class="pdf-toolbar-group pdf-page-nav">
            <button type="button" class="pdf-prev" aria-label="上一頁" title="上一頁 (←)">
              <span>上一頁</span>
            </button>
            <div class="pdf-page-info" role="status" aria-live="polite">
              <input type="number" class="pdf-page-input" min="1" aria-label="當前頁碼" title="輸入頁碼並按 Enter" />
              <span>/</span>
              <span class="pdf-total-pages" aria-label="總頁數">0</span>
            </div>
            <button type="button" class="pdf-next" aria-label="下一頁" title="下一頁 (→)">
              <span>下一頁</span>
            </button>
          </div>
          <div class="pdf-toolbar-group pdf-zoom-controls">
            <button type="button" class="pdf-zoom-out" aria-label="縮小" title="縮小 (-)">
              <span>縮小</span>
            </button>
            <button type="button" class="pdf-zoom-in" aria-label="放大" title="放大 (+)">
              <span>放大</span>
            </button>
            <button type="button" class="pdf-fit-width" aria-label="適應寬度" title="適應寬度">
              <span>適應寬度</span>
            </button>
            <button type="button" class="pdf-fit-page" aria-label="適應頁面" title="適應頁面">
              <span>適應頁面</span>
            </button>
          </div>
          <div class="pdf-toolbar-group">
            ${allowFullscreen ? `
            <button type="button" class="pdf-fullscreen" aria-label="全螢幕" title="全螢幕 (F)">
              <span>全螢幕</span>
            </button>
            ` : ''}
            ${allowDownload ? `
            <button type="button" class="pdf-download" aria-label="下載 PDF" title="下載 PDF">
              <span>下載</span>
            </button>
            ` : ''}
          </div>
        </div>
        ` : ''}
        <div class="pdf-canvas-container" role="main" aria-label="${title} 內容">
          <canvas class="pdf-canvas" aria-label="${title}"></canvas>
          <div class="pdf-loading" role="status" aria-live="polite">
            <div class="pdf-loading-spinner" aria-hidden="true"></div>
            <div class="pdf-loading-text">載入 PDF 中...</div>
          </div>
          <div class="pdf-error" role="alert" aria-live="assertive"></div>
        </div>
      </div>
    `;

    // 初始化 PDF 檢視器
    if (window.initPDFViewer) {
      try {
        window.initPDFViewer(viewerId, src, {
          initialScale: initialScale,
          minScale: minScale,
          maxScale: maxScale,
          title: title
        });
      } catch (error) {
        console.error('Error initializing PDF viewer:', error);
        const errorEl = container.querySelector('.pdf-error');
        if (errorEl) {
          errorEl.textContent = '初始化 PDF 檢視器時發生錯誤。';
          errorEl.style.display = 'block';
        }
      }
    } else {
      console.error('PDF viewer controller not loaded');
    }
  }
})();

// Made with Bob
