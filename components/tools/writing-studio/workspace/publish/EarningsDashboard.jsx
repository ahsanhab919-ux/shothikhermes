"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import {
  DollarSign,
  TrendingUp,
  BookOpen,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Clock,
  Download,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEarnings } from "@/hooks/useEarnings";

function StatCard({ icon: Icon, label, value, prefix = "$", color, subText }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("size-9 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-white">
        {prefix}{typeof value === "number" ? value.toFixed(2) : value}
      </p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {subText && (
        <p className="text-[10px] text-emerald-500 font-bold mt-1">{subText}</p>
      )}
    </div>
  );
}

function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">No sales data yet</p>
        <p className="text-xs text-zinc-400 mt-1">
          Earnings will appear here once your books start selling
        </p>
      </div>
    );
  }

  const maxRoyalty = Math.max(...data.map((d) => d.royalties), 1);
  const recentMonths = data.slice(0, 12);

  return (
    <div className="space-y-2">
      {recentMonths.map((month) => (
        <div key={month.period} className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-20 shrink-0 font-mono">
            {month.period}
          </span>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(month.royalties / maxRoyalty) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-end px-2"
            >
              {month.royalties > maxRoyalty * 0.15 && (
                <span className="text-[10px] font-bold text-white">
                  ${month.royalties.toFixed(2)}
                </span>
              )}
            </motion.div>
          </div>
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 w-16 text-right">
            {month.units} sold
          </span>
        </div>
      ))}
    </div>
  );
}

function BookEarningsTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">No book earnings yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="text-left py-2 px-3 text-xs font-bold text-zinc-500 uppercase">Book</th>
            <th className="text-right py-2 px-3 text-xs font-bold text-zinc-500 uppercase">Units Sold</th>
            <th className="text-right py-2 px-3 text-xs font-bold text-zinc-500 uppercase">Revenue</th>
            <th className="text-right py-2 px-3 text-xs font-bold text-zinc-500 uppercase">Your Royalties</th>
          </tr>
        </thead>
        <tbody>
          {data.map((book) => (
            <tr key={book.bookId} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="py-3 px-3">
                <span className="font-bold text-zinc-900 dark:text-white">{book.title}</span>
              </td>
              <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                {book.units}
              </td>
              <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                ${book.revenue.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right font-bold text-emerald-600 font-mono">
                ${book.royalties.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 dark:border-zinc-600">
            <td className="py-3 px-3 font-black text-zinc-900 dark:text-white">Total</td>
            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white font-mono">
              {data.reduce((s, b) => s + b.units, 0)}
            </td>
            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white font-mono">
              ${data.reduce((s, b) => s + b.revenue, 0).toFixed(2)}
            </td>
            <td className="py-3 px-3 text-right font-black text-emerald-600 font-mono">
              ${data.reduce((s, b) => s + b.royalties, 0).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function EarningsDashboard({ onRequestPayout }) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || "";
  const { summary, isLoading } = useEarnings(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign}
          label="Total Royalties Earned"
          value={summary.totalEarnings}
          color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"
        />
        <StatCard
          icon={Wallet}
          label="Available Balance"
          value={summary.availableBalance}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600"
          subText={summary.availableBalance >= 25 ? "Eligible for payout" : "Min $25 for payout"}
        />
        <StatCard
          icon={TrendingUp}
          label="Units Sold"
          value={summary.totalUnitsSold}
          prefix=""
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600"
        />
        <StatCard
          icon={CreditCard}
          label="Total Paid Out"
          value={summary.totalPaidOut}
          color="bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
        />
      </div>

      {summary.availableBalance >= 25 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="text-white">
            <p className="font-bold">You have ${summary.availableBalance.toFixed(2)} available for payout</p>
            <p className="text-sm text-emerald-100">Request a payout to your connected account</p>
          </div>
          <button
            onClick={onRequestPayout}
            className="px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" />
            Request Payout
          </button>
        </motion.div>
      )}

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand" />
          Monthly Royalties
        </h3>
        <MonthlyChart data={summary.monthlyBreakdown} />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          Earnings by Book
        </h3>
        <BookEarningsTable data={summary.perBookEarnings} />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
        <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">How Royalties Work</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-500">
          <div className="flex items-start gap-2">
            <div className="size-5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">1</div>
            <p>Google pays 70% of list price to Shothik as publisher of record</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="size-5 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">2</div>
            <p>Shothik keeps 15% commission for publishing services</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="size-5 rounded bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">3</div>
            <p>You receive 85% of the net revenue as your royalty</p>
          </div>
        </div>
      </div>
    </div>
  );
}
