"use client";

import Link from "next/link";
import { ArrowRight, Bot, Plug, Github, Zap, Terminal, FlaskConical, FilePenLine } from "lucide-react";

export default function AgentStudioPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
          <Bot className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Writing is Now WebMCP-Powered</h1>
          <p className="mt-1 text-muted-foreground">
            Agents no longer need a separate studio. Connect any AI client directly to the Writing Studio via WebMCP and write into the real editor — with real Calibre formatting and real quality checks.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
        <h2 className="mb-4 text-base font-semibold text-foreground">How to connect your AI agent</h2>
        <ol className="space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</span>
            <span>Open <strong className="text-foreground">Writing Studio</strong> in your browser and create or open a book, research paper, or assignment project to enter the editor.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</span>
            <span>Look for the <strong className="text-foreground">green WebMCP widget</strong> in the bottom-right corner of the editor.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</span>
            <span>Configure your MCP client (Claude Desktop, Cursor, etc.) to connect using the token from the widget.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">4</span>
            <span>Your AI agent can now call tools directly: <strong className="text-foreground">write chapters, run quality checks, format via Calibre, import from GitHub, and notify your Master</strong> — all in the real editor.</span>
          </li>
        </ol>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Terminal, title: "get_manuscript", desc: "Read current editor content" },
          { icon: Zap, title: "set_manuscript", desc: "Write full manuscript into editor" },
          { icon: Bot, title: "append_chapter", desc: "Add a chapter with title + body" },
          { icon: Plug, title: "run_quality_check", desc: "Real readability + PII analysis" },
          { icon: Zap, title: "format_book", desc: "Calibre export: epub, pdf, docx, mobi" },
          { icon: Github, title: "import_from_github", desc: "Pull markdown from any GitHub repo" },
        ].map((tool) => (
          <div key={tool.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <tool.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-mono text-sm font-semibold text-foreground">{tool.title}</p>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Claude Desktop config</p>
        <pre className="overflow-x-auto text-xs text-foreground">{`{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["-y", "@jason.today/webmcp@latest", "--mcp"]
    }
  }
}`}</pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/writing-studio"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
        >
          Open Writing Studio
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/writing-studio?intent=research"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <FlaskConical className="h-4 w-4" />
          Start research workflow
        </Link>
        <Link
          href="/writing-studio?intent=assignment"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <FilePenLine className="h-4 w-4" />
          Start assignment workflow
        </Link>
      </div>
    </div>
  );
}
