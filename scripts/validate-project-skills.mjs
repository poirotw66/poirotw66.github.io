import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const errors = [];
let count = 0;

function validateReferences(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      validateReferences(file);
    } else if (entry.name.endsWith('.md')) {
      const content = fs.readFileSync(file, 'utf8');
      for (const match of content.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
        const href = match[1];
        if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) continue;
        const target = href.split(/[?#]/)[0];
        if (target && !fs.existsSync(path.resolve(path.dirname(file), target))) {
          errors.push(`${path.relative(root, file)}: missing local reference ${href}`);
        }
      }
    }
  }
}

for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillDir = path.join(skillsDir, entry.name);
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    errors.push(`${entry.name}: missing SKILL.md`);
    continue;
  }
  count += 1;
  validateReferences(skillDir);

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
  if (!frontmatter) {
    errors.push(`${entry.name}: missing YAML frontmatter`);
    continue;
  }
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== entry.name) errors.push(`${entry.name}: frontmatter name must match folder`);
  if (!description || description.length < 40) {
    errors.push(`${entry.name}: description is missing or too vague`);
  }
  if (/\bTODO\b/.test(content)) errors.push(`${entry.name}: unresolved TODO in SKILL.md`);

  const metadataFile = path.join(skillDir, 'agents', 'openai.yaml');
  if (!fs.existsSync(metadataFile)) {
    errors.push(`${entry.name}: missing agents/openai.yaml`);
    continue;
  }
  const metadata = fs.readFileSync(metadataFile, 'utf8');
  if (!metadata.includes(`$${entry.name}`)) {
    errors.push(`${entry.name}: default prompt must mention $${entry.name}`);
  }
}

if (count === 0) errors.push('No project skills found');
if (errors.length > 0) {
  console.error('Project skill validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Project skill validation passed (${count} skills).`);
