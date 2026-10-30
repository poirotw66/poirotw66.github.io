import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { cacheImageDerivative } from './imageDerivativeCache.mjs';

const remoteManifest = new URL('../data/remoteImageDimensions.json', import.meta.url);
const remoteDimensions = fs.existsSync(remoteManifest) ? JSON.parse(fs.readFileSync(remoteManifest, 'utf8')) : {};

async function bodyImage(filePath, url, width, options, sourceBytes) {
  const targetWidth = Math.min(width, options.bodyImageWidth ?? 2400);
  const maxBytes = options.bodyImageMaxBytes ?? 500 * 1024;
  const target = filePath.replace(/\.[^.]+$/, '-body.webp');
  const outputUrl = url.split(/[?#]/, 1)[0].replace(/\.[^.]+$/, '-body.webp');
  await cacheImageDerivative({
    sourcePath: filePath, sourceBytes, outputPath: target, id: outputUrl, cacheDir: options.cacheDir,
    recipe: { kind: 'body', targetWidth, maxBytes, quality: options.bodyImageQuality ?? 82, withoutEnlargement: true },
    implementation: import.meta.url,
    generate: async (source) => {
      let outputWidth = targetWidth;
      let buffer;
      do {
        buffer = await sharp(source).resize({ width: outputWidth, withoutEnlargement: true }).webp({ quality: options.bodyImageQuality ?? 82 }).toBuffer();
        if (buffer.length <= maxBytes || outputWidth <= 600) break;
        outputWidth = Math.max(600, Math.floor(outputWidth * 0.8));
      } while (true);
      return buffer;
    },
  });
  return outputUrl;
}

function collectImages(node, images = []) {
  if (!node || typeof node !== 'object') return images;
  if (node.type === 'image' && typeof node.url === 'string') images.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectImages(child, images);
  }
  return images;
}

function resolvePublicImage(url, publicDir) {
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const publicRoot = path.resolve(publicDir);
  const filePath = path.resolve(publicRoot, `.${pathname}`);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) return null;
  return fs.existsSync(filePath) ? filePath : null;
}

export async function preparePublicImage(url, options = {}) {
  const filePath = resolvePublicImage(url, options.publicDir ?? path.resolve(process.cwd(), 'public'));
  // Buffer input avoids libvips' filename cache after an in-place source update.
  const sourceBytes = filePath ? await fs.promises.readFile(filePath) : null;
  const metadata = sourceBytes ? await sharp(sourceBytes).metadata() : remoteDimensions[url];
  let src = url;
  if (filePath && metadata?.width && !(metadata.pages > 1) && /\.(?:png|jpe?g|webp|avif)$/i.test(filePath) && sourceBytes.length > 500 * 1024) {
    src = await bodyImage(filePath, url, metadata.width, options, sourceBytes);
  }
  return { src, ...(metadata?.width && metadata?.height ? { width: metadata.width, height: metadata.height } : {}) };
}

export default function remarkImageDimensions(options = {}) {
  return async (tree) => {
    const images = collectImages(tree);
    await Promise.all(images.map(async (node) => {
      if (!node.url.startsWith('/') && !/^https:\/\//.test(node.url)) return;
      const { src, ...dimensions } = await preparePublicImage(node.url, options);
      const originalUrl = node.url;
      node.url = src;
      node.data ??= {};
      node.data.hProperties = { ...node.data.hProperties, loading: 'lazy', decoding: 'async', ...dimensions };
      if (src !== originalUrl) node.data.originalImage = originalUrl;
    }));
    const linkOriginals = (parent) => {
      if (!Array.isArray(parent.children)) return;
      parent.children = parent.children.map((child) => {
        if (parent.type !== 'link' && child.type === 'image' && child.data?.originalImage) {
          return { type: 'link', url: child.data.originalImage, children: [child] };
        }
        linkOriginals(child);
        return child;
      });
    };
    for (const child of tree.children ?? []) linkOriginals(child);
  };
}
