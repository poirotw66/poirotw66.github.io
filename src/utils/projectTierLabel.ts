import type { Lang } from '../i18n/ui';

/** Matches `projectTier` in `src/content.config.ts`. */
export type ProjectTier = 'flagship' | 'aigc' | 'main' | 'lab';

const LABELS: Record<ProjectTier, { zh: string; en: string }> = {
  flagship: { zh: '旗艦專案', en: 'Flagship' },
  aigc: { zh: 'AIGC', en: 'AIGC' },
  main: { zh: '主線專案', en: 'Main' },
  lab: { zh: '實驗室', en: 'Lab' },
};

export function projectTierLabel(tier: ProjectTier, lang: Lang): string {
  return LABELS[tier][lang];
}
