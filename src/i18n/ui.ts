export const ui = {
  zh: {
    'site.name': 'Bloss0m',
    'nav.projects': '專案',
    'nav.blog': '部落格',
    'nav.paperReading': '論文精讀',
    'nav.search': '搜尋',
    'nav.lab': '花花實驗室',
    'nav.now': 'Studio 更新',
    'nav.stickers': '貼圖',
    'nav.contact': '聯絡',
    'nav.landmark': '網站導覽',
    'nav.menuButton': '切換導覽選單',
    'skipToMain': '跳過至主內容',
    'theme.dark': '黑夜',
    'theme.warm': '暖色',
    'lang.enShort': 'EN',
    'lang.zhShort': '繁中',
    'lang.enLabel': 'English',
    'lang.zhLabel': '繁體中文',
    'footer.secondaryNav': '更多',
    'footer.note':
      '除另有標示外，本站文章與專案說明為作者原創；程式碼授權請見各儲存庫。',
    'blog.tocTitle': '本文目錄',
  },
  en: {
    'site.name': 'Bloss0m',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.paperReading': 'Paper Reading',
    'nav.search': 'Search',
    'nav.lab': 'Huahua Lab',
    'nav.now': 'Studio Updates',
    'nav.stickers': 'Stickers',
    'nav.contact': 'Contact',
    'nav.landmark': 'Site',
    'nav.menuButton': 'Toggle navigation menu',
    'skipToMain': 'Skip to main content',
    'theme.dark': 'Dark',
    'theme.warm': 'Warm',
    'lang.enShort': 'EN',
    'lang.zhShort': '繁中',
    'lang.enLabel': 'English',
    'lang.zhLabel': '繁體中文',
    'footer.secondaryNav': 'More',
    'footer.note':
      'Unless noted otherwise, articles and project write-ups are by the author; see each repository for code licences.',
    'blog.tocTitle': 'On this page',
  },
} as const;

export type Lang = keyof typeof ui;

export type UiKey = keyof (typeof ui)['zh'];
