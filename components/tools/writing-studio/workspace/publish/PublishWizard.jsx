"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  Image,
  DollarSign,
  FileCheck,
  Send,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Cloud,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublishingBook } from "@/hooks/usePublishingBook";
import { ManuscriptUpload } from "./ManuscriptUpload";
import { MetadataForm } from "./MetadataForm";
import { CoverUpload } from "./CoverUpload";
import { PricingCalculator } from "./PricingCalculator";
import { AgreementAcceptance } from "./AgreementAcceptance";
import { TaxInformationStep } from "./TaxInformationStep";
import { ReviewSubmit } from "./ReviewSubmit";

const STEPS = [
  { id: "manuscript", label: "Manuscript", icon: FileText, shortLabel: "Upload" },
  { id: "metadata", label: "Book Details", icon: BookOpen, shortLabel: "Details" },
  { id: "cover", label: "Cover Art", icon: Image, shortLabel: "Cover" },
  { id: "pricing", label: "Pricing", icon: DollarSign, shortLabel: "Price" },
  { id: "agreement", label: "Agreement", icon: FileCheck, shortLabel: "Terms" },
  { id: "tax", label: "Tax Info", icon: Shield, shortLabel: "Tax" },
  { id: "review", label: "Review & Submit", icon: Send, shortLabel: "Submit" },
];

const INITIAL_FORM_DATA = {
  manuscript: null,
  manuscriptName: "",
  manuscriptSize: 0,
  manuscriptFormat: "",
  title: "",
  subtitle: "",
  description: "",
  language: "en",
  category: "",
  subcategory: "",
  keywords: [],
  coverFile: null,
  coverPreview: null,
  coverDimensions: null,
  listPrice: "9.99",
  currency: "USD",
  agreementAccepted: false,
  agreementName: "",
  agreementScrolled: false,
};

function StepIndicator({ steps, currentStep, completedSteps }) {
  return (
    <div className="flex items-center justify-between px-2 mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isPast = index < currentStep;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isActive && "bg-brand border-brand text-white shadow-lg shadow-brand/30 scale-110",
                  isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                  isPast && !isCompleted && "bg-zinc-300 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-600 text-white",
                  !isActive && !isCompleted && !isPast && "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-wide uppercase transition-colors hidden sm:block",
                  isActive && "text-brand",
                  isCompleted && "text-emerald-500",
                  !isActive && !isCompleted && "text-zinc-400"
                )}
              >
                {step.shortLabel}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-18px] sm:mt-[-18px]">
                <div
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-500",
                    isPast || isCompleted ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const REJECTION_CATEGORY_MAP = {
  content_quality: { step: 0, label: "Content Quality", guidance: "Please review and improve your manuscript content. Consider strengthening your writing, fixing grammar issues, or enhancing the overall quality." },
  formatting: { step: 0, label: "Formatting Issues", guidance: "Your manuscript has formatting problems. Please re-upload a properly formatted EPUB or PDF file with consistent styling." },
  cover_quality: { step: 2, label: "Cover Quality", guidance: "Your cover image doesn't meet our standards. Upload a high-quality cover (minimum 1600x2400px) with professional design." },
  metadata: { step: 1, label: "Metadata Issues", guidance: "Please update your book details — title, description, keywords, or category may need improvement." },
  copyright: { step: 0, label: "Copyright Concerns", guidance: "There are copyright concerns with your submission. Ensure all content is original or properly licensed." },
  policy_violation: { step: 0, label: "Policy Violation", guidance: "Your submission violates our content policies. Please review our guidelines and make necessary changes." },
  other: { step: 0, label: "Other", guidance: "Please review the specific feedback below and make the requested changes." },
};

function RejectionBanner({ book, onGoToStep }) {
  if (!book || book.status !== "rejected") return null;

  const category = book.rejectionCategory || "other";
  const categoryInfo = REJECTION_CATEGORY_MAP[category] || REJECTION_CATEGORY_MAP.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/30 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="size-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              Revisions Required
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold">
              {categoryInfo.label}
            </span>
            {book.resubmissionCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                Attempt {(book.resubmissionCount || 0) + 1}
              </span>
            )}
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-2">
            {book.rejectionReason || categoryInfo.guidance}
          </p>
          {book.reviewNotes && (
            <div className="bg-white/60 dark:bg-zinc-800/40 rounded-lg p-3 mb-3 border border-amber-100 dark:border-amber-800/20">
              <p className="text-xs font-bold text-zinc-500 mb-1">Reviewer Notes:</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{book.reviewNotes}</p>
            </div>
          )}
          <button
            onClick={() => onGoToStep(categoryInfo.step)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
          >
            Go to {STEPS[categoryInfo.step]?.label || "relevant step"}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SaveIndicator({ isSaving, saveError }) {
  if (saveError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500">
        <AlertCircle className="h-3 w-3" />
        <span>Save failed</span>
      </div>
    );
  }
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-500">
      <Cloud className="h-3 w-3" />
      <span>Saved</span>
    </div>
  );
}

