import type { Lang } from '../i18n/ui';
import { toLocalizedPath } from '../i18n/utils';
import { getLabProjects } from './sort';

export type LabZone = 'competition' | 'creative';

export const LAB_ZONE_ORDER: LabZone[] = ['competition', 'creative'];

type LabProjectEntry = {
  data: { labZone?: LabZone; pubDate: Date; tier: string };
};

export function resolveLabZone(zone?: LabZone): LabZone {
  return zone ?? 'creative';
}

export function groupLabProjectsByZone<T extends LabProjectEntry>(entries: T[]): Record<LabZone, T[]> {
  const grouped: Record<LabZone, T[]> = { competition: [], creative: [] };
  for (const entry of getLabProjects(entries)) {
    grouped[resolveLabZone(entry.data.labZone)].push(entry);
  }
  return grouped;
}

export function labZonesWithProjects<T extends LabProjectEntry>(
  entries: T[],
): { zone: LabZone; projects: T[] }[] {
  const grouped = groupLabProjectsByZone(entries);
  return LAB_ZONE_ORDER.filter((zone) => grouped[zone].length > 0).map((zone) => ({
    zone,
    projects: grouped[zone],
  }));
}

export function labZoneAnchor(zone: LabZone): string {
  return zone;
}

export function labZoneLabel(zone: LabZone, lang: Lang): string {
  const labels: Record<LabZone, { zh: string; en: string }> = {
    competition: { zh: '競賽專區', en: 'Competitions' },
    creative: { zh: '創意實驗', en: 'Creative Lab' },
  };
  return labels[zone][lang];
}

export function labZoneKicker(zone: LabZone, lang: Lang): string {
  const kickers: Record<LabZone, { zh: string; en: string }> = {
    competition: { zh: 'Kaggle · 資料科學競賽', en: 'Kaggle · Data science' },
    creative: { zh: 'Side projects · 工具與遊戲', en: 'Side projects · Tools & games' },
  };
  return kickers[zone][lang];
}

export function labZoneDescription(zone: LabZone, lang: Lang): string {
  const descriptions: Record<LabZone, { zh: string; en: string }> = {
    competition: {
      zh: 'Kaggle 與類似競賽的完整實作紀錄：研究、特徵工程、驗證策略與 leaderboard 心得。此專區會隨參賽逐步擴增。',
      en: 'End-to-end competition write-ups: research, feature engineering, validation, and leaderboard lessons. This section grows as new entries are added.',
    },
    creative: {
      zh: '靈光一現的 side projects：工具、遊戲與創意實驗，與主線 AI 工程專案分開呈現。',
      en: 'Quick experiments and side projects—tools, games, and creative builds—kept separate from flagship AI engineering work.',
    },
  };
  return descriptions[zone][lang];
}

export function labListParentPath(zone: LabZone | undefined, lang: Lang): string {
  const base = toLocalizedPath('/lab/', lang);
  if (zone === 'competition') {
    return `${base}#competition`;
  }
  return base;
}
