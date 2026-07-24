import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SOURCE_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);

export const COVER_VARIANTS = {
  thumb: { width: 200, height: 125, quality: 72 },
  card: { width: 480, height: 300, quality: 76 },
  hero: { width: 1200, height: 750, quality: 78 },
};

async function walkMarkdownFiles(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdownFiles(fullPath));
    else if (/\.(?:md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

export function extractFrontmatterImage(content) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const image = frontmatter?.[1].match(/^image:\s*["']?([^"'\r\n]+)["']?\s*$/m);
  return image?.[1]?.trim();
}

export function responsiveCoverPath(sourcePath, variant) {
  if (
    !sourcePath?.startsWith('/')
    || !SOURCE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())
  ) {
    return sourcePath;
  }
  return sourcePath.replace(/\.[^.]+$/, `-${variant}.webp`);
}

async function collectSources() {
  const sources = new Set();
  for (const filePath of await walkMarkdownFiles(CONTENT_DIR)) {
    const image = extractFrontmatterImage(await fs.readFile(filePath, 'utf8'));
    if (!image?.startsWith('/')) continue;
    const sourcePath = path.join(PUBLIC_DIR, image.slice(1));
    if (SOURCE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())) {
      try {
        await fs.access(sourcePath);
        sources.add(sourcePath);
      } catch {
        // The regular content validator reports missing frontmatter images.
      }
    }
  }
  return [...sources].sort();
}

async function outputIsFresh(sourcePath, outputPath) {
  try {
    const [sourceStat, outputStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(outputPath),
    ]);
    return outputStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

export async function generateResponsiveCovers() {
  const sources = await collectSources();
  let generated = 0;
  let current = 0;

  for (const sourcePath of sources) {
    const publicPath = `/${path.relative(PUBLIC_DIR, sourcePath).replaceAll(path.sep, '/')}`;
    for (const [variant, options] of Object.entries(COVER_VARIANTS)) {
      const outputPublicPath = responsiveCoverPath(publicPath, variant);
      const outputPath = path.join(PUBLIC_DIR, outputPublicPath.slice(1));
      if (await outputIsFresh(sourcePath, outputPath)) {
        current += 1;
        continue;
      }
      await sharp(sourcePath)
        .rotate()
        .resize(options.width, options.height, { fit: 'cover', position: 'centre' })
        .webp({ quality: options.quality, effort: 6 })
        .toFile(outputPath);
      generated += 1;
    }
  }

  return { sourceCount: sources.length, generated, current };
}

async function runCli() {
  const result = await generateResponsiveCovers();
  console.log(
    `Responsive covers ready: ${result.sourceCount} sources, ${result.generated} generated, ${result.current} already current.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
