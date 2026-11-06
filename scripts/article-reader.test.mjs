import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/js/article-reader.js', import.meta.url), 'utf8');
const codeText = 'const title = "Bloss0m";\n';
const english = { copyLabel: 'Copy code', copiedLabel: 'Copied', copyFailedLabel: 'Copy failed' };
const chinese = { copyLabel: '複製程式碼', copiedLabel: '已複製', copyFailedLabel: '複製失敗' };

function reader({ clipboard, execCommand = () => true, labels = english } = {}) {
  const elements = [];
  const textareas = new Set();
  const timers = [];
  let selectedText;
  function element(tag) {
    const attributes = new Map();
    const classes = new Set();
    const handlers = new Map();
    const node = {
      tag, dataset: {}, style: {}, textContent: '',
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
        toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
      },
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: (name) => attributes.get(name),
      addEventListener: (name, handler) => handlers.set(name, handler),
      click: () => handlers.get('click')(),
      append() {},
      select() { selectedText = node.value; },
      remove() { textareas.delete(node); },
    };
    elements.push(node);
    return node;
  }
  const pre = {
    dataset: {}, className: 'language-js', closest: () => null,
    querySelector: () => ({ dataset: {}, textContent: codeText }),
    parentNode: { insertBefore() {} },
  };
  const root = {
    dataset: labels,
    querySelectorAll: () => [pre],
    querySelector: () => null,
  };
  vm.runInNewContext(source, {
    navigator: { clipboard },
    document: {
      readyState: 'complete',
      querySelectorAll: () => [root],
      createElement: element,
      body: { appendChild: (node) => textareas.add(node) },
      execCommand: (command) => execCommand(command, selectedText),
    },
    window: { isSecureContext: true, setTimeout: (callback, delay) => timers.push({ callback, delay }) },
  });
  const button = elements.find((node) => node.tag === 'button');
  return {
    button, textareas,
    async click() {
      button.click();
      await new Promise((resolve) => setImmediate(resolve));
    },
    reset() {
      for (const timer of timers.splice(0)) {
        assert.equal(timer.delay, 1800);
        timer.callback();
      }
    },
  };
}

function assertFeedback(control, label, copied) {
  assert.equal(control.button.textContent, label);
  assert.equal(control.button.getAttribute('aria-label'), label);
  assert.equal(control.button.classList.contains('is-copied'), copied);
}

test('successful Clipboard API copy reports success and resets its visible and accessible labels', async () => {
  const writes = [];
  const control = reader({ clipboard: { writeText: async (text) => writes.push(text) } });
  await control.click();
  assert.deepEqual(writes, [codeText]);
  assertFeedback(control, english.copiedLabel, true);
  control.reset();
  assertFeedback(control, english.copyLabel, false);
});

test('Clipboard API denial reports localized failure without attempting the legacy path', async () => {
  let fallbackCalls = 0;
  const control = reader({
    labels: chinese,
    clipboard: { writeText: async () => { throw new Error('Clipboard permission denied'); } },
    execCommand: () => { fallbackCalls += 1; return true; },
  });
  await control.click();
  assertFeedback(control, chinese.copyFailedLabel, false);
  assert.equal(fallbackCalls, 0);
  control.reset();
  assertFeedback(control, chinese.copyLabel, false);
});

for (const result of [false, 'throw']) {
  test(`legacy copy ${result === false ? 'returning false' : 'throwing'} reports failure and removes its textarea`, async () => {
    const control = reader({ execCommand: () => {
      if (result === 'throw') throw new Error('Legacy copy unavailable');
      return result;
    } });
    await control.click();
    assertFeedback(control, english.copyFailedLabel, false);
    assert.equal(control.textareas.size, 0);
    control.reset();
    assertFeedback(control, english.copyLabel, false);
  });
}

test('successful legacy copy sends the exact code and removes its textarea', async () => {
  const commands = [];
  const control = reader({ execCommand: (command, text) => { commands.push({ command, text }); return true; } });
  await control.click();
  assert.deepEqual(commands, [{ command: 'copy', text: codeText }]);
  assertFeedback(control, english.copiedLabel, true);
  assert.equal(control.textareas.size, 0);
});

test('copy can succeed when retried after a rejected Clipboard API write', async () => {
  let calls = 0;
  const control = reader({ clipboard: { writeText: async () => {
    calls += 1;
    if (calls === 1) throw new Error('Clipboard permission denied');
  } } });
  await control.click();
  assertFeedback(control, english.copyFailedLabel, false);
  control.reset();
  await control.click();
  assertFeedback(control, english.copiedLabel, true);
  assert.equal(calls, 2);
});
