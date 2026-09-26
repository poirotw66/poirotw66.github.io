import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./validate-project-skills.mjs', import.meta.url));

test('validates nested and sibling references and fails missing entrypoints', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-validation-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const skill = path.join(root, 'skills/example');
  fs.mkdirSync(path.join(skill, 'references'), { recursive: true });
  fs.mkdirSync(path.join(skill, 'agents'));
  fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: example\ndescription: A sufficiently detailed description of a concrete skill.\n---\n[Contract](references/contract.md)\n[External](https://example.org/)');
  fs.writeFileSync(path.join(skill, 'agents/openai.yaml'), 'default_prompt: "Use $example"');
  const contract = path.join(skill, 'references/contract.md');
  fs.writeFileSync(contract, '[Entrypoint](../SKILL.md)');
  const run = () => spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.equal(run().status, 0);
  fs.writeFileSync(contract, '[Missing](missing.md)');
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /missing local reference missing.md/);
  fs.writeFileSync(contract, '[Entrypoint](../SKILL.md)');
  fs.rmSync(path.join(skill, 'SKILL.md'));
  assert.match(run().stderr, /missing SKILL.md/);
});
