import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllTagSlugs,
  resolveCanonicalTagSlug,
  tagToUrlSlug,
} from "../src/utils/tag.ts";
import { blogPostsFixture } from "./fixtures/tag-fixture-posts.mjs";
import { validateTagMappings } from "./validate-tags.mjs";

test("maps Chinese tag to canonical ASCII slug", () => {
  assert.equal(tagToUrlSlug("證件照"), "id-photo");
});

test("normalizes ASCII tags into canonical slug", () => {
  assert.equal(resolveCanonicalTagSlug("  AI   Agent!  "), "ai-agent");
});

test("throws for invalid ASCII normalization result", () => {
  assert.throws(
    () => resolveCanonicalTagSlug("  !!!  "),
    /Invalid ASCII tag normalization:/
  );
});

test("throws clear error for unmapped non-ASCII tag", () => {
  assert.throws(
    () => resolveCanonicalTagSlug("測試標籤"),
    /Unknown non-ASCII tag: 測試標籤\. Add mapping in TAG_SLUG_MAP\./
  );
});

test("getAllTagSlugs returns canonical slugs without raw or encoded variants", () => {
  const posts = [...blogPostsFixture, { data: { tags: ["AI Agent", "  AI   Agent!  "] } }];

  assert.deepEqual(getAllTagSlugs(posts).sort(), [
    "ai-agent",
    "id-photo",
    "paper-reading",
    "research-methods",
  ]);
});

test("fails when non-ASCII tag is not mapped", () => {
  const result = validateTagMappings({
    posts: [{ data: { tags: ["未映射標籤"] } }],
    mapping: {},
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Unknown non-ASCII tag: 未映射標籤/);
});

test("fails when two tags share the same slug", () => {
  const result = validateTagMappings({
    posts: [],
    mapping: {
      "論文閱讀": "paper-reading",
      "文獻閱讀": "paper-reading",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Duplicate slug "paper-reading"/);
});

test("fails when mapped slug is not ASCII-hyphen format", () => {
  const result = validateTagMappings({
    posts: [],
    mapping: {
      "論文閱讀": "paper reading",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Invalid slug format/);
});
