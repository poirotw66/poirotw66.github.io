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

function largestJsonSize(dist, relativeDirectory) {
  const directory = path.join(dist, relativeDirectory);
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.json'));
  return Math.max(...files.map((file) => fs.statSync(path.join(directory, file)).size));
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
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/hub.css']),
      max: 54 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Preview Hub CSS',
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/preview.css', 'css/hub.css']),
      max: 57 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Blog Hub CSS',
      bytes: combinedSize(dist, [
        'css/base.css',
        'css/layout.css',
        'css/hub.css',
        'css/preview.css',
        'css/blog-hub.css',
      ]),
      // This now includes the archive controls previously emitted as inline CSS.
      max: 60 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Article CSS',
      bytes: combinedSize(dist, ['css/base.css', 'css/layout.css', 'css/article.css']),
      max: 55 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    {
      label: 'Article CSS with all enhancements',
      bytes: combinedSize(dist, [
        'css/base.css',
        'css/layout.css',
        'css/article.css',
        'css/article-code.css',
        'css/article-mermaid.css',
        'css/article-math.css',
      ]),
      max: 55 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    { label: 'Chinese homepage HTML', bytes: size(dist, 'index.html'), max: 48 * KB },
    { label: 'English homepage HTML', bytes: size(dist, 'en/index.html'), max: 48 * KB },
    { label: 'Chinese blog index HTML', bytes: size(dist, 'blog/index.html'), max: 70 * KB },
    { label: 'English blog index HTML', bytes: size(dist, 'en/blog/index.html'), max: 70 * KB },
    {
      label: 'Blog index JS',
      bytes: size(dist, 'js/blog-index.js'),
      max: 18 * KB,
      targetHeadroom: CSS_TARGET_HEADROOM,
    },
    { label: 'Navigation brand mark', bytes: size(dist, 'brand/bloom-mark-64.webp'), max: 2 * KB },
    { label: 'Chinese blog index manifest', bytes: size(dist, 'blog/index.json'), max: 20 * KB },
    { label: 'English blog index manifest', bytes: size(dist, 'en/blog/index.json'), max: 22 * KB },
    { label: 'Largest Chinese blog index page', bytes: largestJsonSize(dist, 'blog/data'), max: 20 * KB },
    { label: 'Largest English blog index page', bytes: largestJsonSize(dist, 'en/blog/data'), max: 22 * KB },
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
