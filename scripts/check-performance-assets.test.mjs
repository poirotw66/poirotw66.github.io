import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createBudgets, evaluateBudget } from './check-performance-assets.mjs';

const KB = 1024;

test('budget passes at or below the reserved-headroom target', () => {
  const below = evaluateBudget({ bytes: 70 * KB, max: 86 * KB, targetHeadroom: 0.1 });
  const boundary = evaluateBudget({ bytes: 77.4 * KB, max: 86 * KB, targetHeadroom: 0.1 });

  assert.equal(below.status, 'PASS');
  assert.equal(boundary.status, 'PASS');
  assert.equal(boundary.target, 77.4 * KB);
});

test('budget warns after target but before the real hard limit', () => {
  const result = evaluateBudget({ bytes: 80 * KB, max: 86 * KB, targetHeadroom: 0.1 });

  assert.equal(result.status, 'WARN');
  assert.equal(result.hardMax, 86 * KB);
});

test('budget fails only after the hard limit is exceeded', () => {
  const atLimit = evaluateBudget({ bytes: 86 * KB, max: 86 * KB, targetHeadroom: 0.1 });
  const overLimit = evaluateBudget({ bytes: 86 * KB + 1, max: 86 * KB, targetHeadroom: 0.1 });

  assert.equal(atLimit.status, 'WARN');
  assert.equal(overLimit.status, 'FAIL');
});

test('budgets without a headroom target retain simple hard-limit behavior', () => {
  assert.equal(evaluateBudget({ bytes: 48 * KB, max: 48 * KB }).status, 'PASS');
  assert.equal(evaluateBudget({ bytes: 48 * KB + 1, max: 48 * KB }).status, 'FAIL');
});

test('reader budgets do not require legacy payloads and retain their hard limits', (t) => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'performance-assets-'));
  t.after(() => fs.rmSync(dist, { recursive: true, force: true }));
  const write = (file, bytes = 2) => {
    const target = path.join(dist, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, ' '.repeat(bytes));
  };
  for (const name of ['fonts', 'base', 'layout', 'home', 'hub', 'preview', 'blog-hub', 'article', 'article-code', 'article-mermaid', 'article-math']) {
    write(`css/${name}.css`);
  }
  write('js/blog-index.js');
  write('brand/bloom-mark-64.webp');
  for (const prefix of ['', 'en/']) {
    for (const file of ['index.html', 'blog/index.html', 'paper-reading/index.html', 'blog/index.json', 'blog/data/1.json', 'search/data.json', 'paper-reading/data/1.json', 'paper-reading/data/essence/paper.json']) {
      write(`${prefix}${file}`);
    }
  }

  const budgets = createBudgets(dist);
  assert.ok(budgets.every((budget) => !budget.label.startsWith('Legacy ')));
  assert.ok(budgets.every((budget) => evaluateBudget(budget).status === 'PASS'));
  for (const [language, max] of [['Chinese', 132 * KB], ['English', 145 * KB]]) {
    const search = budgets.find((budget) => budget.label === `${language} compact search JSON`);
    const essence = budgets.find((budget) => budget.label === `Largest ${language} per-note essence`);
    assert.equal(search.max, max);
    assert.equal(search.targetHeadroom, 0.1);
    assert.equal(essence.max, 8 * KB);
    assert.equal(essence.targetHeadroom, 0.1);
  }

  write('search/data.json', 132 * KB + 1);
  write('en/search/data.json', 145 * KB + 1);
  write('paper-reading/data/essence/paper.json', 8 * KB + 1);
  write('en/paper-reading/data/essence/paper.json', 8 * KB + 1);
  const failures = createBudgets(dist).filter((budget) => evaluateBudget(budget).status === 'FAIL');
  assert.deepEqual(failures.map((budget) => budget.label), [
    'Largest Chinese per-note essence',
    'Largest English per-note essence',
    'Chinese compact search JSON',
    'English compact search JSON',
  ]);
});
