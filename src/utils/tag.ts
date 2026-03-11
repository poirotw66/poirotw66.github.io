/**
 * Tag utilities for blog: slug conversion and filtering by tag.
 * ASCII-only tags get a pretty slug (e.g. "BloomRender" -> "bloomrender");
 * tags with non-ASCII (e.g. "證件照") use URL-encoded form so the link works.
 */

export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Slug for URL: use ASCII slug when non-empty, otherwise encode the tag (for Chinese etc.). */
export function tagToUrlSlug(tag: string): string {
  const ascii = tagToSlug(tag);
  return ascii.length > 0 ? ascii : encodeURIComponent(tag.trim());
}

/** Whether the URL slug is encoded (contains %) and should be decoded to get the tag name. */
function isEncodedSlug(slug: string): boolean {
  return slug.includes('%');
}

export function getPostsByTag<T extends { data: { tags?: string[] } }>(
  posts: T[],
  tagSlug: string
): T[] {
  const matchTag = (t: string): boolean => {
    if (isEncodedSlug(tagSlug)) {
      try {
        return decodeURIComponent(tagSlug) === t;
      } catch {
        return false;
      }
    }
    return tagToSlug(t) === tagSlug || t === tagSlug;
  };
  return posts.filter((p) => (p.data.tags ?? []).some(matchTag));
}

/** Returns all URL slugs for static paths. For non-ASCII tags, includes both encoded and raw so /blog/tag/證件照/ and /blog/tag/%E8%AD%89.../ both work. */
export function getAllTagSlugs<T extends { data: { tags?: string[] } }>(posts: T[]): string[] {
  const slugs = new Set<string>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      const urlSlug = tagToUrlSlug(t);
      if (urlSlug) {
        slugs.add(urlSlug);
        if (isEncodedSlug(urlSlug)) slugs.add(t.trim());
      }
    }
  }
  return Array.from(slugs);
}

/**
 * Get display name for a tag slug from a list of posts that have that tag.
 */
export function getDisplayNameForTagSlug<T extends { data: { tags?: string[] } }>(
  posts: T[],
  tagSlug: string
): string {
  if (isEncodedSlug(tagSlug)) {
    try {
      return decodeURIComponent(tagSlug);
    } catch {
      return tagSlug;
    }
  }
  for (const p of posts) {
    const found = (p.data.tags ?? []).find(
      (t) => tagToSlug(t) === tagSlug || t === tagSlug
    );
    if (found) return found;
  }
  return tagSlug.replace(/-/g, ' ');
}

/**
 * Get unique tags with slug and display name for listing (e.g. blog index).
 */
export function getAllTagsWithDisplay<T extends { data: { tags?: string[] } }>(
  posts: T[]
): { slug: string; name: string }[] {
  const bySlug = new Map<string, string>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      const slug = tagToUrlSlug(t);
      if (slug && !bySlug.has(slug)) bySlug.set(slug, t);
    }
  }
  return Array.from(bySlug.entries(), ([slug, name]) => ({ slug, name })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
}
