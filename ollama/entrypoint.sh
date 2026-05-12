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

# Pull the model (Claude 4.7 Opus distilled, MoE 35B/3B active, 23GB APEX quantized)
echo "Pulling yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality..."
ollama pull yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality || echo "Warning: Failed to pull model"

echo "Model ready. Server running on :11434"

# Keep the server in foreground
wait
