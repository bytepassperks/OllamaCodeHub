"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient, streamChat } from "@/lib/api";
import { getToken, getUser, clearAuth, isAdmin } from "@/lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QueryRecord {
  id: string;
  model: string;
  prompt: string;
  response: string;
  createdAt: string;
}

type TabType = "chat" | "history";

export default function DashboardPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX");
  const [models, setModels] = useState<Array<{ id: string; isDefault: boolean }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tab, setTab] = useState<TabType>("chat");
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  const fetchModels = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await apiClient("/v1/models", { token });
      setModels(data.data || []);
      const def = data.data?.find((m: { isDefault: boolean }) => m.isDefault);
      if (def) setModel(def.id);
    } catch {
      /* fallback to default */
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await apiClient("/v1/history?limit=50", { token });
      setHistory(data.queries || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const token = getToken();
    if (!token) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      await streamChat(
        token,
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        model,
        (chunk) => {
          assistantMsg.content += chunk;
          setMessages([...newMessages, { ...assistantMsg }]);
        }
      );
    } catch (err) {
      assistantMsg.content += `\n\nError: ${err instanceof Error ? err.message : "Request failed"}`;
      setMessages([...newMessages, { ...assistantMsg }]);
    }

    setIsStreaming(false);
  };

  const exportSnippet = (query: QueryRecord) => {
    const blob = new Blob(
      [`// Prompt: ${query.prompt}\n// Model: ${query.model}\n// Date: ${query.createdAt}\n\n${query.response}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snippet-${query.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                O
              </div>
              <span className="font-bold">OllamaCodeHub</span>
            </Link>
            <div className="flex gap-1 ml-4">
              <Button
                variant={tab === "chat" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTab("chat")}
              >
                Chat
              </Button>
              <Button
                variant={tab === "history" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTab("history")}
              >
                History
              </Button>
              <Link href="/vscode-setup">
                <Button variant="ghost" size="sm">
                  VS Code Setup
                </Button>
              </Link>
              {isAdmin() && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-secondary rounded-md px-3 py-1.5 text-sm border border-input"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} {m.isDefault ? "(default)" : ""}
                  </option>
                ))
              ) : (
                <>
                  <option value="nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX">Qwen3.6-35B Claude Opus 4.7 (Q2_K)</option>
                </>
              )}
            </select>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4">
        {tab === "chat" && (
          <div className="flex flex-col h-[calc(100vh-7rem)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="text-5xl mb-4">🤖</div>
                  <h2 className="text-xl font-semibold mb-2">Start coding with AI</h2>
                  <p>Ask me to generate code, debug issues, or explain files.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a React component that..."
                  className="flex-1"
                  disabled={isStreaming}
                />
                <Button type="submit" disabled={isStreaming || !input.trim()}>
                  {isStreaming ? "..." : "Send"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="py-6 space-y-4">
            <h2 className="text-xl font-bold">Query History</h2>
            {history.length === 0 && (
              <p className="text-muted-foreground">No queries yet.</p>
            )}
            {history.map((q) => (
              <Card key={q.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {q.prompt.slice(0, 100)}
                      {q.prompt.length > 100 ? "..." : ""}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{q.model}</Badge>
                      <Button size="sm" variant="outline" onClick={() => exportSnippet(q)}>
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-secondary rounded p-3 overflow-x-auto max-h-40">
                    {q.response.slice(0, 500)}
                    {q.response.length > 500 ? "..." : ""}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(q.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
