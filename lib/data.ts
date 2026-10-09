import raw from "@/data/crm.json";
import knowledgeRaw from "@/data/knowledge.json";

export type GroupId = "attract" | "activate" | "engage" | "grow" | "measure" | "predict" | "retain" | "listen" | "data";

/** One stage of the customer lifecycle (A–I in the 500 CRM Prompts Book). */
export interface Group {
  id: GroupId;
  letter: string;
  title: string;
  en: string;
  /** The question a CRM team is asking at this stage. */
  question: string;
  /** What someone says when they are stuck here (the home-page router). */
  sentence: string;
  why: string;
}

/** A topic straight from the prompts book: intro, benefits and its 20 prompts. */
export interface Topic {
  slug: string;
  n: number;
  emoji: string;
  name: string;
  en: string;
  group: GroupId;
  intro: string;
  benefits: string[];
  prompts: string[];
}

/** Deep-research knowledge layer for a topic (data/knowledge/<slug>.json). */
export interface Knowledge {
  slug: string;
  tldr: string;
  whenYouSay: string;
  concepts: { term: string; desc: string }[];
  faq: { q: string; a: string; prompt: string }[];
  metrics: { name: string; formula: string; benchmark: string; why: string }[];
  playbook: string[];
  pitfalls: { mistake: string; fix: string }[];
  advancedPrompts: { title: string; useWhen: string; prompt: string }[];
  thaiContext: string;
  dataNotes: string;
  sources: { title: string; url: string; note: string }[];
}

export const groups = raw.groups as Group[];
export const topics = raw.topics as Topic[];
const knowledge = knowledgeRaw as Record<string, Knowledge>;

export function getGroup(id: GroupId): Group {
  const g = groups.find((x) => x.id === id);
  if (!g) throw new Error(`unknown group ${id}`);
  return g;
}

export function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function topicsIn(group: GroupId): Topic[] {
  return topics.filter((t) => t.group === group);
}

export function getKnowledge(slug: string): Knowledge | undefined {
  return knowledge[slug];
}

/** Authors quote the "when you say" line inconsistently; the UI adds its own quotes. */
export function unquote(s: string): string {
  return s.trim().replace(/^["“]+|["”]+$/g, "").trim();
}

export const promptCount = topics.reduce((n, t) => n + t.prompts.length, 0);

/** Every prompt in the book, flattened, with its book number ("3.7"). */
export interface PromptItem {
  id: string;
  topic: string;
  group: GroupId;
  text: string;
}
export const allPrompts: PromptItem[] = topics.flatMap((t) =>
  t.prompts.map((text, i) => ({ id: `${t.n}.${i + 1}`, topic: t.slug, group: t.group, text })),
);
