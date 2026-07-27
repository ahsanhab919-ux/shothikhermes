"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  CheckCircle2,
  Lock,
  Crown,
  ArrowRight,
  Rocket,
  BookOpen,
  ArrowLeft,
  BarChart3,
  Loader2,
  DollarSign,
  CreditCard,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { PublishWizard } from "./publish/PublishWizard";
import { StatusTracker } from "./publish/StatusTracker";
import { AuthorDashboard } from "./publish/AuthorDashboard";
import { NotificationBell } from "./publish/NotificationBell";
import { EarningsDashboard } from "./publish/EarningsDashboard";
import { PayoutManager } from "./publish/PayoutManager";
import { DistributionManager } from "./publish/DistributionManager";
import { useAuthorBooks } from "@/hooks/usePublishingBook";

const ENTERPRISE_PACKAGES = ["enterprise", "enterprise_plan", "unlimited"];

function useIsEnterprise() {
  const { user } = useSelector((state) => state.auth);
  const pkg = user?.package || "";
  return ENTERPRISE_PACKAGES.includes(pkg);
}

const DASHBOARD_TABS = [
  { id: "books", label: "My Books", icon: BookOpen },
  { id: "earnings", label: "Earnings", icon: DollarSign },
  { id: "payouts", label: "Payouts", icon: CreditCard },
  { id: "distribution", label: "Distribution", icon: Globe },
];

function PublishGate({ children }) {
  const isEnterprise = useIsEnterprise();

  if (isEnterprise) return children;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="size-20 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">
          Book Publishing is an Enterprise Feature
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed text-lg">
          Publish your books to Google Play Books and reach readers in 75+ global markets.
          Upgrade to the Enterprise plan to unlock book publishing, earn royalties,
          and get priority support.
        </p>

        <div className="bg-white dark:bg-zinc-900/50 border-2 border-purple-200 dark:border-purple-800/30 rounded-2xl p-6 mb-8 max-w-sm mx-auto text-left">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Enterprise Plan</h3>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">$25</span>
            <span className="text-sm text-zinc-500">/month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {[
              "Publish to Google Play Books",
              "Earn 85% royalties on every sale",
              "Free ISBN assignment",
              "48-72 hour review & publishing",
              "Monthly earnings dashboard",
              "Everything in Pro plan",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/pricing">
            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Enterprise
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        <p className="text-xs text-zinc-400">
          You can still write and format your book on any plan. Publishing requires Enterprise.
        </p>
      </div>
    </div>
  );
}

export function PublishView({ bookTitle = "The Midnight Protocol", project }) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || "";

  const { books, isLoading } = useAuthorBooks();

  const [view, setView] = useState("dashboard");
  const [dashboardTab, setDashboardTab] = useState("books");
  const [selectedBook, setSelectedBook] = useState(null);
  const [editBookId, setEditBookId] = useState(null);

  const handleStartPublishing = useCallback(() => {
    setEditBookId(null);
    setView("wizard");
  }, []);

  const handleSelectBook = useCallback((book) => {
    setSelectedBook(book);
    if (book.status === "draft" || book.status === "rejected") {
      setEditBookId(book._id);
      setView("wizard");
    } else {
      setView("tracker");
    }
  }, []);

  const handleNotificationSelect = useCallback((book) => {
    const fullBook = books.find((b) => b._id === book._id);
    if (fullBook) {
      handleSelectBook(fullBook);
    } else {
      setSelectedBook(book);
      setView("tracker");
    }
  }, [books, handleSelectBook]);

  const handleBackToDashboard = useCallback(() => {
    setView("dashboard");
    setSelectedBook(null);
    setEditBookId(null);
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    setView("dashboard");
    setEditBookId(null);
  }, []);

  const handleGoToPayouts = useCallback(() => {
    setDashboardTab("payouts");
  }, []);

  if (isLoading) {
    return (
      <PublishGate>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-brand animate-spin" />
            <p className="text-sm text-zinc-500">Loading your books...</p>
          </div>
        </div>
      </PublishGate>
    );
  }

  return (
    <PublishGate>
      <AnimatePresence mode="wait">
        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 pt-4">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-1">
                {DASHBOARD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      dashboardTab === tab.id
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <NotificationBell onSelectBook={handleNotificationSelect} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {dashboardTab === "books" && (
                  <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AuthorDashboard
                      books={books}
                      onSelectBook={handleSelectBook}
                      onStartPublishing={handleStartPublishing}
                    />
                  </motion.div>
                )}

                {dashboardTab === "earnings" && (
                  <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="max-w-4xl mx-auto px-6 py-6">
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Royalty Earnings</h2>
                      <p className="text-sm text-zinc-500 mb-6">Track your book sales and royalties across all channels</p>
                      <EarningsDashboard onRequestPayout={handleGoToPayouts} />
                    </div>
                  </motion.div>
                )}

                {dashboardTab === "payouts" && (
                  <motion.div key="payouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="max-w-4xl mx-auto px-6 py-6">
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Payouts</h2>
                      <p className="text-sm text-zinc-500 mb-6">Manage your payout methods and request withdrawals</p>
                      <PayoutManager />
                    </div>
                  </motion.div>
                )}

                {dashboardTab === "distribution" && (
                  <motion.div key="distribution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="max-w-4xl mx-auto px-6 py-6">
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Distribution</h2>
                      <p className="text-sm text-zinc-500 mb-6">Manage where your books are distributed worldwide</p>
                      <DistributionManager book={selectedBook || books[0]} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {view === "wizard" && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-6 pt-6 pb-2">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-brand transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Books
              </button>
            </div>
            <PublishWizard
              bookTitle={bookTitle}
              project={project}
              onSubmitSuccess={handleSubmitSuccess}
              editBookId={editBookId}
            />
          </motion.div>
        )}

        {view === "tracker" && selectedBook && (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-3xl mx-auto px-6 py-8">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-brand transition-colors font-medium mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Books
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  {selectedBook.title}
                </h2>
                {selectedBook.subtitle && (
                  <p className="text-zinc-500 mt-1">{selectedBook.subtitle}</p>
                )}
              </div>

              <StatusTracker
                book={selectedBook}
                onResubmit={() => {
                  setEditBookId(selectedBook._id);
                  setView("wizard");
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublishGate>
  );
}
