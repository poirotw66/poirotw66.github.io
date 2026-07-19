import assert from 'node:assert/strict';
import test from 'node:test';
import remarkHuahuaCallout, { detectHuahuaCallout } from '../src/utils/remarkHuahuaCallout.mjs';

function callout(label) {
  return {
    type: 'blockquote',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: label }] },
          { type: 'text', value: ' Content' },
        ],
      },
    ],
  };
}

test('detects all three Traditional Chinese Huahua callout labels', () => {
  assert.equal(detectHuahuaCallout(callout('花花的一句話'))?.variant, 'note');
  assert.equal(detectHuahuaCallout(callout('花花的工程提醒'))?.variant, 'engineering');
  assert.equal(detectHuahuaCallout(callout('花花的判斷'))?.variant, 'judgment');
});

test('transforms a Huahua blockquote into an accessible aside', () => {
  const node = callout("Huahua's engineering note");
  const tree = { type: 'root', children: [node] };
  remarkHuahuaCallout()(tree);

  assert.equal(node.data.hName, 'aside');
  assert.deepEqual(node.data.hProperties.className, ['huahua-callout', 'huahua-callout--engineering']);
  assert.equal(node.data.hProperties.role, 'note');
  assert.equal(node.data.hProperties['aria-label'], "Huahua's engineering note");
});

test('leaves ordinary blockquotes unchanged', () => {
  const node = callout('Important');
  const tree = { type: 'root', children: [node] };
  remarkHuahuaCallout()(tree);
  assert.equal(node.data, undefined);
});
