import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/js/article-toc-scroll.js', import.meta.url), 'utf8');

test('TOC resolves Markdown heading ids that begin with a number', () => {
  let clickHandler;
  let scrolledTo;
  const target = {
    id: '1-介面與任務入口',
    getBoundingClientRect: () => ({ top: 240 }),
  };
  const link = {
    classList: { toggle() {} },
    getAttribute: () => '#1-介面與任務入口',
    addEventListener: (type, handler) => {
      if (type === 'click') clickHandler = handler;
    },
    setAttribute() {},
    removeAttribute() {},
  };
  const root = {
    querySelector: () => null,
    querySelectorAll: () => [link],
  };
  const documentElement = {};
  const context = {
    Array,
    Boolean,
    Number,
    Math,
    decodeURIComponent,
    document: {
      documentElement,
      readyState: 'complete',
      querySelectorAll: () => [root],
      querySelector: () => {
        throw new Error('hashes must not be passed to querySelector');
      },
      getElementById: (id) => (id === target.id ? target : null),
    },
    getComputedStyle: () => ({
      scrollPaddingTop: '0',
      fontSize: '16px',
      getPropertyValue: () => '',
    }),
    history: { replaceState() {} },
    requestAnimationFrame: (callback) => callback(),
    window: {
      location: { hash: '' },
      matchMedia: () => ({ matches: false }),
      requestAnimationFrame: (callback) => callback(),
      addEventListener() {},
      scrollY: 0,
      scrollTo: (options) => { scrolledTo = options; },
    },
  };

  vm.runInNewContext(source, context);
  assert.equal(typeof clickHandler, 'function');
  clickHandler({ preventDefault() {} });
  assert.equal(scrolledTo.top, 132);
});
