// Browser-side engine factory. The lexical engine is cheap and synchronous;
// the semantic model (~35MB) is fetched only the first time a search needs it
// and then served from the browser cache.
import { phraseEngine } from "./lexical";
import { decodeIndex, fuse, rankByVector, type VectorIndex, type VectorIndexJson } from "./semantic";
import type { SearchDoc, SearchHit } from "./types";

export type Lexical = (q: string) => SearchHit[];

export async function lexicalEngine(docs: SearchDoc[]): Promise<Lexical> {
  const phrases = (await import("@/data/search-phrases.json")).default as Record<string, string[]>;
  return phraseEngine(docs, phrases);
}

export interface Semantic {
  embed: (q: string) => Promise<Float32Array>;
  index: VectorIndex;
}

export type LoadProgress = { loaded: number; total: number };
let semantic: Promise<Semantic> | null = null;
const listeners = new Set<(p: LoadProgress) => void>();

export function loadSemantic(assetBase: string, onProgress?: (p: LoadProgress) => void): Promise<Semantic> {
  if (onProgress) listeners.add(onProgress);
  semantic ??= new Promise<Semantic>((resolve, reject) => {
    const worker = new Worker(new URL("./semantic.worker.ts", import.meta.url), { type: "module" });
    const files = new Map<string, LoadProgress>();
    const waiting = new Map<number, (v: Float32Array) => void>();
    let nextId = 0;
    const index = fetch(`${assetBase}/search/vectors.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`vectors.json ${r.status}`);
        return r.json() as Promise<VectorIndexJson>;
      })
      .then(decodeIndex);

    worker.onmessage = async (e: MessageEvent) => {
      const m = e.data;
      if (m.type === "progress") {
        files.set(m.file, { loaded: m.loaded, total: m.total });
        const sum = [...files.values()].reduce((a, f) => ({ loaded: a.loaded + f.loaded, total: a.total + f.total }), { loaded: 0, total: 0 });
        listeners.forEach((l) => l(sum));
      } else if (m.type === "vector") {
        waiting.get(m.id)?.(m.vec);
        waiting.delete(m.id);
      } else if (m.type === "ready") {
        try {
          resolve({
            index: await index,
            embed: (q) =>
              new Promise((res) => {
                const id = nextId++;
                waiting.set(id, res);
                worker.postMessage({ type: "embed", id, text: q });
              }),
          });
        } catch (err) {
          reject(err);
        }
      } else if (m.type === "error") {
        reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => reject(new Error(e.message));
    worker.postMessage({ type: "init", modelBase: `${location.origin}${assetBase}/models/` });
  });
  semantic.catch(() => (semantic = null));
  return semantic;
}

export async function hybridSearch(sem: Semantic, lexical: Lexical, q: string): Promise<SearchHit[]> {
  return fuse([lexical(q), rankByVector(sem.index, await sem.embed(q))]);
}
