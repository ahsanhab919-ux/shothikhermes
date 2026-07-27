"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentBuild } from "@/hooks/useDocumentBuild";
import { isWritingStudioEnabled, getTemplates } from "@/services/writing-studio.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  FileText,
  X,
  Package,
} from "lucide-react";
import { toast } from "react-toastify";

const FALLBACK_TEMPLATES = [
  { templateId: "academic-ieee", name: "IEEE", description: "IEEE conference and journal format", icon: "📐", category: "Academic", tags: ["ieee", "engineering"], thumbnailUrl: "" },
  { templateId: "academic-apa", name: "APA", description: "American Psychological Association", icon: "📄", category: "Academic", tags: ["apa", "research"], thumbnailUrl: "" },
  { templateId: "academic-chicago", name: "Chicago", description: "Chicago/Turabian style", icon: "📋", category: "Academic", tags: ["chicago", "humanities"], thumbnailUrl: "" },
  { templateId: "academic-harvard", name: "Harvard", description: "Harvard referencing style", icon: "🎓", category: "Academic", tags: ["harvard"], thumbnailUrl: "" },
  { templateId: "academic-article", name: "Article", description: "Clean academic publication layout", icon: "📝", category: "Academic", tags: ["article", "journal"], thumbnailUrl: "" },
  { templateId: "academic-essay", name: "Essay", description: "General purpose essay format", icon: "✒️", category: "Academic", tags: ["essay"], thumbnailUrl: "" },
  { templateId: "academic-appendix", name: "Appendix", description: "Supplementary materials layout", icon: "📂", category: "Academic", tags: ["appendix"], thumbnailUrl: "" },
  { templateId: "research-lab-report", name: "Lab Report", description: "Scientific laboratory report", icon: "🔬", category: "Research", tags: ["lab", "science"], thumbnailUrl: "" },
  { templateId: "research-literature-review", name: "Literature Review", description: "Comprehensive research review", icon: "📚", category: "Research", tags: ["review"], thumbnailUrl: "" },
  { templateId: "professional-modern-book", name: "Modern Book", description: "Professional book/thesis format", icon: "📕", category: "Professional", tags: ["book", "thesis"], thumbnailUrl: "" },
];

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const BOOK_EXPORT_FORMATS = [
  { id: "docx", label: "DOCX", icon: "📝", desc: "Microsoft Word" },
  { id: "epub", label: "EPUB", icon: "📖", desc: "eBook format" },
  { id: "mobi", label: "MOBI", icon: "📱", desc: "Kindle format" },
  { id: "kepub", label: "KEPUB", icon: "📚", desc: "Kobo format" },
];

