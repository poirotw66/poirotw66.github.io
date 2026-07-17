const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g;
const LATIN_WORD_PATTERN = /[A-Za-z0-9][A-Za-z0-9_+./:#-]*/g;

/** Estimate mixed Chinese/English technical reading time without a runtime dependency. */
export function estimateReadingMinutes(markdown: string): number {
  const text = markdown
    .replace(/^---[\s\S]*?---/m, ' ')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/[`{}()[\],.;]/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|`-]/g, ' ');

  const cjkCount = text.match(CJK_PATTERN)?.length ?? 0;
  const latinWordCount = text.replace(CJK_PATTERN, ' ').match(LATIN_WORD_PATTERN)?.length ?? 0;
  const minutes = cjkCount / 380 + latinWordCount / 210;

  return Math.max(1, Math.ceil(minutes));
}
