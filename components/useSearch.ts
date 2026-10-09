"use client";

import { useEffect, useRef, useState } from "react";
import { hybridSearch, lexicalEngine, loadSemantic, type Lexical, type LoadProgress, type Semantic } from "@/lib/search/browser";
import type { SearchDoc, SearchHit } from "@/lib/search/types";

export type SemanticState = "idle" | "loading" | "ready" | "error";

/** Skip the background download on Data Saver or very slow connections; such visitors load it on first search. */
function shouldPreload(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !(c?.saveData || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g");
}

/**
 * Situation search. Results always appear immediately from the lexical
 * engine (Thai segmentation + BM25 + situation phrases); nothing makes the
 * visitor wait. The Thai embedding model is preloaded silently once the page
 * is idle; queries typed after that get fused (semantic + lexical) results.
 * A list on screen is never swapped when the model finishes loading — the
 * next keystroke uses it.
 */
export function useSearch(docs: SearchDoc[], query: string, assetBase: string) {
  const [lexical, setLexical] = useState<Lexical | null>(null);
  const semantic = useRef<Semantic | null>(null);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [semState, setSemState] = useState<SemanticState>("idle");
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    let alive = true;
    lexicalEngine(docs).then((e) => alive && setLexical(() => e));
    return () => {
      alive = false;
    };
  }, [docs]);

  const startSemantic = useRef(() => {});
  startSemantic.current = () => {
    if (semState !== "idle") return;
    setSemState("loading");
    loadSemantic(assetBase, setProgress)
      .then((s) => {
        semantic.current = s;
        setSemState("ready");
      })
      .catch((e) => {
        console.error("semantic search unavailable", e);
        setSemState("error");
      });
  };

  // Preload in the background after the page has settled.
  useEffect(() => {
    if (!shouldPreload()) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => startSemantic.current(), { timeout: 3000 });
    return () => cancel(handle);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const id = ++seq.current;
    if (!q || !lexical) {
      setHits(null);
      return;
    }
    const sem = semantic.current;
    if (!sem) {
      setHits(lexical(q));
      startSemantic.current(); // no preload (Data Saver) → load now
      return;
    }
    // Fused results normally take a few tens of ms; if they are slower, show lexical ones meanwhile.
    let fallbackShown = false;
    const fallback = setTimeout(() => {
      if (seq.current !== id) return;
      fallbackShown = true;
      setHits(lexical(q));
    }, 100);
    hybridSearch(sem, lexical, q)
      .then((fused) => {
        clearTimeout(fallback);
        if (seq.current === id && !fallbackShown) setHits(fused);
      })
      .catch(() => {
        clearTimeout(fallback);
        if (seq.current === id) setHits(lexical(q));
      });
    return () => clearTimeout(fallback);
  }, [query, lexical]);

  return { hits, semState, progress };
}
