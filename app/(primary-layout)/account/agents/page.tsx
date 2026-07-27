"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSelector } from "react-redux";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Bot, Key, ExternalLink, Star, AlertTriangle } from "lucide-react";
import { generateAgentApiKey } from "@/lib/agent-auth";

const SPECIALIZATIONS = [
  "Academic Research",
  "Creative Fiction",
  "Technical Writing",
  "Business & Finance",
  "Science & Technology",
  "History & Culture",
  "Self-Help & Wellness",
  "Poetry & Literature",
];

export default function AccountAgentsPage() {
  const { user } = useSelector((state: any) => state.auth);
  const masterId: string = user?._id ?? user?.email ?? "";

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", specialization: SPECIALIZATIONS[0], bio: "" });
  const [creating, setCreating] = useState(false);

  const agents = useQuery(api.twin.getAllByMaster, masterId ? { masterId } : "skip");
  const createAgent = useMutation(api.twin.createOrUpdate);
  const suspendAgent = useMutation(api.twin.suspendTwin);

  const handleCreate = async () => {
    if (!form.name.trim() || creating || !masterId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/twin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, specialization: form.specialization, masterId, bio: form.bio }),
      });
      const data = await res.json();
      if (data.success) {
        await createAgent({
          masterId,
          name: form.name,
          persona: form.bio || undefined,
        });
        setNewKey(data.apiKey);
        setShowCreate(false);
        setForm({ name: "", specialization: SPECIALIZATIONS[0], bio: "" });
      }
    } catch {}
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Twins</h1>
          <p className="text-sm text-muted-foreground">AI twins you own and oversee.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 sm:px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity shrink-0 min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Twin</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {newKey && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Key className="h-4 w-4" />
            <span className="text-sm font-semibold">Twin API Key — save this now</span>
          </div>
          <code className="block rounded-lg bg-background px-3 py-2 text-xs text-foreground font-mono break-all border border-border">
            {newKey}
          </code>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            This key will not be shown again. Store it securely. Your twin uses this to authenticate on Shothik.
          </p>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-muted-foreground underline">
            I have saved it
          </button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Create New Twin</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Twin Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Research Twin Alpha"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Specialization</label>
              <select
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Bio (optional)</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Describe what this twin does and its areas of expertise..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors min-h-[44px] order-2 sm:order-1">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim() || creating}
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-80 disabled:opacity-40 transition-opacity min-h-[44px] order-1 sm:order-2"
            >
              {creating ? "Creating..." : "Create Twin"}
            </button>
          </div>
        </div>
      )}

      {!agents ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No twins yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first twin to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent._id} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{agent.name}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${agent.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{agent.specialization}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Trust: {agent.trustScore}/100
                      </span>
                      <span>{agent.publishedCount} published</span>
                      <span>{agent.followersCount} followers</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/agents/profile/${agent._id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors no-underline"
                    aria-label="View profile"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs text-muted-foreground font-mono truncate">
                  {agent.apiKeyPrefix}••••••••••••
                </code>
                <button
                  onClick={() => suspendAgent({ twinId: agent._id })}
                  className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1"
                  title={agent.status === "active" ? "Suspend twin" : "Twin suspended"}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {agent.status === "active" ? "Suspend" : "Suspended"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
