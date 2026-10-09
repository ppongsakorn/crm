import type { SearchHit } from "./types";

/**
 * Pre-computed embeddings (scripts/build-search-index.mjs): one vector per
 * topic text ("passage") and per situation phrase ("query"), int8 with a
 * per-vector scale, all L2-normalised before quantisation.
 */
export interface VectorIndex {
  dim: number;
  items: { slug: string; phrase?: string }[];
  scales: number[];
  data: Int8Array;
}

export interface VectorIndexJson {
  model: string;
  dim: number;
  items: { slug: string; phrase?: string }[];
  scales: number[];
  /** base64 of the int8 matrix, row-major. */
  data: string;
}

export function decodeIndex(json: VectorIndexJson): VectorIndex {
  const bin = typeof atob === "function" ? atob(json.data) : Buffer.from(json.data, "base64").toString("binary");
  const data = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = (bin.charCodeAt(i) << 24) >> 24;
  return { dim: json.dim, items: json.items, scales: json.scales, data };
}

/** Rank topics by their best-matching vector (framework text or any of its phrases). */
export function rankByVector(index: VectorIndex, query: Float32Array, limit = 25): SearchHit[] {
  const best = new Map<string, { score: number; phrase?: string }>();
  const { dim, data, scales, items } = index;
  for (let r = 0; r < items.length; r++) {
    let dot = 0;
    const off = r * dim;
    for (let k = 0; k < dim; k++) dot += data[off + k] * query[k];
    const score = dot * scales[r];
    const cur = best.get(items[r].slug);
    if (!cur || score > cur.score) best.set(items[r].slug, { score, phrase: items[r].phrase });
  }
  return [...best.entries()]
    .map(([slug, b]) => ({ slug, score: b.score, why: b.phrase }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Reciprocal rank fusion of several rankings (k = 60, the usual constant). */
export function fuse(rankings: SearchHit[][], k = 60): SearchHit[] {
  const acc = new Map<string, { score: number; why?: string }>();
  for (const ranking of rankings) {
    ranking.forEach((hit, rank) => {
      const e = acc.get(hit.slug) ?? { score: 0 };
      e.score += 1 / (k + rank + 1);
      e.why ??= hit.why;
      acc.set(hit.slug, e);
    });
  }
  return [...acc.entries()].map(([slug, e]) => ({ slug, ...e })).sort((a, b) => b.score - a.score);
}
