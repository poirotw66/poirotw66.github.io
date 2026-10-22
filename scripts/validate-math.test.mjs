import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMarkdownMath } from './validate-math.mjs';

test('accepts inline, display, and fenced math while leaving escaped prices as prose', () => {
  const source = String.raw`Prices are \$4.66 and \$19.94; success is 52.38%.

Inline $q \in \mathbb{R}^d$ and $\text{甲公司}$.

$$
i^{*} = \arg\max_i s_i
$$

~~~math
\operatorname{Segment}(I)
~~~
`;
  assert.deepEqual(validateMarkdownMath(source), { errors: [], mathCount: 4 });
});

test('rejects currency accidentally parsed as math and reports the source line after frontmatter', () => {
  const source = '---\r\ntitle: "$4 and $8"\r\n---\r\n\r\nCost $4.66 at 60.32%, versus $19.94.\r\n';
  const result = validateMarkdownMath(source, 'article.md');
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /^article\.md:5:/);
  assert.match(result.errors[0], /commentAtEnd/);
});

test('rejects Unicode prose and unsupported LaTeX commands in math', () => {
  for (const source of [String.raw`$(甲公司, 收購, 乙公司)$`, String.raw`$i^\*$`, String.raw`$\textsc{Segment}(I)$`]) {
    assert.equal(validateMarkdownMath(source).errors.length, 1);
  }
});

test('requires a multiline display fence to close before following prose', () => {
  const source = String.raw`$$T(C)=
\begin{cases}
C, & P(C)=0
\end{cases}$$

$D$ is the input.
`;
  assert.equal(validateMarkdownMath(source).errors.length, 1);
});

test('ignores inline code, non-math code fences, and frontmatter', () => {
  const source = '---\ntitle: "$甲公司$"\n---\n\n`$i^\\*$`\n\n```text\n$甲公司$\n```\n';
  assert.deepEqual(validateMarkdownMath(source), { errors: [], mathCount: 0 });
});
