import type { Lang } from '../i18n/ui';

/** Curated homepage 「現在就能玩」 entries. Live URLs verified 2026-10-22. */
export type PlayableCategory =
  | 'games'
  | 'tools'
  | 'ai-studio'
  | 'creative'
  | 'lifestyle';

export type PlayableItem = Readonly<{
  id: string;
  href: string;
  image: string;
  imageAlt: Record<Lang, string>;
  category: PlayableCategory;
  title: Record<Lang, string>;
  pitch: Record<Lang, string>;
  canDo: Record<Lang, readonly string[]>;
  /** Optional build-method note; only when evidenced in repo/live copy. */
  buildNote?: Record<Lang, string>;
  applicationCategory: string;
}>;

export const PLAYABLE_CATEGORY_LABEL: Record<
  PlayableCategory,
  Record<Lang, string>
> = {
  games: { zh: '瀏覽器遊戲', en: 'Browser games' },
  tools: { zh: '設計工具', en: 'Design tools' },
  'ai-studio': { zh: 'AI 工作室', en: 'AI studio' },
  creative: { zh: '創作工具', en: 'Creator tools' },
  lifestyle: { zh: '生活工具', en: 'Everyday tools' },
};

/**
 * Six curated live demos for the homepage 「現在就能玩」 section.
 * Order is intentional. Copy is drawn from project/sticker write-ups and live page text.
 */
export const PLAYABLE_NOW_ITEMS: readonly PlayableItem[] = [
  {
    id: 'bloom-render',
    href: 'https://www.bloss0m.com/bloom-render/',
    image: '/playable/bloom-render.webp',
    imageAlt: {
      zh: 'BloomRender AI 修圖工作室畫面',
      en: 'BloomRender AI photo studio screen',
    },
    category: 'ai-studio',
    title: {
      zh: 'BloomRender',
      en: 'BloomRender',
    },
    pitch: {
      zh: '瀏覽器內的 AI 修圖與照片生成工作室：證件照、旅遊照、虛擬試穿。',
      en: 'Browser AI photo studio for ID photos, travel shots, and try-on.',
    },
    canDo: {
      zh: [
        '上傳照片後進行修圖、濾鏡、調整與裁切',
        '文字生圖，並可選擇長寬比與張數',
        '生成證件照、形象照、旅遊照與主題寫真',
        '上傳人物與服裝照做 AI 虛擬試穿',
        '自備 Gemini 或 OpenRouter API 金鑰即可使用',
      ],
      en: [
        'Upload a photo for retouch, filters, adjustments, and crop',
        'Generate images from text with aspect-ratio and count options',
        'Create ID photos, portraits, travel shots, and themed shoots',
        'Run AI virtual try-on with a portrait and clothing references',
        'Bring your own Gemini or OpenRouter API key',
      ],
    },
    applicationCategory: 'MultimediaApplication',
  },
  {
    id: 'clubhouse-games',
    href: 'https://www.bloss0m.com/Clubhouse-Games/',
    image: '/playable/clubhouse-games.webp',
    imageAlt: {
      zh: 'Clubhouse Games 遊戲總覽畫面',
      en: 'Clubhouse Games overview screen',
    },
    category: 'games',
    title: {
      zh: 'Clubhouse Games',
      en: 'Clubhouse Games',
    },
    pitch: {
      zh: '紙牌、棋盤到益智迷你遊戲，搜尋或依分類後在瀏覽器直接開玩。',
      en: 'Cards, boards, puzzles, and mini-games — filter and play in the browser.',
    },
    canDo: {
      zh: [
        '搜尋或依分類篩選，點「進入遊戲」即可開玩',
        '體驗紙牌、棋盤、運動、益智與迷你遊戲等多個分類',
        '瀏覽 Astra 實驗畫廊中的 AI 生成遊戲實驗',
        '免安裝、零費用，單一總覽選單串起各款網頁遊戲',
      ],
      en: [
        'Search or filter by category, then open a game in the browser',
        'Browse cards, boards, sports, puzzles, and mini-game categories',
        'Explore the Astra experimental gallery of AI-built game trials',
        'No install and no fee — one overview menu links every web build',
      ],
    },
    applicationCategory: 'GameApplication',
  },
  {
    id: 'sprite-animator',
    href: 'https://www.bloss0m.com/Sprite-Animator/',
    image: '/playable/sprite-animator.webp',
    imageAlt: {
      zh: 'Sprite-Animator 角色幀動畫工作室畫面',
      en: 'Sprite-Animator character animation studio screen',
    },
    category: 'creative',
    title: {
      zh: 'Sprite-Animator',
      en: 'Sprite-Animator',
    },
    pitch: {
      zh: '從單張角色圖生成動畫幀與精靈圖，輸出 APNG／GIF／ZIP。',
      en: 'Turn one character image into animation frames and sprite sheets.',
    },
    canDo: {
      zh: [
        '從單張角色立繪生成多段動畫幀與精靈圖',
        '使用逐幀模式或精靈圖模式，並微調網格與 Padding',
        '自動去背與色彩校正，切出乾淨貼圖素材',
        '輸出 APNG／GIF／ZIP，方便接上 LINE 貼圖流程',
      ],
      en: [
        'Generate multi-segment animation frames from one character art',
        'Work in frame-by-frame or sprite-sheet mode with grid fine-tuning',
        'Remove backgrounds and normalize colors for clean sticker assets',
        'Export APNG / GIF / ZIP for LINE sticker workflows',
      ],
    },
    applicationCategory: 'DesignApplication',
  },
  {
    id: 'bloom-picker',
    href: 'https://www.bloss0m.com/bloom-picker/',
    image: '/playable/bloom-picker.webp',
    imageAlt: {
      zh: 'Bloom Picker 雅色傳統色選色畫面',
      en: 'Bloom Picker traditional color palette screen',
    },
    category: 'tools',
    title: {
      zh: 'Bloom Picker · 雅色',
      en: 'Bloom Picker · Elegant Colors',
    },
    pitch: {
      zh: '250 款東亞傳統色，點選進入色境並檢查 WCAG 對比。',
      en: '250 East Asian traditional colors with WCAG contrast checks.',
    },
    canDo: {
      zh: [
        '瀏覽 250 款具文化脈絡的傳統色名與色碼',
        '點選色塊進入全螢幕色境，複製 HEX 等色碼',
        '用「今日之色」或「隨機一色」探索靈感',
        '檢查與黑／白文字的 WCAG 2.1 對比度（AA／AAA）',
        '收藏色票並匯出為 CSS 變數或 JSON',
      ],
      en: [
        'Browse 250 culturally named traditional colors and codes',
        'Enter a full-screen color view and copy HEX and related codes',
        'Explore with Color of the Day or Random Color',
        'Check WCAG 2.1 contrast against black or white text (AA / AAA)',
        'Save favorites and export as CSS variables or JSON',
      ],
    },
    applicationCategory: 'DesignApplication',
  },
  {
    id: 'square-couplets',
    href: 'https://www.bloss0m.com/Square_Couplets_Master/',
    image: '/playable/square-couplets.webp',
    imageAlt: {
      zh: '春聯斗方大師生成介面畫面',
      en: 'Square Couplets Master generation interface',
    },
    category: 'ai-studio',
    title: {
      zh: '春聯斗方大師',
      en: 'Square Couplets Master',
    },
    pitch: {
      zh: '輸入願望關鍵字，用 Gemini 生成傳統春聯斗方藝術圖。',
      en: 'Turn wish keywords into traditional square-couplet art with Gemini.',
    },
    canDo: {
      zh: [
        '輸入關鍵字自動生成菱形斗方書法藝術圖',
        '可上傳參考圖引導風格',
        '在 1K／2K／4K 與多種 Gemini 模型間切換',
        '於設定面板調整後預覽並下載成品',
      ],
      en: [
        'Generate diamond-shaped couplet calligraphy from keywords',
        'Upload a reference image to guide style',
        'Switch among 1K / 2K / 4K and multiple Gemini models',
        'Tune settings, preview results, and download the artwork',
      ],
    },
    applicationCategory: 'DesignApplication',
  },
  {
    id: 'bloom-kitchen',
    href: 'https://recipe.bloss0m.com/',
    image: '/playable/bloom-kitchen.webp',
    imageAlt: {
      zh: 'Bloom Kitchen 今天煮什麼食材搜尋畫面',
      en: 'Bloom Kitchen fridge-ingredient recipe finder screen',
    },
    category: 'lifestyle',
    title: {
      zh: 'Bloom Kitchen｜今天煮什麼',
      en: 'Bloom Kitchen｜What’s for dinner',
    },
    pitch: {
      zh: '輸入冰箱現有食材，快速找到今晚能煮的簡單料理。',
      en: 'Enter fridge ingredients and find simple dishes you can cook tonight.',
    },
    canDo: {
      zh: [
        '輸入 1 到 3 樣現有食材媒合今晚料理',
        '用雞蛋、豆腐等常用食材標籤快速點選',
        '依一人料理、10 分鐘、高蛋白、減脂等情境挑方向',
        '從食譜、食材與主題專區繼續逛',
      ],
      en: [
        'Match tonight’s dishes from 1–3 ingredients you already have',
        'Quick-pick common tags such as eggs or tofu',
        'Filter by situations: cooking for one, 10-minute, high-protein, lighter meals',
        'Browse recipes, ingredients, and themed collections',
      ],
    },
    applicationCategory: 'LifestyleApplication',
  },
];

