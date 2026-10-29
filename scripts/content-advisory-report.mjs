import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'config/content-advisories.json';
const VALIDATORS = [
  { name: 'reading-quality', script: 'scripts/validate-reading-quality.mjs', args: [] },
  { name: 'paper-pair', script: 'skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs', args: ['--strict', '--all'] },
];

export function normalizeMessage(message, root) {
  return message.replaceAll(`${path.resolve(root)}${path.sep}`, '')
    .replace(/^(\d{2,}-[^\s:]+)\.md:/, '$1:').replace(/\s+/g, ' ').trim();
}

export function parseAdvisories(output) {
  const findings = [];
  let inAdvisories = false;
  for (const line of Array.isArray(output) ? output : output.split(/\r?\n/)) {
    if (/^[^-].*advisories:$/.test(line)) inAdvisories = true;
    else if (inAdvisories && line.startsWith('- ')) findings.push(line.slice(2));
    else if (/^(?:Reading quality|Paper pair audit) (?:warnings:|validation (?:passed|failed)|passed|failed)/.test(line)) inAdvisories = false;
    else if (inAdvisories && line.trim() && findings.length) findings[findings.length - 1] += `\n${line}`;
  }
  return findings;
}

export function mergeFindings(results, root) {
  const findings = new Map();
  for (const { validator, messages } of results) {
    for (const raw of messages) {
      const message = normalizeMessage(raw, root);
      const id = createHash('sha256').update(message).digest('hex');
      const finding = findings.get(id) ?? { id, message, validators: [] };
      if (!finding.validators.includes(validator)) finding.validators.push(validator);
      findings.set(id, finding);
    }
  }
  return [...findings.values()].sort((a, b) => a.message.localeCompare(b.message));
}

export function validateBaseline(baseline) {
  if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.entries)) throw new Error('Invalid advisory baseline schema');
  const ids = new Set();
  for (const entry of baseline.entries) {
    if (!/^[a-f0-9]{64}$/.test(entry.id) || typeof entry.message !== 'string' || !entry.message.trim()) throw new Error('Invalid advisory baseline entry');
    if (ids.has(entry.id)) throw new Error(`Duplicate advisory baseline ID: ${entry.id}`);
    ids.add(entry.id);
    if (!['pending', 'exception', 'resolved'].includes(entry.status)) throw new Error(`Invalid advisory status: ${entry.status}`);
    if (entry.status === 'exception' && (!entry.rationale?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt ?? ''))) throw new Error(`Reviewed exceptions need rationale and reviewedAt: ${entry.id}`);
    if (createHash('sha256').update(entry.message).digest('hex') !== entry.id) throw new Error(`Advisory fingerprint does not match its message: ${entry.id}`);
  }
  return baseline;
}

export function buildReport(findings, baseline, { collectionComplete = true } = {}) {
  validateBaseline(baseline);
  const previous = new Map(baseline.entries.map((entry) => [entry.id, entry]));
  const present = new Set(findings.map((finding) => finding.id));
  const entries = findings.map((finding) => {
    const old = previous.get(finding.id);
    return {
      ...finding,
      state: !old || old.status === 'resolved' ? 'new' : old.status === 'exception' ? 'exception' : 'existing',
      reviewStatus: old?.status === 'exception' ? 'exception' : 'pending',
      ...(old?.status === 'exception' ? { rationale: old.rationale, reviewedAt: old.reviewedAt } : {}),
      ...(old?.status === 'resolved' ? { regression: true } : {}),
    };
  });
  entries.push(...baseline.entries.filter((entry) => !present.has(entry.id)).map((entry) => ({ ...entry, state: collectionComplete ? 'resolved' : 'unknown', reviewStatus: entry.status })));
  return {
    schemaVersion: 1,
    baselineCommit: baseline.sourceCommit,
    counts: Object.fromEntries(['new', 'existing', 'resolved', 'exception', 'unknown'].map((state) => [state, entries.filter((entry) => entry.state === state).length])),
    entries,
  };
}

