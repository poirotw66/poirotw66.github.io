#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const paperDir = path.join(root, 'src', 'content', 'paperReading');

const SIGNALS = {
  essenceMap: {
    label: 'ninety-second map',
    pattern: /^#{2,3}\s+.*(?:90\s*秒|九十秒|paper in 90 seconds|90-second|ninety-second)/im,
  },
  priorLimitation: {
    label: 'prior-approach limitation',
    pattern: /舊方法|傳統(?:方法|作法|reranker|RAG)|過去方法|既有方法|為什麼不夠|瓶頸|prior (?:approach|method)|previous (?:approach|method)|why .* (?:fails?|is insufficient)|traditional (?:approach|method|reranker|RAG)/i,
  },
  coreIntuition: {
    label: 'core intuition before machinery',
    pattern: /^#{2,3}\s+.*(?:核心直覺|心智模型|白話理解|core intuition|mental model)/im,
  },
  workedExample: {
    label: 'end-to-end worked example',
    pattern: /^#{2,3}\s+.*(?:走完整個方法|走一遍|逐步例子|具體例子|worked example|walkthrough|walk .* through|step-by-step example)/im,
  },
  mechanism: {
    label: 'mechanism or method flow',
    pattern: /^#{2,3}\s+.*(?:方法|架構|機制|流程|訓練|method|architecture|mechanism|pipeline|training)/im,
  },
  evidenceInterpretation: {
    label: 'interpreted experimental evidence',
    pattern: /(?:Figure|Table|Section|Appendix|圖|表|第\s*\d+(?:\.\d+)*\s*節|附錄)\s*[A-Z0-9.§-]*[\s\S]{0,500}(?:支持|證明|顯示|意味|不能|不代表|supports?|shows?|means?|does not|cannot establish)/i,
  },
  boundary: {
    label: 'claim boundary or limitations',
    pattern: /限制|證據邊界|尚未證明|沒有證明|不能推論|不該過度|limitations?|evidence boundar|not (?:yet )?(?:show|prove|establish)|does not (?:show|prove|establish)/i,
  },
  engineeringTransfer: {
    label: 'engineering consequence and when not to use',
    pattern: /不適用|什麼時候不要|工程(?:判斷|結論|決策|含義)|when not to use|engineering (?:judgment|conclusion|decision|implication)/i,
  },
  exitRecap: {
    label: 'three-point exit recap',
    pattern: /^#{2,3}\s+.*(?:三個記憶點|三件事|如果只記得|讀完後|three (?:things|takeaways|points) to remember|if you remember)/im,
  },
};

export function auditComprehensionBody(body) {
  const dimensions = Object.fromEntries(
    Object.entries(SIGNALS).map(([key, signal]) => [key, signal.pattern.test(body)]),
  );
  const missing = Object.entries(dimensions)
    .filter(([, present]) => !present)
    .map(([key]) => ({ key, label: SIGNALS[key].label }));
  const passed = Object.values(dimensions).filter(Boolean).length;
  return {
    dimensions,
    missing,
    passed,
    total: Object.keys(SIGNALS).length,
    score: Math.round((passed / Object.keys(SIGNALS).length) * 100),
  };
}

function availableIds() {
  return fs
    .readdirSync(paperDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/i, ''))
    .sort();
}

export function auditComprehensionPairs(ids, options = {}) {
  const results = [];
  const errors = [];
  for (const id of ids) {
    for (const locale of ['zh', 'en']) {
      const filePath = path.join(paperDir, ...(locale === 'en' ? ['en'] : []), `${id}.md`);
      if (!fs.existsSync(filePath)) {
        errors.push(`${id}: missing ${locale} article`);
        continue;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u, '');
      const audit = auditComprehensionBody(body);
      results.push({ id, locale, filePath: path.relative(root, filePath), ...audit });
      if (options.strict && audit.missing.length > 0) {
        errors.push(
          `${id} (${locale}): ${audit.missing.map((item) => item.label).join('; ')}`,
        );
      }
    }
  }
  return { results, errors };
}

function runCli() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const json = args.includes('--json');
  const requested = args.filter((arg) => !arg.startsWith('--')).map((arg) => arg.replace(/\.md$/i, ''));
  const ids = args.includes('--all') ? availableIds() : requested;
  if (ids.length === 0) {
    console.error('Usage: audit-paper-comprehension.mjs [--strict] [--json] <basename... | --all>');
    process.exit(2);
  }

  const report = auditComprehensionPairs(ids, { strict });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const result of report.results) {
      const missing = result.missing.length
        ? `missing: ${result.missing.map((item) => item.label).join(', ')}`
        : 'contract structurally complete';
      console.log(`${result.id} (${result.locale}): ${result.score}% (${result.passed}/${result.total}) — ${missing}`);
    }
  }
  if (strict && report.errors.length > 0) process.exit(1);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) runCli();
