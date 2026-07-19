# Blog 封面圖生成提示詞（GPT Image 2）

目前 Blog 僅有兩篇核心指南缺少封面；中英文共用同一張圖，不需要重複生成。

## 共用產出規格

- **尺寸與比例：** 1200 × 750 px，16:10 橫式。
- **格式：** 先輸出 PNG，確認後轉為 WebP；品質約 82。
- **品牌參考：** 將 `public/brand/bloom-hero.webp` 一起上傳給 GPT Image 2，作為花花外觀參考。
- **花花設定：** 三花貓吉祥物；奶油白底、橘棕與深咖啡色塊，表情專注、溫和、好奇。每張只出現一隻花花。
- **Bloss0m 視覺語言：** 暖奶油色底、銅色與焦糖棕重點、深墨色線條；扁平但有細緻紙張與柔光層次的 editorial illustration。避免過度童書感、霓虹賽博龐克、3D 塑膠公仔感。
- **構圖：** 主體集中在中間偏右，左上與右下保留約 15% 的乾淨留白，讓網站既有的 topic 與品牌標示可讀。
- **文字：** 不生成標題、英文字、數字、Logo、UI 字樣或浮水印；網站會自行疊加文章標題與 Bloss0m 標示。
- **負面限制：** no text, no letters, no numbers, no watermark, no logo, no photorealistic human, no extra cats, no distorted paws, no busy dashboard, no neon cyberpunk, no generic stock illustration.

## 64 — AI Agent 完整指南

**文章路徑：** `/blog/64-ai-agent-guide/` 及 `/en/blog/64-ai-agent-guide/`

**生成後檔案：** `public/blog/64-ai-agent-guide/title_image.webp`

**建議 alt：** `花花查看 AI Agent 的任務狀態、工具與流程節點`

### GPT Image 2 Prompt

```text
Create a 1200 × 750 landscape editorial illustration for a premium enterprise AI engineering publication named Bloss0m. Use the attached reference image only to preserve the appearance of Huahua, Bloss0m's calico cat mascot: cream white fur with warm orange and dark brown patches, calm curious expression, soft rounded silhouette.

Scene: Huahua sits at a warm cream desk, carefully orchestrating one AI agent workflow. In front of the cat is a clean, abstract system map made of five connected elements: a goal card, a small tool box, a memory notebook, an observation panel, and a shield-shaped evaluation gate. Show only simple visual symbols and flowing copper lines; do not include any readable UI, code, letters, or numbers. The workflow should communicate state, tools, memory, evaluation, guardrails, and recovery without looking like a busy dashboard. Include one subtle branching path that rejoins the main flow, suggesting deliberate decision-making rather than chaotic multi-agent complexity.

Art direction: warm cream background, copper and caramel accents, deep ink linework, restrained dark navy shadows, refined flat editorial illustration with subtle paper texture and soft ambient light. Composition is centered slightly right; leave clean breathing room in the upper left and lower right for website overlays. One cat only, no humans, no text, no letters, no numbers, no watermark, no logo, no neon cyberpunk, no photorealism, no 3D toy rendering.
```

## 65 — Enterprise RAG 完整指南

**文章路徑：** `/blog/65-enterprise-rag-guide/` 及 `/en/blog/65-enterprise-rag-guide/`

**生成後檔案：** `public/blog/65-enterprise-rag-guide/title_image.webp`

**建議 alt：** `花花在受保護的企業知識花園中檢索並驗證文件證據`

### GPT Image 2 Prompt

```text
Create a 1200 × 750 landscape editorial illustration for a premium enterprise AI engineering publication named Bloss0m. Use the attached reference image only to preserve the appearance of Huahua, Bloss0m's calico cat mascot: cream white fur with warm orange and dark brown patches, calm curious expression, soft rounded silhouette.

Scene: Huahua is tending a structured knowledge garden that represents enterprise RAG. Around the cat are neatly arranged document cards, small books, and file folders growing as paper flowers. A warm copper retrieval path moves through three clear stages: a search lantern for hybrid retrieval, a sorting tray for reranking, and a magnifying glass over a source card for evidence verification. A discreet shield-shaped hedge surrounds the garden to represent permission boundaries and governance. One older document is gently placed outside the protected garden, suggesting freshness and version control. The scene should communicate traceable evidence, retrieval quality, access control, and careful evaluation without any readable interface, labels, letters, or numbers.

Art direction: warm cream background, copper, muted sage, caramel brown, and deep ink linework; refined flat editorial illustration with subtle paper texture and soft ambient light. Composition is centered slightly right; leave clean breathing room in the upper left and lower right for website overlays. One cat only, no humans, no text, no letters, no numbers, no watermark, no logo, no neon cyberpunk, no photorealism, no 3D toy rendering.
```

## 套用方式

封面確認後，將檔案放到上述路徑，並在中英文文章的 frontmatter 加入相同欄位：

```yaml
image: "/blog/64-ai-agent-guide/title_image.webp"
```

封面生成後應檢查：花花是否維持三花特徵、留白是否足夠、沒有誤生成文字，以及縮到 480 × 300 卡片尺寸時主體是否仍清楚。
