/**
 * Optimal string alignment distance: insertions, deletions, substitutions
 * and swaps of neighbouring characters each count as one edit.
 */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * Returns the candidate closest to `word` (case-insensitive), or `undefined`
 * when none is close enough. One edit is allowed for short words and one more
 * for every further three characters; ties go to the earlier candidate.
 */
export function closestMatch(
  word: string,
  candidates: readonly string[],
): string | undefined {
  const typed = word.toLowerCase();
  const allowed = Math.max(1, Math.floor(typed.length / 3));
  let best: string | undefined;
  let bestDistance = allowed + 1;
  for (const candidate of candidates) {
    const distance = editDistance(typed, candidate.toLowerCase());
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
