#!/usr/bin/env sh
# Download the pinned int8 ONNX export of multilingual-e5-small (MIT licence)
# that scripts/build-search-model.py trims for in-browser Thai search.
# Usage: sh scripts/fetch-search-model.sh <dest-dir>
set -eu
DEST="${1:-.cache/e5-source}"
REPO="Xenova/multilingual-e5-small"
REV="761b726dd34fb83930e26aab4e9ac3899aa1fa78"
mkdir -p "$DEST/onnx"
for f in config.json tokenizer.json tokenizer_config.json special_tokens_map.json onnx/model_quantized.onnx; do
  [ -s "$DEST/$f" ] || curl -fsSL --retry 4 -o "$DEST/$f" "https://huggingface.co/$REPO/resolve/$REV/$f"
done
echo "source model in $DEST"
