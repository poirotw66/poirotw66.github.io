import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const KB = 1024;

function size(relativePath) {
  return fs.statSync(path.join(DIST, relativePath)).size;
}

function combinedSize(paths) {
  return paths.reduce((total, relativePath) => total + size(relativePath), 0);
}

const budgets = [
  {
    label: 'Homepage CSS',
    bytes: combinedSize(['css/base.css', 'css/layout.css', 'css/home.css']),
    max: 86 * KB,
  },
  {
    label: 'Hub CSS',
    bytes: combinedSize(['css/base.css', 'css/layout.css', 'css/hub.css']),
    max: 51 * KB,
  },
  {
    label: 'Article CSS',
    bytes: combinedSize(['css/base.css', 'css/layout.css', 'css/article.css']),
    max: 55 * KB,
  },
  { label: 'Chinese homepage HTML', bytes: size('index.html'), max: 48 * KB },
  { label: 'English homepage HTML', bytes: size('en/index.html'), max: 48 * KB },
  { label: 'Chinese blog index HTML', bytes: size('blog/index.html'), max: 115 * KB },
  { label: 'English blog index HTML', bytes: size('en/blog/index.html'), max: 120 * KB },
  { label: 'Chinese blog index JSON', bytes: size('blog/index.json'), max: 80 * KB },
  { label: 'English blog index JSON', bytes: size('en/blog/index.json'), max: 90 * KB },
];

const failures = [];
for (const budget of budgets) {
  const actualKb = budget.bytes / KB;
  const maxKb = budget.max / KB;
  const passed = budget.bytes <= budget.max;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${budget.label}: ${actualKb.toFixed(1)}KB / ${maxKb.toFixed(1)}KB`);
  if (!passed) failures.push(budget.label);
}

if (failures.length > 0) {
  console.error(`Performance asset budget failed: ${failures.join(', ')}`);
  process.exit(1);
}
