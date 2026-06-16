/**
 * Find Astro-rendered mermaid code blocks (pre[data-language="mermaid"]),
 * replace each with a div.mermaid containing raw diagram source, then run Mermaid.
 * Preserves newlines by joining .line spans when present (Astro/Shiki output).
 * Theme follows site data-theme (warm / dark) and re-renders on theme switch.
 */
function getMermaidSource(pre) {
  const lines = pre.querySelectorAll('code .line');
  if (lines.length > 0) {
    return Array.from(lines)
      .map(function (el) {
        return el.textContent || '';
      })
      .join('\n');
  }
  return (pre.textContent || '').replace(/\r\n/g, '\n');
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
};

function getMermaidConfig(theme) {
  if (theme === 'dark') {
    return { theme: 'dark', themeVariables: {} };
  }
  return { theme: 'base', themeVariables: WARM_THEME_VARIABLES };
}

let mermaidApi = null;
let mermaidLoadPromise = null;

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

  return loadMermaid()
    .then(function (mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        themeVariables: themeVariables,
        securityLevel: 'loose',
      });
      return Promise.all(
        Array.from(nodes).map(function (div, i) {
          const source = div.getAttribute('data-mermaid-source');
          if (!source) return Promise.resolve();
          const id = 'mermaid-' + i + '-' + Math.random().toString(36).slice(2);
          return mermaid
            .render(id, source)
            .then(function (result) {
              div.innerHTML = result.svg;
              div.classList.add('mermaid-rendered');
            })
            .catch(function (err) {
              console.warn('Mermaid render failed for diagram ' + i + ':', err);
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
