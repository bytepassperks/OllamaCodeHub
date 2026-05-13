#!/bin/bash

# Start Ollama server in background
ollama serve &
OLLAMA_PID=$!

# Wait for server to be ready
echo "[entrypoint] Waiting for Ollama server..." >&2
for i in $(seq 1 30); do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "[entrypoint] Ollama server ready after ${i}s" >&2
    break
  fi
  sleep 1
done

# Remove old 7b model if present (switching to smaller 3b for cost savings)
if ollama list 2>/dev/null | grep -q "qwen2.5-coder:7b"; then
  echo "[entrypoint] Removing old 7b model to free space..." >&2
  ollama rm qwen2.5-coder:7b 2>/dev/null || true
fi

# Remove old nutboy02 model if present
if ollama list 2>/dev/null | grep -q "nutboy02"; then
  echo "[entrypoint] Removing old nutboy02 model..." >&2
  ollama rm nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX 2>/dev/null || true
fi

# Pull fast coding model (2GB, responds in 2-5s on CPU, low RAM = low cost)
echo "[entrypoint] Starting model pull: qwen2.5-coder:3b" >&2
(
  ollama pull qwen2.5-coder:3b 2>&1 && \
    echo "[entrypoint] Model pull COMPLETE" >&2 || \
    echo "[entrypoint] Model pull FAILED with exit code $?" >&2
) &

echo "[entrypoint] Server running on :11434 — model downloading in background" >&2

# Keep the server in foreground
wait $OLLAMA_PID
