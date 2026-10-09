import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const { groups, topics } = JSON.parse(fs.readFileSync("data/crm.json", "utf8"));
const GROUP_IDS = ["attract", "activate", "engage", "grow", "measure", "predict", "retain", "listen", "data"];

test("nine lifecycle stages A–I in order", () => {
  assert.deepEqual(groups.map((g) => g.id), GROUP_IDS);
  assert.deepEqual(groups.map((g) => g.letter), ["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  for (const g of groups) for (const k of ["title", "en", "question", "sentence", "why"]) assert.ok(g[k], `${g.id} missing ${k}`);
});

test("book topics stay intact; every topic complete and uniquely addressable", () => {
  const book = topics.filter((t) => t.source !== "2026");
  assert.equal(book.length, 25, "the 25 book topics");
  assert.equal(book.reduce((n, t) => n + t.prompts.length, 0), 500, "the book's 500 prompts");
  for (const t of topics) assert.ok([undefined, "book", "2026"].includes(t.source), `${t.slug} source`);
  const slugs = new Set();
  topics.forEach((t, i) => {
    assert.match(t.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, t.name);
    assert.ok(!slugs.has(t.slug), `duplicate slug ${t.slug}`);
    slugs.add(t.slug);
    assert.equal(t.n, i + 1, `${t.slug} numbered out of order`);
    assert.ok(GROUP_IDS.includes(t.group), `${t.slug} has unknown group`);
    for (const k of ["emoji", "name", "en", "intro"]) assert.ok(t[k], `${t.slug} missing ${k}`);
    assert.equal(t.benefits.length, 3, `${t.slug} should list 3 benefits`);
    assert.equal(t.prompts.length, 20, `${t.slug} should have 20 prompts`);
    for (const p of t.prompts) assert.ok(p.trim(), `${t.slug} has an empty prompt`);
  });
});

test("every topic has a knowledge file", () => {
  for (const t of topics) assert.ok(fs.existsSync(`data/knowledge/${t.slug}.json`), `${t.slug} has no knowledge file`);
});

test("every knowledge file matches a topic and is complete", () => {
  const dir = "data/knowledge";
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  const slugs = new Set(topics.map((t) => t.slug));
  const range = (arr, lo, hi, what) => assert.ok(Array.isArray(arr) && arr.length >= lo && arr.length <= hi, `${what}: expected ${lo}–${hi} items, got ${arr?.length}`);
  for (const f of files) {
    const k = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const slug = f.replace(/\.json$/, "");
    assert.equal(k.slug, slug, `${f} slug mismatch`);
    assert.ok(slugs.has(slug), `${f} is not a topic`);
    for (const key of ["tldr", "whenYouSay", "thaiContext", "dataNotes"]) assert.ok(typeof k[key] === "string" && k[key].length > 20, `${slug} ${key}`);
    range(k.concepts, 5, 9, `${slug} concepts`);
    range(k.faq, 7, 13, `${slug} faq`);
    range(k.metrics, 3, 7, `${slug} metrics`);
    range(k.playbook, 4, 8, `${slug} playbook`);
    range(k.pitfalls, 3, 7, `${slug} pitfalls`);
    range(k.advancedPrompts, 4, 7, `${slug} advancedPrompts`);
    range(k.sources, 3, 10, `${slug} sources`);
    for (const q of k.faq) for (const key of ["q", "a", "prompt"]) assert.ok(q[key]?.trim(), `${slug} faq missing ${key}`);
    for (const p of k.advancedPrompts) assert.ok(/\[[^\]]+\]/.test(p.prompt), `${slug} mega prompt "${p.title}" has no [placeholder]`);
    for (const s of k.sources) assert.match(s.url, /^https?:\/\//, `${slug} source url`);
    assert.ok(/[ก-๙]/.test(k.tldr), `${slug} tldr must be Thai`);
    assert.match(k.updatedAt ?? "", /^\d{4}-\d{2}$/, `${slug} updatedAt`);
    range(k.whatsNew, 3, 6, `${slug} whatsNew`);
    for (const w of k.whatsNew) {
      assert.ok(["ai", "social", "marketplace", "live", "messaging", "privacy", "loyalty", "data"].includes(w.theme), `${slug} whatsNew theme ${w.theme}`);
      assert.ok(w.title && w.body && w.sources.length > 0, `${slug} whatsNew item incomplete`);
      for (const u of w.sources) assert.match(u, /^https?:\/\//, `${slug} whatsNew source url`);
    }
  }
});

test("history log is valid and newest first", () => {
  const log = JSON.parse(fs.readFileSync("data/changelog.json", "utf8"));
  assert.ok(log.length > 0);
  let prev = "9999-12-31";
  for (const c of log) {
    assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/, c.title);
    assert.ok(c.date <= prev, `${c.title} is out of order`);
    prev = c.date;
    assert.ok(["launch", "content", "feature", "fix"].includes(c.kind), `${c.title} kind`);
    assert.ok(c.title && c.items.length > 0, `${c.date} needs a title and items`);
    for (const l of c.links ?? []) assert.match(l.href, /^\//, `${c.title} links must be site paths`);
  }
});

test("search phrases and labelled queries point at real topics", () => {
  const slugs = new Set(topics.map((t) => t.slug));
  const phrases = JSON.parse(fs.readFileSync("data/search-phrases.json", "utf8"));
  for (const [slug, list] of Object.entries(phrases)) {
    assert.ok(slugs.has(slug), `phrases for unknown topic ${slug}`);
    assert.ok(Array.isArray(list) && list.length >= 20, `${slug} needs at least 20 phrases`);
    assert.equal(new Set(list).size, list.length, `${slug} has duplicate phrases`);
  }
  const queries = JSON.parse(fs.readFileSync("tests/search-queries.json", "utf8"));
  assert.ok(queries.length >= 50, "need at least 50 labelled queries");
  for (const q of queries) {
    assert.ok(q.q?.trim(), "query text");
    assert.ok(q.relevant.length > 0, `${q.q} has no relevant topics`);
    for (const s of q.relevant) assert.ok(slugs.has(s), `${q.q} → unknown topic ${s}`);
    assert.ok(["easy", "medium", "hard"].includes(q.difficulty), `${q.q} difficulty`);
  }
});

test("mobile app routes map to and from the desktop pages", async () => {
  const { toMobilePath, toDesktopPath } = await import("../lib/mobile.ts");
  assert.equal(toMobilePath("/"), "/mobile/");
  assert.equal(toMobilePath("/topics/"), "/mobile/search/");
  assert.equal(toMobilePath("/topics/", "#retain"), "/mobile/g/retain/");
  assert.equal(toMobilePath("/topics/", "#nonsense"), "/mobile/search/");
  assert.equal(toMobilePath("/topics/churn-prediction/"), "/mobile/t/churn-prediction/");
  assert.equal(toMobilePath("/prompts/"), "/mobile/prompts/");
  assert.equal(toMobilePath("/updates/"), "/mobile/updates/");
  assert.equal(toMobilePath("/trends/"), "/mobile/trends/");
  assert.equal(toDesktopPath("/mobile/trends/"), "/trends/");
  assert.equal(toMobilePath("/architecture/"), null);
  assert.equal(toMobilePath("/advisor/"), null);
  assert.equal(toDesktopPath("/mobile/t/churn-prediction/"), "/topics/churn-prediction/");
  assert.equal(toDesktopPath("/mobile/g/retain/"), "/topics/#retain");
  assert.equal(toDesktopPath("/mobile/prompts/"), "/prompts/");
  assert.equal(toDesktopPath("/mobile/"), "/");
  // every topic has a mobile screen, and the mapping survives a round trip
  for (const t of topics) assert.equal(toDesktopPath(toMobilePath(`/topics/${t.slug}/`)), `/topics/${t.slug}/`);
  // the redirect script is built from toMobilePath's source, so it must be self-contained
  assert.doesNotMatch(toMobilePath.toString(), /\b(KEY|import|require)\b/);
});

test("prompt filling maps the business profile and keeps unknown placeholders", async () => {
  const { placeholders, fillPrompt, fieldFor, normalizeKey } = await import("../lib/prompts.ts");
  assert.deepEqual(placeholders("เขียนให้ [ชื่อธุรกิจ] ที่ขาย [สินค้า/บริการ] ให้ [ชื่อธุรกิจ]"), ["ชื่อธุรกิจ", "สินค้า/บริการ"]);
  assert.equal(normalizeKey("ประเภทธุรกิจ เช่น ร้านอาหาร"), "ประเภทธุรกิจ");
  assert.equal(fieldFor("ชื่อร้าน")?.id, "businessName");
  assert.equal(fieldFor("แพลตฟอร์ม เช่น Facebook, IG")?.id, "channels");
  assert.equal(fieldFor("จำนวน"), undefined);
  const r = fillPrompt("ทำแผนให้ [ชื่อธุรกิจ] ภายใน [ช่วงเวลา] งบ [งบ]", { businessName: "Baan Coffee" }, { "ช่วงเวลา": "3 เดือน" });
  assert.equal(r.prompt, "ทำแผนให้ Baan Coffee ภายใน 3 เดือน งบ [งบ]");
  assert.deepEqual(r.filled, ["ชื่อธุรกิจ", "ช่วงเวลา"]);
  assert.deepEqual(r.missing, ["งบ"]);
  // an exact answer for a placeholder wins over the profile, blanks count as missing
  assert.equal(fillPrompt("[ชื่อแบรนด์]", { businessName: "A" }, { "ชื่อแบรนด์": "B" }).prompt, "B");
  assert.deepEqual(fillPrompt("[ชื่อแบรนด์]", { businessName: "  " }).missing, ["ชื่อแบรนด์"]);
  // the profile should help a meaningful share of prompts: all prompts on the site, and the book's own
  const book = topics.flatMap((t) => t.prompts);
  const site = [...book];
  for (const f of fs.readdirSync("data/knowledge")) {
    const k = JSON.parse(fs.readFileSync(`data/knowledge/${f}`, "utf8"));
    site.push(...k.faq.map((x) => x.prompt), ...k.advancedPrompts.map((x) => x.prompt));
  }
  const share = (list) => list.filter((p) => placeholders(p).some((ph) => fieldFor(ph))).length / list.length;
  assert.ok(share(site) > 0.4, `profile helps only ${(share(site) * 100).toFixed(0)}% of all prompts`);
  assert.ok(share(book) > 0.2, `profile helps only ${(share(book) * 100).toFixed(0)}% of book prompts`);
});