export function PublishWizard({ bookTitle, project, onSubmitSuccess, editBookId }) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || "";

  const {
    bookId,
    book: savedBook,
    isSaving,
    saveError,
    saveDraft,
    debouncedSave,
    uploadManuscript,
    uploadCover,
    submit,
    resubmit,
  } = usePublishingBook({
    bookId: editBookId || null,
    initialTitle: bookTitle || "",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
    title: bookTitle || "",
  });
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (savedBook && !hydrated) {
      setFormData((prev) => ({
        ...prev,
        title: savedBook.title || prev.title,
        subtitle: savedBook.subtitle || "",
        description: savedBook.description || "",
        language: savedBook.language || "en",
        category: savedBook.category || "",
        subcategory: savedBook.subcategory || "",
        keywords: savedBook.keywords || [],
        listPrice: savedBook.listPrice || "9.99",
        currency: savedBook.currency || "USD",
        agreementAccepted: savedBook.agreementAccepted || false,
        agreementName: savedBook.agreementName || "",
        agreementScrolled: savedBook.agreementScrolled || false,
        manuscriptName: savedBook.manuscriptName || "",
        manuscriptSize: savedBook.manuscriptSize || 0,
        manuscriptFormat: savedBook.manuscriptFormat || "",
        manuscript: savedBook.manuscriptStorageId ? { restored: true } : null,
        coverPreview: savedBook.coverUrl || null,
        coverFile: savedBook.coverStorageId ? { restored: true } : null,
        coverDimensions: savedBook.coverDimensions || null,
      }));
      setCurrentStep(savedBook.currentStep || 0);
      if (savedBook.completedSteps) {
        setCompletedSteps(new Set(savedBook.completedSteps));
      }
      setHydrated(true);
    }
  }, [savedBook, hydrated]);

  const updateFormData = useCallback(
    (updates) => {
      setFormData((prev) => ({ ...prev, ...updates }));

      const persistableFields = {};
      for (const [key, val] of Object.entries(updates)) {
        if (
          [
            "title", "subtitle", "description", "language", "category",
            "subcategory", "keywords", "listPrice", "currency",
            "agreementAccepted", "agreementName", "agreementScrolled",
            "manuscriptName", "manuscriptSize", "manuscriptFormat",
            "coverDimensions",
          ].includes(key)
        ) {
          persistableFields[key] = val;
        }
      }

      if (Object.keys(persistableFields).length > 0 && userId) {
        debouncedSave(persistableFields);
      }
    },
    [debouncedSave, userId]
  );

  const markStepCompleted = useCallback(
    (stepId) => {
      setCompletedSteps((prev) => {
        const next = new Set([...prev, stepId]);
        if (userId) {
          saveDraft({ completedSteps: Array.from(next) });
        }
        return next;
      });
    },
    [saveDraft, userId]
  );

  const canProceed = useMemo(() => {
    switch (STEPS[currentStep]?.id) {
      case "manuscript":
        return !!(
          formData.manuscript &&
          formData.manuscriptFormat &&
          ["EPUB", "PDF"].includes(formData.manuscriptFormat) &&
          formData.manuscriptSize > 0 &&
          formData.manuscriptSize <= 300 * 1024 * 1024
        );
      case "metadata":
        return (
          formData.title.trim().length >= 3 &&
          formData.title.trim().length <= 200 &&
          formData.description.trim().length >= 50 &&
          formData.description.trim().length <= 4000 &&
          formData.keywords.length >= 3 &&
          formData.keywords.length <= 7 &&
          formData.category !== "" &&
          formData.language !== ""
        );
      case "cover":
        return !!(
          formData.coverFile &&
          formData.coverDimensions &&
          formData.coverDimensions.width >= 1600 &&
          formData.coverDimensions.height >= 2400
        );
      case "pricing":
        return parseFloat(formData.listPrice) >= 0.99 && parseFloat(formData.listPrice) <= 200;
      case "agreement":
        return !!(
          formData.agreementAccepted &&
          formData.agreementScrolled &&
          formData.agreementName.trim().length >= 2
        );
      case "tax":
        return !!(formData.taxSaved);
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const goNext = useCallback(() => {
    if (!canProceed) return;
    markStepCompleted(STEPS[currentStep].id);
    const nextStep = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(nextStep);
    if (userId) {
      saveDraft({ currentStep: nextStep });
    }
  }, [currentStep, markStepCompleted, canProceed, saveDraft, userId]);

  const goBack = useCallback(() => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
    if (userId) {
      saveDraft({ currentStep: prevStep });
    }
  }, [currentStep, saveDraft, userId]);

  const goToStep = useCallback((index) => {
    if (index <= currentStep || completedSteps.has(STEPS[index - 1]?.id)) {
      setCurrentStep(index);
    }
  }, [currentStep, completedSteps]);

  const handleManuscriptUpload = useCallback(
    async (file) => {
      try {
        const result = await uploadManuscript(file);
        updateFormData({
          manuscript: file,
          manuscriptName: result.fileName,
          manuscriptSize: result.fileSize,
          manuscriptFormat: result.format,
        });
        return result;
      } catch (err) {
        console.error("Manuscript upload failed:", err);
        throw err;
      }
    },
    [uploadManuscript, updateFormData]
  );

  const handleCoverUpload = useCallback(
    async (file, dimensions) => {
      try {
        const result = await uploadCover(file, dimensions);
        const previewUrl = URL.createObjectURL(file);
        updateFormData({
          coverFile: file,
          coverPreview: previewUrl,
          coverDimensions: dimensions,
        });
        return result;
      } catch (err) {
        console.error("Cover upload failed:", err);
        throw err;
      }
    },
    [uploadCover, updateFormData]
  );

  const isResubmission = savedBook?.status === "rejected";

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (isResubmission) {
        await resubmit();
      } else {
        await submit();
      }
      setSubmitSuccess(true);
      markStepCompleted("review");
      onSubmitSuccess?.(bookId);
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitError(error.message || "Something went wrong while submitting your book. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [submit, resubmit, isResubmission, markStepCompleted, onSubmitSuccess, bookId]);

  const stepProps = {
    formData,
    updateFormData,
    goNext,
    goBack,
    canProceed,
    onManuscriptUpload: handleManuscriptUpload,
    onCoverUpload: handleCoverUpload,
    isSaving,
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="size-24 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="h-12 w-12" />
          </motion.div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">
            {isResubmission ? "Book Resubmitted for Review" : "Book Submitted for Review"}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            Your book <span className="font-bold text-zinc-900 dark:text-white">"{formData.title}"</span> has been {isResubmission ? "resubmitted" : "submitted"} successfully.
          </p>
          <p className="text-sm text-zinc-500 mb-8">
            {isResubmission
              ? "Our team will review your updated submission within 48-72 hours. We'll notify you when there's an update."
              : "Our team will review your submission within 48-72 hours. You'll receive a notification when there's an update."
            }
          </p>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Status</span>
              <span className="font-bold text-amber-500">Pending Review</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">{isResubmission ? "Resubmitted" : "Submitted"}</span>
              <span className="font-bold">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Expected Review</span>
              <span className="font-bold">2-3 business days</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div />
          <SaveIndicator isSaving={isSaving} saveError={saveError} />
        </div>

        {isResubmission && (
          <RejectionBanner
            book={savedBook}
            onGoToStep={(step) => setCurrentStep(step)}
          />
        )}

        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={STEPS[currentStep].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {currentStep === 0 && <ManuscriptUpload {...stepProps} />}
            {currentStep === 1 && <MetadataForm {...stepProps} />}
            {currentStep === 2 && <CoverUpload {...stepProps} />}
            {currentStep === 3 && <PricingCalculator {...stepProps} />}
            {currentStep === 4 && <AgreementAcceptance {...stepProps} />}
            {currentStep === 5 && <TaxInformationStep {...stepProps} />}
            {currentStep === 6 && (
              <ReviewSubmit
                {...stepProps}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              currentStep === 0
                ? "opacity-0 pointer-events-none"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={cn(
                  "size-2 rounded-full transition-all",
                  i === currentStep ? "bg-brand w-6" : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                canProceed
                  ? "bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/20"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
              )}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="size-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  {isResubmission ? "Resubmitting..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isResubmission ? "Resubmit for Review" : "Submit for Review"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
