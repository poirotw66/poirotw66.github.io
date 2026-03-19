import { ui, type Lang, type UiKey } from './ui';

export type { Lang, UiKey } from './ui';

type TranslationParams = Record<string, string | number>;

function format(template: string, params: TranslationParams): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function useTranslations(lang: Lang) {
  return (key: UiKey, params?: TranslationParams): string => {
    const template = ui[lang][key];
    if (!params) return template;
    return format(template, params);
  };
}

export function getHtmlLang(lang: Lang): string {
  return lang === 'zh' ? 'zh-Hant' : 'en';
}

export function toLocalizedPath(pathname: string, lang: Lang): string {
  const normalized = pathname === '' ? '/' : pathname;
  const withoutEn = normalized.startsWith('/en/') ? normalized.slice(3) : normalized === '/en' ? '/' : normalized;
  if (lang === 'zh') return withoutEn;
  if (withoutEn === '/') return '/en/';
  return `/en${withoutEn.startsWith('/') ? '' : '/'}${withoutEn}`.replace(/\/{2,}/g, '/');
}

export function getAlternatePath(pathname: string, currentLang: Lang): string {
  return toLocalizedPath(pathname, currentLang === 'zh' ? 'en' : 'zh');
}
