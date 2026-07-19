# 花花提示框

花花提示框用來標示文章中的核心定義、工程限制與作者判斷。每篇文章以 2–3 個為上限，避免削弱正文層級。

## Markdown 寫法

```markdown
> **花花的一句話**
>
> 用一句話解釋文章最重要的概念。

> **花花的工程提醒**
>
> 說明限制、踩坑、成本或正式環境風險。

> **花花的判斷**
>
> 在趨勢文章中加入 Bloss0m 的工程觀點。
```

英文標籤分別使用：

- `Huahua in one sentence`
- `Huahua's engineering note`
- `Huahua's take`

只有上述固定標籤會轉換成花花提示框；其他 Markdown blockquote 維持原本樣式。提示框 CSS 僅在文章實際使用元件時載入。
