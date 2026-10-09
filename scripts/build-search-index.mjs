// Embed every topic text and situation phrase with the in-browser model, so
// the site only has to embed the visitor's query at search time.
//
// Usage: node scripts/build-search-index.mjs <models-dir> <model-name> <out.json>
import fs from "node:fs";
import { env, pipeline } from "@huggingface/transformers";

const [modelsDir, modelName, out] = process.argv.slice(2);
env.allowRemoteModels = false;
env.localModelPath = modelsDir.endsWith("/") ? modelsDir : modelsDir + "/";

const { topics } = JSON.parse(fs.readFileSync("data/crm.json", "utf8"));
const knowledge = JSON.parse(fs.readFileSync("data/knowledge.json", "utf8"));
const phrases = JSON.parse(fs.readFileSync("data/search-phrases.json", "utf8"));

// e5 convention: "passage: " for documents, "query: " for query-like text.
const items = [];
const texts = [];
for (const t of topics) {
  const k = knowledge[t.slug];
  items.push({ slug: t.slug });
  texts.push(`passage: ${t.name} (${t.en}). ${k?.whenYouSay ?? ""} ${k?.tldr ?? t.intro} ${(k?.concepts ?? []).map((c) => c.term).join(", ")}`);
  for (const f of k?.faq ?? []) {
    items.push({ slug: t.slug, phrase: f.q });
    texts.push(`query: ${f.q}`);
  }
}
for (const [slug, list] of Object.entries(phrases)) {
  for (const p of list) {
    items.push({ slug, phrase: p });
    texts.push(`query: ${p}`);
  }
}

const embed = await pipeline("feature-extraction", modelName, { dtype: "q8" });
const dim = 384;
const data = new Int8Array(texts.length * dim);
const scales = [];
const batch = 32;
for (let i = 0; i < texts.length; i += batch) {
  const out = await embed(texts.slice(i, i + batch), { pooling: "mean", normalize: true });
  const v = out.data;
  for (let r = 0; r < out.dims[0]; r++) {
    let max = 0;
    for (let k = 0; k < dim; k++) max = Math.max(max, Math.abs(v[r * dim + k]));
    const scale = max / 127 || 1;
    scales.push(scale);
    for (let k = 0; k < dim; k++) data[(i + r) * dim + k] = Math.round(v[r * dim + k] / scale);
  }
}

fs.mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify({ model: modelName, dim, items, scales: scales.map((s) => +s.toPrecision(6)), data: Buffer.from(data.buffer).toString("base64") }),
);
console.log(`${items.length} vectors (${topics.length} topics + ${items.length - topics.length} phrases/questions) -> ${out}`);
