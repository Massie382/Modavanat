import type { DiffSegment } from "./types";

/**
 * Word-level LCS diff for Persian (and any whitespace-delimited) text.
 * Returns segments tagged as "same" | "removed" | "added".
 *
 * Authoring model:
 *   - The author provides `beforeText` and `afterText` on each AmendmentEvent
 *     and the front-end calls this function to compute the diff automatically.
 *   - Alternatively, the author can pre-compute `diffSegments` and the
 *     front-end will use those directly.
 */
export function computeWordDiff(before: string, after: string): DiffSegment[] {
  if (!before && !after) return [];
  if (!before) return [{ type: "added", text: after }];
  if (!after) return [{ type: "removed", text: before }];

  // Tokenize keeping whitespace so the rendered text preserves spacing.
  const tokenize = (s: string) => s.match(/\S+|\s+/g) || [];
  const a = tokenize(before);
  const b = tokenize(after);

  const m = a.length;
  const n = b.length;

  // dp[i][j] = length of LCS of a[i..] and b[j..]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk forward to produce merged segments
  const segments: DiffSegment[] = [];
  const push = (type: DiffSegment["type"], text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.type === type) last.text += text;
    else segments.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("removed", a[i]);
      i++;
    } else {
      push("added", b[j]);
      j++;
    }
  }
  while (i < m) {
    push("removed", a[i]);
    i++;
  }
  while (j < n) {
    push("added", b[j]);
    j++;
  }

  return segments;
}

/** Convenience: get diff segments from an amendment (uses pre-computed if present). */
export function getDiffSegments(opts: {
  beforeText?: string;
  afterText?: string;
  diffSegments?: DiffSegment[];
}): DiffSegment[] {
  if (opts.diffSegments) return opts.diffSegments;
  if (opts.beforeText !== undefined || opts.afterText !== undefined) {
    return computeWordDiff(opts.beforeText || "", opts.afterText || "");
  }
  return [];
}

/** Render only the "before" side — same + removed segments. */
export function filterBefore(segments: DiffSegment[]): DiffSegment[] {
  return segments.filter((s) => s.type !== "added");
}

/** Render only the "after" side — same + added segments. */
export function filterAfter(segments: DiffSegment[]): DiffSegment[] {
  return segments.filter((s) => s.type !== "removed");
}

/** Summary stats for a diff — used in the modal header. */
export function diffStats(segments: DiffSegment[]) {
  let removed = 0;
  let added = 0;
  let same = 0;
  for (const s of segments) {
    if (s.type === "removed") removed++;
    else if (s.type === "added") added++;
    else same++;
  }
  return { removed, added, same, total: segments.length };
}
