import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_EVIDENCES,
  getProjectEvidence,
  getEvidencesByProject,
  getTrustMetrics,
  formatSourceStatusBadge,
} from './projectEvidence.ts';

test('project evidence items follow structured contract with bilingual parity', () => {
  assert.ok(PROJECT_EVIDENCES.length >= 4);
  for (const item of PROJECT_EVIDENCES) {
    assert.ok(item.id.length > 0, 'id must not be empty');
    assert.ok(['agentic-rag', 'ocr-automation', 'agentic-ai-platform'].includes(item.projectSlug));
    assert.ok(['evaluation', 'capability', 'operational'].includes(item.kind));
    assert.ok(item.value.length > 0, 'value must not be empty');
    assert.ok(['public-artifact', 'author-reported', 'pending-verification'].includes(item.sourceStatus));
    assert.ok(item.detailAnchor.startsWith('#'), 'detailAnchor must start with #');

    for (const lang of ['zh', 'en'] as const) {
      assert.ok(item.label[lang].trim().length > 0, `label.${lang}`);
      assert.ok(item.scope[lang].trim().length > 0, `scope.${lang}`);
      assert.ok(item.method[lang].trim().length > 0, `method.${lang}`);
      assert.ok(item.limitations[lang].trim().length > 0, `limitations.${lang}`);
    }
  }
});

test('RAG quality and latency are kept as separate evidence entries', () => {
  const accuracy = getProjectEvidence('rag-v22-weighted-accuracy');
  const latency = getProjectEvidence('rag-rule-first-latency');

  assert.ok(accuracy);
  assert.ok(latency);
  assert.notEqual(accuracy.version, latency.version);
  assert.notEqual(accuracy.measuredAt, latency.measuredAt);
  assert.equal(accuracy.value, '98.0%');
  assert.equal(latency.value, '2.606s');
  assert.equal(accuracy.sourceStatus, 'author-reported');
});

test('Trust metrics derive directly from verified evidence items without pending-verification', () => {
  for (const lang of ['zh', 'en'] as const) {
    const metrics = getTrustMetrics(lang);
    assert.equal(metrics.length, 3);
    assert.equal(metrics[0].value, '98.0%');
    assert.equal(metrics[1].value, '19');
    assert.equal(metrics[2].value, '5+');

    for (const m of metrics) {
      const ev = getProjectEvidence(m.evidenceId);
      assert.ok(ev, `Evidence item ${m.evidenceId} must exist`);
      assert.notEqual(ev?.sourceStatus, 'pending-verification');
      assert.equal(m.anchor, ev?.detailAnchor);
    }
  }
});

test('formatSourceStatusBadge returns localized strings', () => {
  assert.equal(formatSourceStatusBadge('author-reported', 'zh'), '作者評測報告');
  assert.equal(formatSourceStatusBadge('author-reported', 'en'), 'Author Reported');
  assert.equal(formatSourceStatusBadge('public-artifact', 'zh'), '公開程式庫／附件');
  assert.equal(formatSourceStatusBadge('public-artifact', 'en'), 'Public Artifact');
});
