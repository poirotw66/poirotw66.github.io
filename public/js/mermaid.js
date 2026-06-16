/**
 * Find Astro-rendered mermaid code blocks (pre[data-language="mermaid"]),
 * replace each with a div.mermaid containing raw diagram source, then run Mermaid.
 * Preserves newlines by joining .line spans when present (Astro/Shiki output).
 * Theme follows site data-theme (warm / dark).
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

/** Warm atelier palette — aligned with style.css [data-theme="warm"] tokens */
const WARM_THEME_VARIABLES = {
  darkMode: false,
  background: '#e2d6c4',
  mainBkg: '#e8dece',
  secondBkg: '#d9cbb6',
  tertiaryBkg: '#d0c2ad',
  primaryColor: '#e8dece',
  primaryTextColor: '#1a1510',
  primaryBorderColor: '#b5a088',
  secondaryColor: '#d0c2ad',
  secondaryTextColor: '#1a1510',
  secondaryBorderColor: '#b5a088',
  tertiaryColor: '#ddd0bc',
  tertiaryTextColor: '#4a4238',
  tertiaryBorderColor: '#b5a088',
  lineColor: '#7a4423',
  textColor: '#1a1510',
  nodeTextColor: '#1a1510',
  nodeBorder: '#b5a088',
  clusterBkg: '#d9cbb6',
  clusterBorder: '#b5a088',
  defaultLinkColor: '#7a4423',
  titleColor: '#1a1510',
  edgeLabelBackground: '#e8dece',
  actorBorder: '#b5a088',
  actorBkg: '#e8dece',
  actorTextColor: '#1a1510',
  actorLineColor: '#7a4423',
  signalColor: '#1a1510',
  signalTextColor: '#1a1510',
  labelBoxBkgColor: '#e8dece',
  labelBoxBorderColor: '#b5a088',
  labelTextColor: '#1a1510',
  noteBkgColor: '#f5ede0',
  noteTextColor: '#1a1510',
  noteBorderColor: '#b5a088',
  activationBkgColor: '#d0c2ad',
  activationBorderColor: '#7a4423',
  sequenceNumberColor: '#4a4238',
  sectionBkgColor: '#d9cbb6',
  altSectionBkgColor: '#e8dece',
  sectionBkgColor2: '#d0c2ad',
  excludeBkgColor: '#ddd0bc',
  taskBorderColor: '#7a4423',
  taskBkgColor: '#e8dece',
  taskTextColor: '#1a1510',
  taskTextLightColor: '#4a4238',
  taskTextOutsideColor: '#1a1510',
  activeTaskBorderColor: '#5c3218',
  activeTaskBkgColor: '#d0c2ad',
  gridColor: '#b5a088',
  doneTaskBkgColor: '#d9cbb6',
  doneTaskBorderColor: '#9a7340',
  critBorderColor: '#7a4423',
  critBkgColor: '#f0e4d4',
  todayLineColor: '#7a4423',
  relationLabelBackground: '#e8dece',
  fillType0: '#e8dece',
  fillType1: '#d9cbb6',
  fillType2: '#d0c2ad',
  fillType3: '#ddd0bc',
  fillType4: '#f5ede0',
  fillType5: '#c9b89e',
  fillType6: '#e2d6c4',
  fillType7: '#b5a088',
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
  pieStrokeColor: '#b5a088',
  pieStrokeWidth: '1px',
  pieOuterStrokeWidth: '2px',
  pieOuterStrokeColor: '#b5a088',
};

function getMermaidConfig(theme) {
  if (theme === 'dark') {
    return { theme: 'dark', themeVariables: {} };
  }
  return { theme: 'base', themeVariables: WARM_THEME_VARIABLES };
}

function initMermaid() {
  const blocks = document.querySelectorAll('pre[data-language="mermaid"]');
  if (blocks.length === 0) return;

  const divs = [];
  blocks.forEach(function (pre) {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = getMermaidSource(pre);
    pre.replaceWith(div);
    divs.push(div);
  });

  const siteTheme = getSiteTheme();
  const { theme, themeVariables } = getMermaidConfig(siteTheme);

  import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
    .then(function (m) {
      const mermaid = m.default || m;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        themeVariables: themeVariables,
        securityLevel: 'loose',
      });
      return Promise.all(
        divs.map(function (div, i) {
          const id = 'mermaid-' + i + '-' + Math.random().toString(36).slice(2);
          return mermaid
            .render(id, div.textContent)
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMermaid);
} else {
  initMermaid();
}
