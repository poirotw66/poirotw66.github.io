/**
 * PDF Viewer Controller
 * 使用 PDF.js 實作功能完整的 PDF 檢視器
 */

const PDFJS_VERSION = '3.11.174';
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

function resolvePdfUrl(pdfUrl) {
  try {
    return new URL(pdfUrl, window.location.origin).href;
  } catch {
    return pdfUrl;
  }
}

class PDFViewerController {
  constructor(containerId, pdfUrl, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    this.pdfUrl = pdfUrl;
    this.options = {
      initialScale: options.initialScale || 'page-width',
      minScale: options.minScale || 0.5,
      maxScale: options.maxScale || 2.0,
      ...options
    };

    this.pdfDoc = null;
    this.pageNum = 1;
    this.pageRendering = false;
    this.pageNumPending = null;
    this.scale = 1.0;
    this.canvas = null;
    this.ctx = null;

    this.init();
  }

  async init() {
    try {
      // 顯示載入狀態
      this.showLoading();

      // 設定 PDF.js worker
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/build/pdf.worker.min.js`;

      const absoluteUrl = resolvePdfUrl(this.pdfUrl);

      // CJK and embedded fonts need cMaps (common for Chinese slide PDFs)
      const loadingTask = pdfjsLib.getDocument({
        url: absoluteUrl,
        cMapUrl: `${PDFJS_CDN}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${PDFJS_CDN}/standard_fonts/`,
      });
      this.pdfDoc = await loadingTask.promise;

      // 初始化 UI
      this.initUI();
      
      // 渲染第一頁
      await this.renderPage(this.pageNum);

      // 隱藏載入狀態
      this.hideLoading();

      // 綁定事件
      this.bindEvents();

    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showNativePdfFallback();
    }
  }

  showNativePdfFallback() {
    this.hideLoading();
    const host = this.container.querySelector('.pdf-canvas-container');
    const absoluteUrl = resolvePdfUrl(this.pdfUrl);
    const title = this.options.title || 'PDF';

    if (!host) {
      this.showError('無法載入 PDF，請使用文章中的下載連結。');
      return;
    }

    const toolbar = this.container.querySelector('.pdf-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }

    host.innerHTML = `
      <iframe
        src="${absoluteUrl}"
        title="${title}"
        style="width:100%;height:min(80vh,800px);border:0;border-radius:8px;background:#fff;"
        loading="lazy"
      ></iframe>
      <p class="pdf-fallback-note" style="margin:0.75rem 0 0;font-size:0.875rem;color:var(--text-muted,#666);">
        進階檢視器無法解析此檔案時，已改為瀏覽器內建 PDF 預覽。亦可使用上方下載連結。
      </p>
    `;
  }

  initUI() {
    const toolbar = this.container.querySelector('.pdf-toolbar');
    const canvas = this.container.querySelector('.pdf-canvas');
    
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 更新總頁數和當前頁碼
    const totalPages = this.container.querySelector('.pdf-total-pages');
    if (totalPages) {
      totalPages.textContent = this.pdfDoc.numPages;
    }
    
    const pageInput = this.container.querySelector('.pdf-page-input');
    if (pageInput) {
      pageInput.value = this.pageNum;
      pageInput.max = this.pdfDoc.numPages;
    }

    // 根據初始縮放設定調整
    if (this.options.initialScale === 'page-width') {
      this.fitToWidth();
    } else if (this.options.initialScale === 'page-fit') {
      this.fitToPage();
    }
  }

  async renderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
      return;
    }

    this.pageRendering = true;
    this.pageNum = num;

    try {
      // 取得頁面
      const page = await this.pdfDoc.getPage(num);

      // 計算視口
      const viewport = page.getViewport({ scale: this.scale });

      // 設定 canvas 尺寸
      const devicePixelRatio = window.devicePixelRatio || 1;
      this.canvas.width = viewport.width * devicePixelRatio;
      this.canvas.height = viewport.height * devicePixelRatio;
      this.canvas.style.width = viewport.width + 'px';
      this.canvas.style.height = viewport.height + 'px';

      // 調整 context 縮放以支援高 DPI 顯示
      this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      // 渲染頁面
      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      this.pageRendering = false;

      // 更新頁碼顯示
      this.updatePageNumber();

      // 如果有待處理的頁面,渲染它
      if (this.pageNumPending !== null) {
        const pending = this.pageNumPending;
        this.pageNumPending = null;
        await this.renderPage(pending);
      }

    } catch (error) {
      console.error('Error rendering page:', error);
      this.pageRendering = false;
    }
  }

  updatePageNumber() {
    // 更新頁碼輸入框
    const pageInput = this.container.querySelector('.pdf-page-input');
    if (pageInput) {
      pageInput.value = this.pageNum;
    }

    // 更新按鈕狀態
    const prevBtn = this.container.querySelector('.pdf-prev');
    const nextBtn = this.container.querySelector('.pdf-next');
    
    if (prevBtn) {
      prevBtn.disabled = this.pageNum <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
    }
  }

  async prevPage() {
    if (this.pageNum <= 1) return;
    await this.renderPage(this.pageNum - 1);
  }

  async nextPage() {
    if (this.pageNum >= this.pdfDoc.numPages) return;
    await this.renderPage(this.pageNum + 1);
  }

  async goToPage(pageNum) {
    const num = parseInt(pageNum);
    if (num < 1 || num > this.pdfDoc.numPages) return;
    await this.renderPage(num);
  }

  async zoomIn() {
    const newScale = Math.min(this.scale * 1.2, this.options.maxScale);
    if (newScale !== this.scale) {
      this.scale = newScale;
      await this.renderPage(this.pageNum);
    }
  }

  async zoomOut() {
    const newScale = Math.max(this.scale / 1.2, this.options.minScale);
    if (newScale !== this.scale) {
      this.scale = newScale;
      await this.renderPage(this.pageNum);
    }
  }

  async fitToWidth() {
    const page = await this.pdfDoc.getPage(this.pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const containerWidth = this.container.querySelector('.pdf-canvas-container').clientWidth - 40;
    this.scale = containerWidth / viewport.width;
    await this.renderPage(this.pageNum);
  }

  async fitToPage() {
    const page = await this.pdfDoc.getPage(this.pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const container = this.container.querySelector('.pdf-canvas-container');
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    const scaleWidth = containerWidth / viewport.width;
    const scaleHeight = containerHeight / viewport.height;
    this.scale = Math.min(scaleWidth, scaleHeight);
    await this.renderPage(this.pageNum);
  }

  toggleFullscreen() {
    const viewer = this.container.querySelector('.pdf-viewer');
    if (!document.fullscreenElement) {
      viewer.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  download() {
    const link = document.createElement('a');
    link.href = this.pdfUrl;
    link.download = this.pdfUrl.split('/').pop();
    link.click();
  }

  print() {
    window.open(this.pdfUrl, '_blank');
  }

  showLoading() {
    const loading = this.container.querySelector('.pdf-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = this.container.querySelector('.pdf-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(message) {
    this.hideLoading();
    const error = this.container.querySelector('.pdf-error');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  bindEvents() {
    // 工具列按鈕
    const prevBtn = this.container.querySelector('.pdf-prev');
    const nextBtn = this.container.querySelector('.pdf-next');
    const zoomInBtn = this.container.querySelector('.pdf-zoom-in');
    const zoomOutBtn = this.container.querySelector('.pdf-zoom-out');
    const fitWidthBtn = this.container.querySelector('.pdf-fit-width');
    const fitPageBtn = this.container.querySelector('.pdf-fit-page');
    const fullscreenBtn = this.container.querySelector('.pdf-fullscreen');
    const downloadBtn = this.container.querySelector('.pdf-download');
    const pageInput = this.container.querySelector('.pdf-page-input');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
    if (fitWidthBtn) fitWidthBtn.addEventListener('click', () => this.fitToWidth());
    if (fitPageBtn) fitPageBtn.addEventListener('click', () => this.fitToPage());
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.download());

    if (pageInput) {
      pageInput.addEventListener('change', (e) => {
        this.goToPage(e.target.value);
      });
      pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.goToPage(e.target.value);
        }
      });
    }

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      if (!this.container.contains(document.activeElement)) return;

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomIn();
          break;
        case '-':
          e.preventDefault();
          this.zoomOut();
          break;
        case 'f':
        case 'F':
          if (!e.target.matches('input')) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
        case 'Home':
          e.preventDefault();
          this.goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          this.goToPage(this.pdfDoc.numPages);
          break;
      }
    });

    // 視窗大小改變時重新渲染
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        if (this.options.initialScale === 'page-width') {
          this.fitToWidth();
        } else if (this.options.initialScale === 'page-fit') {
          this.fitToPage();
        }
      }, 250);
    });
  }
}

// 全域初始化函數
window.initPDFViewer = function(containerId, pdfUrl, options) {
  return new PDFViewerController(containerId, pdfUrl, options);
};

// Made with Bob
