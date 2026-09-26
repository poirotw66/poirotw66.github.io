import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./sync-personal-skill.mjs', import.meta.url));

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-sync-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'skills/example');
  const home = path.join(root, 'personal');
  const destination = path.join(home, 'skills/example');
  fs.mkdirSync(path.join(source, 'references'), { recursive: true });
  fs.writeFileSync(path.join(source, 'SKILL.md'), 'Example skill');
  fs.writeFileSync(path.join(source, 'references/contract.md'), 'Current contract');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, env: { ...process.env, CODEX_HOME: home }, encoding: 'utf8' });
  return { root, source, destination, run };
}

test('check is read-only, detects missing or changed files, and sync resolves drift', (t) => {
  const { destination, run } = fixture(t);
  assert.equal(run('--check').status, 1);
  assert.equal(fs.existsSync(destination), false);
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0);
  const contract = path.join(destination, 'references/contract.md');
  fs.writeFileSync(contract, 'Older contract');
  assert.equal(run('--check').status, 1);
  assert.equal(fs.readFileSync(contract, 'utf8'), 'Older contract');
  assert.equal(run().status, 0);
  assert.equal(fs.readFileSync(contract, 'utf8'), 'Current contract');
  assert.equal(run('--check').status, 0);
});

test('preflight preserves installed-only files and prevents partial synchronization', (t) => {
  const { source, destination, run } = fixture(t);
  assert.equal(run().status, 0);
  fs.writeFileSync(path.join(destination, 'personal-note.md'), 'Keep me');
  fs.writeFileSync(path.join(source, 'SKILL.md'), 'New revision');
  assert.match(run('--check').stdout, /installed-only/);
  assert.equal(run().status, 1);
  assert.equal(fs.readFileSync(path.join(destination, 'SKILL.md'), 'utf8'), 'Example skill');
  assert.equal(fs.readFileSync(path.join(destination, 'personal-note.md'), 'utf8'), 'Keep me');
});

test('refuses a symlink destination without altering its target', (t) => {
  const { root, destination, run } = fixture(t);
  const target = path.join(root, 'unrelated');
  fs.mkdirSync(target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.symlinkSync(target, destination);
  assert.equal(run().status, 1);
  assert.deepEqual(fs.readdirSync(target), []);
});
