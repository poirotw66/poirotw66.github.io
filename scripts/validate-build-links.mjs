import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DIST = path.resolve('dist');

/**
 * Recursively find all HTML files within a directory.
 */
function findHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Resolve an internal pathname against the dist directory.
 * Supports directory index files, flat .html files, and static files.
 */
function resolveInternalPath(distDir, pathname) {
  const decoded = decodeURIComponent(pathname);
  const clean = decoded.startsWith('/') ? decoded.slice(1) : decoded;
  const directPath = path.join(distDir, clean);

  if (fs.existsSync(directPath)) {
    if (fs.statSync(directPath).isDirectory()) {
      const indexPath = path.join(directPath, 'index.html');
      if (fs.existsSync(indexPath)) return indexPath;
    } else {
      return directPath;
    }
  }

  const htmlVariant = directPath.replace(/\/+$/u, '') + '.html';
  if (fs.existsSync(htmlVariant)) {
    return htmlVariant;
  }

  const indexVariant = path.join(directPath.replace(/\/+$/u, ''), 'index.html');
  if (fs.existsSync(indexVariant)) {
    return indexVariant;
  }

  return null;
}

/**
 * Check whether a target HTML file contains an element with the given ID or name.
 */
function hasAnchor(htmlContent, anchorId) {
  if (anchorId.toLowerCase() === 'top') return true;
  // Support encoded and decoded ID comparisons
  const candidates = [anchorId, encodeURIComponent(anchorId), decodeURIComponent(anchorId)];
  for (const cand of candidates) {
    const pattern = new RegExp(`(?:id|name)=["']${cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
    if (pattern.test(htmlContent)) return true;
  }
  return false;
}

/**
 * Validate all internal links and anchors across built HTML files in dist.
 */
export function validateBuildLinks(distDir = DEFAULT_DIST) {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Build directory does not exist: ${distDir}. Run npm run build first.`);
  }

  const htmlFiles = findHtmlFiles(distDir);
  const issues = [];
  const linkRegex = /<a\s+[^>]*?href=["']([^"']+)["']/gis;
  const htmlCache = new Map();

  function getHtmlContent(filePath) {
    if (!htmlCache.has(filePath)) {
      htmlCache.set(filePath, fs.readFileSync(filePath, 'utf8'));
    }
    return htmlCache.get(filePath);
  }

  for (const htmlFile of htmlFiles) {
    const content = getHtmlContent(htmlFile);

    // Skip Astro-generated redirect stub files (they have meta refresh and only exist to redirect legacy URLs)
    if (content.includes('<meta http-equiv="refresh"')) {
      continue;
    }

    let match;
    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(content)) !== null) {
      const rawHref = match[1].trim();

      // Skip external schemes, telephone, mailto, javascript, pure hash, template strings
      if (
        !rawHref ||
        /^(?:https?:\/\/|mailto:|tel:|javascript:|#$)/i.test(rawHref) ||
        /\$\{[^}]+\}/.test(rawHref) ||
        /\{\{[^}]+\}\}/.test(rawHref)
      ) {
        continue;
      }

      const [pathWithQuery, hashPart] = rawHref.split('#');
      const [pathPart] = pathWithQuery.split('?');
      let targetFile = htmlFile;

      if (pathPart) {
        // Resolve internal link target
        targetFile = resolveInternalPath(distDir, pathPart);
        if (!targetFile) {
          issues.push({
            source: path.relative(distDir, htmlFile),
            href: rawHref,
            type: 'broken-path',
            message: `Target route not found: ${pathPart}`,
          });
          continue;
        }
      }

      // If an anchor is present and target is an HTML file, verify anchor existence
      if (hashPart && targetFile.endsWith('.html')) {
        const targetContent = getHtmlContent(targetFile);
        if (!hasAnchor(targetContent, hashPart)) {
          issues.push({
            source: path.relative(distDir, htmlFile),
            href: rawHref,
            type: 'broken-anchor',
            message: `Anchor #${hashPart} not found in ${path.relative(distDir, targetFile)}`,
          });
        }
      }
    }
  }

  return {
    totalFiles: htmlFiles.length,
    issues,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const result = validateBuildLinks();
    if (result.issues.length > 0) {
      console.error(`Found ${result.issues.length} link / anchor issue(s) across ${result.totalFiles} HTML files:\n`);
      for (const issue of result.issues) {
        console.error(`  - [${issue.type}] ${issue.source} -> ${issue.href}: ${issue.message}`);
      }
      process.exit(1);
    }
    console.log(`Internal links and anchors validated successfully across ${result.totalFiles} HTML files.`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
