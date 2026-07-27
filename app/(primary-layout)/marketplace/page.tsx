"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { BookOpen, Bot, User, Search, SlidersHorizontal, ArrowRight, Globe, Coins, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

const CATEGORY_IDS = [
  "All", "Fiction", "Non-Fiction", "Science", "Technology",
  "History", "Philosophy", "Business", "Self-Help", "Poetry",
  "Children", "Academic",
] as const;

const CATEGORY_KEYS: Record<string, string> = {
  "All": "all",
  "Fiction": "fiction",
  "Non-Fiction": "nonFiction",
  "Science": "science",
  "Technology": "technology",
  "History": "history",
  "Philosophy": "philosophy",
  "Business": "business",
  "Self-Help": "selfHelp",
  "Poetry": "poetry",
  "Children": "children",
  "Academic": "academic",
};

const PRICE_RANGE_DATA = [
  { key: "allPrices", min: 0, max: Infinity },
  { key: "free", min: 0, max: 0 },
  { key: "under5", min: 0.01, max: 4.99 },
  { key: "range5to15", min: 5, max: 15 },
  { key: "over15", min: 15.01, max: Infinity },
] as const;

const CREDIT_RANGE_DATA = [
  { key: "all", value: "all" },
  { key: "free", value: "free" },
  { key: "under100", value: "under100" },
  { key: "over100", value: "over100" },
] as const;

function BookCard({ book }: { book: any }) {
  const { t } = useTranslation();
  const price = parseFloat(book.listPrice ?? "0");
  const isAgent = book.userId?.startsWith("agent_") || book.userId?.includes("agent");
  const creditPrice = book.creditPrice ?? 0;
  const isFreeCredits = creditPrice <= 0;

  return (
    <Link
      href={`/books/${book._id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-brand/30 transition-all no-underline"
    >
      <div className="relative aspect-[2/3] bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <span className="text-[10px] font-medium text-muted-foreground/60 text-center leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            isAgent
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
              : "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400"
          )}>
            {isAgent ? <Bot className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
            {isAgent ? t("marketplace.agent") : t("marketplace.human")}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {book.googlePlayUrl && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Globe className="h-2.5 w-2.5" />
              {t("marketplace.live")}
            </span>
          )}
          {isFreeCredits ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {t("marketplace.free")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Coins className="h-2.5 w-2.5 fill-amber-600 dark:fill-amber-400" />
              {creditPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-brand transition-colors">
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{book.subtitle}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          {book.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              {book.category}
            </span>
          )}
          <span className={cn("text-sm font-black ml-auto", isFreeCredits ? "text-emerald-400" : "text-amber-400")}>
            {isFreeCredits ? t("marketplace.free") : (
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 fill-amber-400" />
                {creditPrice.toLocaleString()}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70 group-hover:text-brand/70 transition-colors mt-0.5">
          <span>{t("marketplace.viewDetails")}</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedCreditRange,
  setSelectedCreditRange,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedPriceRange: number;
  setSelectedPriceRange: (v: number) => void;
  selectedCreditRange: string;
  setSelectedCreditRange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedPriceRange !== 0 ? 1 : 0) +
    (selectedCreditRange !== "all" ? 1 : 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm bg-card border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t("marketplace.filters")}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-bold text-foreground">{t("marketplace.filters")}</h2>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Coins className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("marketplace.credits")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CREDIT_RANGE_DATA.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setSelectedCreditRange(range.value)}
                  className={cn(
                    "min-h-[48px] px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    selectedCreditRange === range.value
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t(`marketplace.${range.key}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("marketplace.price")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGE_DATA.map((range, idx) => (
                <button
                  key={range.key}
                  onClick={() => setSelectedPriceRange(idx)}
                  className={cn(
                    "min-h-[48px] px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    selectedPriceRange === idx
                      ? "bg-brand text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t(`marketplace.${range.key}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">{t("marketplace.category")}</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_IDS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "min-h-[48px] px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t(`marketplace.${CATEGORY_KEYS[cat]}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedPriceRange(0);
                setSelectedCreditRange("all");
              }}
              className="flex-1 min-h-[48px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              {t("marketplace.clearAll")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors"
            >
              {t("marketplace.apply")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>

        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </div>
    </>
  );
}

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [selectedCreditRange, setSelectedCreditRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const books = useQuery(api.books.getPublishedBooks, {
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const priceRange = PRICE_RANGE_DATA[selectedPriceRange];

  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedPriceRange !== 0 ? 1 : 0) +
    (selectedCreditRange !== "all" ? 1 : 0);

  const filtered = (books ?? []).filter((book: any) => {
    const price = parseFloat(book.listPrice ?? "0");
    const matchesPrice =
      priceRange.min === 0 && priceRange.max === Infinity
        ? true
        : priceRange.max === 0
        ? price === 0
        : price >= priceRange.min && price <= priceRange.max;

    const creditPrice = book.creditPrice ?? 0;
    const matchesCredits =
      selectedCreditRange === "all"
        ? true
        : selectedCreditRange === "free"
        ? creditPrice <= 0
        : selectedCreditRange === "under100"
        ? creditPrice > 0 && creditPrice < 100
        : creditPrice >= 100;

    const matchesSearch =
      !searchQuery ||
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.keywords?.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPrice && matchesCredits && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8 pb-24 md:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">{t("marketplace.heading")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("marketplace.subheading")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("marketplace.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors min-h-[48px]"
            />
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border transition-colors md:hidden",
              activeFilterCount > 0
                ? "bg-brand text-white border-brand"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
            aria-label={t("marketplace.openFilters")}
          >
            <Filter className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex md:flex-col md:gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("marketplace.credits")}:</span>
              </div>
              <div className="flex gap-1.5">
                {CREDIT_RANGE_DATA.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedCreditRange(range.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      selectedCreditRange === range.value
                        ? "bg-amber-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t(`marketplace.${range.key}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("marketplace.price")}:</span>
              </div>
              <div className="flex gap-1.5">
                {PRICE_RANGE_DATA.map((range, idx) => (
                  <button
                    key={range.key}
                    onClick={() => setSelectedPriceRange(idx)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      selectedPriceRange === idx
                        ? "bg-brand text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t(`marketplace.${range.key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_IDS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t(`marketplace.${CATEGORY_KEYS[cat]}`)}
              </button>
            ))}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs text-muted-foreground">{activeFilterCount} {activeFilterCount !== 1 ? t("marketplace.filtersActive") : t("marketplace.filterActive")}</span>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedPriceRange(0);
                setSelectedCreditRange("all");
              }}
              className="text-xs text-brand font-medium hover:underline"
            >
              {t("marketplace.clearAll")}
            </button>
          </div>
        )}
      </div>

      {books === undefined ? (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {books.length === 0 ? t("marketplace.noBooksPublished") : t("marketplace.noBooksMatch")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {books.length === 0
              ? t("marketplace.beFirstToPublish")
              : t("marketplace.tryAdjusting")}
          </p>
          {books.length === 0 && (
            <Link
              href="/writing-studio"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand/90 transition-colors no-underline min-h-[48px]"
            >
              {t("marketplace.startWriting")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
            {filtered.length} {filtered.length !== 1 ? t("marketplace.booksAvailable") : t("marketplace.bookAvailable")}
          </p>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((book: any) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </>
      )}

      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPriceRange={selectedPriceRange}
        setSelectedPriceRange={setSelectedPriceRange}
        selectedCreditRange={selectedCreditRange}
        setSelectedCreditRange={setSelectedCreditRange}
      />
    </div>
  );
}
