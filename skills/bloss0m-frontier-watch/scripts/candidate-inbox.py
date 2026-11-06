#!/usr/bin/env python3
"""Append-only Frontier Watch research inbox. No website or shared-ledger writes."""
import argparse
import copy
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

DEFAULT_ROOT = Path.home() / '.codex/automations/bloss0m-daily-frontier-watch/candidate-inbox'
LANES = {'mechanisms', 'playable-works', 'cross-domain', 'failures-work'}
CARD_FIELDS = ('surprise', 'unresolvedQuestion', 'whyExplore', 'approach', 'angle')
BLOG_KEYS = ('topicRelevance', 'durability', 'evidenceQuality', 'engineeringValue', 'readerInterest')
PAPER_KEYS = ('topicRelevance', 'novelty', 'evidenceQuality', 'reproducibility', 'engineeringValue', 'readerInterest')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def timestamp(value):
    require(isinstance(value, str) and value.endswith('Z'), 'timestamp must be UTC ISO-8601 ending Z')
    parsed = dt.datetime.fromisoformat(value[:-1] + '+00:00')
    require(parsed.utcoffset() == dt.timedelta(0), 'timestamp must include a UTC time')
    return parsed


def canonical(url):
    require(text(url), 'source URL required')
    p = urlsplit(url)
    require(p.scheme == 'https' and p.hostname and not p.username and not p.password, 'use public https URLs without credentials')
    pairs = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in {'fbclid', 'gclid'}]
    return urlunsplit(('https', p.netloc.lower(), p.path.rstrip('/') or '/', urlencode(sorted(pairs)), ''))


def identity(c):
    url = canonical(c['canonicalUrl'])
    parsed = urlsplit(url)
    sid = c.get('stableId', '')
    if sid.startswith('doi:'):
        require(re.fullmatch(r'doi:10\.\d{4,9}/\S+', sid, re.I), 'invalid DOI identity')
        return sid.lower()
    if sid.startswith('openreview:'):
        require(re.fullmatch(r'openreview:[A-Za-z0-9_-]+', sid), 'invalid OpenReview identity')
        return sid
    arxiv = (re.fullmatch(r'/(?:abs|html|pdf)/(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?', parsed.path)
             if parsed.hostname in {'arxiv.org', 'www.arxiv.org', 'export.arxiv.org'} else None)
    if arxiv:
        return 'arxiv:' + arxiv[1]
    if sid.startswith('arxiv:'):
        require(re.fullmatch(r'arxiv:\d{4}\.\d{4,5}(?:v\d+)?', sid), 'invalid arXiv identity')
        return re.sub(r'v\d+$', '', sid)
    doi = (re.fullmatch(r'/(10\.\d{4,9}/.+)', parsed.path, re.I)
           if parsed.hostname in {'doi.org', 'dx.doi.org'} else None)
    if doi:
        return 'doi:' + doi[1].lower()
    if parsed.hostname in {'openreview.net', 'www.openreview.net'}:
        forum = dict(parse_qsl(parsed.query)).get('id')
        if forum:
            return 'openreview:' + forum
    require(not sid or sid.startswith('url:'), 'unsupported stable identity')
    return 'url:' + url


