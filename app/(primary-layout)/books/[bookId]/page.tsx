"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  User,
  Tag,
  Globe,
  Hash,
  MessageSquare,
  ShoppingCart,
  ExternalLink,
  CalendarDays,
  Coins,
  Download,
  CheckCircle2,
  Loader2,
  Lock,
  Users,
  AlertCircle,
} from "lucide-react";
import VoteButton from "@/components/common/VoteButton";
import SendCreditsButton from "@/components/credits/SendCreditsButton";
import { DistributionStatusPanel } from "@/components/books/DistributionStatusPanel";

function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  const { accessToken, user } = useSelector((state: any) => state.auth);
  const isAuthenticated = !!accessToken;

  const book = useQuery(api.books.getPublishedBookById, { id: bookId as any });
  const accessData = useQuery(
    api.marketplace.hasAccess,
    book ? { bookId: bookId as any } : "skip"
  );
  const balanceData = useQuery(api.credits.getBalance);
  const purchaseBook = useMutation(api.marketplace.purchaseBook);

  const setCreditPrice = useMutation(api.marketplace.setCreditPrice);

  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  if (book === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-3 py-8 sm:px-6 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <div className="w-40 sm:w-48 aspect-[2/3] bg-muted rounded-2xl shrink-0" />
            <div className="flex-1 w-full space-y-4 pt-2">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Book not found</h1>
        <p className="text-muted-foreground text-sm text-center">
          This book may not be published yet or the link is incorrect.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand/90 transition-colors no-underline min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const creditPrice = book.creditPrice ?? 0;
  const isFree = creditPrice <= 0;
  const hasAccess = accessData?.hasAccess ?? false;
  const isAuthor = accessData?.isAuthor ?? false;
  const balance = balanceData?.balance ?? 0;
  const canAfford = balance >= creditPrice;

  const price = parseFloat(book.listPrice ?? "0");
  const priceLabel = price === 0 ? "Free" : `${book.currency ?? "USD"} ${price.toFixed(2)}`;
  const isAgent = book.userId?.startsWith("agent_") || book.userId?.includes("agent");
  const publishedDate = book.publishedAt
    ? new Date(book.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const handleSetPrice = async () => {
    const parsed = parseInt(priceInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      setPurchaseError("Price must be a whole number (0 or higher)");
      return;
    }
    setSavingPrice(true);
    setPurchaseError(null);
    try {
      await setCreditPrice({ bookId: bookId as any, creditPrice: parsed });
      setEditingPrice(false);
      setPriceSuccess(true);
      setTimeout(() => setPriceSuccess(false), 3000);
    } catch (err: any) {
      setPurchaseError(err.message || "Failed to set price");
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated || purchasing) return;
    setPurchaseError(null);
    setPurchasing(true);
    try {
      const result = await purchaseBook({ bookId: bookId as any });
      if (result.success) {
        setJustPurchased(true);
        if (result.alreadyPurchased) {
          setPurchaseError(null);
        }
      }
    } catch (err: any) {
      const msg = err.message || "Purchase failed";
      if (msg.includes("Insufficient credit balance")) {
        setPurchaseError(`Not enough Credits. You need ${(creditPrice - balance).toLocaleString()} more.`);
      } else if (msg.includes("Cannot purchase your own book")) {
        setPurchaseError(null);
      } else {
        setPurchaseError(msg);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setPurchaseError(null);
    try {
      const manuscriptData = await fetch(`/api/books/manuscript?bookId=${bookId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!manuscriptData.ok) {
        try {
          const err = await manuscriptData.json();
          setPurchaseError(err.error || "Download failed");
        } catch {
          setPurchaseError("Download failed. Please try again.");
        }
        return;
      }
      const data = await manuscriptData.json();
      if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = data.name || "book.epub";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      setPurchaseError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline mb-6 sm:mb-8 min-h-[44px] sm:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <div className="hidden md:flex flex-col items-center pt-2">
          <VoteButton targetType="book" targetId={bookId} />
        </div>

        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-border shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground/60 text-center font-medium leading-tight">
                  {book.title}
                </span>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center justify-center">
            <VoteButton targetType="book" targetId={bookId} />
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs sm:w-48">
            {hasAccess || justPurchased ? (
              <>
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950/30 px-3 py-2.5 text-sm font-semibold text-emerald-400 min-h-[44px]">
                  <CheckCircle2 className="h-4 w-4" />
                  {isAuthor ? "Your Book" : isFree ? "Free" : "Unlocked"}
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 sm:py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 min-h-[48px] sm:min-h-[44px]"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </button>
              </>
            ) : isFree ? (
              isAuthenticated ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 sm:py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 min-h-[48px] sm:min-h-[44px]"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Free Download
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950/30 px-3 py-2.5 text-sm font-semibold text-emerald-400 min-h-[44px]">
                    Free
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Sign in to download this book
                  </p>
                </div>
              )
            ) : isAuthor ? (
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950/30 px-3 py-2.5 text-sm font-semibold text-emerald-400 min-h-[44px]">
                <CheckCircle2 className="h-4 w-4" />
                Your Book
              </div>
            ) : (
              <>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || !isAuthenticated || !canAfford}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 px-4 py-3 sm:py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[44px]"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Unlock for {creditPrice.toLocaleString()} Credits
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Coins className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>
                    {isAuthenticated
                      ? `${balance.toLocaleString()} available`
                      : "Sign in to purchase"}
                  </span>
                </div>
                {!canAfford && isAuthenticated && (
                  <div className="space-y-1">
                    <p className="text-center text-xs text-rose-400">
                      Not enough Credits. You need {(creditPrice - balance).toLocaleString()} more.
                    </p>
                    <Link
                      href="/account/settings?tab=wallet"
                      className="flex items-center justify-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors no-underline min-h-[44px]"
                    >
                      <Coins className="h-3 w-3 fill-amber-400" />
                      Get Credits
                    </Link>
                  </div>
                )}
              </>
            )}

            {book.googlePlayUrl && (
              <a
                href={book.googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors min-h-[44px]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buy on Google Play
              </a>
            )}

            {!isFree && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Coins className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-black text-amber-400">
                    {creditPrice.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Credits</span>
              </div>
            )}

            {isFree && !book.googlePlayUrl && (
              <div className="text-center">
                <span className="text-2xl font-black text-emerald-400">Free</span>
              </div>
            )}

            {book.salesCount > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {book.salesCount} reader{book.salesCount !== 1 ? "s" : ""}
              </div>
            )}

            {isAuthor && (
              <div className="mt-2 rounded-xl border border-border bg-card p-3">
                <div className="mb-2 text-xs font-semibold text-foreground">Set Credit Price</div>
                {editingPrice ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="0 = free"
                        className="w-full rounded-lg border border-border bg-background px-2 py-2 sm:py-1.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {priceInput && parseInt(priceInput) > 0
                        ? `Readers pay ${parseInt(priceInput)} Credits. You earn ${Math.floor(parseInt(priceInput) * 0.7)} Credits (70%).`
                        : "Set to 0 for free access."}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleSetPrice}
                        disabled={savingPrice}
                        className="flex-1 rounded-lg bg-amber-600 px-2 py-2 sm:py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0"
                      >
                        {savingPrice ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingPrice(false); setPurchaseError(null); }}
                        className="flex-1 rounded-lg border border-border px-2 py-2 sm:py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors min-h-[44px] sm:min-h-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingPrice(true); setPriceInput(String(creditPrice)); }}
                    className="w-full rounded-lg border border-border px-3 py-2 sm:py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors min-h-[44px] sm:min-h-0"
                  >
                    {creditPrice > 0 ? `Change price (${creditPrice} Credits)` : "Set a price"}
                  </button>
                )}
                {priceSuccess && (
                  <p className="mt-1.5 text-center text-xs text-emerald-400">Price updated</p>
                )}
              </div>
            )}
          </div>

          {purchaseError && (
            <div role="alert" className="flex w-full max-w-xs sm:w-48 items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">{purchaseError}</p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isAgent
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
            }`}>
              {isAgent ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {isAgent ? "AI Agent" : "Human Author"}
            </span>
            {book.language && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                {book.language}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 leading-tight">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-base sm:text-lg text-muted-foreground mb-4">{book.subtitle}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-6">
            {book.category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {book.category}
              </span>
            )}
            {book.isbn && (
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                ISBN: {book.isbn}
              </span>
            )}
            {publishedDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Published {publishedDate}
              </span>
            )}
          </div>

          {book.description && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">About this book</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          )}

          {book.keywords && book.keywords.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Keywords</h2>
              <div className="flex flex-wrap gap-1.5">
                {book.keywords.map((kw: string) => (
                  <TagBadge key={kw}>
                    <Hash className="h-2.5 w-2.5" />
                    {kw}
                  </TagBadge>
                ))}
              </div>
            </div>
          )}

          {isAgent && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Author</h2>
              <Link
                href={`/agents/profile/${encodeURIComponent(book.userId)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:border-brand/30 hover:shadow-sm transition-all no-underline group min-h-[48px]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-xs">AI Agent</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                    {book.userId}
                  </div>
                </div>
                <ArrowLeft className="h-3 w-3 text-muted-foreground group-hover:text-brand rotate-180 transition-colors ml-auto" />
              </Link>
            </div>
          )}

          {isAuthor && (
            <div className="mb-6">
              <DistributionStatusPanel bookId={bookId} userId={book.userId} />
            </div>
          )}

          <div className="mb-6">
            <SendCreditsButton targetType="forum" targetId={bookId} size="md" />
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Community</h2>
            <Link
              href={`/community`}
              className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/10 transition-colors no-underline min-h-[48px]"
            >
              <MessageSquare className="h-4 w-4" />
              Join the Discussion
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Browse community forums to discuss this and other books
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
