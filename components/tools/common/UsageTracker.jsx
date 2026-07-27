"use client";

import { useSelector } from "react-redux";
import { useGetUsesLimitQuery } from "@/redux/api/tools/toolsApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  FileText,
  Wand2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

const TOOL_CONFIG = {
  paraphrase: {
    label: "Paraphrase",
    icon: Wand2,
    color: "var(--color-brand)",
    service: "paraphrase",
  },
  grammar: {
    label: "Grammar Fix",
    icon: FileText,
    color: "#10b981",
    service: "grammar",
  },
  humanize: {
    label: "Humanize GPT",
    icon: ShieldCheck,
    color: "#f59e0b",
    service: "bypass",
  },
  "ai-detector": {
    label: "AI Detector",
    icon: FlaskConical,
    color: "#8b5cf6",
    service: "ai-detector",
  },
};

function UsageBar({ used, total, color, label, icon: Icon }) {
  const percentage = total === 99999 ? 0 : Math.min((used / total) * 100, 100);
  const remaining = total === 99999 ? "Unlimited" : `${Math.max(0, total - used)} left`;
  const isUnlimited = total === 99999;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {isUnlimited ? (
              <span className="text-emerald-500 font-medium">Unlimited</span>
            ) : (
              remaining
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                backgroundColor: percentage >= 90 ? "#ef4444" : percentage >= 70 ? "#f59e0b" : color,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsageTracker({ currentTool, compact = false }) {
  const { user } = useSelector((state) => state.auth);
  const [expanded, setExpanded] = useState(false);
  const isAuthenticated = !!user?.email;
  const isPro = !!(user?.package && user.package !== "free");

  const { data: paraphraseLimits } = useGetUsesLimitQuery(
    { service: "paraphrase" },
    { skip: !isAuthenticated }
  );
  const { data: humanizeLimits } = useGetUsesLimitQuery(
    { service: "bypass" },
    { skip: !isAuthenticated }
  );
  const { data: aiDetectorLimits } = useGetUsesLimitQuery(
    { service: "ai-detector" },
    { skip: !isAuthenticated }
  );

  const limitsMap = useMemo(() => ({
    paraphrase: paraphraseLimits,
    grammar: paraphraseLimits,
    humanize: humanizeLimits,
    "ai-detector": aiDetectorLimits,
  }), [paraphraseLimits, humanizeLimits, aiDetectorLimits]);

  const totalUsedPercentage = useMemo(() => {
    if (!paraphraseLimits) return 0;
    const pUsed = paraphraseLimits.totalWordLimit === 99999 ? 0 :
      ((paraphraseLimits.totalWordLimit - paraphraseLimits.remainingWord) / paraphraseLimits.totalWordLimit) * 100;
    return Math.round(pUsed);
  }, [paraphraseLimits]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Sparkles size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Sign in to track usage</p>
            <p className="text-[11px] text-slate-500">Free users get 180 words per tool</p>
          </div>
        </div>
      </div>
    );
  }

  if (isPro && compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
        <Crown size={12} className="text-emerald-500" />
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          {user?.package?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Plan
        </span>
      </div>
    );
  }

  const currentToolConfig = TOOL_CONFIG[currentTool];
  const currentLimits = limitsMap[currentTool];

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          aria-label="Toggle usage details"
        >
          <div className="flex items-center gap-2">
            <Zap size={13} className={totalUsedPercentage >= 80 ? "text-red-500" : "text-blue-500"} />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Daily Usage: {totalUsedPercentage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalUsedPercentage >= 70 && !isPro && (
              <Link href="/pricing" className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Upgrade
              </Link>
            )}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                {Object.entries(TOOL_CONFIG).map(([key, config]) => {
                  const limits = limitsMap[key];
                  if (!limits) return null;
                  const used = limits.totalWordLimit - limits.remainingWord;
                  return (
                    <UsageBar
                      key={key}
                      used={Math.max(0, used)}
                      total={limits.totalWordLimit}
                      color={config.color}
                      label={config.label}
                      icon={config.icon}
                    />
                  );
                })}
                {!isPro && (
                  <Link href="/pricing">
                    <div className="flex items-center justify-center gap-2 mt-2 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors cursor-pointer">
                      <Crown size={12} />
                      Upgrade for Unlimited Access
                      <ArrowRight size={12} />
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daily Usage
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
          {user?.package === "free" ? "Free Plan" : user?.package?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-3">
        {currentToolConfig && currentLimits && (
          <UsageBar
            used={Math.max(0, currentLimits.totalWordLimit - currentLimits.remainingWord)}
            total={currentLimits.totalWordLimit}
            color={currentToolConfig.color}
            label={`${currentToolConfig.label} (Current)`}
            icon={currentToolConfig.icon}
          />
        )}

        {Object.entries(TOOL_CONFIG).map(([key, config]) => {
          if (key === currentTool) return null;
          const limits = limitsMap[key];
          if (!limits) return null;
          const used = limits.totalWordLimit - limits.remainingWord;
          return (
            <UsageBar
              key={key}
              used={Math.max(0, used)}
              total={limits.totalWordLimit}
              color={config.color}
              label={config.label}
              icon={config.icon}
            />
          );
        })}
      </div>

      {!isPro && (
        <Link href="/pricing">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center justify-center gap-2 mt-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Crown size={13} />
            Upgrade — Plans from $7.99/mo
            <ArrowRight size={13} />
          </motion.div>
        </Link>
      )}
    </div>
  );
}

export function InlineUsageBadge({ tool }) {
  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user?.email;
  const isPro = !!(user?.package && user.package !== "free");

  const config = TOOL_CONFIG[tool];
  const { data: limits } = useGetUsesLimitQuery(
    { service: config?.service || tool },
    { skip: !isAuthenticated || !config }
  );

  if (!isAuthenticated || !limits || isPro) return null;

  const remaining = limits.remainingWord;
  const total = limits.totalWordLimit;
  if (total === 99999) return null;

  const percentage = ((total - remaining) / total) * 100;

  if (percentage < 50) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
      percentage >= 90
        ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        : "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
    }`}>
      <Zap size={10} />
      {remaining <= 0
        ? "Limit reached"
        : `${remaining} words left`}
      {remaining <= 0 && (
        <Link href="/pricing" className="ml-1 underline font-semibold">
          Upgrade
        </Link>
      )}
    </div>
  );
}
