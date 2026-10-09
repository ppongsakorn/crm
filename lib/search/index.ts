import MiniSearch from "minisearch";
import { isLatin, tokenize } from "./tokenize";

export interface SearchHit {
  id: string;
  score: number;
}

const searchOptions = {
  tokenize,
  processTerm: (t: string) => t,
  fuzzy: (term: string) => (isLatin(term) && term.length > 4 ? 0.2 : 0),
  prefix: (term: string) => isLatin(term) && term.length > 2,
  combineWith: "OR" as const,
};

/**
 * BM25 ranking over any set of documents with Thai word segmentation and
 * per-field boosts. Falls back to a substring match so that an exact phrase
 * the segmenter splits differently still finds its document.
 */
export function makeEngine<T extends { id: string }>(docs: T[], fields: (keyof T & string)[], boost: Partial<Record<keyof T & string, number>>) {
  const ms = new MiniSearch<T>({
    idField: "id",
    fields,
    tokenize,
    processTerm: (t) => t,
    searchOptions: { ...searchOptions, boost: boost as Record<string, number> },
  });
  ms.addAll(docs);
  const text = new Map(docs.map((d) => [d.id, fields.map((f) => String(d[f] ?? "")).join(" ").toLowerCase()]));

  return (query: string): SearchHit[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const ranked = ms.search(q).map((r) => ({ id: r.id as string, score: r.score }));
    const seen = new Set(ranked.map((r) => r.id));
    for (const d of docs) if (!seen.has(d.id) && text.get(d.id)!.includes(q)) ranked.push({ id: d.id, score: 0.5 });
    return ranked;
  };
}