export function collectAdvisories(root) {
  const results = [];
  const validators = [];
  for (const { name, script, args } of VALIDATORS) {
    // Preserve console-call boundaries: excerpts can contain newlines and '- '
    // Markdown lists, which cannot be safely recovered from flattened stderr.
    const capture = `
      import { pathToFileURL } from 'node:url';
      import { writeFileSync } from 'node:fs';
      const events = [];
      for (const level of ['log', 'warn', 'error']) console[level] = (...args) => events.push({ level, message: args.map(String).join(' ') });
      process.on('exit', () => writeFileSync(1, JSON.stringify(events)));
      try { await import(pathToFileURL(process.argv[1]).href); }
      catch (error) { console.error(error.stack ?? error.message); process.exitCode = 1; }
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', capture, path.join(root, script), ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    if (run.error) throw run.error;
    let events;
    try { events = JSON.parse(run.stdout); } catch { throw new Error(`Could not capture ${name} diagnostics: ${run.stderr ?? ''}`); }
    if (!Array.isArray(events) || events.some((event) => typeof event.message !== 'string')) throw new Error(`Invalid ${name} diagnostic capture`);
    const output = events.map((event) => event.message).join('\n');
    // A failed validator is retained as a failure, even if it emitted advisories.
    validators.push({ name, passed: run.status === 0, exitCode: run.status, ...(run.status !== 0 ? { diagnostics: normalizeMessage(output, root) } : {}) });
    const messages = parseAdvisories(events.map((event) => event.message));
    const declared = output.match(/(?:Reading quality validation|Paper pair audit) passed \([^\n]*?(\d+) advisor(?:y|ies)\)/)?.[1];
    if (run.status === 0 && (declared === undefined || Number(declared) !== messages.length)) throw new Error(`Could not collect all ${name} advisories (declared=${declared}, captured=${messages.length}); refusing an incomplete report`);
    validators.at(-1).advisoryCount = messages.length;
    results.push({ validator: name, messages });
  }
  return { findings: mergeFindings(results, root), validators };
}

function withCommittedSource(root, ref, callback) {
  const commit = execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd: root, encoding: 'utf8' }).trim();
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'bloss0m-advisories-')));
  try {
    const archive = execFileSync('git', ['archive', commit, 'scripts', 'skills/publish-bilingual-paper-reading', 'src/content'], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    const unpack = spawnSync('tar', ['-xf', '-', '-C', temporary], { input: archive });
    if (unpack.status !== 0) throw new Error('Could not export committed validator sources');
    // Pair validation checks cover existence only. Avoid exporting large assets.
    const publicFiles = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', commit, 'public'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    for (const file of publicFiles) {
      const destination = path.join(temporary, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, '');
    }
    return callback(temporary, commit);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function runCli() {
  const args = process.argv.slice(2);
  const value = (prefix) => args.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1);
  const known = args.every((arg) => arg === '--refresh-baseline' || /^(--source-ref|--format|--output|--baseline)=.+/.test(arg));
  if (!known || (value('--format') && !['text', 'json'].includes(value('--format')))) throw new Error('Usage: content-advisory-report.mjs [--format=text|json] [--output=file] [--baseline=file] [--source-ref=HEAD] [--refresh-baseline]');
  const baselinePath = path.resolve(ROOT, value('--baseline') ?? BASELINE);
  const refresh = args.includes('--refresh-baseline');
  if (value('--output') && path.resolve(ROOT, value('--output')) === baselinePath) throw new Error('Report output must not overwrite the baseline; use --refresh-baseline explicitly');
  const ref = value('--source-ref') ?? (refresh ? 'HEAD' : undefined);
  const result = ref ? withCommittedSource(ROOT, ref, (source, sourceCommit) => ({ ...collectAdvisories(source), sourceCommit })) : { ...collectAdvisories(ROOT), sourceCommit: null };
  const previous = fs.existsSync(baselinePath) ? validateBaseline(JSON.parse(fs.readFileSync(baselinePath, 'utf8'))) : null;
  const passed = result.validators.every((validator) => validator.passed);
  if (refresh) {
    if (!passed) throw new Error('Refusing to refresh a baseline while a validator fails');
    const old = new Map((previous?.entries ?? []).map((entry) => [entry.id, entry]));
    const entries = result.findings.map((finding) => ({ ...finding, status: old.get(finding.id)?.status === 'exception' ? 'exception' : 'pending', ...(old.get(finding.id)?.status === 'exception' ? { rationale: old.get(finding.id).rationale, reviewedAt: old.get(finding.id).reviewedAt } : {}) }));
    const present = new Set(entries.map((entry) => entry.id));
    entries.push(...(previous?.entries ?? []).filter((entry) => !present.has(entry.id)).map((entry) => ({ ...entry, status: 'resolved' })));
    const baseline = { schemaVersion: 1, sourceCommit: result.sourceCommit, entries };
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`Updated advisory baseline from ${result.sourceCommit}; ${result.findings.length} current findings remain pending review unless explicitly excepted.`);
    return;
  }
  if (!previous) throw new Error(`Missing advisory baseline: ${baselinePath}. Create it explicitly with --refresh-baseline.`);
  const report = { ...buildReport(result.findings, previous, { collectionComplete: passed }), collectionComplete: passed, source: ref ?? 'working-tree', validators: result.validators, passed };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (value('--output')) {
    const output = path.resolve(ROOT, value('--output'));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, json);
  }
  if (value('--format') === 'json') process.stdout.write(json);
  else {
    console.log(`Content advisories: ${report.counts.new} new, ${report.counts.existing} existing pending, ${report.counts.resolved} resolved, ${report.counts.exception} reviewed exceptions, ${report.counts.unknown} unknown due to incomplete validation.`);
    console.log(`Baseline: ${report.baselineCommit}. Advisory status is informational; validator errors and strict warnings remain blocking.`);
    for (const entry of report.entries.filter((entry) => entry.state === 'new')) console.log(`NEW ${entry.id.slice(0, 12)} ${entry.message}`);
    if (!passed) for (const validator of report.validators.filter((entry) => !entry.passed)) console.error(validator.diagnostics);
  }
  if (!passed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
