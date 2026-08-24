import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PAPER_READING_DIR = path.resolve(ROOT_DIR, 'src/content/paperReading');
const BLOG_DIR = path.resolve(ROOT_DIR, 'src/content/blog');

/** Exact legacy routes may keep multipart metadata, but receive every content-quality check. */
const LEGACY_MULTIPART_FILES = new Set([
  '01-alexnet-paper-reading-part-1.md',
  '02-alexnet-paper-reading-part-2.md',
]);

const BANNED_HEADING_RES = [
  /^##\s*第一部分/m,
  /^##\s*第二部分/m,
  /^##\s*第[一二三四五六七八九十]+部分/m,
  /^##\s*[^#\n]*海選/m,
  /^##\s*[\u{1F300}-\u{1FAFF}]/mu,
];

const ANCHOR_RES = [
  /§\s*\d/,
  /\bFigure\s+\d+\b/i,
  /\bTable\s+\d+\b/i,
  /\bFig\.\s*\d+\b/i,
  /\bSection\s+[A-Z0-9.]+\b/i,
  /\bAppendix\s+[A-Z0-9.]+\b/i,
  /表\s*\d+/,
  /圖\s*\d+/,
  /第\s*\d+(?:\.\d+)*\s*節/,
  /附錄\s*[A-Z0-9.]*/i,
];

/** Blog deep-read: prose sections count as locatable anchors (rubric §4.2). */
const BLOG_ANCHOR_RES = [...ANCHOR_RES, /^###\s+\S+/m, /^##\s+\S+/m];

const BLOG_JUDGMENT_RES =
  /限制|局限|侷限|編者|不足|尚未|失敗|overclaim|brittle|caveat|風險|但須|然而|代價|trade-off/i;

const COVERAGE_SIGNALS = {
  evidenceMap:
    /證據地圖|證據、主張|論文直接支持|作者(?:仍)?未證明|我的(?:工程)?推論|evidence map|paper directly supports|author claims?|not (?:yet )?supported|our engineering judgment/i,
  limitation:
    /限制|局限|侷限|威脅|證據邊界|不能越過|不該過度|尚未證明|不支持什麼|limitations?|threats? to validity|evidence boundar|unsupported (?:claims?|interpretations?)|does not (?:show|prove|support)|what (?:the )?evidence does not support/i,
  artifact:
    /artifact|可重現|重現性|復現|程式碼|資料(?:集)?公開|checkpoint|repository|reproduc|code release|dataset release/i,
  artifactStatus:
    /截至\s*\d{4}|as of(?:\s+[A-Z][a-z]+)?(?:\s+\d{1,2},?)?\s+\d{4}|可存取|可下載|尚未公開|無法存取|需要申請|受限|空白|缺失|僅宣布|usable|accessible|reachable|downloadable|gated|missing|empty|announced|unavailable/i,
  engineering:
    /工程|落地|部署|production|engineering|when to use|when not to use|什麼時候值得|什麼時候不要|不適合/i,
  diagnostic:
    /消融|失敗模式|錯誤分析|子群|跨平台|校準|成本|延遲|轉移|泛化|ablation|failure (?:mode|analysis)|subgroup|cross-platform|calibration|cost|latency|transfer|generalization/i,
  primarySources: /原始出處|原始來源|主要來源|primary sources?|original sources?/i,
};

const EXPERIMENT_DIMENSIONS = {
  datasets: /資料集|語料|benchmark|dataset|corpus|task set/i,
  baselines: /基線|對照|baseline|comparison method|compared (?:with|against)/i,
  metrics: /指標|準確率|召回率|精確率|metric|accuracy|recall|precision|F1|nDCG|exact match|score/i,
  compute: /算力|GPU|TPU|訓練成本|推理成本|token|latency|compute|hardware|A100|H100|H20/i,
};

const SIMPLIFIED_ONLY_CHARS = '这国说对时会过还与为门';
const MIN_PAPER_ANCHORS = 3;
const MIN_METHOD_SIGNALS = 2;
const MIN_PAPER_BODY_CHARS = { zh: 6500, en: 9000 };
const MIN_BLOG_DEEP_READ_CHARS = 2000;
const MIN_PAIR_SIGNAL_RATIO = 0.6;

function stripForLanguageCheck(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/`[^`]+`/g, '');
}

export function splitFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Invalid frontmatter block in ${filePath}`);
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

