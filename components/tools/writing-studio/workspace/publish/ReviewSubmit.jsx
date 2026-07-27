"use client";

import {
  Send,
  FileText,
  BookOpen,
  Image,
  DollarSign,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Rocket,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const GOOGLE_TAKE = 0.30;
const COMMISSION_RATE = 0.15;

function formatFileSize(bytes) {
  if (!bytes) return "N/A";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionCard({ icon: Icon, title, status, children, onEdit }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {status === "complete" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {status === "incomplete" && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn("text-xs font-bold", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white")}>
        {value}
      </span>
    </div>
  );
}

export function ReviewSubmit({ formData, goBack, onSubmit, isSubmitting, submitError }) {
  const price = parseFloat(formData.listPrice) || 0;
  const googleRevenue = price * (1 - GOOGLE_TAKE);
  const commission = googleRevenue * COMMISSION_RATE;
  const authorRoyalty = googleRevenue - commission;

  const isComplete = !!(
    formData.manuscript &&
    formData.manuscriptFormat &&
    ["EPUB", "PDF"].includes(formData.manuscriptFormat) &&
    formData.title.trim().length >= 3 &&
    formData.title.trim().length <= 200 &&
    formData.description.trim().length >= 50 &&
    formData.description.trim().length <= 4000 &&
    formData.keywords.length >= 3 &&
    formData.keywords.length <= 7 &&
    formData.category &&
    formData.language &&
    formData.coverFile &&
    formData.coverDimensions &&
    formData.coverDimensions.width >= 1600 &&
    formData.coverDimensions.height >= 2400 &&
    price >= 0.99 &&
    price <= 200 &&
    formData.agreementAccepted &&
    formData.agreementScrolled &&
    formData.agreementName.trim().length >= 2
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Review & Submit
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review your book details before submitting for review. You can edit any section by clicking "Edit".
        </p>
      </div>

      <div className="space-y-4">
        <SectionCard icon={FileText} title="Manuscript" status={formData.manuscript ? "complete" : "incomplete"}>
          {formData.manuscript ? (
            <div className="space-y-1">
              <DetailRow label="File" value={formData.manuscriptName} />
              <DetailRow label="Size" value={formatFileSize(formData.manuscriptSize)} />
              <DetailRow label="Format" value={formData.manuscriptFormat} />
            </div>
          ) : (
            <p className="text-xs text-amber-500">No manuscript uploaded</p>
          )}
        </SectionCard>

        <SectionCard icon={BookOpen} title="Book Details" status={formData.title && formData.description && formData.category && formData.keywords.length >= 3 ? "complete" : "incomplete"}>
          <div className="space-y-1">
            <DetailRow label="Title" value={formData.title || "Not set"} />
            {formData.subtitle && <DetailRow label="Subtitle" value={formData.subtitle} />}
            <DetailRow label="Language" value={formData.language?.toUpperCase() || "EN"} />
            <DetailRow label="Category" value={formData.category?.replace(/_/g, " > ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Not selected"} />
            <DetailRow label="Keywords" value={formData.keywords.length > 0 ? formData.keywords.join(", ") : "None"} />
            <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Description</p>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3">
                {formData.description || "Not provided"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Image} title="Cover Art" status={formData.coverFile ? "complete" : "incomplete"}>
          {formData.coverFile && formData.coverPreview ? (
            <div className="flex items-start gap-4">
              <img
                src={formData.coverPreview}
                alt="Cover preview"
                className="w-16 h-24 object-cover rounded-lg shadow-md"
              />
              <div className="space-y-1 flex-1">
                <DetailRow label="Dimensions" value={formData.coverDimensions ? `${formData.coverDimensions.width} x ${formData.coverDimensions.height} px` : "Unknown"} />
                <DetailRow label="Size" value={formatFileSize(formData.coverFile.size)} />
                <DetailRow label="Format" value={formData.coverFile.type?.split("/")[1]?.toUpperCase()} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-500">No cover uploaded</p>
          )}
        </SectionCard>

        <SectionCard icon={DollarSign} title="Pricing & Royalties" status={price >= 0.99 ? "complete" : "incomplete"}>
          <div className="space-y-1">
            <DetailRow label="List Price" value={`$${price.toFixed(2)} USD`} />
            <DetailRow label="Google's share (30%)" value={`-$${(price * GOOGLE_TAKE).toFixed(2)}`} />
            <DetailRow label="Shothik commission (15%)" value={`-$${commission.toFixed(2)}`} />
            <DetailRow label="Your royalty per sale" value={`$${authorRoyalty.toFixed(2)}`} highlight />
          </div>
        </SectionCard>

        <SectionCard icon={FileCheck} title="Agreement" status={formData.agreementAccepted && formData.agreementName ? "complete" : "incomplete"}>
          <div className="space-y-1">
            <DetailRow label="Status" value={formData.agreementAccepted ? "Accepted" : "Not accepted"} />
            <DetailRow label="Signed by" value={formData.agreementName || "Not signed"} />
            <DetailRow label="Version" value="1.0" />
          </div>
        </SectionCard>
      </div>

      <div className={cn(
        "rounded-2xl p-6 border-2",
        isComplete
          ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30"
          : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "size-12 rounded-full flex items-center justify-center shrink-0",
            isComplete ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500" : "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
          )}>
            {isComplete ? <Rocket className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "font-bold mb-1",
              isComplete ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {isComplete ? "Ready to Submit" : "Some sections need attention"}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              {isComplete
                ? "Your book will be reviewed by our team within 48-72 hours. You'll receive email notifications about your submission status."
                : "Please complete all required sections before submitting. Go back to fill in missing information."}
            </p>

            {isComplete && (
              <div className="flex items-start gap-2 text-[10px] text-zinc-500 bg-white/60 dark:bg-zinc-900/30 rounded-lg p-3">
                <Shield className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
                <span>
                  By submitting, your book will undergo automated checks (formatting, plagiarism, content policy)
                  followed by a manual review. You'll be able to track your submission status in real-time.
                </span>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-300">{submitError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
