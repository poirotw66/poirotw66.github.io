/**
 * Tag utilities for blog: slug conversion and filtering by tag.
 */

export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function getPostsByTag<T extends { data: { tags?: string[] } }>(
  posts: T[],
  tagSlug: string
): T[] {
  return posts.filter((p) =>
    (p.data.tags ?? []).some((t) => tagToSlug(t) === tagSlug)
  );
}

export function getAllTagSlugs<T extends { data: { tags?: string[] } }>(posts: T[]): string[] {
  const slugs = new Set<string>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      const slug = tagToSlug(t);
      if (slug) slugs.add(slug);
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
  for (const p of posts) {
    const found = (p.data.tags ?? []).find((t) => tagToSlug(t) === tagSlug);
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
      const slug = tagToSlug(t);
      if (slug && !bySlug.has(slug)) bySlug.set(slug, t);
    }
  }
  return Array.from(bySlug.entries(), ([slug, name]) => ({ slug, name })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
}
