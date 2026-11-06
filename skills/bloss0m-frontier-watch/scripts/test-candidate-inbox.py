#!/usr/bin/env python3
"""Synthetic invariant tests; no real research, model calls, or website writes."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('inbox', Path(__file__).with_name('candidate-inbox.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def candidate(url='https://example.com/creative', topic='creative-representation'):
    return {'title': 'Synthetic creative mechanism', 'canonicalUrl': url, 'lane': 'cross-domain', 'topicKey': topic,
            'kind': 'paper', 'stage': 'lead', 'discoveryLabel': 'newly-discovered',
            'card': dict(zip(m.CARD_FIELDS, ['A new representation?', 'How does it work?', 'Explore design', 'Read the method; no experiment needed', 'Explain the mechanism'])),
            'sources': [{'url': url, 'role': 'primary', 'inspected': False, 'publishedAt': '2026-09-01'}],
            'claims': [{'text': 'Author claims 99% accuracy', 'kind': 'quantitative', 'verification': 'unchecked', 'sourceUrls': [url]}],
            'unknowns': ['Unchecked numerical result'],
            'sourceSnapshot': {'sha256': hashlib.sha256(b'synthetic source revision one').hexdigest(), 'verified': False}}


def run(key='run-1', candidates=None, when='2026-10-29T00:00:00Z'):
    return {'schemaVersion': 1, 'runId': key, 'createdAt': when, 'candidates': candidates if candidates is not None else [candidate()]}


def verify(c):
    c['stage'] = 'formal'; c['sources'][0]['inspected'] = True; c['sourceSnapshot']['verified'] = True
    c['coverageChecked'] = True; c['alreadyCovered'] = False; c['rubricVersion'] = 2
    c['score'] = {k: 5 for k in m.PAPER_KEYS};c['score']['evidenceQuality'] = 4;c['score']['reproducibility'] = 4;c['score']['total'] = 28
    c['scoreRationale'] = 'Synthetic rationale, no existing series required'
    return c


class InboxTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='frontier-inbox-test-')
        self.root = Path(self.tmp.name).resolve()
        self.store = m.Store(self.root / 'inbox', test=True)
        self.site = self.root / 'website';self.site.mkdir()
        self.dirty = self.site / 'human-draft.md';self.dirty.write_text('USER UNCOMMITTED DRAFT\n')
        self.before = hashlib.sha256(self.dirty.read_bytes()).hexdigest()

    def tearDown(self):
        self.assertEqual(self.before, hashlib.sha256(self.dirty.read_bytes()).hexdigest())
        self.tmp.cleanup()

    def test_cross_domain_unchecked_lead_is_retained(self):
        p = self.store.save(run());d = json.loads(p.read_text())
        self.assertEqual(len(d['presentedIds']), 1)
        self.assertEqual(d['candidates'][0]['claims'][0]['verification'], 'unchecked')
        self.assertEqual(d['candidates'][0]['stage'], 'lead')

    def test_unchecked_numbers_cannot_be_promoted(self):
        with self.assertRaisesRegex(ValueError, 'unchecked'):
            self.store.save(run(candidates=[verify(candidate())]))
        self.assertEqual(self.store.records('runs'), [])

    def test_verified_cross_domain_formal_needs_no_series_bonus(self):
        c = verify(candidate()); c['claims'][0]['verification'] = 'primary-inspected'
        p = self.store.save(run(candidates=[c]))
        self.assertEqual(json.loads(p.read_text())['candidates'][0]['score']['total'], 28)
        c['score']['seriesValue'] = 5
        with self.assertRaises(ValueError):m.validate_run(run(candidates=[c]))

    def test_canonical_identity_and_no_repeat_without_verified_change(self):
        self.store.save(run(candidates=[candidate('https://arxiv.org/abs/2610.12345v1?utm_source=x')]))
        c = candidate('https://arxiv.org/html/2610.12345v2'); c['sourceSnapshot']['sha256'] = 'a' * 64
        r = self.store.prepare(run('run-2', [c], '2026-10-30T00:00:00Z'))
        self.assertEqual(r['presentedIds'], [])
        self.assertIn('same material', r['suppressed'][0]['reason'])
        c['sources'][0]['inspected'] = True; c['sourceSnapshot']['verified'] = True
        c['materialUpdate'] = {'summary': 'Actual synthetic method change', 'sourceUrls': [c['canonicalUrl']]}
        self.assertEqual(len(self.store.prepare(run('run-3', [c], '2026-10-30T00:00:00Z'))['presentedIds']), 1)

    def test_duplicate_run_and_feedback_never_overwrite(self):
        p = self.store.save(run());b = p.read_bytes()
        with self.assertRaises(FileExistsError):self.store.save(run())
        self.assertEqual(b, p.read_bytes())
        event = {'schemaVersion': 1, 'eventId': 'feedback-1', 'createdAt': '2026-10-29T00:01:00Z',
                 'stableId': 'url:https://example.com/creative', 'decision': 'tired', 'origin': 'explicit-user',
                 'quote': 'Synthetic user fixture: tired of this topic', 'conversationRef': 'synthetic:test'}
        f = self.store.feedback(event);before = f.read_bytes()
        event['decision'] = 'want-write'
        with self.assertRaises(FileExistsError):self.store.feedback(event)
        self.assertEqual(before, f.read_bytes())
        r = self.store.prepare(run('run-2', when='2026-11-10T00:00:00Z'))
        self.assertEqual(r['presentedIds'], [])
        self.assertEqual(r['feedbackRefs'], ['feedback-1'])
        self.assertFalse((self.store.root / 'ledger.json').exists())

    def test_three_card_limit_and_mechanism_fatigue(self):
        cs = [candidate(f'https://example.com/{n}', 'same-mechanism') for n in range(4)]
        p = self.store.save(run(candidates=cs));self.assertEqual(len(json.loads(p.read_text())['presentedIds']), 3)
        r = self.store.prepare(run('next', [candidate('https://example.com/new', 'same-mechanism'), candidate('https://example.com/other', 'different-mechanism')]))
        self.assertEqual(r['presentedIds'], ['url:https://example.com/other'])
        self.assertIn('previous three', r['suppressed'][0]['reason'])

    def test_unpresented_observation_does_not_restart_cooldown(self):
        self.store.save(run())
        self.store.save(run('suppressed', when='2026-11-04T00:00:00Z'))
        r = self.store.prepare(run('after-seven', when='2026-11-06T00:00:00Z'))
        self.assertEqual(len(r['presentedIds']), 1)

    def test_duplicate_identity_symlink_and_fabricated_feedback_rejected(self):
        with self.assertRaisesRegex(ValueError, 'duplicate stableId'):
            m.validate_run(run(candidates=[candidate('https://example.com/a#x'), candidate('https://example.com/a?utm_source=b')]))
        with self.assertRaises(ValueError):self.store.feedback({'schemaVersion':1})
        bad = self.root / 'link';bad.symlink_to(self.site)
        with self.assertRaisesRegex(ValueError, 'symlink'):m.Store(bad, test=True)
        self.assertEqual(list(self.site.iterdir()), [self.dirty])

    def test_test_root_cannot_escape_temp_with_parent_traversal(self):
        outside = Path(tempfile.gettempdir()).resolve() / '..' / 'frontier-inbox-escape-probe'
        with self.assertRaisesRegex(ValueError, 'parent traversal|OS temp'):
            m.Store(outside, test=True)

    def test_paper_identity_requires_the_actual_source_host(self):
        for url in ['https://not-arxiv.org/abs/2610.12345',
                    'https://example.com/arxiv.org/abs/2610.12345',
                    'https://not-doi.org/10.1234/forged',
                    'https://not-openreview.net/forum?id=forged']:
            with self.subTest(url=url):
                self.assertEqual(m.identity({'canonicalUrl': url}), 'url:' + m.canonical(url))
        self.assertEqual(m.identity({'canonicalUrl': 'https://export.arxiv.org/pdf/2610.12345v2.pdf'}), 'arxiv:2610.12345')
        self.assertEqual(m.identity({'canonicalUrl': 'https://doi.org/10.1234/ABC'}), 'doi:10.1234/abc')
        self.assertEqual(m.identity({'canonicalUrl': 'https://openreview.net/forum?id=Paper123'}), 'openreview:Paper123')

    def test_timestamps_require_a_complete_utc_datetime(self):
        for value in ['2026-10-29Z', '2026-10-29T00:00:00+01:00Z']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                m.timestamp(value)
        self.assertEqual(m.timestamp('2026-10-29T00:00Z').utcoffset().total_seconds(), 0)
        self.assertEqual(m.timestamp('2026-10-29T00:00:00.100Z').utcoffset().total_seconds(), 0)

    def test_latest_feedback_uses_chronological_not_string_order(self):
        event = {'schemaVersion': 1, 'eventId': 'feedback-first', 'createdAt': '2026-10-29T00:00:00Z',
                 'stableId': 'url:https://example.com/creative', 'decision': 'tired', 'origin': 'explicit-user',
                 'quote': 'Synthetic user fixture: tired', 'conversationRef': 'synthetic:test'}
        self.store.feedback(event)
        event.update(eventId='feedback-later', createdAt='2026-10-29T00:00:00.100Z', decision='want-write',
                     quote='Synthetic user fixture: want to write')
        self.store.feedback(event)
        self.assertEqual(self.store.prepare(run(when='2026-10-29T00:00:01Z'))['presentedIds'], ['url:https://example.com/creative'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
