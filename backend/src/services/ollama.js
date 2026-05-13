import { config } from "../config/env.js";

const OLLAMA_URL = config.ollamaBaseUrl;
const MODAL_URL = config.modalInferenceUrl;

export async function chatCompletion(model, messages, stream = false, tools = null, toolChoice = null) {
  if (MODAL_URL) {
    return modalChatCompletion(model, messages, stream, tools, toolChoice);
  }
  return ollamaChatCompletion(model, messages, stream, tools, toolChoice);
}

async function modalChatCompletion(model, messages, stream, tools, toolChoice) {
  const payload = {
    messages,
    temperature: 0.7,
    max_tokens: 4096,
    stream: !!stream,
  };
  if (tools) payload.tools = tools;
  if (toolChoice) payload.tool_choice = toolChoice;

  const response = await fetch(MODAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Modal inference error ${response.status}: ${err}`);
  }

  if (stream) {
    // Modal now returns a real SSE stream — pipe it through directly
    return response;
  }

  return response.json();
}

async function ollamaChatCompletion(model, messages, stream, tools, toolChoice) {
  const url = `${OLLAMA_URL}/v1/chat/completions`;

  const payload = { model, messages, stream };
  if (tools) payload.tools = tools;
  if (toolChoice) payload.tool_choice = toolChoice;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.ollamaApiKey && { Authorization: `Bearer ${config.ollamaApiKey}` }),
    },
    body: JSON.stringify(payload),
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
  if (MODAL_URL) {
    return { models: [{ name: "Claude Opus 4.7 (GPU)", size: 13000000000 }] };
  }
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error("Failed to list models");
  return response.json();
}

export async function pullModel(name) {
  if (MODAL_URL) return { status: "Model managed by Modal.com GPU" };
  const response = await fetch(`${OLLAMA_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, stream: false }),
  });
  if (!response.ok) throw new Error(`Failed to pull model: ${name}`);
  return response.json();
}

export async function deleteModel(name) {
  if (MODAL_URL) return { success: true, message: "Model managed by Modal.com GPU" };
  const response = await fetch(`${OLLAMA_URL}/api/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error(`Failed to delete model: ${name}`);
  return { success: true };
}
