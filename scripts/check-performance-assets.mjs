import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DIST = path.resolve('dist');
const KB = 1024;
const CSS_TARGET_HEADROOM = 0.1;

function size(dist, relativePath) {
  return fs.statSync(path.join(dist, relativePath)).size;
}

function combinedSize(dist, paths) {
  return paths.reduce((total, relativePath) => total + size(dist, relativePath), 0);
}

export function evaluateBudget({ bytes, max, targetHeadroom = 0 }) {
  const target = max * (1 - targetHeadroom);
  const status = bytes > max ? 'FAIL' : bytes > target ? 'WARN' : 'PASS';
  return {
    status,
    target,
    hardMax: max,
    headroom: 1 - bytes / max,
  };
}

export function createBudgets(dist = DEFAULT_DIST) {
  return [
    { label: 'Deferred font CSS', bytes: size(dist, 'css/fonts.css'), max: 4 * KB },
    {
      label: 'Homepage CSS',
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/home.css']),
      max: 86 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Hub CSS',
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/preview.css', 'css/hub.css']),
      max: 51 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Article CSS',
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/article.css']),
      max: 55 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    { label: 'Chinese homepage HTML', bytes: size(dist, 'index.html'), max: 48 * KB },
    { label: 'English homepage HTML', bytes: size(dist, 'en/index.html'), max: 48 * KB },
    { label: 'Chinese blog index HTML', bytes: size(dist, 'blog/index.html'), max: 115 * KB },
    { label: 'English blog index HTML', bytes: size(dist, 'en/blog/index.html'), max: 120 * KB },
    { label: 'Chinese blog index JSON', bytes: size(dist, 'blog/index.json'), max: 80 * KB },
    { label: 'English blog index JSON', bytes: size(dist, 'en/blog/index.json'), max: 90 * KB },
  ];
}

function formatBudgetLine(budget, result) {
  const actualKb = budget.bytes / KB;
  const hardMaxKb = result.hardMax / KB;
  if (!budget.targetHeadroom) {
    return `${result.status} ${budget.label}: ${actualKb.toFixed(1)}KB / ${hardMaxKb.toFixed(1)}KB hard limit`;
  }

  const targetKb = result.target / KB;
  return `${result.status} ${budget.label}: ${actualKb.toFixed(1)}KB / ${targetKb.toFixed(1)}KB target, ${hardMaxKb.toFixed(1)}KB hard limit, ${(result.headroom * 100).toFixed(1)}% headroom`;
}

export function checkPerformanceAssets(dist = DEFAULT_DIST) {
  const failures = [];
  const warnings = [];

  for (const budget of createBudgets(dist)) {
    const result = evaluateBudget(budget);
    console.log(formatBudgetLine(budget, result));
    if (result.status === 'FAIL') failures.push(budget.label);
    if (result.status === 'WARN') warnings.push(budget.label);
  }

  if (warnings.length > 0) {
    console.warn(`Performance asset budget warnings: ${warnings.join(', ')}`);
  }
  if (failures.length > 0) {
    console.error(`Performance asset budget failed: ${failures.join(', ')}`);
    return false;
  }
  return true;
}

const isMain =
  process.argv[1] != null
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain && !checkPerformanceAssets()) {
  process.exit(1);
}
