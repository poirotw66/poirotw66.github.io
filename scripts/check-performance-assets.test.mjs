import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateBudget } from './check-performance-assets.mjs';

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
