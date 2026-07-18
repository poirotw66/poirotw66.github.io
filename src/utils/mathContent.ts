/** Detect Markdown math forms handled by remark-math / rehype-katex. */
export function hasMathContent(body: string): boolean {
  return /(^|[^\\])\$\$[\s\S]*?\$\$|\\\(|\\\[|\\begin\{/.test(body);
}
