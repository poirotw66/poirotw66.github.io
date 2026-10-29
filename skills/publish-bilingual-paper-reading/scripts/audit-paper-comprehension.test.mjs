import test from 'node:test';
import assert from 'node:assert/strict';

import { auditComprehensionBody } from './audit-paper-comprehension.mjs';
import { paperTypeFromFrontmatter } from './teaching-signals.mjs';

const completeBody = `
## The paper in 90 seconds

The traditional method is insufficient because it ranks documents independently.

## Core intuition

Select a complementary evidence set before applying the mechanism.

## Walk one example through the method

1. Input a query.
2. Build criteria.
3. Select evidence.

## Technical mechanism

The pipeline maps the query to a selected set.

## How to read the evidence

Table 2 shows the gain but does not establish production reliability.

## Limitations and engineering decision: when not to use it

The evidence boundary excludes private corpora. Engineers should not adopt it without checking their own corpus.

## Three things to remember

1. Select sets.
2. Verify evidence.
3. Keep the boundary.
`;

test('passes a comprehension-complete teaching structure', () => {
  const result = auditComprehensionBody(completeBody);
  assert.equal(result.missing.length, 0, JSON.stringify(result.missing));
  assert.equal(result.score, 100);
});

test('reports evidence-complete prose that lacks teaching layers', () => {
  const result = auditComprehensionBody(`
## Method

Figure 1 shows the result, but it does not establish generalization.

## Limitations and engineering implications

The repository is incomplete.
  `);
  const missing = result.missing.map((item) => item.key);
  assert.ok(missing.includes('essenceMap'));
  assert.ok(missing.includes('coreIntuition'));
  assert.ok(missing.includes('workedExample'));
  assert.ok(missing.includes('exitRecap'));
});

for (const [name, wrap] of [
  ['HTML comment', (body) => `<!--${body}-->`],
  ['backtick code fence', (body) => '```markdown\n' + body + '\n```'],
  ['tilde code fence', (body) => '~~~markdown\n' + body + '\n~~~'],
  ['indented code', (body) => body.split('\n').map((line) => `    ${line}`).join('\n')],
]) {
  test(`ignores teaching signals inside ${name}`, () => {
    assert.equal(auditComprehensionBody(wrap(completeBody)).passed, 0);
    assert.equal(auditComprehensionBody(wrap(completeBody) + '\n' + completeBody).score, 100);
  });
}

test('does not close a longer code fence with a shorter fence or parse comments inside code', () => {
  const body = '````markdown\n<!--\n```\n' + completeBody + '\n````\n' + completeBody;
  assert.equal(auditComprehensionBody(body).score, 100);
  assert.equal(auditComprehensionBody('````markdown\n```\n' + completeBody).passed, 0);
});

test('natural question headings preserve the same teaching assessment', () => {
  const natural = completeBody.replace(/^## .+$/gm, '## Why would this help a reader?');
  assert.deepEqual(auditComprehensionBody(natural).dimensions, auditComprehensionBody(completeBody).dimensions);
});

test('headings alone never supply missing mechanism or understanding', () => {
  const headings = completeBody.split('\n').filter((line) => line.startsWith('## ')).join('\n');
  const result = auditComprehensionBody(headings);
  assert.equal(result.dimensions.mechanism, false);
  assert.ok(result.score < 100);
  assert.equal(result.semanticReviewRequired, true);
});

test('missing the substantive method fails even with a Method heading', () => {
  const body = `## Method\n\nThe traditional baseline is insufficient.\n\nTable 2 shows a result but does not establish generalization.\n\nEngineers should remain uncertain about the evidence boundary.`;
  assert.equal(auditComprehensionBody(body).dimensions.mechanism, false);
});

test('paperType parsing supports normal YAML scalar comments without silent fallback', () => {
  assert.equal(paperTypeFromFrontmatter('paperType: "theoretical" # source is a proof'), 'theoretical');
  assert.equal(paperTypeFromFrontmatter('title: "legacy"'), 'empirical');
  assert.throws(() => paperTypeFromFrontmatter('paperType: unknown'));
  assert.throws(() => paperTypeFromFrontmatter('paperType: [theoretical]'));
});
