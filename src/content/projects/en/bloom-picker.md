---
title: "Bloom Picker · Elegant Colors"
description: "Bloom Picker bridges traditional East Asian colors with modern workflows: 250 culturally contextualized color names and codes, WCAG 2.1 contrast ratios, Traditional Chinese localized color names, recommended color swatches, and palette export."
pubDate: 2025-03-01
updatedDate: 2025-03-01
tldr:
  - "Bloom Picker bridges traditional East Asian colors with modern workflows: 250 culturally contextualized color names and codes, WCAG 2"
  - "1 contrast ratios, Traditional Chinese localized color names, recommended color swatches, and palette export"
  - "Polished UI · Pantone · React · TypeScript · WCAG 2.1 Accessibility Compliance"
  - "Pantone · one-click WCAG 2.1 contrast checks"
audience:
  - "Engineers, technical leads, and product teams evaluating real project architecture, trade-offs, and delivery results."
  - "Readers who want concrete outcomes and stack choices, not just a concept demo."
tier: lab
subtitle: "Polished UI · Pantone · React · TypeScript · WCAG 2.1 Accessibility Compliance"
repoUrl: "https://github.com/poirotw66/bloom-picker"

metrics:
  - "React · TypeScript · Vite"
  - "WCAG 2.1 Contrast"
  - "250 Traditional Colors"
impact: "Pantone · one-click WCAG 2.1 contrast checks"
image: "https://github.com/poirotw66/bloom-picker/raw/main/image/gunjyo.png"
---

**Bloom Picker · Elegant Colors** is more than just a color code lookup tool; it is a bridge connecting "traditional East Asian colors" with "modern workflows." It offers 250 culturally contextualized color names and codes, making them readily available for brand, visual, and UI designers, and allows easy export to design systems.

The color names follow the principles of "traditional names, Taiwanese vernacular, and elegance." They retain traditional East Asian color names and are standardized into commonly used Traditional Chinese orthography in Taiwan (for example, Japanese shinjitai forms mapped to Taiwan Traditional Chinese), preserving cultural color sense while improving local recognition.

👉 **Online Demo:** [www.bloss0m.com/bloom-picker/](http://www.bloss0m.com/bloom-picker/)

---

## 1. Core Features and Application Scenarios

- **Design and Brand Applications**: Provides complete CMYK / RGB / HSL / HEX color codes, with click-to-copy for HEX. Supports saving favorite colors, drag-and-drop sorting, and exporting as CSS variables or JSON.
- **Accessibility Compliance**: Built-in WCAG 2.1 contrast calculation automatically evaluates the contrast ratio against black or white text, displaying AA / AAA status to help strike a balance between aesthetics and readability.
- **Inspiration and Recommendations**: Built-in "Color of the Day" and "Random Color" features. The system recommends matching color swatches based on color distance and hue algorithms, lowering the barrier to color matching.

---

## 2. Interface and Preview

The project adopts a full-screen color block experience: clicking a color name on the sidebar switches the full-page background color with smooth transitions and no button flickering. Combined with Hash routing (e.g., `#color-name`), users can directly link to a specific color, facilitating cross-tab operations.

### 2.1 Main Visuals

| First Cherry Blossom | Ultramarine | Young Bamboo |
|------|------|------|
| ![First Cherry Blossom Main](https://github.com/poirotw66/bloom-picker/raw/main/image/ikkonome.png) | ![Ultramarine Main](https://github.com/poirotw66/bloom-picker/raw/main/image/gunjyo.png) | ![Young Bamboo Main](https://github.com/poirotw66/bloom-picker/raw/main/image/wakatake.png) |

### 2.2 Recommended Palettes and Concepts

| Creative Palette | Boundless Sky | Sprouting Green |
|----------|----------|----------|
| ![Creative Palette](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E5%89%B5%E6%84%8F%E9%85%8D%E8%89%B2.png) | ![Boundless Sky](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E8%92%BC%E7%A9%B9%E8%90%AC%E9%87%8C.png) | ![Sprouting Green](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E6%96%B0%E7%B6%A0%E8%90%8C%E8%8A%BD.png) |
| ![Creative Palette Concept](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E5%89%B5%E6%84%8F%E9%85%8D%E8%89%B2-img.png) | ![Boundless Sky Concept](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E8%92%BC%E7%A9%B9%E8%90%AC%E9%87%8C-img.png) | ![Sprouting Green Concept](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E6%96%B0%E7%B6%A0%E8%90%8C%E8%8A%BD-img.png) |

---

## 3. Architecture and Tech Stack

The project is built with React and TypeScript, ensuring type safety and component reusability.

- **Framework and Build Tool**: React + TypeScript + Vite
- **Animation and Interaction**: Framer Motion for handling smooth color transition effects
- **Icons**: Lucide React
- **Color Logic**: Custom color distance and recommendation algorithms, WCAG 2.1 contrast calculation module

The project structure is clearly divided:
```text
src/
  ├── components/    # Sidebar, Detail Page, Recommended Palettes, Favorites List
  ├── data/          # 250 colors and recommended palette static data
  └── utils/         # Color conversion, WCAG calculation, Export tools
```

---

## 4. Development and Licensing

- **Local Development**: Run `npm install` and `npm run dev` to start the development server.
- **Deployment**: The built `dist` folder can be easily deployed to GitHub Pages (by configuring the branch path in Settings → Pages).
- **Licensing**: This project is licensed under the Apache License 2.0. The web structure and code are original to the project; the color code data is adapted from public Japanese traditional color data, used only for transcription and localization, and is not for commercial use.
