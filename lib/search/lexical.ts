import MiniSearch from "minisearch";
import { isLatin, tokenize } from "./tokenize";
import type { SearchDoc, SearchHit } from "./types";

const searchOptions = {
  tokenize,
  processTerm: (t: string) => t,
  fuzzy: (term: string) => (isLatin(term) && term.length > 4 ? 0.2 : 0),
  prefix: (term: string) => isLatin(term) && term.length > 2,
  combineWith: "OR" as const,
};

/** BM25 over the topic text with Thai word segmentation and field boosts. */
export function bm25Engine(docs: SearchDoc[]) {
  const ms = new MiniSearch<SearchDoc>({
    idField: "slug",
    fields: ["name", "en", "when", "tldr", "concepts", "faq", "news", "prompts"],
    tokenize,
    processTerm: (t) => t,
    searchOptions: { ...searchOptions, boost: { name: 5, en: 4, when: 3, tldr: 2, concepts: 1.5, faq: 1, news: 1, prompts: 0.7 } },
  });
  ms.addAll(docs);
  return (query: string): SearchHit[] =>
    query.trim() ? ms.search(query).map((r) => ({ slug: r.id as string, score: r.score })) : [];
}

/**
 * BM25 plus a knowledge base of situation phrases (what people type when
 * stuck, data/search-phrases.json). Each topic's score = its own text score
 * + its best phrase match + a small bonus for further matching phrases.
 */
export function phraseEngine(docs: SearchDoc[], phrases: Record<string, string[]>) {
  const textSearch = bm25Engine(docs);
  const ms = new MiniSearch<{ id: number; slug: string; phrase: string }>({
    fields: ["phrase"],
    storeFields: ["slug", "phrase"],
    tokenize,
    processTerm: (t) => t,
    searchOptions,
  });
  let id = 0;
  for (const [slug, list] of Object.entries(phrases)) for (const phrase of list) ms.add({ id: id++, slug, phrase });

  return (query: string): SearchHit[] => {
    if (!query.trim()) return [];
    const bySlug = new Map<string, { best: number; why: string; extra: number; text: number }>();
    const entry = (slug: string) => {
      let e = bySlug.get(slug);
      if (!e) bySlug.set(slug, (e = { best: 0, why: "", extra: 0, text: 0 }));
      return e;
    };
    for (const r of ms.search(query)) {
      const e = entry(r.slug as string);
      if (r.score > e.best) {
        e.extra += e.best * 0.15;
        e.best = r.score;
        e.why = r.phrase as string;
      } else e.extra += r.score * 0.15;
    }
    for (const r of textSearch(query)) entry(r.slug).text = r.score;
    return [...bySlug.entries()]
      .map(([slug, e]) => ({ slug, score: e.best + Math.min(e.extra, e.best) + e.text * 0.6, why: e.why || undefined }))
      .sort((a, b) => b.score - a.score);
  };
}
