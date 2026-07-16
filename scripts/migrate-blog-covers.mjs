/**
 * P0/P1 blog asset migration:
 * 1) Align asset dirs 03/09/10 with markdown ids
 * 2) Fix typo 11-harness-enginnering -> 11-harness-engineering
 * 3) Normalize each post cover to /blog/<id>/title_image.webp (target ~100-250KB)
 * 4) Compress leftover og_image.* to og_image.webp
 *
 * Usage: node scripts/migrate-blog-covers.mjs
 */
import sharp from 'sharp';
import {
  copyFile,
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_MD = join(ROOT, 'src/content/blog');
const BLOG_PUBLIC = join(ROOT, 'public/blog');

const TARGET_MAX = 250 * 1024;
const TARGET_SOFT = 180 * 1024;
const COVER_MAX_EDGE = 1280;
const OG_MAX_EDGE = 1200;

function parseImageField(frontmatter) {
  const m = frontmatter.match(/^image:\s*"([^"]+)"/m);
  return m ? m[1] : null;
}

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('missing frontmatter');
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
    raw: match[0],
  };
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function moveDir(from, to) {
  if (!existsSync(from)) {
    console.log(`  skip move (missing): ${from}`);
    return;
  }
  if (existsSync(to)) {
    // merge files
    for (const name of await readdir(from)) {
      const src = join(from, name);
      const dest = join(to, name);
      if (!existsSync(dest)) {
        await cp(src, dest, { recursive: true });
      }
    }
    await rm(from, { recursive: true, force: true });
  } else {
    await cp(from, to, { recursive: true });
    await rm(from, { recursive: true, force: true });
  }
  console.log(`  moved ${basename(from)} -> ${basename(to)}`);
}

async function replaceInTree(rootDir, replacements) {
  const exts = new Set(['.md', '.astro', '.ts', '.js', '.mjs']);
  async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', '.astro'].includes(entry.name)) continue;
        yield* walk(full);
      } else if (exts.has(extname(entry.name))) {
        yield full;
      }
    }
  }

  let filesChanged = 0;
  for await (const file of walk(rootDir)) {
    let text = await readFile(file, 'utf8');
    let changed = false;
    for (const [from, to] of replacements) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      await writeFile(file, text);
      filesChanged++;
    }
  }
  return filesChanged;
}

async function compressToWebp(inputPath, outputPath, { maxEdge, preferBytes }) {
  const input = sharp(inputPath, { failOn: 'none' });
  const meta = await input.metadata();
  let width = Math.min(maxEdge, meta.width || maxEdge);
  let quality = 82;
  let best = null;

  for (let i = 0; i < 8; i++) {
    const tmp = `${outputPath}.tmp-${i}.webp`;
    await sharp(inputPath, { failOn: 'none' })
      .rotate()
      .resize({
        width,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6 })
      .toFile(tmp);

    const size = (await stat(tmp)).size;
    if (!best || size < best.size) {
      if (best) await rm(best.path, { force: true });
      best = { path: tmp, size, quality, width };
    } else {
      await rm(tmp, { force: true });
    }

    if (size <= preferBytes) break;
    if (size > TARGET_MAX) {
      quality = Math.max(45, quality - 12);
      width = Math.max(720, Math.round(width * 0.88));
    } else {
      quality = Math.max(50, quality - 8);
    }
  }

  if (existsSync(outputPath)) await rm(outputPath, { force: true });
  await rename(best.path, outputPath);
  // cleanup leftover temps
  for (let i = 0; i < 8; i++) {
    await rm(`${outputPath}.tmp-${i}.webp`, { force: true }).catch(() => {});
  }
  return best.size;
}

