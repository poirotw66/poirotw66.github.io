import fs from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkImageDimensions, { preparePublicImage } from '../src/utils/remarkImageDimensions.mjs';
import { parseFrontmatter } from '@astrojs/markdown-remark';

const processor = unified().use(remarkParse);
const transform = remarkImageDimensions();
let files = 0;
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.mdx?$/.test(file)) {
      const { content: markdown, frontmatter } = parseFrontmatter(await fs.readFile(file, 'utf8'));
      if (file.includes(`${path.sep}stickers${path.sep}`)) {
        const slug = path.basename(file, path.extname(file));
        for (const image of frontmatter.spriteImages ?? []) await preparePublicImage(`/stickers/${slug}/${image}`);
      }
      await transform(processor.parse(markdown));
      files += 1;
    }
  }
}
await walk('src/content');
console.log(`Body image derivatives ready for ${files} Markdown files.`);
