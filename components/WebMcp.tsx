"use client";

import { useEffect } from "react";
import type { Knowledge, Topic } from "@/lib/data";
import type { Change } from "@/lib/changelog";
import { basePath } from "@/lib/site";

/**
 * WebMCP (W3C WebML CG draft): registers the site's search and content as
 * tools that an in-browser AI agent can call. Every tool is read-only. On
 * browsers without document.modelContext this renders nothing and does nothing.
 */

interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}
interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => Promise<void>;
}

function modelContext(): ModelContext | undefined {
  const d = document as Document & { modelContext?: ModelContext };
  const n = navigator as Navigator & { modelContext?: ModelContext }; // earlier drafts
  return d.modelContext ?? n.modelContext;
}

const isMobile = () => location.pathname.startsWith(`${basePath}/mobile`);
const pageFor = (slug: string) => `${basePath}${isMobile() ? `/mobile/t/${slug}/` : `/topics/${slug}/`}`;
const url = (slug: string) => `${location.origin}${pageFor(slug)}`;
const GROUPS = ["attract", "activate", "engage", "grow", "measure", "predict", "retain", "listen", "data"];

/**
 * Takes no props on purpose: the catalogue, knowledge layer and search engine
 * are loaded in a separate chunk only when the browser exposes modelContext,
 * so ordinary visitors never download them twice (once in the page, once here).
 */
export function WebMcp() {
  useEffect(() => {
    const ctx = modelContext();
    if (!ctx) return;
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      const [{ topics, getKnowledge, groups }, { searchDocs }, { phraseEngine }, phrasesMod, { makeEngine }, prompts, changelogMod] = await Promise.all([
        import("@/lib/data"),
        import("@/lib/searchDocs"),
        import("@/lib/search/lexical"),
        import("@/data/search-phrases.json"),
        import("@/lib/search"),
        import("@/lib/prompts"),
        import("@/data/changelog.json"),
      ]);
      if (cancelled) return;
      const knowledge: Record<string, Knowledge> = Object.fromEntries(topics.map((t) => [t.slug, getKnowledge(t.slug)]).filter(([, k]) => k) as [string, Knowledge][]);
      const search = phraseEngine(searchDocs, phrasesMod.default as Record<string, string[]>);
      register(ctx, ac.signal, topics, knowledge, search, { groups, makeEngine, prompts, changelog: changelogMod.default as Change[] });
    })().catch((e) => console.warn("WebMCP setup failed", e));
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);
  return null;
}

