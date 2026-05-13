"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function VSCodeSetupPage() {
  const router = useRouter();
  const [yamlConfig, setYamlConfig] = useState<string>("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  const fetchConfig = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await apiClient("/vscode/config", { token });
      setYamlConfig(data.yamlConfig || "");
      setInstructions(data.instructions || []);
    } catch {
      /* user not logged in or API down */
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const copyConfig = () => {
    if (yamlConfig) {
      navigator.clipboard.writeText(yamlConfig);
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
        <h1 className="text-3xl font-bold mb-2">VS Code AI Agent Setup</h1>
        <p className="text-muted-foreground mb-8">
          Turn VS Code into a Devin-like AI coding agent using Continue + OllamaCodeHub.
          Chat, edit code, create files, and run commands — all powered by Claude Opus 4.7.
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
              <CardTitle>Step 2: Open Continue Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Press{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">
                  Ctrl+Shift+P
                </code>{" "}
                (or Cmd+Shift+P on Mac) &rarr; type{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">
                  Continue: Open config.yaml
                </code>{" "}
                &rarr; click it
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Replace Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Select all (<code className="bg-secondary px-1.5 py-0.5 rounded text-sm">Ctrl+A</code>),
                delete everything, then paste this config.
                Your API token is already filled in!
              </p>
              <div className="relative">
                <pre className="bg-secondary p-4 rounded-lg text-sm overflow-x-auto whitespace-pre">
                  {yamlConfig || "Loading... (sign in to see your config)"}
                </pre>
                {yamlConfig && (
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
              <CardTitle>Step 4: Save &amp; Open a Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Press{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">Ctrl+S</code>{" "}
                to save. Then open a project folder:{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">File → Open Folder</code>{" "}
                → pick any folder with your code.
              </p>
              <p className="text-muted-foreground">
                Click the Continue icon in the left sidebar, then click{" "}
                <strong>&quot;Select model&quot;</strong> and pick{" "}
                <strong>&quot;Claude Opus 4.7&quot;</strong>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 5: Use Agent Mode (Devin-like AI)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                At the top of the Continue chat panel, you&apos;ll see a dropdown that says{" "}
                <strong>&quot;Chat&quot;</strong>. Click it and switch to{" "}
                <strong>&quot;Agent&quot;</strong> for the full AI coding agent experience.
              </p>
              <div className="bg-secondary p-4 rounded-lg space-y-3">
                <p className="font-medium text-sm">What the Agent can do:</p>
                <ul className="text-muted-foreground text-sm space-y-1.5 list-disc pl-5">
                  <li>Read and understand your entire codebase</li>
                  <li>Create new files and write code from scratch</li>
                  <li>Edit existing files across your project</li>
                  <li>Run terminal commands (npm install, git, tests, etc.)</li>
                  <li>Search your codebase with grep and glob</li>
                  <li>Search the web for documentation</li>
                  <li>Fix bugs autonomously across multiple files</li>
                </ul>
              </div>
              <div className="bg-secondary p-4 rounded-lg space-y-3">
                <p className="font-medium text-sm">3 ways to use it:</p>
                <ul className="text-muted-foreground text-sm space-y-1.5">
                  <li>
                    <strong>Chat</strong> (<code className="bg-background px-1 rounded">Ctrl+L</code>) — Ask questions, get code suggestions
                  </li>
                  <li>
                    <strong>Edit</strong> (<code className="bg-background px-1 rounded">Ctrl+I</code>) — Select code → tell it what to change → it edits the file
                  </li>
                  <li>
                    <strong>Agent</strong> — Give it a task like &quot;Create a REST API with authentication&quot; and it builds it autonomously
                  </li>
                </ul>
              </div>
              <p className="text-muted-foreground text-sm">
                First request may take ~45 seconds (cold start). After that, responses are ~3 seconds.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                <strong>No image support</strong> — The model is text-only. You cannot attach images/screenshots for analysis.
                Use text descriptions or paste code instead.
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Complex agent tasks</strong> — For very large multi-step tasks, the model may need guidance.
                Break complex requests into smaller steps for best results.
              </p>
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
