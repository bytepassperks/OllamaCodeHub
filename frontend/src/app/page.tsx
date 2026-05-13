"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              O
            </div>
            <span className="font-bold text-lg">OllamaCodeHub</span>
          </div>
          <div className="flex items-center gap-4">
            {!loggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Powered by Qwen3-Coder 30B — 92%+ HumanEval
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Private AI Coding
          <br />
          <span className="text-primary">in VS Code</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Claude-like AI coding assistance without sending your code to the
          cloud. Self-hosted Ollama backend with enterprise-grade models at a
          fraction of the cost.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free — 100 queries/day
            </Button>
          </Link>
          <Link href="/vscode-setup">
            <Button size="lg" variant="outline" className="text-lg px-8">
              VS Code Setup
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need for AI-powered coding
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Code Generation", desc: "Generate code, debug issues, and get explanations — all from a chat UI or directly in VS Code.", icon: "{ }" },
            { title: "VS Code Integration", desc: "One-click Continue config. Get autocomplete, inline chat, and code actions right in your editor.", icon: "</>" },
            { title: "Private & Fast", desc: "Your code never leaves the server. Qwen3-Coder 30B runs locally via Ollama with sub-second responses.", icon: "🔒" },
            { title: "Model Selection", desc: "Choose between Qwen3-Coder 30B (best quality) and CodeLlama 13B (fastest) based on your needs.", icon: "🤖" },
            { title: "Query History", desc: "Full history of all your prompts and responses. Export code snippets with one click.", icon: "📋" },
            { title: "Admin Controls", desc: "Full admin panel: manage users, models, analytics, and API logs. Admin generates passwords for users.", icon: "⚡" },
          ].map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="text-2xl mb-2">{f.icon}</div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>OllamaCodeHub — Affordable private AI coding. Built with Ollama, Next.js, and Fastify.</p>
        </div>
      </footer>
    </div>
  );
}
