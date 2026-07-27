"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Check,
  Sparkles,
  ArrowRight,
  FlaskConical,
  Wand2,
  ShieldCheck,
  FileText,
  GraduationCap,
  Zap,
  BookOpen,
  Rocket,
} from "lucide-react";
import Link from "next/link";

const TRIGGER_MESSAGES = {
  word_limit: {
    title: "You've hit your daily word limit",
    subtitle: "Upgrade to keep writing without interruption",
    icon: Zap,
    iconColor: "#ef4444",
  },
  usage_high: {
    title: "You're running low on free uses",
    subtitle: "Don't lose momentum — upgrade for unlimited access",
    icon: Zap,
    iconColor: "#f59e0b",
  },
  pro_feature: {
    title: "This is a Pro feature",
    subtitle: "Unlock AI detection, plagiarism checking, and more",
    icon: Crown,
    iconColor: "#8b5cf6",
  },
  stem_mode: {
    title: "STEM-Safe Mode is a Pro feature",
    subtitle: "Preserve your LaTeX formulas and code blocks during paraphrasing",
    icon: FlaskConical,
    iconColor: "#10b981",
  },
  export: {
    title: "Export to DOCX/PDF requires an upgrade",
    subtitle: "Download your work in any format with a Pro plan",
    icon: FileText,
    iconColor: "var(--color-brand)",
  },
  third_use: {
    title: "You're getting value from Shothik AI",
    subtitle: "Upgrade now to remove limits and access all tools",
    icon: Sparkles,
    iconColor: "var(--color-brand)",
  },
  book_publish: {
    title: "Book publishing is a Premium feature",
    subtitle: "Publish your book to Google Play Books and more with the Enterprise plan",
    icon: BookOpen,
    iconColor: "#8b5cf6",
  },
};

const STARTER_FEATURES = [
  "Unlimited paraphrasing & grammar fixes",
  "STEM-Safe Mode (LaTeX & code)",
  "AI Detection scans",
  "Export to DOCX, PDF, LaTeX",
  "5 plagiarism checks per month",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "Unlimited plagiarism checks",
  "Smart citation manager",
  "Priority AI processing",
  "Research paper templates",
  "Work for Me AI agent",
];

const ENTERPRISE_FEATURES = [
  "Everything in Pro",
  "Book publishing to Google Play",
  "Journal-ready formatting",
  "Unlimited AI agents",
  "Team collaboration",
  "Priority support",
];

export default function UpgradePrompt({ trigger = "word_limit", open, onClose }) {
  const triggerConfig = TRIGGER_MESSAGES[trigger] || TRIGGER_MESSAGES.word_limit;
  const TriggerIcon = triggerConfig.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade your plan"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <TriggerIcon size={20} style={{ color: "white" }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{triggerConfig.title}</h2>
                  <p className="text-sm text-blue-100">{triggerConfig.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="border-2 border-blue-200 dark:border-blue-800/30 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                      STARTER
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1 mt-1">
                    <GraduationCap size={16} className="text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Starter</h3>
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">$7.99</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {STARTER_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <Check size={12} className="text-blue-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Get Starter <ArrowRight size={12} />
                    </motion.button>
                  </Link>
                </div>

                <div className="border-2 border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                      POPULAR
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1 mt-1">
                    <Sparkles size={16} className="text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pro</h3>
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">$15</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {PRO_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Get Pro <ArrowRight size={12} />
                    </motion.button>
                  </Link>
                </div>

                <div className="border-2 border-purple-200 dark:border-purple-800/30 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                      BEST VALUE
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1 mt-1">
                    <Rocket size={16} className="text-purple-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Enterprise</h3>
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">$25</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {ENTERPRISE_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <Check size={12} className="text-purple-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Get Enterprise <ArrowRight size={12} />
                    </motion.button>
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400">
                <span>Cancel anytime</span>
                <span>&middot;</span>
                <span>bKash, Razorpay & Stripe accepted</span>
                <span>&middot;</span>
                <span>7-day free trial available</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function UpgradeBanner({ trigger = "usage_high", onUpgrade }) {
  const triggerConfig = TRIGGER_MESSAGES[trigger] || TRIGGER_MESSAGES.usage_high;
  const TriggerIcon = triggerConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${triggerConfig.iconColor}15` }}>
          <TriggerIcon size={14} style={{ color: triggerConfig.iconColor }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">{triggerConfig.title}</p>
          <p className="text-[10px] text-slate-500">{triggerConfig.subtitle}</p>
        </div>
      </div>
      <Link href="/pricing">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          <Crown size={12} />
          From $7.99/mo
        </motion.button>
      </Link>
    </motion.div>
  );
}