export function playableNowCopy(lang: Lang) {
  if (lang === 'en') {
    return {
      kicker: 'Huahua Lab · Playable demos',
      title: 'Playable now',
      lead: 'Open a live side project in the browser. Click a card for what you can do there; use Open now to jump straight in.',
      status: 'Live',
      openLabel: 'Open now →',
      openAria: (title: string) => `Open ${title} in a new tab`,
      dialogTitle: (title: string) => `What you can do in ${title}`,
      closeLabel: 'Close',
      labCta: 'Browse Huahua Lab ↗',
      cardHint: 'Open details',
    } as const;
  }
  return {
    kicker: '花花實驗室 · 可玩 Demo',
    title: '現在就能玩',
    lead: '直接在瀏覽器打開 side project。點卡片看能做什麼；「立即開啟」則一鍵進場。',
    status: '公開中',
    openLabel: '立即開啟 →',
    openAria: (title: string) => `在新分頁開啟 ${title}`,
    dialogTitle: (title: string) => `${title}｜你可以做什麼`,
    closeLabel: '關閉',
    labCta: '逛花花實驗室 ↗',
    cardHint: '查看詳情',
  } as const;
}

export function playableNowJsonLd(lang: Lang, siteUrl: string) {
  const copy = playableNowCopy(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    description: copy.lead,
    numberOfItems: PLAYABLE_NOW_ITEMS.length,
    itemListElement: PLAYABLE_NOW_ITEMS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'WebApplication',
        name: item.title[lang],
        description: item.pitch[lang],
        url: item.href,
        image: new URL(item.image, siteUrl).toString(),
        applicationCategory: item.applicationCategory,
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'TWD' },
      },
    })),
  };
}
