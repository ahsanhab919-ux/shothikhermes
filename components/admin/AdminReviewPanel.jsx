"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Globe,
  Upload,
  Send,
  BarChart3,
  Shield,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Download,
  Image,
  Hash,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  useAdminReview,
  useAdminBooks,
  useAdminStats,
  useAdminBookDetail,
} from "@/hooks/useAdminReview";

const STATUS_TABS = [
  { id: undefined, label: "Review Queue", icon: Search, description: "Submitted + In Review" },
  { id: "submitted", label: "Submitted", icon: Send },
  { id: "in_review", label: "In Review", icon: Search },
  { id: "approved", label: "Approved", icon: CheckCircle2 },
  { id: "published", label: "Published", icon: Globe },
  { id: "rejected", label: "Rejected", icon: XCircle },
];

const REJECTION_CATEGORIES = [
  { id: "content_quality", label: "Content Quality", desc: "Writing quality, errors, incomplete content" },
  { id: "formatting", label: "Formatting Issues", desc: "Layout, structure, or file format problems" },
  { id: "cover_quality", label: "Cover Quality", desc: "Image resolution, design, or dimensions" },
  { id: "metadata", label: "Metadata Issues", desc: "Title, description, or keyword problems" },
  { id: "copyright", label: "Copyright Concerns", desc: "Potential IP or plagiarism issues" },
  { id: "policy_violation", label: "Policy Violation", desc: "Violates publishing guidelines" },
  { id: "other", label: "Other", desc: "Other reasons not listed above" },
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn("size-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function BookListItem({ book, onSelect, isLoading }) {
  const statusColors = {
    submitted: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    in_review: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    published: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    uploading: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  const statusLabels = {
    submitted: "Submitted",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    published: "Published",
    uploading: "Publishing",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md hover:border-brand/30 transition-all cursor-pointer group"
      onClick={() => onSelect(book)}
    >
      <div className="flex gap-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-14 h-20 object-cover rounded-lg shadow shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand transition-colors">
                {book.title}
              </h4>
              {book.subtitle && (
                <p className="text-xs text-slate-500 truncate">{book.subtitle}</p>
              )}
            </div>
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full shrink-0", statusColors[book.status])}>
              {statusLabels[book.status]}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>User: {book.userId?.slice(0, 8)}...</span>
            {book.manuscriptFormat && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                {book.manuscriptFormat}
              </span>
            )}
            {book.listPrice && <span>${book.listPrice}</span>}
            {book.timestamps?.submitted && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(book.timestamps.submitted).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <Eye className="h-4 w-4 text-slate-300 group-hover:text-brand transition-colors shrink-0 self-center" />
      </div>
    </motion.div>
  );
}

function BookDetailPanel({ bookId, onBack }) {
  const { book, isLoading } = useAdminBookDetail(bookId);
  const { startReview, approveBook, rejectBook, markPublished, actionLoading } = useAdminReview();
  const assignIsbn = useMutation(api.isbn.assignIsbn);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isbn, setIsbn] = useState("");
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState("");
  const [googlePlayUrl, setGooglePlayUrl] = useState("");
  const [error, setError] = useState("");

  const handleAutoAssignIsbn = useCallback(async (format = "epub") => {
    if (!bookId) return;
    setIsbnLoading(true);
    setIsbnError("");
    try {
      const assigned = await assignIsbn({ bookId, format });
      setIsbn(assigned);
    } catch (err) {
      setIsbnError(err.message ?? "Failed to assign ISBN. Pool may be empty.");
    } finally {
      setIsbnLoading(false);
    }
  }, [bookId, assignIsbn]);

  const handleStartReview = useCallback(async () => {
    setError("");
    try {
      await startReview(bookId, "Admin");
    } catch (err) {
      setError(err.message);
    }
  }, [startReview, bookId]);

  const handleApprove = useCallback(async () => {
    setError("");
    try {
      await approveBook(bookId, { reviewNotes, isbn: isbn || undefined });
      setShowApproveForm(false);
      setReviewNotes("");
      setIsbn("");
    } catch (err) {
      setError(err.message);
    }
  }, [approveBook, bookId, reviewNotes, isbn]);

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    if (!rejectionCategory) {
      setError("Please select a rejection category");
      return;
    }
    setError("");
    try {
      await rejectBook(bookId, { rejectionReason, rejectionCategory, reviewNotes });
      setShowRejectForm(false);
      setRejectionReason("");
      setRejectionCategory("");
      setReviewNotes("");
    } catch (err) {
      setError(err.message);
    }
  }, [rejectBook, bookId, rejectionReason, rejectionCategory, reviewNotes]);

  const handlePublish = useCallback(async () => {
    if (!googlePlayUrl.trim()) {
      setError("Please provide the Google Play Books URL");
      return;
    }
    setError("");
    try {
      await markPublished(bookId, { googlePlayUrl, isbn: isbn || undefined });
      setShowPublishForm(false);
      setGooglePlayUrl("");
      setIsbn("");
    } catch (err) {
      setError(err.message);
    }
  }, [markPublished, bookId, googlePlayUrl, isbn]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Book not found</p>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </button>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex gap-6">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-32 h-48 object-cover rounded-xl shadow-lg shrink-0"
              />
            ) : (
              <div className="w-32 h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-10 w-10 text-slate-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{book.title}</h2>
              {book.subtitle && (
                <p className="text-slate-500 mb-3">{book.subtitle}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Language:</span>
                  <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">{book.language || "en"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">{book.category || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Price:</span>
                  <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">${book.listPrice} {book.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400">Author ID:</span>
                  <span className="ml-2 font-bold text-slate-700 dark:text-slate-300 text-xs">{book.userId}</span>
                </div>
              </div>

              {book.keywords && book.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {book.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {book.description && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {book.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              Manuscript
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">File:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate ml-2">{book.manuscriptName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{book.manuscriptFormat || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatFileSize(book.manuscriptSize)}</span>
              </div>
            </div>
            {book.manuscriptUrl && (
              <a
                href={book.manuscriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-3 text-xs text-brand font-bold hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download Manuscript
              </a>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Image className="h-4 w-4 text-brand" />
              Cover Image
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {book.coverDimensions
                    ? `${book.coverDimensions.width} × ${book.coverDimensions.height}px`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min Required:</span>
                <span className="text-slate-500">1600 × 2400px</span>
              </div>
              {book.coverDimensions && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Meets Spec:</span>
                  <span className={cn(
                    "font-bold",
                    book.coverDimensions.width >= 1600 && book.coverDimensions.height >= 2400
                      ? "text-emerald-500" : "text-red-500"
                  )}>
                    {book.coverDimensions.width >= 1600 && book.coverDimensions.height >= 2400 ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
            {book.coverUrl && (
              <a
                href={book.coverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-3 text-xs text-brand font-bold hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Cover
              </a>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            {Object.entries(book.timestamps || {}).map(([status, time]) => (
              <div key={status} className="flex justify-between">
                <span className="text-slate-400 capitalize">{status.replace("_", " ")}:</span>
                <span className="text-slate-600 dark:text-slate-400">{new Date(time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            Admin Actions
          </h3>

          <div className="flex flex-wrap gap-3">
            {book.status === "submitted" && (
              <button
                onClick={handleStartReview}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {actionLoading === bookId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Start Review
              </button>
            )}

            {(book.status === "submitted" || book.status === "in_review") && (
              <>
                <button
                  onClick={() => { setShowApproveForm(true); setShowRejectForm(false); setShowPublishForm(false); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => { setShowRejectForm(true); setShowApproveForm(false); setShowPublishForm(false); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}

            {book.status === "approved" && (
              <button
                onClick={() => { setShowPublishForm(true); setShowApproveForm(false); setShowRejectForm(false); }}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                Mark as Published
              </button>
            )}
          </div>

          <AnimatePresence>
            {showApproveForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Approve Book</h4>
                    <button onClick={() => setShowApproveForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">ISBN</label>
                    {isbn ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                        <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 flex-1">{isbn}</span>
                        <button
                          onClick={() => { setIsbn(""); setIsbnError(""); }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAutoAssignIsbn("epub")}
                            disabled={isbnLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {isbnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                            Auto-Assign EPUB ISBN
                          </button>
                          <button
                            onClick={() => handleAutoAssignIsbn("pdf")}
                            disabled={isbnLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
                          >
                            {isbnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hash className="h-3.5 w-3.5" />}
                            Auto-Assign PDF ISBN
                          </button>
                        </div>
                        {isbnError && <p className="text-[10px] text-red-500">{isbnError}</p>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Review Notes (optional)</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Internal notes about the review..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm Approval
                  </button>
                </div>
              </motion.div>
            )}

            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-red-700 dark:text-red-400">Reject Book</h4>
                    <button onClick={() => setShowRejectForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Rejection Category *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {REJECTION_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setRejectionCategory(cat.id)}
                          className={cn(
                            "text-left px-3 py-2 rounded-lg border text-xs transition-all",
                            rejectionCategory === cat.id
                              ? "border-red-400 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300"
                          )}
                        >
                          <span className="font-bold block">{cat.label}</span>
                          <span className="text-[10px] text-slate-400">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Reason for Rejection *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain what needs to be fixed so the author can revise and resubmit..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Internal Notes (optional)</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Internal notes (not shown to author)..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleReject}
                    disabled={!!actionLoading || !rejectionReason.trim() || !rejectionCategory}
                    className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            )}

            {showPublishForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400">Mark as Published</h4>
                    <button onClick={() => setShowPublishForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Google Play Books URL *</label>
                    <input
                      type="url"
                      value={googlePlayUrl}
                      onChange={(e) => setGooglePlayUrl(e.target.value)}
                      placeholder="https://play.google.com/store/books/details/..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">ISBN</label>
                    {isbn ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg">
                        <span className="text-sm font-mono font-bold text-purple-700 dark:text-purple-400 flex-1">{isbn}</span>
                        <button
                          onClick={() => { setIsbn(""); setIsbnError(""); }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAutoAssignIsbn("epub")}
                            disabled={isbnLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 transition-colors disabled:opacity-50"
                          >
                            {isbnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                            Auto-Assign EPUB ISBN
                          </button>
                          <button
                            onClick={() => handleAutoAssignIsbn("pdf")}
                            disabled={isbnLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
                          >
                            {isbnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hash className="h-3.5 w-3.5" />}
                            Auto-Assign PDF ISBN
                          </button>
                        </div>
                        {isbnError && <p className="text-[10px] text-red-500">{isbnError}</p>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={!!actionLoading || !googlePlayUrl.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Confirm Published
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function AdminReviewPanel() {
  const { user } = useSelector((state) => state.auth);

  const [statusFilter, setStatusFilter] = useState(undefined);
  const [selectedBookId, setSelectedBookId] = useState(null);

  const { books, isLoading } = useAdminBooks(statusFilter);
  const { stats } = useAdminStats();

  if (!user?._id) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-500">Please log in to access the review panel.</p>
        </div>
      </div>
    );
  }

  if (selectedBookId) {
    return (
      <BookDetailPanel
        bookId={selectedBookId}
        onBack={() => setSelectedBookId(null)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Publishing Review</h1>
            <p className="text-sm text-slate-500">Review and manage book submissions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={Send} label="Submitted" value={stats.submitted} color="bg-blue-100 dark:bg-blue-900/20 text-blue-500" />
          <StatCard icon={Search} label="In Review" value={stats.inReview} color="bg-amber-100 dark:bg-amber-900/20 text-amber-500" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500" />
          <StatCard icon={Globe} label="Published" value={stats.published} color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-red-100 dark:bg-red-900/20 text-red-500" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                statusFilter === tab.id
                  ? "bg-brand text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-brand animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Queue is Clear</h3>
            <p className="text-sm text-slate-500">No books matching this filter. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <BookListItem
                key={book._id}
                book={book}
                onSelect={(b) => setSelectedBookId(b._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
