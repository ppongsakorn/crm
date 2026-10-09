// Merge data/knowledge/<slug>.json into data/knowledge.json (keyed by slug).
// Runs before dev/build/typecheck. Topics without a knowledge file are allowed
// (the page shows the prompts-book content only).
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("data/knowledge");
const out = path.resolve("data/knowledge.json");
const merged = {};
if (fs.existsSync(dir)) {
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    const k = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    merged[k.slug ?? f.replace(/\.json$/, "")] = k;
  }
}
fs.writeFileSync(out, JSON.stringify(merged, null, 1) + "\n");
console.log(`knowledge: ${Object.keys(merged).length} topics → data/knowledge.json`);
