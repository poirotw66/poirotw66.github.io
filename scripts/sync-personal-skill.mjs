#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const skillNames = [
  'publish-bilingual-ai-blog',
  'bloss0m-content-refresh',
  'bloss0m-distribution-kit',
  'bloss0m-frontier-watch',
  'publish-bilingual-paper-reading',
];

for (const skillName of skillNames) {
  const source = path.join(root, 'skills', skillName);
  const destination = path.join(codexHome, 'skills', skillName);
  if (!fs.existsSync(path.join(source, 'SKILL.md'))) {
    throw new Error(`Repository skill not found: ${source}`);
  }
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
  console.log(`Synced ${skillName} to ${destination}`);
}
