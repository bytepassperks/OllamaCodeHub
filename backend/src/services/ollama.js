import { config } from "../config/env.js";

const OLLAMA_URL = config.ollamaBaseUrl;

export async function chatCompletion(model, messages, stream = false) {
  const url = `${OLLAMA_URL}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.ollamaApiKey && { Authorization: `Bearer ${config.ollamaApiKey}` }),
    },
    body: JSON.stringify({ model, messages, stream }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error ${response.status}: ${err}`);
  }

  if (stream) {
    return response;
  }

  return response.json();
}

export async function listModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error("Failed to list models");
  return response.json();
}

export async function pullModel(name) {
  const response = await fetch(`${OLLAMA_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, stream: false }),
  });
  if (!response.ok) throw new Error(`Failed to pull model: ${name}`);
  return response.json();
}

export async function deleteModel(name) {
  const response = await fetch(`${OLLAMA_URL}/api/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error(`Failed to delete model: ${name}`);
  return { success: true };
}
