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

# Pull model in background so container stays healthy
echo "[entrypoint] Starting model pull: nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX" >&2
(
  ollama pull nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX 2>&1 && \
    echo "[entrypoint] Model pull COMPLETE" >&2 || \
    echo "[entrypoint] Model pull FAILED with exit code $?" >&2
) &

echo "[entrypoint] Server running on :11434 — model downloading in background" >&2

# Keep the server in foreground
wait $OLLAMA_PID
