"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  CreditCard,
  Wallet,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Building2,
  Globe,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePayouts, useEarnings } from "@/hooks/useEarnings";

const PAYOUT_METHODS = [
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    description: "Instant payouts to your bank account via Stripe Connect",
    available: true,
  },
  {
    id: "payoneer",
    name: "Payoneer",
    icon: Globe,
    description: "Global payouts — popular in South & Southeast Asia",
    available: true,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Building2,
    description: "Direct bank transfer (3-5 business days)",
    available: true,
  },
];

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20", icon: Clock },
  processing: { label: "Processing", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20", icon: Loader2 },
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-600 bg-red-100 dark:bg-red-900/20", icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800", icon: XCircle },
};

function PayoutRequestForm({ availableBalance, onSubmit, onCancel, isRequesting, error }) {
  const [amount, setAmount] = useState(availableBalance >= 25 ? availableBalance.toFixed(2) : "");
  const [method, setMethod] = useState("stripe");

  const now = new Date();
  const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const periodStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 25) return;
    if (numAmount > availableBalance) return;
    onSubmit({ amount: numAmount, method, periodStart, periodEnd });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white dark:bg-zinc-900/50 border-2 border-emerald-200 dark:border-emerald-800/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            Request Payout
          </h3>
          <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-zinc-600">
            Cancel
          </button>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1.5">Amount (min $25.00)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
            <input
              type="number"
              min="25"
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Available: ${availableBalance.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1.5">Payout Method</label>
          <div className="grid grid-cols-1 gap-2">
            {PAYOUT_METHODS.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                  method === pm.id
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                )}
              >
                <pm.icon className={cn("h-5 w-5", method === pm.id ? "text-emerald-600" : "text-zinc-400")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold", method === pm.id ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>
                    {pm.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{pm.description}</p>
                </div>
                {method === pm.id && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isRequesting || parseFloat(amount) < 25 || parseFloat(amount) > availableBalance}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRequesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
          {isRequesting ? "Processing..." : `Request $${parseFloat(amount || "0").toFixed(2)} Payout`}
        </button>
      </div>
    </motion.div>
  );
}

function StripeConnectSetup({ userId, email, onAccountSaved }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSetupStripe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          returnUrl: window.location.origin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create Stripe account");
        return;
      }

      if (onAccountSaved) {
        await onAccountSaved({
          method: "stripe",
          stripeConnectAccountId: data.accountId,
          isDefault: true,
        });
      }

      window.open(data.onboardingUrl, "_blank");
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Set Up Stripe Connect</h3>
          <p className="text-xs text-zinc-500">Connect your bank account to receive payouts</p>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      <button
        onClick={handleSetupStripe}
        disabled={isLoading}
        className="w-full py-2.5 bg-brand hover:bg-[#1171d3] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        {isLoading ? "Setting up..." : "Connect with Stripe"}
      </button>
    </div>
  );
}

export function PayoutManager() {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || "";
  const email = user?.email || "";

  const { summary } = useEarnings(userId);
  const { history, accounts, isLoading, isRequesting, error, requestPayout, savePayoutAccount } = usePayouts(userId);

  const [showRequestForm, setShowRequestForm] = useState(false);

  const hasStripeAccount = accounts.some((a) => a.method === "stripe" && a.stripeConnectAccountId);
  const hasPayoneerAccount = accounts.some((a) => a.method === "payoneer" && a.payoneerAccountEmail);

  const handleRequestPayout = useCallback(
    async (data) => {
      try {
        await requestPayout(data);
        setShowRequestForm(false);
      } catch (err) {
      }
    },
    [requestPayout]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-zinc-500">Available Balance</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">${summary.availableBalance.toFixed(2)}</p>
          {summary.availableBalance >= 25 && !showRequestForm && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="mt-2 text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
            >
              <ArrowUpRight className="h-3 w-3" />
              Request Payout
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-zinc-500">Pending Payouts</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">${summary.pendingPayouts.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-zinc-500">Total Paid Out</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">${summary.totalPaidOut.toFixed(2)}</p>
        </div>
      </div>

      <AnimatePresence>
        {showRequestForm && (
          <PayoutRequestForm
            availableBalance={summary.availableBalance}
            onSubmit={handleRequestPayout}
            onCancel={() => setShowRequestForm(false)}
            isRequesting={isRequesting}
            error={error}
          />
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand" />
          Payout Accounts
        </h3>

        {accounts.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 mb-4">
              Set up a payout account to receive your royalty earnings.
            </p>
            <StripeConnectSetup userId={userId} email={email} onAccountSaved={savePayoutAccount} />
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account._id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <CreditCard className="h-5 w-5 text-brand" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                    {account.method.replace("_", " ")}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {account.method === "stripe" && account.stripeConnectAccountId && `Connected: ${account.stripeConnectAccountId.slice(0, 12)}...`}
                    {account.method === "payoneer" && account.payoneerAccountEmail}
                    {account.method === "bank_transfer" && account.bankDetails && `${account.bankDetails.bankName} ****${account.bankDetails.lastFourDigits}`}
                  </p>
                </div>
                {account.isDefault && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-bold">Default</span>
                )}
              </div>
            ))}
            {!hasStripeAccount && (
              <StripeConnectSetup userId={userId} email={email} onAccountSaved={savePayoutAccount} />
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" />
          Payout History
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No payouts yet</p>
            <p className="text-xs text-zinc-400 mt-1">Your payout history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((payout) => {
              const config = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              return (
                <div key={payout._id} className="flex items-center gap-3 p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <div className={cn("size-8 rounded-lg flex items-center justify-center", config.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      ${payout.amount.toFixed(2)} via {payout.method.replace("_", " ")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(payout.createdAt).toLocaleDateString()} · {payout.periodStart} to {payout.periodEnd}
                    </p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", config.color)}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
