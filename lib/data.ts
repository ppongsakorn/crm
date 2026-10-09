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

/** Themes of the 2025–2026 changes ("what's new") across topics. */
export const THEMES = ["ai", "social", "marketplace", "live", "messaging", "privacy", "loyalty", "data"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_LABEL: Record<Theme, string> = {
  ai: "AI",
  social: "Social Media",
  marketplace: "Marketplace",
  live: "Live Commerce",
  messaging: "แชท & ข้อความ",
  privacy: "กฎหมาย & ความเป็นส่วนตัว",
  loyalty: "Loyalty & การจ่ายเงิน",
  data: "ข้อมูล & ระบบ",
};

export interface WhatsNew {
  theme: Theme;
  title: string;
  body: string;
  sources: string[];
}

/** Deep-research knowledge layer for a topic (data/knowledge/<slug>.json). */
export interface Knowledge {
  slug: string;
  /** "YYYY-MM" of the last research round. */
  updatedAt?: string;
  /** What changed in 2025–2026 for this topic and what to do about it. */
  whatsNew?: WhatsNew[];
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

/** Every "what's new" item across topics, in topic order, with its topic. */
export const allWhatsNew: (WhatsNew & { topic: Topic })[] = topics.flatMap((t) =>
  (getKnowledge(t.slug)?.whatsNew ?? []).map((w) => ({ ...w, topic: t })),
);

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
/** "2026-10" → "ต.ค. 2026" */
export function thaiMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y}`;
}

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
