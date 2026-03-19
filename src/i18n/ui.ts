export const ui = {
  zh: {
    'site.name': 'Bloss0m',
    'nav.projects': '專案',
    'nav.blog': '部落格',
    'nav.paperReading': '論文精讀',
    'nav.lab': '實驗室',
    'nav.stickers': '貼圖',
    'nav.contact': '聯絡',
    'skipToMain': '跳過至主內容',
    'theme.dark': '黑夜',
    'theme.warm': '暖色',
    'lang.enShort': 'EN',
    'lang.zhShort': '繁中',
    'lang.enLabel': 'English',
    'lang.zhLabel': '繁體中文',
  },
  en: {
    'site.name': 'Bloss0m',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.paperReading': 'Paper Reading',
    'nav.lab': 'Lab',
    'nav.stickers': 'Stickers',
    'nav.contact': 'Contact',
    'skipToMain': 'Skip to main content',
    'theme.dark': 'Dark',
    'theme.warm': 'Warm',
    'lang.enShort': 'EN',
    'lang.zhShort': '繁中',
    'lang.enLabel': 'English',
    'lang.zhLabel': '繁體中文',
  },
} as const;

export type Lang = keyof typeof ui;

export type UiKey = keyof (typeof ui)['zh'];
