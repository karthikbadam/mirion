export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ac = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? 0;
}

export function nearest(
  input: string,
  candidates: readonly string[],
  opts: { maxDistance?: number } = {},
): string | undefined {
  if (candidates.length === 0) return undefined;
  const lower = input.toLowerCase();
  const maxDistance = opts.maxDistance ?? Math.max(2, Math.floor(input.length / 2));
  let best: string | undefined;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = distance(lower, c.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  if (bestDist > maxDistance) return undefined;
  return best;
}

export function topK(
  input: string,
  candidates: readonly string[],
  k: number,
): string[] {
  const lower = input.toLowerCase();
  return [...candidates]
    .map((c) => ({ c, d: distance(lower, c.toLowerCase()) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((x) => x.c);
}
