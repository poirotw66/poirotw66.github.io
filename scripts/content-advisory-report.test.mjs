import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReport, collectAdvisories, mergeFindings, normalizeMessage, parseAdvisories, validateBaseline } from './content-advisory-report.mjs';

const root = '/tmp/content-source';
const finding = (message) => mergeFindings([{ validator: 'reading-quality', messages: [message] }], root)[0];
const baseline = (entries = []) => ({ schemaVersion: 1, sourceCommit: 'test-commit', entries });

test('only advisory sections are parsed, preserving strict diagnostic separation', () => {
  assert.deepEqual(parseAdvisories('Reading quality warnings:\n- strict warning\nReading quality advisories:\n- review claim\n- review pair\nReading quality validation failed:\n- blocking error'), ['review claim', 'review pair']);
});

test('multiline excerpts preserve continuations and all subsequent advisories', () => {
  const output = 'Reading quality advisories:\n- Claim in /tmp/content-source/src/content/paperReading/10-demo.md: first line\n  continuation with 75% and Figure 4\n\nA second paragraph in the same excerpt\n- Another finding\nReading quality validation passed (0 warnings, 2 advisories).';
  const parsed = parseAdvisories(output);
  assert.equal(parsed.length, 2);
  assert.match(parsed[0], /first line\n  continuation with 75% and Figure 4\nA second paragraph/);
  assert.equal(parsed[1], 'Another finding');
  assert.equal(mergeFindings([{ validator: 'reading-quality', messages: parsed }], root)[0].message.includes('\n'), false);
});

test('structured console records preserve embedded Markdown list items as one advisory', () => {
  const parsed = parseAdvisories([
    'Paper pair audit advisories:',
    '- Claim excerpt:\n- an embedded bullet\n- another embedded bullet',
    '- A separate diagnostic',
    'Paper pair audit passed (1 pair, 0 warnings, 2 advisories).',
  ]);
  assert.equal(parsed.length, 2);
  assert.match(parsed[0], /embedded bullet/);
  assert.equal(parsed[1], 'A separate diagnostic');
});

test('fingerprints are portable and duplicate validator findings merge without merging languages', () => {
  const messages = [
    { validator: 'reading-quality', messages: [`Unconditioned claim in ${root}/src/content/paperReading/en/10-demo.md: result`, '10-demo.md: bilingual quantitative claims differ'] },
    { validator: 'paper-pair', messages: [`Unconditioned claim in ${root}/src/content/paperReading/en/10-demo.md: result`, '10-demo: bilingual quantitative claims differ', `Unconditioned claim in ${root}/src/content/paperReading/10-demo.md: result`] },
  ];
  const findings = mergeFindings(messages, root);
  assert.equal(findings.length, 3);
  assert.equal(findings.find((entry) => entry.message.startsWith('10-demo:')).validators.length, 2);
  const moved = mergeFindings(messages.map((entry) => ({ ...entry, messages: entry.messages.map((message) => message.replaceAll(root, '/another/checkout')) })), '/another/checkout');
  assert.deepEqual(moved, findings);
  assert.equal(normalizeMessage('10-demo.md: pair issue', root), '10-demo: pair issue');
});

test('delta distinguishes new, existing, resolved, reviewed exceptions and regressions', () => {
  const existing = finding('Existing issue');
  const resolved = finding('Fixed issue');
  const exception = finding('Reviewed issue');
  const regression = finding('Returned issue');
  const current = [existing, exception, regression, finding('New issue')];
  const report = buildReport(current, baseline([
    { ...existing, status: 'pending' },
    { ...resolved, status: 'pending' },
    { ...exception, status: 'exception', rationale: 'Human review confirmed the intended bilingual term.', reviewedAt: '2026-10-30' },
    { ...regression, status: 'resolved' },
  ]));
  assert.deepEqual(report.counts, { new: 2, existing: 1, resolved: 1, exception: 1, unknown: 0 });
  assert.equal(report.entries.find((entry) => entry.id === regression.id).regression, true);
  assert.equal(report.entries.find((entry) => entry.id === exception.id).rationale, 'Human review confirmed the intended bilingual term.');
});

test('changed claim details produce a new finding rather than an inherited exception', () => {
  const previous = finding('10-demo: accuracy differs for 75%');
  const report = buildReport([finding('10-demo: accuracy differs for 90%')], baseline([{ ...previous, status: 'exception', rationale: 'Reviewed the old claim.', reviewedAt: '2026-10-30' }]));
  assert.deepEqual(report.counts, { new: 1, existing: 0, resolved: 1, exception: 0, unknown: 0 });
});

test('incomplete collection never labels missing baseline findings resolved', () => {
  const missing = finding('Missing from failed validator output');
  const present = finding('Still observed');
  const report = buildReport([present], baseline([{ ...missing, status: 'pending' }, { ...present, status: 'pending' }]), { collectionComplete: false });
  assert.equal(report.counts.resolved, 0);
  assert.equal(report.counts.unknown, 1);
  assert.equal(report.entries.find((entry) => entry.id === missing.id).state, 'unknown');
  assert.equal(report.entries.find((entry) => entry.id === present.id).state, 'existing');
});

test('invalid baseline entries cannot silently suppress diagnostics', () => {
  const entry = finding('Review issue');
  assert.throws(() => validateBaseline(baseline([{ ...entry, status: 'exception' }])), /rationale/);
  assert.throws(() => validateBaseline(baseline([{ ...entry, status: 'approved' }])), /status/);
  assert.throws(() => validateBaseline(baseline([{ ...entry, message: 'Changed message', status: 'pending' }])), /fingerprint/);
  assert.throws(() => validateBaseline(baseline([{ ...entry, status: 'pending' }, { ...entry, status: 'pending' }])), /Duplicate/);
});

test('collector retains failed validator status even with no advisory lines', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'advisory-collector-test-'));
  try {
    for (const file of ['scripts/validate-reading-quality.mjs', 'skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs']) {
      const destination = path.join(directory, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, 'console.error("Validator failed: fixture error"); process.exitCode = 1;\n');
    }
    const result = collectAdvisories(directory);
    assert.deepEqual(result.findings, []);
    assert.ok(result.validators.every((validator) => !validator.passed && validator.exitCode === 1 && /fixture error/.test(validator.diagnostics)));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('collector preserves large multiline diagnostics and verifies declared counts', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'advisory-collector-large-'));
  try {
    const diagnostic = `Claim excerpt ${'a'.repeat(100000)}\n- embedded Markdown bullet`;
    const files = ['scripts/validate-reading-quality.mjs', 'skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs'];
    for (const file of files) {
      const destination = path.join(directory, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, `console.warn('Reading quality advisories:'); console.warn(${JSON.stringify(`- ${diagnostic}`)}); console.log('Reading quality validation passed (0 warnings, 1 advisory).');\n`);
    }
    const result = collectAdvisories(directory);
    assert.equal(result.findings.length, 1);
    assert.match(result.findings[0].message, /embedded Markdown bullet$/);
    assert.ok(result.validators.every((validator) => validator.passed && validator.advisoryCount === 1));
    fs.writeFileSync(path.join(directory, files[0]), "console.log('Reading quality validation passed (0 warnings, 2 advisories).');\n");
    assert.throws(() => collectAdvisories(directory), /refusing an incomplete report/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