async function structuralRenames() {
  console.log('\n== Structural renames ==');
  await moveDir(
    join(BLOG_PUBLIC, '03-line-sticker'),
    join(BLOG_PUBLIC, '03-line-sticker-quick-launch'),
  );
  await moveDir(
    join(BLOG_PUBLIC, '09-harness-design'),
    join(BLOG_PUBLIC, '09-harness-design-long-running-apps'),
  );
  await moveDir(
    join(BLOG_PUBLIC, '10-effective-harnesses'),
    join(BLOG_PUBLIC, '10-effective-harnesses-for-long-running-agents'),
  );

  // typo fix for post 11
  const oldMd = join(BLOG_MD, '11-harness-enginnering.md');
  const newMd = join(BLOG_MD, '11-harness-engineering.md');
  if (existsSync(oldMd)) {
    await rename(oldMd, newMd);
    console.log('  renamed markdown 11-harness-enginnering.md');
  }
  await moveDir(
    join(BLOG_PUBLIC, '11-harness-enginnering'),
    join(BLOG_PUBLIC, '11-harness-engineering'),
  );

  const replacements = [
    ['/blog/03-line-sticker/', '/blog/03-line-sticker-quick-launch/'],
    ['/blog/09-harness-design/', '/blog/09-harness-design-long-running-apps/'],
    ['/blog/10-effective-harnesses/', '/blog/10-effective-harnesses-for-long-running-agents/'],
    ['/blog/11-harness-enginnering/', '/blog/11-harness-engineering/'],
    ['11-harness-enginnering', '11-harness-engineering'],
  ];
  const changed = await replaceInTree(join(ROOT, 'src'), replacements);
  console.log(`  updated ${changed} source files with path renames`);
}

