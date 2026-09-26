#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check')) {
  console.error('Usage: sync-personal-skill.mjs [--check]');
  process.exit(2);
}
const check = args.includes('--check');
const skillsDir = path.join(root, 'skills');
const skillNames = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
  .map((entry) => entry.name).sort();
if (skillNames.length === 0) throw new Error('No repository skills found.');

function files(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in skill tree: ${path.join(directory, entry.name)}`);
    return entry.isDirectory() ? files(path.join(directory, entry.name), relative) : [relative];
  }).sort();
}

const plans = skillNames.map((name) => {
  const source = path.join(skillsDir, name);
  const destination = path.join(codexHome, 'skills', name);
  if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) {
    throw new Error(`Refusing symlink destination: ${destination}`);
  }
  const sourceFiles = files(source);
  const destinationFiles = files(destination);
  const extra = destinationFiles.filter((file) => !sourceFiles.includes(file));
  const differences = sourceFiles.flatMap((file) => {
    const target = path.join(destination, file);
    if (!fs.existsSync(target)) return [`missing: ${name}/${file}`];
    return fs.readFileSync(path.join(source, file)).equals(fs.readFileSync(target)) ? [] : [`changed: ${name}/${file}`];
  });
  return { name, source, destination, extra, differences };
});

const differences = plans.flatMap((plan) => [
  ...plan.differences,
  ...plan.extra.map((file) => `installed-only: ${plan.name}/${file}`),
]);
if (check) {
  for (const difference of differences) console.log(difference);
  console.log(differences.length ? `Skill sync check failed (${differences.length} differences).` : `Skill sync check passed (${plans.length} skills).`);
  process.exitCode = differences.length ? 1 : 0;
} else {
  // Preflight every tree before copying; never erase installed-only user files.
  if (plans.some((plan) => plan.extra.length > 0)) {
    console.error('Installed-only files require review before synchronization. Run with --check for details.');
    process.exitCode = 1;
  } else {
    for (const { name, source, destination } of plans) {
      fs.mkdirSync(destination, { recursive: true });
      fs.cpSync(source, destination, { recursive: true, force: true });
      console.log(`Synced ${name} to ${destination}`);
    }
  }
}
