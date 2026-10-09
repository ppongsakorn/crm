/** One topic as the search engines see it (built at build time from the book + knowledge layer). */
export interface SearchDoc {
  slug: string;
  name: string;
  en: string;
  /** "When you say…" line + tldr. */
  when: string;
  tldr: string;
  /** Key terms with their one-line descriptions. */
  concepts: string;
  /** The Q&A questions. */
  faq: string;
  /** What changed in 2025–2026 (titles and bodies). */
  news: string;
  /** The 20 prompts from the book. */
  prompts: string;
}

export interface SearchHit {
  slug: string;
  score: number;
  /** Short explanation shown under a result, e.g. the situation phrase that matched. */
  why?: string;
}
