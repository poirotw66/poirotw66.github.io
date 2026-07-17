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

/** Warm palette — Claude parchment, aligned with style.css [data-theme="warm"] */
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
};

function getMermaidConfig(theme) {
  if (theme === 'dark') {
    return {
      theme: 'dark',
      themeVariables: {
        fontSize: '14px',
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
    pre.replaceWith(div);
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
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
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
                svg.removeAttribute('height');
                svg.style.maxWidth = '100%';
                svg.style.height = 'auto';
                // Prefer viewBox scaling over fixed pixel width when present.
                if (svg.hasAttribute('viewBox') && svg.hasAttribute('width')) {
                  const width = svg.getAttribute('width');
                  if (width && !String(width).endsWith('%')) {
                    svg.setAttribute('width', '100%');
                  }
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