function countMatches(body, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    count += body.match(new RegExp(pattern.source, flags))?.length ?? 0;
  }
  return count;
}

function countMethodSignals(body) {
  const numberedSteps = body.match(/^\s*\d+\.\s+\S+/gm) ?? [];
  const arrowSteps = body.match(/→/g) ?? [];
  const methodHeadings =
    body.match(/^#{2,3}\s+.*(?:方法|架構|機制|流程|訓練|method|architecture|mechanism|pipeline|training).*$/gim) ?? [];
  return numberedSteps.length + arrowSteps.length + methodHeadings.length;
}

function findSimplifiedChinese(body) {
  return [...SIMPLIFIED_ONLY_CHARS].filter((char) => body.includes(char));
}

function findBannedHeadings(body) {
  return BANNED_HEADING_RES.flatMap((pattern) => {
    const match = body.match(pattern);
    return match ? [match[0].trim()] : [];
  });
}

function detectLocale(filePath) {
  return filePath.split(path.sep).includes('en') ? 'en' : 'zh';
}

function coverage(body) {
  const experimentDimensions = Object.entries(EXPERIMENT_DIMENSIONS)
    .filter(([, pattern]) => pattern.test(body))
    .map(([name]) => name);
  return {
    evidenceMap: COVERAGE_SIGNALS.evidenceMap.test(body),
    experiment: experimentDimensions.length >= 2,
    experimentDimensions,
    limitation: COVERAGE_SIGNALS.limitation.test(body),
    artifact:
      COVERAGE_SIGNALS.artifact.test(body) && COVERAGE_SIGNALS.artifactStatus.test(body),
    engineering: COVERAGE_SIGNALS.engineering.test(body),
    diagnostic: COVERAGE_SIGNALS.diagnostic.test(body),
    primarySources: COVERAGE_SIGNALS.primarySources.test(body),
  };
}

export function summarizePaperReadingBody(body) {
  const headings = body.match(/^#{2,3}\s+\S+/gm)?.length ?? 0;
  const externalLinks = body.match(/\]\(https?:\/\//g)?.length ?? 0;
  const images = body.match(/^!\[[^\]]*\]/gm)?.length ?? 0;
  const tables = body.match(/^\|?\s*:?-{3,}/gm)?.length ?? 0;
  const anchors = countMatches(body, ANCHOR_RES);
  const coverageSignals = coverage(body);
  const coverageCount = [
    'evidenceMap',
    'experiment',
    'limitation',
    'artifact',
    'engineering',
    'diagnostic',
    'primarySources',
  ].filter((key) => coverageSignals[key]).length;
  return {
    bodyChars: body.length,
    headings,
    externalLinks,
    images,
    tables,
    anchors,
    coverage: coverageSignals,
    informationScore:
      headings + anchors + externalLinks + images * 2 + tables * 2 + coverageCount * 3,
  };
}

function missingCoverage(summary) {
  const missing = [];
  if (!summary.coverage.evidenceMap) missing.push('evidence map / separated claims');
  if (!summary.coverage.experiment) {
    missing.push(
      `experimental setup (found ${summary.coverage.experimentDimensions.length}/4 of datasets, baselines, metrics, compute)`,
    );
  }
  if (!summary.coverage.limitation) missing.push('limitations / unsupported interpretations');
  if (!summary.coverage.artifact) missing.push('artifact availability with an as-of status');
  if (!summary.coverage.engineering) missing.push('engineering implications / when not to use');
  if (!summary.coverage.diagnostic) missing.push('ablation, failure mode, cost, or transfer analysis');
  if (!summary.coverage.primarySources) missing.push('primary sources section');
  return missing;
}

/**
 * @param {{ basename: string, frontmatter: string, body: string, filePath: string, locale?: 'zh'|'en' }} file
 * @returns {{ errors: string[], warnings: string[], advisories: string[], summary: ReturnType<typeof summarizePaperReadingBody> }}
 */
export function validatePaperReadingFile({
  basename,
  frontmatter,
  body,
  filePath,
  locale = detectLocale(filePath),
}) {
  const errors = [];
  const warnings = [];
  const advisories = [];
  const summary = summarizePaperReadingBody(body);
  const legacyMultipart = LEGACY_MULTIPART_FILES.has(basename);

  if (!legacyMultipart && /-part-\d+\.md$/.test(basename)) {
    errors.push(`New paperReading files must not use -part-N filename: ${filePath}`);
  }

  for (const heading of findBannedHeadings(body)) {
    errors.push(`Banned heading pattern "${heading}" in ${filePath}`);
  }
  if (/\bTODO\b/i.test(body)) errors.push(`TODO placeholder in body: ${filePath}`);
  if (/\\[\(\[]/.test(body)) {
    errors.push(`Use KaTeX $...$ / $$...$$ instead of \\(...\\) or \\[...\\]: ${filePath}`);
  }

  if (locale === 'zh') {
    const simplifiedHits = findSimplifiedChinese(stripForLanguageCheck(body));
    if (simplifiedHits.length > 0) {
      errors.push(`Possible simplified Chinese characters [${simplifiedHits.join(', ')}] in ${filePath}`);
    }
  }

  if (summary.anchors < MIN_PAPER_ANCHORS) {
    warnings.push(
      `Need at least ${MIN_PAPER_ANCHORS} locatable evidence anchors; found ${summary.anchors} in ${filePath}`,
    );
  }
  const methodSignals = countMethodSignals(body);
  if (methodSignals < MIN_METHOD_SIGNALS) {
    warnings.push(`Method skeleton is thin (${methodSignals}/${MIN_METHOD_SIGNALS} numbered or arrow steps) in ${filePath}`);
  }
  const missing = missingCoverage(summary);
  if (missing.length > 0) {
    warnings.push(`Missing paper-reading coverage in ${filePath}: ${missing.join('; ')}`);
  }

  const lengthFloor = MIN_PAPER_BODY_CHARS[locale];
  if (body.length < lengthFloor) {
    warnings.push(
      `Body length ${body.length} chars below the ${locale} ${lengthFloor}-char detailed-note floor in ${filePath}`,
    );
  }

  const pdfLink = frontmatter.match(/^\s*pdf:\s*["']?(https:\/\/[^"'\n]+)["']?/m);
  if (pdfLink && !pdfLink[1].startsWith('https://')) {
    errors.push(`paper.links.pdf must be HTTPS in ${filePath}`);
  }

  return { errors, warnings, advisories, summary };
}

/** Compare structural information density, not translated character counts alone. */
export function validatePaperReadingPair({ id, zhBody, enBody }) {
  const warnings = [];
  const advisories = [];
  const zh = summarizePaperReadingBody(zhBody);
  const en = summarizePaperReadingBody(enBody);

  for (const key of [
    'evidenceMap',
    'experiment',
    'limitation',
    'artifact',
    'engineering',
    'diagnostic',
    'primarySources',
  ]) {
    if (zh.coverage[key] !== en.coverage[key]) {
      warnings.push(`${id}: bilingual coverage mismatch for ${key} (zh=${zh.coverage[key]}, en=${en.coverage[key]})`);
    }
  }

  for (const [label, zhValue, enValue] of [
    ['evidence anchors', zh.anchors, en.anchors],
    ['headings', zh.headings, en.headings],
    ['external sources', zh.externalLinks, en.externalLinks],
    ['information score', zh.informationScore, en.informationScore],
  ]) {
    const high = Math.max(zhValue, enValue);
    const low = Math.min(zhValue, enValue);
    if (high >= 3 && low / high < MIN_PAIR_SIGNAL_RATIO) {
      warnings.push(`${id}: bilingual ${label} differ materially (zh=${zhValue}, en=${enValue})`);
    }
  }

  const charRatio = en.bodyChars / Math.max(zh.bodyChars, 1);
  if (charRatio < 1.1 || charRatio > 2.6) {
    warnings.push(
      `${id}: English/Traditional-Chinese body-length ratio ${charRatio.toFixed(2)} is outside the required 1.1-2.6 range`,
    );
  }

  return { warnings, advisories, summaries: { zh, en } };
}

export function validateBlogDeepReadFile({ body, filePath }) {
  const errors = [];
  const warnings = [];
  const advisories = [];
  const anchors = countMatches(body, BLOG_ANCHOR_RES);
  if (!/原文出處/.test(body)) errors.push(`Missing 原文出處 block in ${filePath}`);
  if (anchors < MIN_PAPER_ANCHORS) {
    errors.push(`Need at least ${MIN_PAPER_ANCHORS} source anchors; found ${anchors} in ${filePath}`);
  }
  if (!BLOG_JUDGMENT_RES.test(body)) errors.push(`Missing critical judgment/limitation signal in ${filePath}`);
  const simplifiedHits = findSimplifiedChinese(stripForLanguageCheck(body));
  if (simplifiedHits.length > 0) {
    errors.push(`Possible simplified Chinese characters [${simplifiedHits.join(', ')}] in ${filePath}`);
  }
  if (body.length < MIN_BLOG_DEEP_READ_CHARS) {
    advisories.push(`Body length ${body.length} below ${MIN_BLOG_DEEP_READ_CHARS} in ${filePath}`);
  }
  return { errors, warnings, advisories };
}

function loadMarkdownFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return loadMarkdownFilesRecursive(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function loadMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name));
}

export function validateReadingQuality(options = {}) {
  const paperDir = options.paperReadingDir ?? PAPER_READING_DIR;
  const blogDir = options.blogDir ?? BLOG_DIR;
  const errors = [];
  const warnings = [];
  const advisories = [];
  const pairs = new Map();

  for (const filePath of loadMarkdownFilesRecursive(paperDir)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = splitFrontmatter(raw, filePath);
    const locale = detectLocale(filePath);
    const basename = path.basename(filePath);
    const result = validatePaperReadingFile({ basename, frontmatter, body, filePath, locale });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    advisories.push(...result.advisories);
    const pair = pairs.get(basename) ?? {};
    pair[locale] = body;
    pairs.set(basename, pair);
  }

  for (const [id, pair] of pairs) {
    if (!pair.zh || !pair.en) continue;
    const result = validatePaperReadingPair({ id, zhBody: pair.zh, enBody: pair.en });
    warnings.push(...result.warnings);
    advisories.push(...result.advisories);
  }

  for (const filePath of loadMarkdownFiles(blogDir)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { body } = splitFrontmatter(raw, filePath);
    if (!/原文出處/.test(body)) continue;
    const result = validateBlogDeepReadFile({ body, filePath });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    advisories.push(...result.advisories);
  }

  return { ok: errors.length === 0, errors, warnings, advisories };
}

function runCli() {
  const { ok, errors, warnings, advisories } = validateReadingQuality();
  if (warnings.length > 0) {
    console.warn('Reading quality warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  if (advisories.length > 0) {
    console.warn('Reading quality advisories:');
    for (const advisory of advisories) console.warn(`- ${advisory}`);
  }
  if (!ok || warnings.length > 0) {
    console.error('Reading quality validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    for (const warning of warnings) console.error(`- ${warning}`);
    process.exit(1);
  }
  console.log(
    `Reading quality validation passed (${warnings.length} warning${warnings.length === 1 ? '' : 's'}, ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'}).`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) runCli();
