// Runs the embedding model off the main thread so loading it (and each query)
// never freezes typing or scrolling.
import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

type In = { type: "init"; modelBase: string } | { type: "embed"; id: number; text: string };

let extractor: Promise<FeatureExtractionPipeline> | null = null;

self.onmessage = async (e: MessageEvent<In>) => {
  const msg = e.data;
  if (msg.type === "init") {
    // Hosted on this site but treated as a "remote" model: as a local model,
    // Transformers.js would fetch each file in full just to read its size.
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.remoteHost = msg.modelBase;
    env.remotePathTemplate = "{model}/";
    extractor ??= pipeline("feature-extraction", "e5-small-th", {
      dtype: "q8",
      device: "wasm",
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === "progress" && p.file && p.total) self.postMessage({ type: "progress", file: p.file, loaded: p.loaded ?? 0, total: p.total });
      },
    }) as Promise<FeatureExtractionPipeline>;
    try {
      const ex = await extractor;
      await ex("query: warm up", { pooling: "mean", normalize: true }); // first inference is slow; pay it now
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }
  const ex = await extractor!;
  const out = await ex(`query: ${msg.text}`, { pooling: "mean", normalize: true });
  const vec = out.data as Float32Array;
  self.postMessage({ type: "vector", id: msg.id, vec }, { transfer: [vec.buffer] });
};
