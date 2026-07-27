"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  FlaskConical,
  Code2,
  Sigma,
  Lock,
  Crown,
  ChevronDown,
  ShieldCheck,
  Info,
} from "lucide-react";
import Link from "next/link";

export default function STEMSafeToggle({
  enabled,
  onToggle,
  stemStats,
  compact = false,
}) {
  const { user } = useSelector((state) => state.auth);
  const isPro = !!(user?.package && user.package !== "free");
  const [showInfo, setShowInfo] = useState(false);

  const handleToggle = () => {
    if (!isPro) {
      return;
    }
    onToggle(!enabled);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            enabled && isPro
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
          aria-label="Toggle STEM-Safe Mode"
        >
          <FlaskConical size={13} />
          STEM-Safe
          {!isPro && <Lock size={10} className="text-slate-400" />}
          {enabled && isPro && stemStats?.hasLatex && (
            <span className="flex items-center gap-0.5 text-[10px] bg-emerald-200 dark:bg-emerald-800/50 px-1.5 rounded-full">
              <Sigma size={9} /> {stemStats.latexCount}
            </span>
          )}
          {enabled && isPro && stemStats?.hasCode && (
            <span className="flex items-center gap-0.5 text-[10px] bg-emerald-200 dark:bg-emerald-800/50 px-1.5 rounded-full">
              <Code2 size={9} /> {stemStats.codeBlockCount}
            </span>
          )}
        </button>

        {!isPro && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <Link href="/pricing">
              <span className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                Upgrade to unlock
              </span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 transition-all ${
      enabled && isPro
        ? "border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/10"
        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    }`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 group"
        aria-label="Toggle STEM-Safe Mode"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            enabled && isPro
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-slate-100 dark:bg-slate-800"
          }`}>
            <FlaskConical size={16} className={enabled && isPro ? "text-emerald-600" : "text-slate-400"} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">STEM-Safe Mode</span>
              {!isPro && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Crown size={9} /> Pro
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Preserves LaTeX formulas & code blocks during paraphrasing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {enabled && isPro && stemStats && (stemStats.hasLatex || stemStats.hasCode) && (
            <div className="flex items-center gap-1.5 mr-2">
              {stemStats.hasLatex && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-400">
                  <Sigma size={10} /> {stemStats.latexCount} formula{stemStats.latexCount !== 1 ? "s" : ""}
                </span>
              )}
              {stemStats.hasCode && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-400">
                  <Code2 size={10} /> {stemStats.codeBlockCount} block{stemStats.codeBlockCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          <div className={`w-11 h-6 rounded-full relative transition-colors ${
            enabled && isPro ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          }`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled && isPro ? "translate-x-5" : "translate-x-0.5"
            }`} />
            {!isPro && (
              <Lock size={8} className="absolute top-1.5 left-1.5 text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {enabled && isPro && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-3 border-t border-emerald-200 dark:border-emerald-800/30 pt-2.5">
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={12} />
              <span className="font-medium">
                {stemStats?.hasLatex || stemStats?.hasCode
                  ? "STEM content detected and protected"
                  : "Monitoring for LaTeX formulas and code blocks"}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {!isPro && (
        <div className="px-4 pb-3">
          <Link href="/pricing">
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30 hover:border-blue-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Crown size={12} className="text-blue-500" />
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                  Unlock STEM-Safe Mode — from $7.99/mo
                </span>
              </div>
              <span className="text-blue-500 text-xs">&rarr;</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function STEMSafeBadge({ active, stemStats }) {
  if (!active) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
      <FlaskConical size={11} />
      STEM-Safe
      {stemStats?.hasLatex && <span className="text-[9px]">({stemStats.latexCount}∑)</span>}
      {stemStats?.hasCode && <span className="text-[9px]">({stemStats.codeBlockCount}&lt;/&gt;)</span>}
    </div>
  );
}
