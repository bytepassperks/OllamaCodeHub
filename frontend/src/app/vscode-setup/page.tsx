"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";

export default function VSCodeSetupPage() {
  const { getToken } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiClient("/vscode/config", { token });
      setConfig(data.config);
      setInstructions(data.instructions || []);
    } catch {
      /* user not logged in or API down */
    }
  }, [getToken]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const copyConfig = () => {
    if (config) {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              O
            </div>
            <span className="font-bold">OllamaCodeHub</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">VS Code Integration</h1>
        <p className="text-muted-foreground mb-8">
          Connect OllamaCodeHub to VS Code using the Continue extension for
          AI-powered autocomplete and chat.
        </p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Install Continue Extension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Install the{" "}
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=Continue.continue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Continue extension
                </a>{" "}
                from the VS Code marketplace.
              </p>
              <pre className="bg-secondary p-3 rounded-lg text-sm">
                ext install Continue.continue
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Continue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Open Continue settings:{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">
                  Ctrl+Shift+P → Continue: Open config.json
                </code>
              </p>
              <p className="text-muted-foreground">
                Replace the contents with this config:
              </p>
              <div className="relative">
                <pre className="bg-secondary p-4 rounded-lg text-sm overflow-x-auto">
                  {config
                    ? JSON.stringify(config, null, 2)
                    : "Loading... (sign in to see your config)"}
                </pre>
                {config && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={copyConfig}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Add Your API Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Replace{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">
                  your-clerk-jwt-token
                </code>{" "}
                in the config with your JWT token from the dashboard.
              </p>
              <p className="text-muted-foreground">
                You can get your token from the browser developer tools:
              </p>
              <pre className="bg-secondary p-3 rounded-lg text-sm">
                {`// In browser console on the dashboard page:\nawait window.Clerk.session.getToken()`}
              </pre>
            </CardContent>
          </Card>

          {instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  {instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
