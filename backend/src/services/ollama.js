import { config } from "../config/env.js";

const OLLAMA_URL = config.ollamaBaseUrl;
const MODAL_URL = config.modalInferenceUrl;

export async function chatCompletion(model, messages, stream = false) {
  if (MODAL_URL) {
    return modalChatCompletion(model, messages, stream);
  }
  return ollamaChatCompletion(model, messages, stream);
}

async function modalChatCompletion(model, messages, stream) {
  const response = await fetch(MODAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Modal inference error ${response.status}: ${err}`);
  }

  const result = await response.json();

  if (stream) {
    const content = result.choices?.[0]?.message?.content || "";
    const sseStream = simulateSSEStream(content, model);
    return new Response(sseStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  return result;
}

function simulateSSEStream(content, model) {
  const encoder = new TextEncoder();
  const words = content.split(/(\s+)/);
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < words.length) {
        const batchSize = Math.min(3, words.length - index);
        const batch = words.slice(index, index + batchSize).join("");
        index += batchSize;

        const chunk = {
          id: "chatcmpl-modal",
          object: "chat.completion.chunk",
          model,
          choices: [{
            index: 0,
            delta: { content: batch },
            finish_reason: null,
          }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      } else {
        const doneChunk = {
          id: "chatcmpl-modal",
          object: "chat.completion.chunk",
          model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: "stop",
          }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

async function ollamaChatCompletion(model, messages, stream) {
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
