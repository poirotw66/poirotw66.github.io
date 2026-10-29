import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mobile = require('../lighthouserc.mobile.cjs');
const pr = require('../lighthouserc.pr.cjs');
const { routeBudget } = require('../lighthouserc.budgets.cjs');

function assertionsFor(config, url) {
  const matches = config.ci.assert.assertMatrix.filter(({ matchingUrlPattern }) => new RegExp(matchingUrlPattern).test(url));
  assert.equal(matches.length, 1, `${url} must have exactly one route budget`);
  return matches[0].assertions;
}

for (const [name, config] of [['mobile', mobile], ['PR', pr]]) {
  test(`${name} audit routes have exactly one budget and retain quality assertions`, () => {
    for (const url of config.ci.collect.url) {
      const assertions = assertionsFor(config, url);
      assert.equal(assertions['categories:accessibility'][1].minScore, 1);
      assert.equal(assertions['largest-contentful-paint'][1].maxNumericValue, 3000);
    }
  });
}

test('both PR blog articles use the article transfer budget, independently of archive budgets', () => {
  for (const slug of ['64-ai-agent-guide', '100-gemini-3-8-flash-coding-agent-workflow']) {
    assert.equal(assertionsFor(pr, `http://localhost/blog/${slug}/`)['total-byte-weight'][1].maxNumericValue, 400 * 1024);
  }
  for (const route of ['/blog/', '/en/blog/', '/paper-reading/']) {
    assert.equal(assertionsFor(pr, `http://localhost${route}`)['total-byte-weight'][1].maxNumericValue, 850 * 1024);
  }
});

test('search and error pages stay exempt from indexing assertions', () => {
  for (const route of ['/search/', '/404.html']) {
    assert.equal(assertionsFor(mobile, `http://localhost${route}`)['categories:seo'], undefined);
  }
});

test('unknown named budgets fail instead of silently disabling assertions', () => {
  assert.throws(() => routeBudget('.*', 'missing'), /Unknown mobile budget/);
});
