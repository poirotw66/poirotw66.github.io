/**
 * Find Astro-rendered mermaid code blocks (pre[data-language="mermaid"]),
 * replace each with a div.mermaid containing raw diagram source, then run Mermaid.
 * Preserves newlines by joining .line spans when present (Astro/Shiki output).
 * Theme follows site data-theme (warm / dark) and re-renders on theme switch.
 */
function getMermaidSource(pre) {
  const lines = pre.querySelectorAll('code .line');
  let source;
  if (lines.length > 0) {
    source = Array.from(lines)
      .map(function (el) {
        return el.textContent || '';
      })
      .join('\n');
  } else {
    source = (pre.textContent || '').replace(/\r\n/g, '\n');
  }
  // Normalize common markdown/HTML artifacts that break Mermaid layout.
  return source
    .replace(/\u00a0/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getSiteTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'warm' || stored === 'dark') return stored;
  } catch (e) {}
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'warm';
}

/** Warm palette: Claude parchment, aligned with style.css [data-theme="warm"] */
const WARM_THEME_VARIABLES = {
  darkMode: false,
  background: '#faf9f5',
  mainBkg: '#faf9f5',
  secondBkg: '#f5f4ed',
  tertiaryBkg: '#f0eee6',
  primaryColor: '#faf9f5',
  primaryTextColor: '#141413',
  primaryBorderColor: '#e8e6dc',
  secondaryColor: '#f0eee6',
  secondaryTextColor: '#141413',
  secondaryBorderColor: '#e8e6dc',
  tertiaryColor: '#f5f4ed',
  tertiaryTextColor: '#5e5d59',
  tertiaryBorderColor: '#e8e6dc',
  lineColor: '#7a4423',
  textColor: '#141413',
  nodeTextColor: '#141413',
  nodeBorder: '#e8e6dc',
  clusterBkg: '#f5f4ed',
  clusterBorder: '#e8e6dc',
  defaultLinkColor: '#7a4423',
  titleColor: '#141413',
  edgeLabelBackground: '#faf9f5',
  actorBorder: '#e8e6dc',
  actorBkg: '#faf9f5',
  actorTextColor: '#141413',
  actorLineColor: '#7a4423',
  signalColor: '#141413',
  signalTextColor: '#141413',
  labelBoxBkgColor: '#faf9f5',
  labelBoxBorderColor: '#e8e6dc',
  labelTextColor: '#141413',
  noteBkgColor: '#f5f4ed',
  noteTextColor: '#141413',
  noteBorderColor: '#e8e6dc',
  activationBkgColor: '#f0eee6',
  activationBorderColor: '#7a4423',
  sequenceNumberColor: '#5e5d59',
  sectionBkgColor: '#f5f4ed',
  altSectionBkgColor: '#faf9f5',
  sectionBkgColor2: '#f0eee6',
  excludeBkgColor: '#f5f4ed',
  taskBorderColor: '#7a4423',
  taskBkgColor: '#faf9f5',
  taskTextColor: '#141413',
  taskTextLightColor: '#5e5d59',
  taskTextOutsideColor: '#141413',
  activeTaskBorderColor: '#5c3218',
  activeTaskBkgColor: '#f0eee6',
  gridColor: '#e8e6dc',
  doneTaskBkgColor: '#f5f4ed',
  doneTaskBorderColor: '#9a7340',
  critBorderColor: '#7a4423',
  critBkgColor: '#f0eee6',
  todayLineColor: '#7a4423',
  relationLabelBackground: '#faf9f5',
  fillType0: '#faf9f5',
  fillType1: '#f5f4ed',
  fillType2: '#f0eee6',
  fillType3: '#e8e6dc',
  fillType4: '#ffffff',
  fillType5: '#d1cfc5',
  fillType6: '#faf9f5',
  fillType7: '#e8e6dc',
  pie1: '#7a4423',
  pie2: '#9a7340',
  pie3: '#5a6b42',
  pie4: '#b5a088',
  pie5: '#4f5c46',
  pie6: '#d0c2ad',
  pie7: '#5c3218',
  pieTitleTextColor: '#1a1510',
  pieSectionTextColor: '#1a1510',
  pieSectionTextSize: '14px',
  pieLegendTextColor: '#4a4238',
  pieStrokeColor: '#e8e6dc',
  pieStrokeWidth: '1px',
  pieOuterStrokeWidth: '2px',
  pieOuterStrokeColor: '#e8e6dc',
  fontSize: '14px',
  fontFamily: '"DM Sans", "Noto Sans TC", sans-serif',
};

const MERMAID_FONT_FAMILY = '"DM Sans", "Noto Sans TC", sans-serif';

