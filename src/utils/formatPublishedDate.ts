import type { Lang } from '../i18n/ui';

export function formatPublishedDate(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW', {
    year: 'numeric',
    month: lang === 'en' ? 'short' : '2-digit',
    day: 'numeric',
  });
}

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}
