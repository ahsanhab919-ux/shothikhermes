"use client";

import { useState } from "react";
import {
  BookOpen,
  TrendingUp,
  DollarSign,
  Eye,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Globe,
  Upload,
  ArrowRight,
  BarChart3,
  FileText,
  Rocket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", icon: Upload },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400", icon: Search },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  uploading: { label: "Publishing", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400", icon: Upload },
  published: { label: "Live", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", icon: Globe },
};

const DEMO_BOOKS = [];

function StatCard({ icon: Icon, label, value, subvalue, color }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("size-9 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {subvalue && (
        <p className="text-[10px] text-emerald-500 font-bold mt-1">{subvalue}</p>
      )}
    </div>
  );
}

function BookCard({ book, onSelect }) {
  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-brand/30 transition-all cursor-pointer group"
      onClick={() => onSelect(book)}
    >
      <div className="flex gap-4 p-4">
        {(book.coverUrl) ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-16 h-24 object-cover rounded-lg shadow-md shrink-0"
          />
        ) : (
          <div className="w-16 h-24 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-zinc-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-brand transition-colors">
                {book.title}
              </h4>
              {book.subtitle && (
                <p className="text-xs text-zinc-500 truncate">{book.subtitle}</p>
              )}
            </div>
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0", statusInfo.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {book.listPrice && (
              <span className="text-xs text-zinc-500">
                ${book.listPrice}
              </span>
            )}
            {book.salesCount !== undefined && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {book.salesCount} sales
              </span>
            )}
            {(book.updatedAt || book._creationTime) && (
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(book.updatedAt || book._creationTime).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-brand transition-colors shrink-0 self-center" />
      </div>
    </motion.div>
  );
}

function EmptyState({ onStartPublishing }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-8"
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="size-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Rocket className="h-12 w-12" />
        </motion.div>

        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">
          Publish Your First Book
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
          Start earning by publishing your books to Google Play Books and reaching readers in 75+ countries. We handle the ISBN, review, and distribution — you focus on writing.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: "Free ISBN", desc: "We assign it" },
            { icon: Globe, label: "75+ Markets", desc: "Global reach" },
            { icon: DollarSign, label: "85% Royalty", desc: "You keep more" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            >
              <Icon className="h-5 w-5 text-brand mx-auto mb-1.5" />
              <p className="text-xs font-bold text-zinc-900 dark:text-white">{label}</p>
              <p className="text-[10px] text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStartPublishing}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/30 hover:bg-brand/90 transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          Start Publishing
        </button>

        <p className="text-[10px] text-zinc-400 mt-4">
          Enterprise plan required. Publishing is free — we earn a small commission on sales.
        </p>
      </div>
    </motion.div>
  );
}

export function AuthorDashboard({ books = DEMO_BOOKS, onSelectBook, onStartPublishing }) {
  const [filter, setFilter] = useState("all");

  if (books.length === 0) {
    return <EmptyState onStartPublishing={onStartPublishing} />;
  }

  const filteredBooks = filter === "all" ? books : books.filter((b) => b.status === filter);

  const stats = {
    total: books.length,
    published: books.filter((b) => b.status === "published").length,
    pending: books.filter((b) => ["submitted", "in_review", "approved", "uploading"].includes(b.status)).length,
    totalSales: books.reduce((sum, b) => sum + (b.salesCount || 0), 0),
  };

  const filters = [
    { id: "all", label: "All Books" },
    { id: "draft", label: "Drafts" },
    { id: "submitted", label: "Submitted" },
    { id: "in_review", label: "In Review" },
    { id: "published", label: "Published" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">My Books</h2>
            <p className="text-sm text-zinc-500">Manage your published and upcoming books</p>
          </div>
          <button
            onClick={onStartPublishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Book
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Books"
            value={stats.total}
            color="bg-brand/10 text-brand"
          />
          <StatCard
            icon={Globe}
            label="Published"
            value={stats.published}
            color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500"
          />
          <StatCard
            icon={Clock}
            label="In Pipeline"
            value={stats.pending}
            color="bg-amber-100 dark:bg-amber-900/20 text-amber-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Sales"
            value={stats.totalSales}
            subvalue={stats.totalSales > 0 ? "View earnings" : undefined}
            color="bg-purple-100 dark:bg-purple-900/20 text-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map((f) => {
            const count = f.id === "all" ? books.length : books.filter((b) => b.status === f.id).length;
            if (count === 0 && f.id !== "all") return null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  filter === f.id
                    ? "bg-brand text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  filter === f.id ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-700"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book) => (
              <BookCard key={book._id || book.id} book={book} onSelect={onSelectBook} />
            ))}
          </AnimatePresence>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No books found with this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
