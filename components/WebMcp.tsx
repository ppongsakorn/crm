"use client";

import { useEffect } from "react";
import type { Knowledge, Topic } from "@/lib/data";
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

const pageFor = (slug: string) => `${basePath}/topics/${slug}/`;
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
      const [{ topics, getKnowledge }, { searchDocs }, { phraseEngine }, phrasesMod] = await Promise.all([
        import("@/lib/data"),
        import("@/lib/searchDocs"),
        import("@/lib/search/lexical"),
        import("@/data/search-phrases.json"),
      ]);
      if (cancelled) return;
      const knowledge: Record<string, Knowledge> = Object.fromEntries(topics.map((t) => [t.slug, getKnowledge(t.slug)]).filter(([, k]) => k) as [string, Knowledge][]);
      const search = phraseEngine(searchDocs, phrasesMod.default as Record<string, string[]>);
      register(ctx, ac.signal, topics, knowledge, search);
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
) {
  {
    const bySlug = new Map(topics.map((t) => [t.slug, t]));
    const summary = (t: Topic) => {
      const k = knowledge[t.slug];
      return { slug: t.slug, name: t.name, en: t.en, group: t.group, whenYouSay: k?.whenYouSay ?? null, tldr: k?.tldr ?? t.intro, url: url(t.slug) };
    };
    const find = (slug: unknown) => bySlug.get(String(slug));

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
          "Ready-to-use prompts for the topic: the 20 numbered prompts from the 500 CRM Prompts Book (with [placeholders] to fill in) and the longer 'mega prompts' (role, context, task, constraints, output format).",
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
