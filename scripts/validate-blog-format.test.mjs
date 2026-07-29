import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBlogDocument } from './validate-blog-format.mjs';

const frontmatter = `---
title: Test
---
`;

test('accepts localized Huahua callouts and localized English links', () => {
  const source = `${frontmatter}
> **Huahua's engineering note**
>
> Keep the production boundary explicit.

[Related](/en/blog/64-ai-agent-guide/)
`;
  assert.deepEqual(validateBlogDocument(source, 'en'), []);
});

test('rejects unstable legacy formatting outside code fences', () => {
  const source = `${frontmatter}
---
> [!TIP]
> Advice
> **花花的一句話**：Legacy text
<img src="/x.webp" style="width:40%">
[Related](/blog/64-ai-agent-guide/)
## 🚀 Decorative heading
`;
  const errors = validateBlogDocument(source, 'en');
  assert.equal(errors.length, 7);
});

test('ignores examples inside fenced code blocks', () => {
  const source = `${frontmatter}
\`\`\`markdown
---
> [!NOTE]
\`\`\`
`;
  assert.deepEqual(validateBlogDocument(source, 'zh'), []);
});
