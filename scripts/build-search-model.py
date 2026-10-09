"""Build a small Thai/English sentence-embedding model for in-browser search.

Takes the int8 ONNX export of multilingual-e5-small (MIT licence) and keeps
only the vocabulary rows a Thai site needs: every Thai piece, punctuation /
symbols, every piece the tokenizer uses for the N most common English words
(lower / Capitalised / UPPER), and every piece used by the site's own text.

The tokenizer is a Unigram model and splits text on whitespace first, so a
word whose original best segmentation survives keeps exactly that
segmentation, and the transformer layers are untouched: such text gets the
same embedding as with the full model. Only the 250k-row lookup table shrinks.

Usage:
  python scripts/build-search-model.py <source-dir> <output-dir> [--english-words N] [--corpus FILE ...]

<source-dir> holds the original files (config.json, tokenizer.json,
tokenizer_config.json, special_tokens_map.json, onnx/model_quantized.onnx).
Requires: numpy, onnx, tokenizers, wordfreq.
"""
import argparse
import json
import re
import shutil
from pathlib import Path

import numpy as np
import onnx
from onnx import numpy_helper
from tokenizers import Tokenizer
from wordfreq import top_n_list

THAI = re.compile(r"^[▁฀-๿]+$")
ASCII = re.compile(r"^[▁\x20-\x7E]+$")
# Digits, punctuation and common symbols outside ASCII (quotes, dashes, arrows, ×, ≤ ...).
SYMBOLS = re.compile(r"^[▁\s -¿×÷ -⁯←-⇿∀-⋿]+$")
EMBEDDING = "embeddings.word_embeddings.weight_quantized"


def pieces_used(tokenizer, texts):
    ids = set()
    for enc in tokenizer.encode_batch(list(texts), add_special_tokens=False):
        ids.update(enc.ids)
    return ids


def choose_vocab(vocab, tokenizer, n_english, corpus_texts):
    special = {i for i, (piece, _) in enumerate(vocab) if piece in ("<s>", "<pad>", "</s>", "<unk>", "<mask>")}
    thai = {i for i, (piece, _) in enumerate(vocab) if THAI.match(piece)}
    symbols = {i for i, (piece, _) in enumerate(vocab) if SYMBOLS.match(piece) or len(piece.strip("\u2581")) <= 1 and ASCII.match(piece)}
    words = [w for w in top_n_list("en", n_english) if re.fullmatch(r"[a-z0-9'.-]+", w)]
    forms = {f for w in words for f in (w, w.capitalize(), w.upper())}
    english = pieces_used(tokenizer, sorted(forms))
    site = pieces_used(tokenizer, corpus_texts + ["query:", "passage:"])
    return sorted(special | thai | symbols | english | site)


def corpus_strings(paths):
    """All string values found in the given JSON files (site content, phrases)."""
    out = []

    def walk(x):
        if isinstance(x, str):
            out.append(x)
        elif isinstance(x, dict):
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    for p in paths:
        walk(json.loads(Path(p).read_text(encoding="utf-8")))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--english-words", type=int, default=60000, help="how many common English words to cover")
    ap.add_argument("--corpus", nargs="*", default=[], help="JSON files whose strings must tokenize exactly")
    args = ap.parse_args()

    tok = json.loads((args.src / "tokenizer.json").read_text(encoding="utf-8"))
    vocab = tok["model"]["vocab"]
    tokenizer = Tokenizer.from_file(str(args.src / "tokenizer.json"))
    keep = choose_vocab(vocab, tokenizer, args.english_words, corpus_strings(args.corpus))
    new_id = {old: new for new, old in enumerate(keep)}

    # Tokenizer: same pieces/scores in the same order, renumbered.
    tok["model"]["vocab"] = [vocab[i] for i in keep]
    tok["model"]["unk_id"] = new_id[tok["model"]["unk_id"]]
    for added in tok["added_tokens"]:
        added["id"] = new_id[added["id"]]
    for spec in tok["post_processor"]["special_tokens"].values():
        spec["ids"] = [new_id[i] for i in spec["ids"]]

    tok_cfg = json.loads((args.src / "tokenizer_config.json").read_text(encoding="utf-8"))
    if "added_tokens_decoder" in tok_cfg:
        tok_cfg["added_tokens_decoder"] = {str(new_id[int(k)]): v for k, v in tok_cfg["added_tokens_decoder"].items()}

    cfg = json.loads((args.src / "config.json").read_text(encoding="utf-8"))
    cfg["vocab_size"] = len(keep)

    # Model: slice the rows of the int8 embedding table (scale/zero-point are per-tensor, so unchanged).
    model = onnx.load(args.src / "onnx" / "model_quantized.onnx")
    init = next(t for t in model.graph.initializer if t.name == EMBEDDING)
    table = numpy_helper.to_array(init)
    init.CopyFrom(numpy_helper.from_array(np.ascontiguousarray(table[keep]), EMBEDDING))

    (args.out / "onnx").mkdir(parents=True, exist_ok=True)
    onnx.save(model, args.out / "onnx" / "model_quantized.onnx")
    (args.out / "tokenizer.json").write_text(json.dumps(tok, ensure_ascii=False), encoding="utf-8")
    (args.out / "tokenizer_config.json").write_text(json.dumps(tok_cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.out / "config.json").write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    shutil.copy(args.src / "special_tokens_map.json", args.out / "special_tokens_map.json")

    size = (args.out / "onnx" / "model_quantized.onnx").stat().st_size / 1e6
    print(f"kept {len(keep)} of {len(vocab)} pieces -> model {size:.1f} MB")


if __name__ == "__main__":
    main()
