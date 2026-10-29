import { spawnSync } from 'node:child_process';

// Keep fixture-based regression tests together; the live reading-path gate runs in build.
const files = [
  'scripts/classify-site-changes.test.mjs',
  'scripts/verify-deployment.test.mjs',
  'scripts/validate-tags.test.mjs',
  'scripts/validate-content.test.mjs',
  'scripts/validate-markdown-emphasis.test.mjs',
  'scripts/validate-math.test.mjs',
  'scripts/normalize-markdown-emphasis.test.mjs',
  'scripts/validate-blog-format.test.mjs',
  'src/utils/blogIndexData.test.ts',
  'scripts/archive-pagination.test.mjs',
  'scripts/blog-lanes.test.mjs',
  'scripts/rehype-role-comparison.test.mjs',
  'scripts/validate-reading-quality.test.mjs',
  'scripts/sync-personal-skill.test.mjs',
  'scripts/validate-project-skills.test.mjs',
  'skills/bloss0m-content-refresh/scripts/audit-archive.test.mjs',
  'skills/publish-bilingual-paper-reading/scripts/audit-paper-figures.test.mjs',
  'skills/publish-bilingual-paper-reading/scripts/audit-paper-comprehension.test.mjs',
  'scripts/paper-archive-loader.test.mjs',
  'scripts/search-index-codec.test.mjs',
  'src/utils/paperEssence.test.ts',
  'scripts/validate-i18n.test.mjs',
  'scripts/validate-english-purity.test.mjs',
  'scripts/check-image-budgets.test.mjs',
  'scripts/check-external-links.test.mjs',
  'scripts/generate-responsive-covers.test.mjs',
  'scripts/article-toc-scroll.test.mjs',
  'scripts/remark-huahua-callout.test.mjs',
  'scripts/remark-image-dimensions.test.mjs',
  'scripts/home-roadmap.test.mjs',
  'scripts/home-brand.test.mjs',
  'scripts/studio-updates.test.mjs',
  'scripts/check-performance-assets.test.mjs',
  'scripts/lighthouse-config.test.mjs',
  'scripts/finalize-sitemap.test.mjs',
  'scripts/legacy-redirects.test.mjs',
  'src/utils/articleReadingProgress.test.ts',
  'scripts/search-state.test.mjs',
  'scripts/check-legacy-json.test.mjs',
  'scripts/content-advisory-report.test.mjs',
  'scripts/validate-paper-topics.test.mjs',
  'scripts/validate-build-links.test.mjs',
  'scripts/paper-reading-pagination.test.mjs',
];

const result = spawnSync(process.execPath, [
  '--experimental-strip-types', '--test', '--test-concurrency=2', ...files,
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
