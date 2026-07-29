import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

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

export default function remarkImageDimensions(options = {}) {
  const publicDir = options.publicDir ?? path.resolve(process.cwd(), 'public');

  return async (tree) => {
    const images = collectImages(tree);
    await Promise.all(images.map(async (node) => {
      const filePath = resolvePublicImage(node.url, publicDir);
      if (!filePath) return;
      const metadata = await sharp(filePath).metadata();
      if (!metadata.width || !metadata.height) return;
      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        width: metadata.width,
        height: metadata.height,
        loading: 'lazy',
        decoding: 'async',
      };
    }));
  };
}
