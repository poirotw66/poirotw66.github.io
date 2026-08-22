/** Response headers for machine-only endpoints that should not rank in search. */
export const NON_INDEX_ROBOT_TAG = 'noindex, nofollow';

export function withNonIndexHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    'X-Robots-Tag': NON_INDEX_ROBOT_TAG,
  };
}
