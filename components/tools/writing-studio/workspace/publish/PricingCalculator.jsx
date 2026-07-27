"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Calculator,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79 },
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka", rate: 110.5 },
  { code: "INR", symbol: "₹", label: "Indian Rupee", rate: 83.2 },
  { code: "EUR", symbol: "€", label: "Euro", rate: 0.92 },
];

const COMMISSION_RATE = 0.15;
const GOOGLE_TAKE = 0.30;

function RoyaltySplitBar({ listPrice }) {
  const price = parseFloat(listPrice) || 0;
  const googleCut = price * GOOGLE_TAKE;
  const shothikCommission = (price - googleCut) * COMMISSION_RATE;
  const authorRoyalty = price - googleCut - shothikCommission;

  if (price <= 0) return null;

  const googlePct = (googleCut / price) * 100;
  const shothikPct = (shothikCommission / price) * 100;
  const authorPct = (authorRoyalty / price) * 100;

  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-4 bg-zinc-200 dark:bg-zinc-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${authorPct}%` }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-500 h-full"
          title={`Author: ${authorPct.toFixed(1)}%`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${shothikPct}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-brand h-full"
          title={`Shothik: ${shothikPct.toFixed(1)}%`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${googlePct}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-zinc-400 h-full"
          title={`Google: ${googlePct.toFixed(1)}%`}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" />
          You ({authorPct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-brand" />
          Shothik ({shothikPct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-zinc-400" />
          Google ({googlePct.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}

export function PricingCalculator({ formData, updateFormData }) {
  const [monthlySales, setMonthlySales] = useState("50");
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const calculations = useMemo(() => {
    const price = parseFloat(formData.listPrice) || 0;
    const sales = parseInt(monthlySales) || 0;
    const googleRevenue = price * (1 - GOOGLE_TAKE);
    const commission = googleRevenue * COMMISSION_RATE;
    const authorRoyalty = googleRevenue - commission;
    const monthlyEarnings = authorRoyalty * sales;
    const yearlyEarnings = monthlyEarnings * 12;

    const curr = CURRENCIES.find((c) => c.code === displayCurrency) || CURRENCIES[0];
    const converted = {
      royalty: authorRoyalty * curr.rate,
      monthly: monthlyEarnings * curr.rate,
      yearly: yearlyEarnings * curr.rate,
    };

    return {
      price,
      googleCut: price * GOOGLE_TAKE,
      googleRevenue,
      commission,
      authorRoyalty,
      monthlyEarnings,
      yearlyEarnings,
      converted,
      currSymbol: curr.symbol,
    };
  }, [formData.listPrice, monthlySales, displayCurrency]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Set Your Price
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Choose your book's list price and see how much you'll earn per sale.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-brand" />
              <h3 className="font-bold text-sm">List Price</h3>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">$</span>
              <input
                type="number"
                value={formData.listPrice}
                onChange={(e) => updateFormData({ listPrice: e.target.value })}
                min="0.99"
                max="200"
                step="0.01"
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-16 py-4 text-2xl font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                aria-label="List price in USD"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">USD</span>
            </div>

            {parseFloat(formData.listPrice) < 0.99 && formData.listPrice !== "" && (
              <p className="text-xs text-red-400 mb-3">Minimum price is $0.99</p>
            )}

            <div className="flex flex-wrap gap-2">
              {["2.99", "4.99", "9.99", "14.99", "19.99"].map((price) => (
                <button
                  key={price}
                  onClick={() => updateFormData({ listPrice: price })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    formData.listPrice === price
                      ? "bg-brand text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  )}
                >
                  ${price}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-4 w-4 text-brand" />
              <h3 className="font-bold text-sm">Revenue Split</h3>
            </div>

            <RoyaltySplitBar listPrice={formData.listPrice} />

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">List Price</span>
                <span className="text-sm font-bold">${calculations.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">Google&apos;s share (30%)</span>
                <span className="text-sm font-bold text-zinc-400">-${calculations.googleCut.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">Net from Google (70%)</span>
                <span className="text-sm font-bold">${calculations.googleRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">Shothik commission (15%)</span>
                <span className="text-sm font-bold text-zinc-400">-${calculations.commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-50 dark:bg-emerald-900/10 -mx-3 px-3 rounded-lg">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Your royalty per sale</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ${calculations.authorRoyalty.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-brand" />
              <h3 className="font-bold text-sm">Earnings Projector</h3>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-zinc-500 mb-2">
                Estimated monthly sales
              </label>
              <input
                type="range"
                min="1"
                max="500"
                value={monthlySales}
                onChange={(e) => setMonthlySales(e.target.value)}
                className="w-full accent-brand"
                aria-label="Estimated monthly sales"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>1</span>
                <span className="font-bold text-brand">{monthlySales} sales/month</span>
                <span>500</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-500 mb-2">
                Display currency
              </label>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                aria-label="Display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Monthly Earnings</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">
                  {calculations.currSymbol}
                  {calculations.converted.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {monthlySales} sales x {calculations.currSymbol}
                  {calculations.converted.royalty.toFixed(2)} per sale
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Yearly Projection</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {calculations.currSymbol}
                  {calculations.converted.yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-brand mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                <p className="font-bold text-brand">How royalties work</p>
                <p>Google keeps 30% of the list price. From the remaining 70%, Shothik takes a 15% commission for publishing services (ISBN, review, distribution). You keep 85% of Google's payout.</p>
                <p>Royalties are calculated monthly and paid out once your balance reaches the minimum threshold.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
