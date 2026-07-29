import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

const CALLOUT_LABELS = {
  zh: {
    '花花的一句話': '花花的一句話',
    '花花的工程提醒': '花花的工程提醒',
    '花花的判斷': '花花的判斷',
    'Huahua in one sentence': '花花的一句話',
    "Huahua's engineering note": '花花的工程提醒',
    "Huahua's take": '花花的判斷',
    "Bloom's Mascot Quote": '花花的一句話',
    "Bloom's Engineering Advice": '花花的工程提醒',
  },
  en: {
    '花花的一句話': 'Huahua in one sentence',
    '花花的工程提醒': "Huahua's engineering note",
    '花花的判斷': "Huahua's take",
    'Huahua in one sentence': 'Huahua in one sentence',
    "Huahua's engineering note": "Huahua's engineering note",
    "Huahua's take": "Huahua's take",
    "Bloom's Mascot Quote": 'Huahua in one sentence',
    "Bloom's Engineering Advice": "Huahua's engineering note",
  },
};

const OBSIDIAN_VARIANTS = {
  NOTE: 'note',
  TIP: 'engineering',
  WARNING: 'engineering',
  CAUTION: 'engineering',
  IMPORTANT: 'judgment',
};

const STANDARD_LABELS = {
  zh: {
    note: '花花的一句話',
    engineering: '花花的工程提醒',
    judgment: '花花的判斷',
  },
  en: {
    note: 'Huahua in one sentence',
    engineering: "Huahua's engineering note",
    judgment: "Huahua's take",
  },
};

function listMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return /\.mdx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function splitDocument(source) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!match) throw new Error('Missing frontmatter');
  return { frontmatter: match[0], body: source.slice(match[0].length) };
}

function localizeInternalLinks(line, locale) {
  if (locale !== 'en') return line;
  return line.replace(/(?<!!)\[([^\]]+)\]\((\/blog\/[^)\s]+)\)/g, (full, label, href) => {
    const pathname = href.split(/[?#]/, 1)[0];
    return pathname.endsWith('/') ? `[${label}](/en${href})` : full;
  });
}

function normalizeBody(body, locale, counters) {
  const output = [];
  let fence = null;

  for (const originalLine of body.split(/\r?\n/)) {
    const fenceMatch = originalLine.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      fence = fence === marker ? null : (fence ?? marker);
      output.push(originalLine);
      continue;
    }

    if (fence) {
      output.push(originalLine);
      continue;
    }

    if (/^\s*---\s*$/.test(originalLine)) {
      counters.horizontalRules += 1;
      continue;
    }

    if (/^\s*<img\b[^>]*\bstyle\s*=/i.test(originalLine)) {
      counters.rawStyledImages += 1;
      continue;
    }

    let line = originalLine.replace(
      /^(\s*#{2,3}\s+)(?:\p{Extended_Pictographic}\uFE0F?\s*)+/u,
      (_, prefix) => {
        counters.emojiHeadings += 1;
        return prefix;
      },
    );

    line = line.replace(
      /^(\s*>\s*)\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*$/i,
      (_, prefix, variant) => {
        counters.obsidianCallouts += 1;
        const normalizedVariant = OBSIDIAN_VARIANTS[variant.toUpperCase()];
        return `${prefix}**${STANDARD_LABELS[locale][normalizedVariant]}**`;
      },
    );

    line = line.replace(
      /^(\s*>\s*)\*\*([^*]+)\*\*/,
      (full, prefix, rawLabel) => {
        const cleanLabel = rawLabel.replace(/[:：\s]*$/, '').trim();
        const replacement = CALLOUT_LABELS[locale][cleanLabel];
        if (!replacement || replacement === cleanLabel) return full;
        counters.localizedCallouts += 1;
        return `${prefix}**${replacement}**`;
      },
    );

    line = line.replace(
      /^(\s*>\s*)\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/,
      (full, prefix, rawLabel, content) => {
        const cleanLabel = rawLabel.trim();
        if (!Object.values(STANDARD_LABELS[locale]).includes(cleanLabel)) return full;
        counters.expandedCallouts += 1;
        return `${prefix}**${cleanLabel}**\n>\n> ${content}`;
      },
    );

    const localized = localizeInternalLinks(line, locale);
    if (localized !== line) counters.localizedLinks += 1;
    output.push(localized.replace(/[ \t]+$/, ''));
  }

  return output.join('\n').replace(/^\n+/, '').trimEnd();
}

export function normalizeBlogCorpus() {
  const counters = {
    filesChanged: 0,
    horizontalRules: 0,
    obsidianCallouts: 0,
    localizedCallouts: 0,
    expandedCallouts: 0,
    localizedLinks: 0,
    rawStyledImages: 0,
    emojiHeadings: 0,
  };

  for (const filePath of listMarkdownFiles(BLOG_DIR)) {
    const locale = filePath.includes(`${path.sep}en${path.sep}`) ? 'en' : 'zh';
    const source = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = splitDocument(source);
    const normalized = `${frontmatter}${normalizeBody(body, locale, counters)}\n`;
    if (normalized === source) continue;
    fs.writeFileSync(filePath, normalized, 'utf8');
    counters.filesChanged += 1;
  }

  return counters;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(normalizeBlogCorpus(), null, 2));
}
