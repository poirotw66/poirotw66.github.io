import test from 'node:test';
import assert from 'node:assert/strict';
import { validPaperId } from './paper-id.mjs';

test('accepts historical and future numeric article IDs', () => {
  for (const id of ['03-valid', '99-test', '104-mlops-bench-production-ml-agent-evaluation', '1000-future-paper']) {
    assert.equal(validPaperId(id), true, id);
  }
});
test('rejects malformed and path-like IDs', () => {
  for (const id of ['3-short', '104-', 'abc-paper', '../104-paper', '104-paper/name', '104-中文', '104-white space', '', null]) {
    assert.equal(validPaperId(id), false, String(id));
  }
});