def validate_run(value):
    r = copy.deepcopy(value)
    require(r.get('schemaVersion') == 1, 'schemaVersion must be 1')
    require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,99}', r.get('runId', '')), 'safe unique runId required')
    now = timestamp(r.get('createdAt'))
    require(isinstance(r.get('candidates'), list), 'candidates must be a list')
    require(not {'presentedIds', 'suppressed', 'feedbackRefs'} & r.keys(), 'presentation fields are computed, not caller-controlled')
    seen = set()
    for c in r['candidates']:
        require(isinstance(c, dict), 'candidate must be an object')
        c['canonicalUrl'] = canonical(c.get('canonicalUrl'))
        c['stableId'] = identity(c)
        require(c['stableId'] not in seen, 'duplicate stableId in batch')
        seen.add(c['stableId'])
        require(text(c.get('title')), 'title required')
        require(c.get('lane') in LANES, 'unknown discovery lane')
        require(re.fullmatch(r'[a-z0-9][a-z0-9-]{0,99}', c.get('topicKey', '')), 'stable mechanism/topic key required')
        require(c.get('kind') in {'blog', 'paper'}, 'kind must be blog or paper')
        require(c.get('stage') in {'lead', 'formal'}, 'stage must be lead or formal')
        for key in CARD_FIELDS:
            require(text(c.get('card', {}).get(key)), 'missing card.' + key)
        require(isinstance(c.get('unknowns'), list) and all(text(x) for x in c['unknowns']), 'unknowns must be a string list')
        require(isinstance(c.get('claims'), list), 'claims list required')
        require(isinstance(c.get('sources'), list) and c['sources'], 'at least one real source required')
        inspected = set()
        primary = set()
        for source in c['sources']:
            source['url'] = canonical(source.get('url'))
            require(source.get('role') in {'primary', 'supporting', 'discovery'}, 'invalid source role')
            require(type(source.get('inspected')) is bool, 'source inspected must be boolean')
            date = source.get('publishedAt')
            require('publishedAt' in source, 'publishedAt required; null means unknown')
            if date is not None:
                require(isinstance(date, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', date), 'source date must be YYYY-MM-DD or null')
                require(dt.date.fromisoformat(date) <= now.date(), 'source publication date is in the future')
            if source['inspected']:
                inspected.add(source['url'])
                if source['role'] == 'primary':
                    primary.add(source['url'])
        for claim in c['claims']:
            require(text(claim.get('text')), 'claim text required')
            require(claim.get('verification') in {'unchecked', 'primary-inspected', 'independent-verified'}, 'invalid claim verification')
            require(claim.get('kind') in {'qualitative', 'quantitative'}, 'claim kind required')
            urls = claim.get('sourceUrls')
            require(isinstance(urls, list), 'claim sourceUrls must be a list')
            claim['sourceUrls'] = [canonical(x) for x in urls]
            if claim['verification'] != 'unchecked':
                require(bool(urls) and set(claim['sourceUrls']) <= inspected, 'confirmed claim needs inspected sources')
                if claim['verification'] == 'primary-inspected':
                    require(bool(set(claim['sourceUrls']) & primary), 'primary-inspected claim needs an inspected primary source')
                if claim['verification'] == 'independent-verified':
                    require(len(set(claim['sourceUrls'])) >= 2, 'independent verification needs at least two inspected sources; provenance must establish independence')
        snapshot = c.get('sourceSnapshot')
        require(isinstance(snapshot, dict) and re.fullmatch(r'[a-f0-9]{64}', snapshot.get('sha256', '')), 'sourceSnapshot.sha256 required')
        require(type(snapshot.get('verified')) is bool, 'snapshot verified must be boolean')
        require(not snapshot['verified'] or bool(primary), 'verified snapshot requires inspected primary source')
        update = c.get('materialUpdate')
        if update is not None:
            require(text(update.get('summary')) and isinstance(update.get('sourceUrls'), list) and update['sourceUrls'], 'material update needs summary and evidence')
            update['sourceUrls'] = [canonical(x) for x in update['sourceUrls']]
            require(snapshot['verified'] and set(update['sourceUrls']) <= inspected, 'material update evidence must be inspected')
        require(c.get('discoveryLabel') in {'recent-news', 'newly-discovered', 'date-unknown'}, 'honest discoveryLabel required')
        require(c['discoveryLabel'] == 'date-unknown' or any(s['publishedAt'] for s in c['sources']), 'unknown dates cannot establish recency')
        if c['stage'] == 'formal':
            require(bool(primary) and snapshot['verified'], 'formal candidate needs inspected primary source and verified snapshot')
            require(c.get('coverageChecked') is True and c.get('alreadyCovered') is False, 'formal candidate needs bilingual/archive dedup confirmation')
            require(bool(c['claims']) and all(x['verification'] != 'unchecked' for x in c['claims']), 'unchecked claims/numbers cannot support formal admission; retain as lead')
            keys = PAPER_KEYS if c['kind'] == 'paper' else BLOG_KEYS
            score = c.get('score', {})
            require(c.get('rubricVersion') == 2, 'formal candidate needs rubricVersion 2')
            require(set(score) == set(keys) | {'total'}, 'score must use current keys, without seriesValue')
            require(all(type(score[k]) is int and 0 <= score[k] <= 5 for k in keys), 'scores must be integers 0..5')
            require(score['total'] == sum(score[k] for k in keys), 'score total mismatch')
            require(score['total'] >= (28 if c['kind'] == 'paper' else 23) and score['evidenceQuality'] >= 3, 'formal score below gate')
            require(c['kind'] != 'blog' or score['readerInterest'] >= 4, 'formal Blog readerInterest must be >=4')
            require(text(c.get('scoreRationale')), 'score rationale required')
    return r


class Store:
    def __init__(self, root=DEFAULT_ROOT, test=False):
        self.root = Path(root).absolute()
        require('..' not in self.root.parts, 'refusing parent traversal storage path')
        if test:
            require(self.root.is_relative_to(Path(tempfile.gettempdir()).resolve()) or self.root.is_relative_to(Path('/tmp')), 'test storage must be in OS temp directory')
        else:
            require(self.root == DEFAULT_ROOT.absolute(), 'production storage is fixed to this automation inbox')
        for p in [self.root, *self.root.parents]:
            require(not p.is_symlink(), 'refusing symlink storage path')

    def records(self, folder):
        target = self.root / folder
        require(not target.is_symlink(), 'refusing symlink subdirectory')
        rows = []
        for p in sorted(target.glob('*.json')):
            require(not p.is_symlink(), 'refusing symlink record')
            rows.append(json.loads(p.read_text()))
        return rows

    def append(self, folder, key, data):
        target = self.root / folder
        require(not target.is_symlink(), 'refusing symlink subdirectory')
        target.mkdir(parents=True, exist_ok=True)
        destination = target / (key + '.json')
        # Atomic visibility and exclusive final creation; no replace/overwrite.
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=target, prefix='.pending-', delete=False) as f:
            temporary = Path(f.name)
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
            f.flush()
            os.fsync(f.fileno())
        try:
            os.link(temporary, destination)
        finally:
            temporary.unlink()
        return destination

    def prepare(self, value):
        r = validate_run(value)
        when = timestamp(r['createdAt'])
        history = sorted(self.records('runs'), key=lambda x: timestamp(x['createdAt']))
        feedback = sorted(self.records('feedback'), key=lambda x: timestamp(x['createdAt']))
        decisions = {f['stableId']: f['decision'] for f in feedback}
        recent = [h for h in history if dt.timedelta(0) <= when - timestamp(h['createdAt']) < dt.timedelta(days=7)]
        previous = [(c['stableId'], c['topicKey']) for h in history if timestamp(h['createdAt']) <= when
                    for sid in h.get('presentedIds', []) for c in h['candidates'] if c['stableId'] == sid][-3:]
        fatigue = previous[0][1] if len(previous) == 3 and len({x[1] for x in previous}) == 1 else None
        presented, suppressed = [], []
        for c in r['candidates']:
            reason = None
            old = [x for h in recent for x in h['candidates'] if x['stableId'] == c['stableId'] and x['stableId'] in h.get('presentedIds', [])]
            prior = old[-1] if old else None
            if decisions.get(c['stableId']) == 'tired':
                reason = 'explicit human tired feedback'
            elif c.get('alreadyCovered') is True:
                reason = 'already covered or drafted'
            elif prior and not (c.get('materialUpdate') and c['sourceSnapshot']['sha256'] != prior['sourceSnapshot']['sha256']):
                reason = 'same material without verified substantive update within seven days'
            elif c['topicKey'] == fatigue:
                reason = 'previous three cards share this mechanism/question; prefer variety'
            elif len(presented) >= 3:
                reason = 'daily presentation limited to three cards'
            if reason:
                suppressed.append({'stableId': c['stableId'], 'reason': reason})
            else:
                presented.append(c['stableId'])
        r.update(presentedIds=presented, suppressed=suppressed, feedbackRefs=[f['eventId'] for f in feedback])
        return r

    def save(self, value):
        r = self.prepare(value)
        return self.append('runs', r['runId'], r)

    def feedback(self, event):
        require(event.get('schemaVersion') == 1, 'feedback schemaVersion must be 1')
        require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,99}', event.get('eventId', '')), 'safe eventId required')
        timestamp(event.get('createdAt'))
        require(text(event.get('stableId')), 'feedback needs stableId')
        require(event.get('decision') in {'want-write', 'want-play', 'collect', 'tired', 'import'}, 'unknown human decision')
        require(event.get('origin') == 'explicit-user' and text(event.get('quote')) and text(event.get('conversationRef')), 'feedback needs explicit user quote and provenance; daily research must not call feedback')
        require(event['decision'] != 'import' or event.get('target') in {'blog-radar', 'paper-radar'}, 'import approval needs named target')
        return self.append('feedback', event['eventId'], event)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['validate', 'preview', 'save', 'feedback'])
    p.add_argument('input', type=Path)
    p.add_argument('--test-root', type=Path, help='synthetic dry runs only; must be inside OS temp')
    args = p.parse_args()
    data = json.loads(args.input.read_text())
    store = Store(args.test_root or DEFAULT_ROOT, test=args.test_root is not None)
    if args.action == 'validate':
        result = validate_run(data)
        print(json.dumps({'valid': True, 'candidates': len(result['candidates'])}))
    elif args.action == 'preview':
        print(json.dumps(store.prepare(data), ensure_ascii=False, indent=2))
    else:
        print(store.feedback(data) if args.action == 'feedback' else store.save(data))


if __name__ == '__main__':
    main()