function register(
  ctx: ModelContext,
  signal: AbortSignal,
  topics: Topic[],
  knowledge: Record<string, Knowledge>,
  search: (q: string) => { slug: string; score: number; why?: string }[],
  extra: {
    groups: { id: string; title: string }[];
    makeEngine: typeof import("@/lib/search").makeEngine;
    prompts: typeof import("@/lib/prompts");
    changelog: Change[];
  },
) {
  const { groups, makeEngine, prompts, changelog } = extra;
  {
    const bySlug = new Map(topics.map((t) => [t.slug, t]));
    const summary = (t: Topic) => {
      const k = knowledge[t.slug];
      return { slug: t.slug, name: t.name, en: t.en, group: t.group, whenYouSay: k?.whenYouSay ?? null, tldr: k?.tldr ?? t.intro, url: url(t.slug) };
    };
    const find = (slug: unknown) => bySlug.get(String(slug));
    // Engines over every Q&A entry and every KPI, built once.
    const faqDocs = topics.flatMap((t) =>
      (knowledge[t.slug]?.faq ?? []).map((f, i) => ({ id: `${t.slug}#${i}`, q: f.q, a: f.a, topic: t.name })),
    );
    const faqSearch = makeEngine(faqDocs, ["q", "a", "topic"], { q: 3, a: 1, topic: 1 });
    const faqById = new Map(faqDocs.map((d) => [d.id, d]));
    const kpiDocs = topics.flatMap((t) =>
      (knowledge[t.slug]?.metrics ?? []).map((m, i) => ({ id: `${t.slug}#${i}`, name: m.name, formula: m.formula, why: m.why, topic: t.name })),
    );
    const kpiSearch = makeEngine(kpiDocs, ["name", "formula", "why", "topic"], { name: 4, formula: 1.5, why: 1, topic: 1 });
    const kpiById = new Map(kpiDocs.map((d) => [d.id, d]));
    const split = (id: string) => {
      const [slug, i] = id.split("#");
      return { t: bySlug.get(slug)!, i: Number(i) };
    };
    const order = groups.map((g) => g.id);
    const mentionText = (slug: string) => JSON.stringify(knowledge[slug] ?? {}).toLowerCase();


    const tools: ModelContextTool[] = [
      {
        name: "search_topics",
        title: "ค้นหาหัวข้อ CRM จากสถานการณ์",
        description:
          "Find CRM topics for a situation described in plain Thai or English (e.g. 'ลูกค้าหายไปเงียบ ๆ', 'LINE OA broadcast gets blocked', 'loyalty program design'). Returns the best matches with the phrase each one matched and a page URL. Use get_topic for the full knowledge.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The situation or problem, in the user's own words" },
            limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
          },
          required: ["query"],
        },
        annotations: { readOnlyHint: true },
        execute: async ({ query, limit }) => {
          const q = String(query ?? "").trim();
          if (!q) return { results: [] };
          const hits = search(q).slice(0, Math.min(Number(limit) || 5, 10));
          return { query: q, results: hits.map((h) => ({ ...summary(bySlug.get(h.slug)!), matchedPhrase: h.why ?? null })) };
        },
      },
      {
        name: "list_topics",
        title: "รายการหัวข้อ CRM ทั้งหมด",
        description:
          "List all 25 CRM topics on this site, grouped by customer-lifecycle stage (attract, activate, engage, grow, measure, predict, retain, listen, data), with a one-line summary for each.",
        inputSchema: { type: "object", properties: { group: { type: "string", enum: GROUPS, description: "Optional: only this stage" } } },
        annotations: { readOnlyHint: true },
        execute: async ({ group }) => ({
          topics: topics.filter((t) => !group || t.group === group).map((t) => ({ slug: t.slug, n: t.n, name: t.name, en: t.en, group: t.group, tldr: knowledge[t.slug]?.tldr ?? t.intro })),
        }),
      },
      {
        name: "get_topic",
        title: "ความรู้ของหัวข้อ",
        description:
          "Get one topic by slug: summary, benefits, key concepts, KPIs with formulas and benchmarks, step-by-step playbook, common pitfalls, Thai-market context, what the data team must prepare, and sources.",
        inputSchema: { type: "object", properties: { slug: { type: "string", description: "Topic slug, e.g. 'churn-prediction' (from search_topics or list_topics)" } }, required: ["slug"] },
        annotations: { readOnlyHint: true },
        execute: async ({ slug }) => {
          const t = find(slug);
          if (!t) return { error: `unknown slug: ${slug}`, hint: "call list_topics for valid slugs" };
          const k = knowledge[t.slug];
          return {
            ...summary(t),
            intro: t.intro,
            benefits: t.benefits,
            concepts: k?.concepts ?? [],
            metrics: k?.metrics ?? [],
            playbook: k?.playbook ?? [],
            pitfalls: k?.pitfalls ?? [],
            updatedAt: k?.updatedAt ?? null,
            whatsNew: k?.whatsNew ?? [],
            thaiContext: k?.thaiContext ?? null,
            dataNotes: k?.dataNotes ?? null,
            sources: k?.sources ?? [],
            faqCount: k?.faq.length ?? 0,
            promptCount: t.prompts.length + (k?.advancedPrompts.length ?? 0),
          };
        },
      },
      {
        name: "get_faq",
        title: "ถาม-ตอบของหัวข้อ",
        description: "The topic's question-and-answer entries (beginner → advanced). Each answer comes with a follow-up prompt the user can take to an AI assistant.",
        inputSchema: { type: "object", properties: { slug: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20, default: 12 } }, required: ["slug"] },
        annotations: { readOnlyHint: true },
        execute: async ({ slug, limit }) => {
          const t = find(slug);
          if (!t) return { error: `unknown slug: ${slug}` };
          const faq = (knowledge[t.slug]?.faq ?? []).slice(0, Math.min(Number(limit) || 12, 20));
          return { topic: t.name, url: url(t.slug), faq: faq.map((f) => ({ question: f.q, answer: f.a, followUpPrompt: f.prompt })) };
        },
      },
      {
        name: "get_prompts",
        title: "Prompt ของหัวข้อ",
        description:
          "Ready-to-use prompts for the topic: the 20 numbered prompts (from the 500 CRM Prompts Book for topics 1–25, newly written for topics added in 2026; with [placeholders] to fill in) and the longer 'mega prompts' (role, context, task, constraints, output format).",
        inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
        annotations: { readOnlyHint: true },
        execute: async ({ slug }) => {
          const t = find(slug);
          if (!t) return { error: `unknown slug: ${slug}` };
          const k = knowledge[t.slug];
          return {
            topic: t.name,
            url: url(t.slug),
            bookPrompts: t.prompts.map((p, i) => ({ id: `${t.n}.${i + 1}`, prompt: p })),
            megaPrompts: (k?.advancedPrompts ?? []).map((p) => ({ title: p.title, useWhen: p.useWhen, prompt: p.prompt })),
          };
        },
      },
      {
        name: "search_faq",
        title: "ค้นหาคำถาม-คำตอบ",
        description:
          "Search all Q&A entries across every CRM topic (Thai or English question). Returns the best-matching questions with their answers, a ready-to-use follow-up prompt, the topic and a page URL. Prefer this when the user asks a specific question rather than describing a broad situation.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10, default: 5 } },
          required: ["query"],
        },
        annotations: { readOnlyHint: true },
        execute: async ({ query, limit }) => {
          const q = String(query ?? "").trim();
          if (!q) return { results: [] };
          return {
            query: q,
            results: faqSearch(q)
              .slice(0, Math.min(Number(limit) || 5, 10))
              .map((h) => {
                const { t, i } = split(h.id);
                const f = knowledge[t.slug].faq[i];
                return { topic: t.slug, topicName: t.name, question: f.q, answer: f.a, followUpPrompt: f.prompt, url: url(t.slug) };
              }),
          };
        },
      },
      {
        name: "search_kpis",
        title: "ค้นหา KPI",
        description:
          "Search the KPI dictionary across all topics by name or meaning (e.g. 'churn rate', 'อัตราซื้อซ้ำ', 'live GPM'). Returns each KPI's formula, reference benchmark (with its source note), why it matters, and the topic it belongs to.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 15, default: 5 } },
          required: ["query"],
        },
        annotations: { readOnlyHint: true },
        execute: async ({ query, limit }) => {
          const q = String(query ?? "").trim();
          if (!q) return { results: [] };
          return {
            query: q,
            results: kpiSearch(q)
              .slice(0, Math.min(Number(limit) || 5, 15))
              .map((h) => {
                const { t, i } = split(h.id);
                const m = knowledge[t.slug].metrics[i];
                return { topic: t.slug, topicName: t.name, name: m.name, formula: m.formula, benchmark: m.benchmark, why: m.why, url: url(t.slug) };
              }),
          };
        },
      },
      {
        name: "fill_prompt",
        title: "เติมช่องว่างใน prompt",
        description:
          "Return a prompt from this site with its [placeholders] filled in. Identify the prompt by its book id (e.g. '14.3', from get_prompts), or by topic slug + mega-prompt title, or pass the prompt text directly. `values` maps placeholder text (without brackets, e.g. 'จำนวน') or business-profile fields (businessType, businessName, product, audience, channels, crm) to the user's values. Call it once without values to see which placeholders a prompt needs. Returns the filled prompt plus the placeholders still missing.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Book prompt id such as '14.3'" },
            slug: { type: "string", description: "Topic slug, used with title for a mega prompt" },
            title: { type: "string", description: "Mega prompt title (or part of it)" },
            text: { type: "string", description: "Any prompt text with [placeholders]" },
            values: { type: "object", additionalProperties: { type: "string" } },
          },
        },
        annotations: { readOnlyHint: true },
        execute: async ({ id, slug, title, text, values }) => {
          let source: { kind: string; topic?: string; id?: string; title?: string } = { kind: "text" };
          let raw = typeof text === "string" ? text : "";
          if (id) {
            const m = String(id).match(/^(\d+)\.(\d+)$/);
            const t = m && topics.find((x) => x.n === Number(m[1]));
            const p = t && t.prompts[Number(m![2]) - 1];
            if (!p) return { error: `unknown prompt id: ${id}`, hint: "ids look like '14.3'; call get_prompts for a topic's list" };
            raw = p;
            source = { kind: "book", topic: t!.slug, id: String(id) };
          } else if (slug && title) {
            const t = find(slug);
            const p = t && (knowledge[t.slug]?.advancedPrompts ?? []).find((x) => x.title.toLowerCase().includes(String(title).toLowerCase()));
            if (!p) return { error: `no mega prompt matching "${title}" in ${slug}`, hint: "call get_prompts for titles" };
            raw = p.prompt;
            source = { kind: "mega", topic: t!.slug, title: p.title };
          }
          if (!raw.trim()) return { error: "pass id, slug+title, or text" };
          const v = (values && typeof values === "object" ? values : {}) as Record<string, string>;
          const fieldIds = new Set(prompts.PROFILE_FIELDS.map((f) => f.id));
          const profile = Object.fromEntries(Object.entries(v).filter(([k]) => fieldIds.has(k)).map(([k, x]) => [k, String(x)]));
          const custom = Object.fromEntries(Object.entries(v).filter(([k]) => !fieldIds.has(k)).map(([k, x]) => [k.replace(/^\[|\]$/g, "").trim(), String(x)]));
          const r = prompts.fillPrompt(raw, profile, custom);
          return {
            source,
            prompt: r.prompt,
            placeholders: prompts.placeholders(raw),
            filled: r.filled,
            missing: r.missing,
            profileFields: prompts.PROFILE_FIELDS.map((f) => ({ id: f.id, label: f.label, example: f.example })),
          };
        },
      },
      {
        name: "get_related_topics",
        title: "หัวข้อที่เกี่ยวข้อง",
        description:
          "Topics to read alongside or after a given topic: other topics in the same lifecycle stage, topics in the next stage, and topics this topic's content explicitly refers to (including the topics added in 2026).",
        inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
        annotations: { readOnlyHint: true },
        execute: async ({ slug }) => {
          const t = find(slug);
          if (!t) return { error: `unknown slug: ${slug}` };
          const text = mentionText(t.slug);
          const brief = (x: Topic) => ({ slug: x.slug, name: x.name, en: x.en, group: x.group, url: url(x.slug) });
          const next = order[(order.indexOf(t.group) + 1) % order.length];
          return {
            topic: t.slug,
            sameStage: topics.filter((x) => x.group === t.group && x.slug !== t.slug).map(brief),
            nextStage: { stage: next, topics: topics.filter((x) => x.group === next).map(brief) },
            mentioned: topics
              .filter((x) => x.slug !== t.slug && (text.includes(x.en.toLowerCase().split(" (")[0]) || text.includes(x.name.toLowerCase())))
              .map(brief),
          };
        },
      },
      {
        name: "list_updates",
        title: "อัปเดตล่าสุดของเว็บ",
        description:
          "What changed on this site since a date: the public history log entries and which topics were re-researched. Use it to judge how fresh the content is.",
        inputSchema: { type: "object", properties: { since: { type: "string", description: "YYYY-MM-DD; default: all entries" } } },
        annotations: { readOnlyHint: true },
        execute: async ({ since }) => {
          const d = typeof since === "string" && /^\d{4}-\d{2}-\d{2}$/.test(since) ? since : "0000-00-00";
          return {
            since: d === "0000-00-00" ? null : d,
            entries: changelog.filter((c) => c.date >= d).map((c) => ({ date: c.date, kind: c.kind, title: c.title, items: c.items })),
            topicsUpdated: topics
              .filter((t) => (knowledge[t.slug]?.updatedAt ?? "") >= d.slice(0, 7))
              .map((t) => ({ slug: t.slug, name: t.name, updatedAt: knowledge[t.slug]?.updatedAt ?? null, addedIn2026: t.source === "2026" })),
          };
        },
      },
      {
        name: "list_trends",
        title: "เทรนด์ CRM 2025–2026",
        description:
          "What changed in CRM in 2025–2026 across all topics (AI, social media, marketplaces, live commerce, messaging, privacy, loyalty, data), each with what CRM teams should do differently, the topic it belongs to, and source URLs.",
        inputSchema: {
          type: "object",
          properties: { theme: { type: "string", enum: ["ai", "social", "marketplace", "live", "messaging", "privacy", "loyalty", "data"], description: "Optional: only this theme" } },
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async ({ theme }) => ({
          trends: topics.flatMap((t) =>
            (knowledge[t.slug]?.whatsNew ?? [])
              .filter((w) => !theme || w.theme === theme)
              .map((w) => ({ theme: w.theme, title: w.title, body: w.body, sources: w.sources, topic: t.slug, url: url(t.slug) })),
          ),
        }),
      },
      {
        name: "open_topic",
        title: "เปิดหน้าหัวข้อ",
        description: "Navigate this tab to the topic's page so the user can read it.",
        inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
        annotations: { readOnlyHint: true },
        execute: async ({ slug }) => {
          const t = find(slug);
          if (!t) return { error: `unknown slug: ${slug}` };
          location.assign(pageFor(t.slug));
          return { opened: url(t.slug) };
        },
      },
    ];

    for (const t of tools) ctx.registerTool(t, { signal }).catch((e) => console.warn("WebMCP register failed", t.name, e));
  }
}
