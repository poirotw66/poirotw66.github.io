import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.resolve(ROOT_DIR, 'src/content');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

const REQUIRED_FIELDS_BY_COLLECTION = {
  blog: ['title', 'description', 'pubDate', 'category'],
  paperReading: ['title', 'description', 'pubDate', 'paper'],
  projects: ['title', 'description', 'pubDate', 'tier'],
  stickers: ['title', 'description', 'lineStoreUrl', 'pubDate'],
  stickerTools: ['title', 'description', 'repoUrl', 'order'],
};

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function walkFiles(targetDir) {
  const files = [];
  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function splitFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Invalid frontmatter block in ${filePath}`);
  }
  const frontmatter = match[1];
  const body = content.slice(match[0].length);
  return { frontmatter, body };
}

function parseTopLevelFields(frontmatter) {
  const fields = new Map();
  // Normalize CRLF / lone CR so top-level `key: value` lines match on Windows.
  const lines = frontmatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line || line.startsWith(' ') || line.startsWith('\t') || line.trim().startsWith('#')) {
      continue;
    }
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, value] = match;
    fields.set(key, value.trim());
  }
  return fields;
}

function stripQueryAndHash(raw) {
  const normalized = raw.split('#')[0].split('?')[0];
  try {
    return decodeURI(normalized);
  } catch {
    return normalized;
  }
}

function hasFileExtension(linkPath) {
  return path.extname(linkPath) !== '';
}

function shouldSkipHref(href) {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#') ||
    href.startsWith('file://')
  );
}

function resolveLocalPath(filePath, linkValue) {
  const normalized = stripQueryAndHash(linkValue);
  if (!normalized) return null;
  if (normalized.startsWith('/')) {
    return path.resolve(PUBLIC_DIR, `.${normalized}`);
  }
  return path.resolve(path.dirname(filePath), normalized);
}

function collectMarkdownLinks(body) {
  const results = [];
  const markdownLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of body.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.startsWith('<') && rawTarget.endsWith('>')
      ? rawTarget.slice(1, -1).trim()
      : rawTarget;
    results.push({ target, isImage: match[0].startsWith('!'), fullMatch: match[0] });
  }
  return results;
}

function extractAltText(markdownImage) {
  // 從 ![alt](url) 提取 alt 文字
  const match = markdownImage.match(/!\[([^\]]*)\]/);
  return match ? match[1].trim() : '';
}

function validateImageAltText(body, filePath) {
  const issues = [];
  const imagePattern = /!\[[^\]]*\]\([^)]+\)/g;
  
  for (const match of body.matchAll(imagePattern)) {
    const altText = extractAltText(match[0]);
    
    // 檢查 alt 文字是否存在
    if (!altText) {
      issues.push(`Image missing alt text in ${filePath}: ${match[0].substring(0, 50)}...`);
      continue;
    }
    
    // 檢查 alt 文字長度
    if (altText.length < 3) {
      issues.push(`Image alt text too short in ${filePath}: "${altText}"`);
    }
    
    // 檢查是否包含無意義的文字
    const badPatterns = ['image', 'picture', 'photo', 'img', 'TODO'];
    const lowerAlt = altText.toLowerCase();
    for (const pattern of badPatterns) {
      if (lowerAlt.includes(pattern)) {
        issues.push(`Image alt text may be non-descriptive in ${filePath}: "${altText}"`);
        break;
      }
    }
  }
  
  return issues;
}

function getCollectionName(filePath) {
  const relative = path.relative(CONTENT_DIR, filePath);
  const [collection] = relative.split(path.sep);
  return collection;
}

function validateFile(filePath) {
  const issues = [];
  const warnings = [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw, filePath);
  const fields = parseTopLevelFields(frontmatter);

  const collection = getCollectionName(filePath);
  const requiredFields = REQUIRED_FIELDS_BY_COLLECTION[collection] ?? [];
  for (const fieldName of requiredFields) {
    if (!fields.has(fieldName)) {
      issues.push(`Missing required frontmatter field "${fieldName}" in ${filePath}`);
    }
  }

  const frontmatterImage = fields.get('image');
  if (frontmatterImage) {
    const imagePath = frontmatterImage.replace(/^['"]|['"]$/g, '');
    if (!shouldSkipHref(imagePath)) {
      let resolved;
      if (collection === 'stickers' && !imagePath.startsWith('/')) {
        const stickerSlug = path.basename(filePath, path.extname(filePath));
        resolved = path.resolve(PUBLIC_DIR, `stickers/${stickerSlug}/${imagePath}`);
      } else {
        resolved = resolveLocalPath(filePath, imagePath);
      }
      if (resolved && !fs.existsSync(resolved)) {
        // 檢查是否有 WebP 版本
        const ext = path.extname(resolved).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          const webpPath = resolved.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          if (!fs.existsSync(webpPath)) {
            warnings.push(`Frontmatter image not found: ${imagePath} (${filePath})`);
          }
        } else {
          warnings.push(`Frontmatter image not found: ${imagePath} (${filePath})`);
        }
      }
    }
  }

  for (const { target, isImage } of collectMarkdownLinks(body)) {
    if (shouldSkipHref(target)) {
      continue;
    }
    const normalized = stripQueryAndHash(target);
    if (!hasFileExtension(normalized)) {
      continue;
    }
    const resolved = resolveLocalPath(filePath, normalized);
    if (resolved && !fs.existsSync(resolved)) {
      // 如果是圖片且找不到，嘗試檢查 WebP 版本
      if (isImage) {
        const ext = path.extname(resolved).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          const webpPath = resolved.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          if (fs.existsSync(webpPath)) {
            // WebP 版本存在，跳過錯誤
            continue;
          }
        }
      }
      const kind = isImage ? 'Image' : 'Link';
      issues.push(`${kind} target not found: ${target} (${filePath})`);
    }
  }

  // 驗證圖片 alt 文字
  const altIssues = validateImageAltText(body, filePath);
  issues.push(...altIssues);

  return { issues, warnings };
}

function validateUniqueBlogNumberPrefixes() {
  const blogDir = path.resolve(CONTENT_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const errors = [];
  const byPrefix = new Map();
  for (const fileName of fs.readdirSync(blogDir)) {
    if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) continue;
    const match = fileName.match(/^(\d+)-/);
    if (!match) {
      errors.push(`Blog post missing numeric prefix: ${fileName}`);
      continue;
    }
    const prefix = match[1];
    const list = byPrefix.get(prefix) ?? [];
    list.push(fileName);
    byPrefix.set(prefix, list);
  }

  for (const [prefix, files] of byPrefix) {
    if (files.length > 1) {
      errors.push(`Duplicate blog number prefix "${prefix}": ${files.join(', ')}`);
    }
  }
  return errors;
}

function runCli() {
  const contentFiles = walkFiles(CONTENT_DIR);
  const errors = [];
  const warnings = [];

  errors.push(...validateUniqueBlogNumberPrefixes());

  for (const filePath of contentFiles) {
    const result = validateFile(filePath);
    errors.push(...result.issues);
    warnings.push(...result.warnings);
  }

  if (errors.length > 0) {
    console.error('Content validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('Content validation warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  console.log(`Content validation passed (${contentFiles.length} files).`);
}

runCli();
