const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiClient(
  path: string,
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function streamChat(
  token: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(`${API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      const raw = line.replace("data: ", "").trim();
      if (raw === "[DONE]") return;

      try {
        const data = JSON.parse(raw);
        const content = data.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        /* partial JSON */
      }
    }
  }
}
