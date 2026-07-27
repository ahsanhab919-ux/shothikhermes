"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BookOpen, Coins, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function MyLibrarySection() {
  const purchases = useQuery(api.marketplace.getMyPurchases);

  if (!purchases) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse rounded-xl border border-border bg-muted/40 p-4">
            <div className="h-14 w-10 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="mb-1 text-base font-semibold text-foreground">No purchases yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Browse the marketplace and unlock books with Credits.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/80 transition-colors no-underline"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((p) => (
        <Link
          key={p._id}
          href={`/books/${p.bookId}`}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30 no-underline"
        >
          <div className="h-14 w-10 shrink-0 rounded-lg overflow-hidden border border-border bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            {p.bookCoverUrl ? (
              <img
                src={p.bookCoverUrl}
                alt={p.bookTitle ?? "Book"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {p.bookTitle ?? "Untitled Book"}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3 w-3 fill-amber-400 text-amber-400" />
                {p.creditAmount.toLocaleString()} Credits
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(p.purchasedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-950/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Unlocked
          </span>
        </Link>
      ))}
    </div>
  );
}
