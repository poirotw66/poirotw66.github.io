import test from 'node:test';
import assert from 'node:assert/strict';
import { archivePagePath } from '../src/utils/archivePagination.ts';

test('archivePagePath keeps page one on the hub route', () => {
  assert.equal(archivePagePath('/blog/', 1, 'zh'), '/blog/');
  assert.equal(archivePagePath('/blog/', 1, 'en'), '/en/blog/');
});

test('archivePagePath creates localized static page routes', () => {
  assert.equal(archivePagePath('/paper-reading/', 2, 'zh'), '/paper-reading/page/2/');
  assert.equal(archivePagePath('paper-reading', 3, 'en'), '/en/paper-reading/page/3/');
});

test('archivePagePath rejects invalid page numbers', () => {
  assert.throws(() => archivePagePath('/blog/', 0, 'zh'), RangeError);
  assert.throws(() => archivePagePath('/blog/', 1.5, 'en'), RangeError);
});
