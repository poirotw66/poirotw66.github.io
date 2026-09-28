import type { Lang } from '../i18n/ui.ts';

export function archivePagePath(basePath: string, page: number, lang: Lang): string {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError('Archive page must be a positive integer.');
  }

  const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, '')}/`;
  const pathname = page === 1 ? normalizedBase : `${normalizedBase}page/${page}/`;
  return lang === 'en' ? `/en${pathname}` : pathname;
}
