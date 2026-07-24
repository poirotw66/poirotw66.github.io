import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllTagSlugs,
  resolveCanonicalTagSlug,
  tagToUrlSlug,
} from "../src/utils/tag.ts";
import { blogPostsFixture } from "./fixtures/tag-fixture-posts.mjs";
import { validateTagMappings, validateTagTaxonomy } from "./validate-tags.mjs";

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

test("allows unregistered ASCII tags when they are reused", () => {
  const result = validateTagTaxonomy({
    zhPosts: [
      { id: "one", data: { tags: ["New Topic"] } },
      { id: "two", data: { tags: ["New Topic"] } },
    ],
    enPosts: [
      { id: "one", data: { tags: ["New Topic"] } },
      { id: "two", data: { tags: ["New Topic"] } },
    ],
    singletonExceptions: new Set(),
  });

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("fails when bilingual tags resolve to different slugs", () => {
  const result = validateTagTaxonomy({
    zhPosts: [
      { id: "one", data: { tags: ["AI Agent"] } },
      { id: "two", data: { tags: ["AI Agent"] } },
    ],
    enPosts: [
      { id: "one", data: { tags: ["AI Safety"] } },
      { id: "two", data: { tags: ["AI Agent"] } },
    ],
    singletonExceptions: new Set(),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /mismatched bilingual tag slugs/);
});

test("fails singleton tags unless explicitly excepted", () => {
  const posts = [{ id: "one", data: { tags: ["Unique Topic"] } }];
  const rejected = validateTagTaxonomy({
    zhPosts: posts,
    enPosts: posts,
    singletonExceptions: new Set(),
  });
  assert.equal(rejected.ok, false);
  assert.match(rejected.errors.join("\n"), /Singleton tag slug "unique-topic"/);

  const accepted = validateTagTaxonomy({
    zhPosts: posts,
    enPosts: posts,
    singletonExceptions: new Set(["unique-topic"]),
  });
  assert.equal(accepted.ok, true, accepted.errors.join("\n"));
});

test("fails stale singleton exceptions", () => {
  const posts = [
    { id: "one", data: { tags: ["Shared Topic"] } },
    { id: "two", data: { tags: ["Shared Topic"] } },
  ];
  const result = validateTagTaxonomy({
    zhPosts: posts,
    enPosts: posts,
    singletonExceptions: new Set(["shared-topic"]),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Stale singleton exception/);
});
