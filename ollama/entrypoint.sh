#!/bin/bash
set -e

# Start Ollama server in background
ollama serve &
OLLAMA_PID=$!

# Wait for server to be ready
echo "Waiting for Ollama server..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama server ready."

# Pull the model in background so health check can pass immediately
(
  echo "Pulling model in background..."
  ollama pull yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality || echo "Warning: Failed to pull model"
  echo "Model pull complete."
) &

echo "Server running on :11434 (model pulling in background)"

# Keep the server in foreground
wait $OLLAMA_PID