export function ExportPanel({ editor, onClose, bookId }) {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [orientation, setOrientation] = useState("portrait");
  const [primaryColor, setPrimaryColor] = useState("#1e293b");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [showPreview, setShowPreview] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [bookDownloadingFormat, setBookDownloadingFormat] = useState(null);

  const backendEnabled = isWritingStudioEnabled();
  const { buildState, startBuild, resetBuild, downloadPdf } = useDocumentBuild();

  useEffect(() => {
    if (!backendEnabled) return;
    setLoadingTemplates(true);
    getTemplates()
      .then((data) => {
        if (data && data.length > 0) {
          setTemplates(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load export templates:", err);
        toast.error("Failed to load export templates. Please try again.");
      })
      .finally(() => setLoadingTemplates(false));
  }, [backendEnabled]);

  const handleGeneratePdf = useCallback(() => {
    if (!editor || !selectedTemplateId) return;
    if (!backendEnabled) {
      toast.error("PDF export requires the Writing Studio backend to be connected.");
      return;
    }
    const html = editor.getHTML();
    startBuild(html, {
      templateId: selectedTemplateId,
      styles: {
        primaryColor,
        accentColor,
        orientation,
      },
    });
    toast.info("PDF generation started...");
  }, [editor, selectedTemplateId, startBuild, primaryColor, accentColor, orientation, backendEnabled]);

  const handleRetry = useCallback(() => {
    resetBuild();
    handleGeneratePdf();
  }, [resetBuild, handleGeneratePdf]);

  const handleBookExport = useCallback(async (format) => {
    if (!bookId) {
      toast.error("No book selected for export.");
      return;
    }
    setBookDownloadingFormat(format);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
      const res = await fetch("/api/books/export/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId, format }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || `Export to ${format.toUpperCase()} failed.`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manuscript.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded!`);
    } catch {
      toast.error("Export failed. The conversion service may be unavailable.");
    } finally {
      setBookDownloadingFormat(null);
    }
  }, [bookId]);

  const categories = [...new Set(templates.map((t) => t.category))];

  const groupedTemplates = categories.reduce((acc, cat) => {
    acc[cat] = templates.filter((t) => t.category === cat);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={springTransition}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Export to PDF</h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            aria-label="Close export panel"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!backendEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springTransition}
          className="p-3 bg-amber-500/10 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>PDF export will be available when the Writing Studio backend is connected.</span>
        </motion.div>
      )}

      <div className="p-6 bg-muted/50 shadow-sm rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Select Template</span>
          {loadingTemplates && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        <ScrollArea className="max-h-[350px]" aria-label="Template selection">
          <div className="space-y-4 pr-2">
            {categories.map((category) => (
              <div key={category}>
                <Badge variant="secondary" className="mb-2 text-[10px]">
                  {category}
                </Badge>
                <div className="grid grid-cols-2 gap-2">
                  {groupedTemplates[category].map((template) => (
                    <motion.button
                      key={template.templateId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springTransition}
                      onClick={() =>
                        setSelectedTemplateId(
                          selectedTemplateId === template.templateId ? null : template.templateId
                        )
                      }
                      className={cn(
                        "p-3 bg-muted/30 shadow-sm rounded-xl text-left transition-all w-full",
                        selectedTemplateId === template.templateId
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted/60"
                      )}
                      aria-label={`Select ${template.name} template`}
                      aria-pressed={selectedTemplateId === template.templateId}
                    >
                      {template.thumbnailUrl && (
                        <div className="w-full h-16 rounded-lg bg-muted/50 mb-2 overflow-hidden">
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{template.name}</div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AnimatePresence>
        {selectedTemplateId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="overflow-hidden"
          >
            <div className="p-6 bg-muted/50 shadow-sm rounded-xl space-y-4">
              <span className="text-sm font-medium">Export Settings</span>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Orientation</label>
                <div className="flex gap-2">
                  {["portrait", "landscape"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setOrientation(opt)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg transition-colors capitalize",
                        orientation === opt
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                      aria-label={`Set orientation to ${opt}`}
                      aria-pressed={orientation === opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor="primary-color">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <input
                      id="primary-color"
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-background border rounded-md"
                      aria-label="Primary color hex value"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor="accent-color">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <input
                      id="accent-color"
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-background border rounded-md"
                      aria-label="Accent color hex value"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bookId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springTransition}
          className="p-4 bg-muted/50 shadow-sm rounded-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Book Export Formats</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BOOK_EXPORT_FORMATS.map((fmt) => (
              <Button
                key={fmt.id}
                variant="outline"
                size="sm"
                onClick={() => handleBookExport(fmt.id)}
                disabled={bookDownloadingFormat === fmt.id}
                className="justify-start gap-2 text-xs h-9"
                aria-label={`Export as ${fmt.label}`}
              >
                {bookDownloadingFormat === fmt.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="text-base leading-none">{fmt.icon}</span>
                )}
                <div className="text-left">
                  <div className="font-medium">{fmt.label}</div>
                </div>
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Requires Calibre service. EPUB export is always available.
          </p>
        </motion.div>
      )}

      <Button
        onClick={handleGeneratePdf}
        disabled={!selectedTemplateId || buildState.isBuilding || !backendEnabled}
        className="w-full gap-2"
        size="sm"
        aria-label="Generate PDF"
      >
        {buildState.isBuilding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {buildState.isBuilding ? "Generating..." : "Generate PDF"}
      </Button>

      <AnimatePresence mode="wait">
        {buildState.status === "queued" && (
          <motion.div
            key="queued"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="p-6 bg-muted/50 shadow-sm rounded-xl flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Preparing your document...</span>
          </motion.div>
        )}

        {buildState.status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="p-6 bg-muted/50 shadow-sm rounded-xl space-y-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating PDF with LaTeX...</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "10%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 30, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {buildState.status === "completed" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="p-6 bg-muted/50 shadow-sm rounded-xl space-y-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                PDF ready!
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={downloadPdf}
                className="flex-1 gap-2"
                aria-label="Download PDF"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 gap-2"
                aria-label="Preview PDF"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Hide Preview" : "Preview"}
              </Button>
            </div>

            <AnimatePresence>
              {showPreview && buildState.pdfUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springTransition}
                  className="overflow-hidden"
                >
                  <iframe
                    src={buildState.pdfUrl}
                    className="w-full h-[400px] rounded-xl border bg-white"
                    title="PDF Preview"
                    aria-label="PDF document preview"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadPdf}
                    className="w-full mt-2 gap-2"
                    aria-label="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {buildState.status === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="p-6 bg-muted/50 shadow-sm rounded-xl space-y-3"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">
                {buildState.error || "PDF generation failed."}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="w-full gap-2"
              aria-label="Try again"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ExportPanel;
