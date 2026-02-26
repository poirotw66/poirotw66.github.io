/**
 * Resolve sticker asset path: if path is absolute (starts with /), return as-is;
 * otherwise treat as filename under /stickers/{slug}/.
 */
export function resolveStickerAsset(slug: string, path: string): string {
  return path.startsWith('/') ? path : `/stickers/${slug}/${path}`;
}

export function resolveStickerAssets(slug: string, paths: string[]): string[] {
  return paths.map((p) => resolveStickerAsset(slug, p));
}
