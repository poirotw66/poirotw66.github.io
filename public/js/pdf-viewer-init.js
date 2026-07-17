/**
 * PDF Viewer Auto-Initialization
 * 自動將帶有 data-pdf-viewer 屬性的 div 轉換為 PDF 檢視器
 */

(function() {
  'use strict';

  function isEnglishUi() {
    return (document.documentElement.lang || '').toLowerCase().startsWith('en');
  }

  function pdfUi() {
    if (isEnglishUi()) {
      return {
        toolbar: 'PDF controls',
        prev: 'Previous page',
        prevTitle: 'Previous page (←)',
        pageInput: 'Current page',
        pageInputTitle: 'Enter a page number and press Enter',
        totalPages: 'Total pages',
        next: 'Next page',
        nextTitle: 'Next page (→)',
        zoomOut: 'Zoom out',
        zoomOutTitle: 'Zoom out (-)',
        zoomIn: 'Zoom in',
        zoomInTitle: 'Zoom in (+)',
        fitWidth: 'Fit width',
        fitPage: 'Fit page',
        fullscreen: 'Fullscreen',
        fullscreenTitle: 'Fullscreen (F)',
        download: 'Download PDF',
        downloadLabel: 'Download',
        contentSuffix: ' content',
        loading: 'Loading PDF...',
        initError: 'Failed to initialize the PDF viewer.',
      };
    }
    return {
      toolbar: 'PDF 控制工具列',
      prev: '上一頁',
      prevTitle: '上一頁 (←)',
      pageInput: '當前頁碼',
      pageInputTitle: '輸入頁碼並按 Enter',
      totalPages: '總頁數',
      next: '下一頁',
      nextTitle: '下一頁 (→)',
      zoomOut: '縮小',
      zoomOutTitle: '縮小 (-)',
      zoomIn: '放大',
      zoomInTitle: '放大 (+)',
      fitWidth: '適應寬度',
      fitPage: '適應頁面',
      fullscreen: '全螢幕',
      fullscreenTitle: '全螢幕 (F)',
      download: '下載 PDF',
      downloadLabel: '下載',
      contentSuffix: ' 內容',
      loading: '載入 PDF 中...',
      initError: '初始化 PDF 檢視器時發生錯誤。',
    };
  }

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

    const ui = pdfUi();

    // 生成唯一 ID
    const viewerId = `pdf-viewer-${Math.random().toString(36).substr(2, 9)}`;

    // 建立 HTML 結構
    container.style.height = height;
    container.className = 'pdf-viewer-container';
    container.innerHTML = `
      <div class="pdf-viewer" id="${viewerId}">
        ${showToolbar ? `
        <div class="pdf-toolbar" role="toolbar" aria-label="${ui.toolbar}">
          <div class="pdf-toolbar-group pdf-page-nav">
            <button type="button" class="pdf-prev" aria-label="${ui.prev}" title="${ui.prevTitle}">
              <span>${ui.prev}</span>
            </button>
            <div class="pdf-page-info" role="status" aria-live="polite">
              <input type="number" class="pdf-page-input" min="1" aria-label="${ui.pageInput}" title="${ui.pageInputTitle}" />
              <span>/</span>
              <span class="pdf-total-pages" aria-label="${ui.totalPages}">0</span>
            </div>
            <button type="button" class="pdf-next" aria-label="${ui.next}" title="${ui.nextTitle}">
              <span>${ui.next}</span>
            </button>
          </div>
          <div class="pdf-toolbar-group pdf-zoom-controls">
            <button type="button" class="pdf-zoom-out" aria-label="${ui.zoomOut}" title="${ui.zoomOutTitle}">
              <span>${ui.zoomOut}</span>
            </button>
            <button type="button" class="pdf-zoom-in" aria-label="${ui.zoomIn}" title="${ui.zoomInTitle}">
              <span>${ui.zoomIn}</span>
            </button>
            <button type="button" class="pdf-fit-width" aria-label="${ui.fitWidth}" title="${ui.fitWidth}">
              <span>${ui.fitWidth}</span>
            </button>
            <button type="button" class="pdf-fit-page" aria-label="${ui.fitPage}" title="${ui.fitPage}">
              <span>${ui.fitPage}</span>
            </button>
          </div>
          <div class="pdf-toolbar-group">
            ${allowFullscreen ? `
            <button type="button" class="pdf-fullscreen" aria-label="${ui.fullscreen}" title="${ui.fullscreenTitle}">
              <span>${ui.fullscreen}</span>
            </button>
            ` : ''}
            ${allowDownload ? `
            <button type="button" class="pdf-download" aria-label="${ui.download}" title="${ui.download}">
              <span>${ui.downloadLabel}</span>
            </button>
            ` : ''}
          </div>
        </div>
        ` : ''}
        <div class="pdf-canvas-container" role="main" aria-label="${title}${ui.contentSuffix}">
          <canvas class="pdf-canvas" aria-label="${title}"></canvas>
          <div class="pdf-loading" role="status" aria-live="polite">
            <div class="pdf-loading-spinner" aria-hidden="true"></div>
            <div class="pdf-loading-text">${ui.loading}</div>
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
          errorEl.textContent = ui.initError;
          errorEl.style.display = 'block';
        }
      }
    } else {
      console.error('PDF viewer controller not loaded');
    }
  }
})();

// Made with Bob
