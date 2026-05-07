/**
 * Find Astro-rendered mermaid code blocks (pre[data-language="mermaid"]),
 * replace each with a div.mermaid containing raw diagram source, then run Mermaid.
 * Preserves newlines by joining .line spans when present (Astro/Shiki output).
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

(function () {
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

  // Import mermaid from local npm package
  import('/node_modules/mermaid/dist/mermaid.esm.min.mjs')
    .then(function (m) {
      const mermaid = m.default || m;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
      });
      // Render each diagram so one failure does not block others
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
})();
