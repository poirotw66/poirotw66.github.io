/** Whether the article's 75% position has reached the bottom of the viewport. */
export function hasReachedArticleRead75(
  articleTop: number,
  articleHeight: number,
  viewportHeight: number,
): boolean {
  return articleHeight > 0
    && viewportHeight > 0
    && articleTop + articleHeight * 0.75 <= viewportHeight;
}
