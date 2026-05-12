#!/bin/bash
set -e

# Start Ollama server in background
ollama serve &

# Wait for server to be ready
echo "Waiting for Ollama server..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama server ready."

# Pull the primary model
echo "Pulling qwen3-coder:30b..."
ollama pull qwen3-coder:30b || echo "Warning: Failed to pull qwen3-coder:30b"

# Pull fallback model
echo "Pulling codellama:13b..."
ollama pull codellama:13b || echo "Warning: Failed to pull codellama:13b"

echo "All models ready. Server running on :11434"

# Keep the server in foreground
wait
