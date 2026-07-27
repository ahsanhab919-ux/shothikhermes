"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, BookOpen, ShoppingCart, TrendingUp, Info } from "lucide-react";
import Link from "next/link";

export default function ContentSalesCard() {
  const salesData = useQuery(api.marketplace.getBookSales);

  if (!salesData) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded bg-muted" />
          <div className="h-5 w-36 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-8 w-12 rounded bg-muted" />
          </div>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <ShoppingCart className="h-5 w-5 text-emerald-500" />
        Content Sales
      </h3>

      <div className="mb-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground">Total Sales</div>
          <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            {salesData.totalSales}
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground">Credits Earned</div>
          <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-400">
            <Coins className="h-5 w-5 fill-amber-400" />
            {salesData.totalEarned.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3 shrink-0" />
        You receive 70% of each sale. 30% goes to platform and Reviewer Fund.
      </div>

      {salesData.books.length > 0 ? (
        <div className="space-y-2">
          {salesData.books.map((book) => (
            <Link
              key={book.bookId}
              href={`/books/${book.bookId}`}
              className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50 no-underline"
            >
              <div className="h-10 w-7 shrink-0 rounded overflow-hidden border border-border bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {book.title}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {book.salesCount > 0 ? (
                    <>
                      <span>{book.salesCount} sale{book.salesCount !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Coins className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {book.creditPrice} per copy
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-400">
                      {book.creditPrice > 0
                        ? `${book.creditPrice} Credits — no sales yet`
                        : "Free — set a price to start selling"}
                    </span>
                  )}
                </div>
              </div>
              {book.totalEarned > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
                  <Coins className="h-3.5 w-3.5 fill-amber-400" />
                  {book.totalEarned.toLocaleString()}
                </span>
              ) : book.creditPrice <= 0 ? (
                <span className="shrink-0 rounded-full bg-amber-950/30 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  Set Price
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No content sales yet. Set a Credit price on your published books to start selling.
          </p>
        </div>
      )}
    </div>
  );
}