function getMermaidConfig(theme) {
  if (theme === 'dark') {
    return {
      theme: 'dark',
      themeVariables: {
        fontSize: '14px',
        fontFamily: MERMAID_FONT_FAMILY,
      },
    };
  }
  return { theme: 'base', themeVariables: WARM_THEME_VARIABLES };
}

let mermaidApi = null;
let mermaidLoadPromise = null;
let renderToken = 0;

function loadMermaid() {
  if (mermaidApi) return Promise.resolve(mermaidApi);
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import(
      'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
    ).then(function (m) {
      mermaidApi = m.default || m;
      return mermaidApi;
    });
  }
  return mermaidLoadPromise;
}

function prepareDiagramNodes() {
  const blocks = document.querySelectorAll('pre[data-language="mermaid"]');
  blocks.forEach(function (pre) {
    const source = getMermaidSource(pre);
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.setAttribute('data-mermaid-source', source);
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', 'diagram');
    const shell = pre.closest('.code-block-shell');
    if (shell) {
      shell.replaceWith(div);
    } else {
      pre.replaceWith(div);
    }
  });
}

function getDiagramNodes() {
  return document.querySelectorAll('.mermaid[data-mermaid-source]');
}

function renderMermaidDiagrams() {
  const nodes = getDiagramNodes();
  if (nodes.length === 0) return Promise.resolve();

  const siteTheme = getSiteTheme();
  const { theme, themeVariables } = getMermaidConfig(siteTheme);
  const token = ++renderToken;

  return loadMermaid()
    .then(function (mermaid) {
      if (token !== renderToken) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        themeVariables: themeVariables,
        fontFamily: MERMAID_FONT_FAMILY,
        // Mermaid 11 uses the root-level option; the flowchart-specific
        // variant is deprecated and may be ignored.
        htmlLabels: false,
        securityLevel: 'loose',
        flowchart: {
          // Pure SVG text stays crisp and is isolated from article paragraph CSS.
          htmlLabels: false,
          useMaxWidth: true,
          curve: 'basis',
          padding: 12,
          nodeSpacing: 40,
          rankSpacing: 40,
        },
        sequence: {
          useMaxWidth: true,
          actorMargin: 24,
          messageMargin: 32,
        },
        er: { useMaxWidth: true },
        journey: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
        pie: { useMaxWidth: true },
        sankey: { useMaxWidth: true },
      });

      return Promise.all(
        Array.from(nodes).map(function (div, i) {
          const source = div.getAttribute('data-mermaid-source');
          if (!source) return Promise.resolve();

          // Clear previous SVG before re-render (theme switch / remount).
          div.classList.remove('mermaid-rendered');
          div.removeAttribute('data-processed');
          div.innerHTML = '';

          const id = 'mermaid-' + i + '-' + Math.random().toString(36).slice(2);
          return mermaid
            .render(id, source)
            .then(function (result) {
              if (token !== renderToken) return;
              div.innerHTML = result.svg;
              const svg = div.querySelector('svg');
              if (svg) {
                const viewBox = (svg.getAttribute('viewBox') || '')
                  .trim()
                  .split(/\s+/)
                  .map(Number);
                const intrinsicWidth = viewBox.length === 4 ? viewBox[2] : NaN;
                const intrinsicHeight = viewBox.length === 4 ? viewBox[3] : NaN;

                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                if (Number.isFinite(intrinsicWidth) && intrinsicWidth > 0) {
                  // CSS uses this to avoid desktop upscaling and preserve a
                  // readable, horizontally scrollable size for unusually
                  // wide diagrams on narrow screens.
                  svg.style.setProperty('--mermaid-intrinsic-width', intrinsicWidth + 'px');
                }
                if (
                  Number.isFinite(intrinsicWidth) &&
                  (intrinsicWidth > 480 ||
                    (Number.isFinite(intrinsicHeight) &&
                      intrinsicHeight > 0 &&
                      intrinsicWidth / intrinsicHeight >= 1.8))
                ) {
                  // Preserve the author-intended text size only when fitting
                  // a diagram would make it too small to read. Stacked and
                  // compact diagrams continue to fit the article column
                  // without an unnecessary scrollbar.
                  div.setAttribute('data-mermaid-layout', 'wide');
                } else {
                  div.removeAttribute('data-mermaid-layout');
                }
              }
              div.classList.add('mermaid-rendered');
            })
            .catch(function (err) {
              console.warn('Mermaid render failed for diagram ' + i + ':', err);
              div.textContent = 'Diagram failed to render.';
              div.classList.add('mermaid-rendered');
            });
        })
      );
    })
    .catch(function (err) {
      console.warn('Mermaid load failed:', err);
    });
}

function initMermaid() {
  prepareDiagramNodes();
  return renderMermaidDiagrams();
}

function bootMermaid() {
  initMermaid();
  document.addEventListener('site-theme-change', function () {
    renderMermaidDiagrams();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootMermaid);
} else {
  bootMermaid();
}
