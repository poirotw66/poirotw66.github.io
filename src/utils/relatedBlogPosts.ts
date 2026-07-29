import type { CollectionEntry } from 'astro:content';
import { blogSlug } from './blogLocale';
import { getTopicClusterById, getTopicClusterForSlug } from './topicClusters';

function normalizedTags(post: CollectionEntry<'blog'>): Set<string> {
  return new Set((post.data.tags ?? []).map((tag) => tag.trim().toLowerCase()));
}

function relatedScore(
  current: CollectionEntry<'blog'>,
  candidate: CollectionEntry<'blog'>,
): number {
  const currentSlug = blogSlug(current);
  const candidateSlug = blogSlug(candidate);
  const currentCluster = getTopicClusterById(current.data.cluster)
    ?? getTopicClusterForSlug(currentSlug);
  const candidateCluster = getTopicClusterById(candidate.data.cluster)
    ?? getTopicClusterForSlug(candidateSlug);
  const currentTags = normalizedTags(current);
  const sharedTags = [...normalizedTags(candidate)]
    .filter((tag) => currentTags.has(tag))
    .length;

  let score = sharedTags * 3;
  if (current.data.category === candidate.data.category) score += 2;
  if (currentCluster && candidateCluster?.id === currentCluster.id) score += 6;
  if (candidate.data.kind === 'guide') score += 1;
  return score;
}

export function getRelatedBlogPosts(
  current: CollectionEntry<'blog'>,
  posts: CollectionEntry<'blog'>[],
  limit = 3,
): CollectionEntry<'blog'>[] {
  const currentSlug = blogSlug(current);
  return posts
    .filter((candidate) => blogSlug(candidate) !== currentSlug)
    .map((candidate) => ({
      candidate,
      score: relatedScore(current, candidate),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => (
      b.score - a.score
      || b.candidate.data.pubDate.getTime() - a.candidate.data.pubDate.getTime()
    ))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