async function migrateCovers() {
  console.log('\n== Cover normalization to title_image.webp ==');
  const files = (await readdir(BLOG_MD)).filter((f) => f.endsWith('.md')).sort();
  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const mdPath = join(BLOG_MD, file);
    const content = await readFile(mdPath, 'utf8');
    const { frontmatter, body, raw } = splitFrontmatter(content);
    const image = parseImageField(frontmatter);
    if (!image) {
      skipped++;
      continue;
    }

    const assetDir = join(BLOG_PUBLIC, id);
    await ensureDir(assetDir);
    const dest = join(assetDir, 'title_image.webp');
    const publicSrc = join(ROOT, 'public', image.replace(/^\//, ''));

    // Resolve source file for conversion
    let source = publicSrc;
    if (!existsSync(source)) {
      console.warn(`  ! missing source for ${id}: ${image}`);
      skipped++;
      continue;
    }

    // If already canonical and small enough, keep
    if (image === `/blog/${id}/title_image.webp` && existsSync(dest)) {
      const size = (await stat(dest)).size;
      if (size <= TARGET_MAX) {
        skipped++;
        continue;
      }
      source = dest; // recompress oversized canonical cover
    }

    const ext = extname(source).toLowerCase();
    if (ext === '.svg') {
      // Rasterize SVG covers via sharp when possible
      console.log(`  rasterizing SVG cover for ${id}`);
    }

    const size = await compressToWebp(source, dest, {
      maxEdge: COVER_MAX_EDGE,
      preferBytes: TARGET_SOFT,
    });

    const newImage = `/blog/${id}/title_image.webp`;
    let newFrontmatter = frontmatter;
    if (image !== newImage) {
      newFrontmatter = frontmatter.replace(/^image:\s*"[^"]+"/m, `image: "${newImage}"`);
    }
    // Also rewrite body refs that pointed at the old cover path
    let newBody = body;
    if (image !== newImage) {
      newBody = body.split(image).join(newImage);
    }
    // Common hyphen variant in same folder
    const oldHyphen = `/blog/${id}/title-image.webp`;
    if (oldHyphen !== newImage) {
      newBody = newBody.split(oldHyphen).join(newImage);
      newFrontmatter = newFrontmatter.split(oldHyphen).join(newImage);
    }

    const newRaw = `---\n${newFrontmatter}\n---${newBody.startsWith('\n') ? '' : '\n'}${newBody}`;
    // preserve exact body start after frontmatter
    const rebuilt = `---\n${newFrontmatter}\n---\n${body.startsWith('\n') ? body.slice(1) : body}`;
    // Prefer careful rebuild: keep body unless cover path substitutions needed
    const finalBody = image === newImage && !body.includes(oldHyphen) ? body : newBody;
    const finalContent = `---\n${newFrontmatter}\n---${finalBody.startsWith('\n') ? finalBody : `\n${finalBody}`}`;
    // Normalize to single leading newline after frontmatter
    const normalized = `---\n${newFrontmatter}\n---\n${finalBody.replace(/^\n*/, '')}`;
    await writeFile(mdPath, normalized);

    console.log(
      `  ✓ ${id}: ${(size / 1024).toFixed(1)}KB -> ${newImage}`,
    );
    migrated++;
  }

  console.log(`  migrated=${migrated}, skipped=${skipped}`);
}

async function compressOgImages() {
  console.log('\n== Compress og_image.* ==');
  let count = 0;
  for (const dirent of await readdir(BLOG_PUBLIC, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const dir = join(BLOG_PUBLIC, dirent.name);
    for (const name of await readdir(dir)) {
      if (!/^og_image\.(png|jpg|jpeg|webp)$/i.test(name)) continue;
      const src = join(dir, name);
      const dest = join(dir, 'og_image.webp');
      // Avoid recompressing a file into itself incorrectly
      const sourceForCompress = src;
      const size = await compressToWebp(sourceForCompress, dest + '.out', {
        maxEdge: OG_MAX_EDGE,
        preferBytes: 180 * 1024,
      });
      if (existsSync(dest)) await rm(dest, { force: true });
      await rename(dest + '.out', dest);
      if (src !== dest) {
        // keep original only if still referenced; otherwise remove large raster originals
        const sizeOrig = (await stat(src)).size;
        if (sizeOrig > 300 * 1024 && /\.(png|jpg|jpeg)$/i.test(src)) {
          await rm(src, { force: true });
        }
      }
      console.log(`  ✓ ${dirent.name}/og_image.webp ${(size / 1024).toFixed(1)}KB`);
      count++;
    }
  }
  console.log(`  compressed ${count} og images`);
}

async function cleanupOldCovers() {
  console.log('\n== Cleanup unreferenced old cover filenames ==');
  // Gather referenced image paths
  const referenced = new Set();
  for (const file of await readdir(BLOG_MD)) {
    if (!file.endsWith('.md')) continue;
    const text = await readFile(join(BLOG_MD, file), 'utf8');
    for (const m of text.matchAll(/\/blog\/[^)"'\s]+/g)) {
      referenced.add(m[0]);
    }
  }

  const candidates = [
    'title_image.jpg',
    'title_image.png',
    'title_image.jpeg',
    'title-image.jpg',
    'title-image.webp',
    'cover.jpg',
    'cover.webp',
    'banner.png',
    'banner.webp',
  ];

  let removed = 0;
  for (const dirent of await readdir(BLOG_PUBLIC, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const dir = join(BLOG_PUBLIC, dirent.name);
    for (const name of await readdir(dir)) {
      if (!candidates.includes(name) && !/^image_0\.(jpg|png|jpeg)$/i.test(name) && name !== 'generate_2_image.webp' && name !== 'method-three-pass.webp') {
        continue;
      }
      // Never delete the canonical cover
      if (name === 'title_image.webp') continue;
      const rel = `/blog/${dirent.name}/${name}`;
      if (referenced.has(rel)) continue;
      const full = join(dir, name);
      // only remove if a canonical cover exists
      if (!existsSync(join(dir, 'title_image.webp'))) continue;
      const size = (await stat(full)).size;
      await rm(full, { force: true });
      removed++;
      console.log(`  removed ${rel} (${(size / 1024).toFixed(1)}KB)`);
    }
  }
  console.log(`  removed ${removed} old cover files`);
}

async function patchAstroRedirects() {
  console.log('\n== Patch astro redirects for post 11 typo ==');
  const configPath = join(ROOT, 'astro.config.mjs');
  let text = await readFile(configPath, 'utf8');
  const block = `    '/blog/11-harness-enginnering': '/blog/11-harness-engineering',
    '/blog/11-harness-enginnering/': '/blog/11-harness-engineering/',
    '/en/blog/11-harness-enginnering': '/en/blog/11-harness-engineering',
    '/en/blog/11-harness-enginnering/': '/en/blog/11-harness-engineering/',
`;
  if (text.includes('/blog/11-harness-enginnering')) {
    console.log('  redirects already present');
    return;
  }
  text = text.replace(
    '  redirects: {\n',
    `  redirects: {\n${block}`,
  );
  await writeFile(configPath, text);
  console.log('  added 11 typo redirects');
}

async function main() {
  await structuralRenames();
  await patchAstroRedirects();
  await migrateCovers();
  await compressOgImages();
  await cleanupOldCovers();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
