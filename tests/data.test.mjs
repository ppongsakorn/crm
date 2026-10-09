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

test("25 topics, 500 prompts, every topic complete and uniquely addressable", () => {
  assert.equal(topics.length, 25);
  assert.equal(topics.reduce((n, t) => n + t.prompts.length, 0), 500);
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
