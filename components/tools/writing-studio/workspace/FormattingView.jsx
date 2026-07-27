"use client";

import { useState, useEffect } from "react";
import {
  Type,
  Ruler,
  ListChecks,
  FileText,
  Smartphone,
  FileDown,
  ZoomOut,
  ZoomIn,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import useDocumentBuild from "@/hooks/useDocumentBuild";

const FORMAT_FONTS = {
  "EB Garamond": "'EB Garamond', Georgia, serif",
  "Baskerville": "Baskerville, 'Baskerville Old Face', serif",
  "Caslon": "'Adobe Caslon Pro', 'Palatino Linotype', serif",
  "Inter": "Inter, system-ui, sans-serif",
};

function LeftFormatPanel({ onGenerateExport, buildState, projectContent }) {
  const [fontType, setFontType] = useState("serif");
  const [selectedFont, setSelectedFont] = useState("EB Garamond");
  const [fontSize, setFontSize] = useState(11);
  const [lineSpacing, setLineSpacing] = useState(1.4);
  const [selectedFormat, setSelectedFormat] = useState("epub");
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const handleExport = async () => {
    const content = projectContent || "<p>Your manuscript content will appear here.</p>";

    if (selectedFormat === "pdf") {
      onGenerateExport(content, {
        fontFamily: FORMAT_FONTS[selectedFont] || FORMAT_FONTS["EB Garamond"],
        fontSize: `${fontSize}pt`,
        lineHeight: lineSpacing,
        title: "My Book",
        author: "",
      });
      return;
    }

    if (selectedFormat === "epub" || selectedFormat === "docx") {
      setIsGeneratingFile(true);
      setFileError(null);
      setFileUrl(null);
      try {
        const endpoint = selectedFormat === "epub" ? "/api/export/epub" : "/api/export/docx";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title: "My Book", author: "", fontFamily: selectedFont }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `${selectedFormat.toUpperCase()} generation failed`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
        const a = document.createElement("a");
        a.href = url;
        a.download = `manuscript.${selectedFormat}`;
        a.click();
      } catch (err) {
        setFileError(err.message || `Could not generate ${selectedFormat.toUpperCase()}`);
      } finally {
        setIsGeneratingFile(false);
      }
    }
  };

  const isBuilding = buildState.isBuilding || isGeneratingFile;
  const isComplete = selectedFormat === "pdf" ? !!buildState.pdfUrl : !!fileUrl;
  const error = selectedFormat === "pdf" ? buildState.error : fileError;

  return (
    <aside className="w-[380px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-brand-surface overflow-y-auto scrollbar-hide shrink-0">
      <div className="p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">Format Settings</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">v2.4 Draft</span>
          </div>
          <p className="text-sm text-zinc-500">Configure your manuscript for digital or print distribution.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand font-semibold text-sm uppercase tracking-widest">
            <Type className="h-4 w-4" /> Typography
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFontType("serif")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                fontType === "serif" ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
              )}
              aria-label="Select serif font"
              aria-pressed={fontType === "serif"}
            >
              <span className="text-xl" style={{ fontFamily: "Georgia, serif" }}>Aa</span>
              <span className="text-xs font-medium mt-1">Serif</span>
            </button>
            <button
              onClick={() => setFontType("sans")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                fontType === "sans" ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
              )}
              aria-label="Select sans-serif font"
              aria-pressed={fontType === "sans"}
            >
              <span className="text-xl font-sans">Aa</span>
              <span className="text-xs font-medium mt-1">Sans</span>
            </button>
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Font Family</label>
                <span className="text-xs text-zinc-400">{selectedFont}</span>
              </div>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-brand p-2"
                aria-label="Font family"
              >
                {Object.keys(FORMAT_FONTS).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Font Size</label>
                <span className="text-xs font-mono">{fontSize}pt</span>
              </div>
              <input
                type="range"
                min="8"
                max="18"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
                aria-label="Font size"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Line Spacing</label>
                <span className="text-xs font-mono">{lineSpacing.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
                aria-label="Line spacing"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm uppercase tracking-widest">
            <Ruler className="h-4 w-4" /> Page Layout
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trim Size</label>
              <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-brand p-2" aria-label="Trim size">
                <option>Digest (5.5&quot; x 8.5&quot;)</option>
                <option>Trade Paperback (6&quot; x 9&quot;)</option>
                <option>US Letter (8.5&quot; x 11&quot;)</option>
                <option>A5 (148 x 210 mm)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-medium">Inside Margin</label>
                <input type="text" defaultValue="0.75 in" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-center p-2" aria-label="Inside margin" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-medium">Outside Margin</label>
                <input type="text" defaultValue="0.50 in" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-center p-2" aria-label="Outside margin" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm uppercase tracking-widest">
            <ListChecks className="h-4 w-4" /> Chapter Styles
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Drop Caps</span>
              <input type="checkbox" defaultChecked className="rounded border-zinc-300 text-brand focus:ring-brand" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Chapter Ornaments</span>
              <input type="checkbox" className="rounded border-zinc-300 text-brand focus:ring-brand" />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Export Format</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFormat("pdf")}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg bg-white dark:bg-zinc-800 border transition-all",
                selectedFormat === "pdf" ? "border-brand ring-1 ring-brand" : "border-zinc-200 dark:border-zinc-700 hover:border-brand"
              )}
              aria-label="Export as PDF"
              aria-pressed={selectedFormat === "pdf"}
            >
              <FileText className="h-5 w-5 text-red-500" />
              <span className="text-[10px] mt-1 font-bold">PDF</span>
            </button>
            <button
              onClick={() => setSelectedFormat("epub")}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg bg-white dark:bg-zinc-800 border transition-all",
                selectedFormat === "epub" ? "border-brand ring-1 ring-brand" : "border-zinc-200 dark:border-zinc-700 hover:border-brand"
              )}
              aria-label="Export as EPUB"
              aria-pressed={selectedFormat === "epub"}
            >
              <Smartphone className="h-5 w-5 text-brand" />
              <span className="text-[10px] mt-1 font-bold">EPUB</span>
            </button>
            <button
              onClick={() => setSelectedFormat("docx")}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg bg-white dark:bg-zinc-800 border transition-all",
                selectedFormat === "docx" ? "border-brand ring-1 ring-brand" : "border-zinc-200 dark:border-zinc-700 hover:border-brand"
              )}
              aria-label="Export as DOCX"
              aria-pressed={selectedFormat === "docx"}
            >
              <FileDown className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] mt-1 font-bold">DOCX</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {isComplete && !error && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {selectedFormat.toUpperCase()} ready — downloading...
              </p>
            </div>
          )}

          {selectedFormat === "pdf" && buildState.pdfUrl && (
            <a
              href={buildState.pdfUrl}
              download="manuscript.pdf"
              className="w-full text-center py-2 text-xs font-semibold text-brand border border-brand rounded-lg hover:bg-brand/5 transition-all"
            >
              Download PDF
            </a>
          )}

          <button
            onClick={handleExport}
            disabled={isBuilding}
            className={cn(
              "w-full py-3 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-2",
              isBuilding
                ? "bg-zinc-400 cursor-wait text-white"
                : "bg-brand text-white shadow-brand/20 hover:bg-brand/90"
            )}
            aria-label="Generate export file"
            aria-busy={isBuilding}
          >
            {isBuilding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {selectedFormat.toUpperCase()}...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" /> Generate {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function RightPreviewPanel({ projectContent, selectedFont }) {
  const [viewMode, setViewMode] = useState("spread");
  const [showAiTip, setShowAiTip] = useState(true);

  useEffect(() => {
    if (showAiTip) {
      const timer = setTimeout(() => setShowAiTip(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showAiTip]);

  const previewContent = projectContent
    ? (() => {
        const div = typeof document !== "undefined" ? document.createElement("div") : null;
        if (div) {
          div.innerHTML = projectContent;
          const text = div.textContent || "";
          return text.slice(0, 600);
        }
        return "";
      })()
    : null;

  const displayText = previewContent || "Your manuscript preview will appear here once you start writing.";

  return (
    <section className="flex-1 bg-zinc-100 dark:bg-brand-surface/50 relative flex flex-col items-center overflow-hidden">
      <div className="w-full bg-white dark:bg-brand-surface border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1" role="tablist" aria-label="Preview mode">
          {["spread", "single", "ereader"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              role="tab"
              aria-selected={viewMode === mode}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                viewMode === mode
                  ? "bg-white dark:bg-zinc-800 shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {mode === "spread" ? "Spread View" : mode === "single" ? "Single Page" : "E-reader"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-zinc-400" />
            <input type="range" className="w-32 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand" aria-label="Zoom level" />
            <ZoomIn className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 ml-1">75%</span>
          </div>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <button className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-brand transition-colors" aria-label="Toggle safe zones">
            <LayoutGrid className="h-4 w-4" /> Safe Zones
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto flex items-start justify-center p-12 scrollbar-hide">
        <div className={cn("flex items-start max-w-full", viewMode === "spread" ? "flex-row gap-4" : "flex-col gap-8")}>
          {(viewMode === "spread" || viewMode === "single") && (
            <div
              className="bg-white w-[420px] p-12 relative flex flex-col shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)] dark:border dark:border-zinc-700"
              style={{ aspectRatio: "6/9", fontFamily: selectedFont ? `'${selectedFont}', Georgia, serif` : "'Georgia', serif" }}
            >
              <div className="text-[10px] text-center text-zinc-400 uppercase tracking-widest mb-16">Your Manuscript</div>
              <div className="flex-1 text-[#2d2d2d] leading-[1.6] text-[15px] text-justify">
                <p className="text-zinc-600">{displayText.slice(0, 300)}</p>
              </div>
              <div className="mt-16 text-center text-[11px] text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>1</div>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-200/50 to-transparent" />
            </div>
          )}

          <div
            className={cn(
              "bg-white p-12 relative flex flex-col shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)] dark:border dark:border-zinc-700",
              viewMode === "ereader" ? "w-[360px] rounded-xl" : "w-[420px]"
            )}
            style={{ aspectRatio: "6/9", fontFamily: selectedFont ? `'${selectedFont}', Georgia, serif` : "'Georgia', serif" }}
          >
            <div className="text-[10px] text-center text-zinc-400 uppercase tracking-widest mb-24">Chapter One</div>
            <div className="flex-1 text-[#2d2d2d]">
              <div className="leading-[1.6] text-[15px] text-justify">
                <p className="text-zinc-600">{displayText.slice(300, 600) || displayText.slice(0, 300)}</p>
              </div>
            </div>
            <div className="mt-16 text-center text-[11px] text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>2</div>
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-200/50 to-transparent" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-6 z-10">
        <button className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:text-brand transition-all" aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md px-6 py-2 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-4">
          <span className="text-xs font-bold text-zinc-500">Page 1</span>
        </div>
        <button className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:text-brand transition-all" aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showAiTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 right-8 w-64 bg-zinc-900/95 text-white p-4 rounded-xl shadow-2xl border border-brand/30 backdrop-blur-sm z-20"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-brand/20 rounded-lg shrink-0">
                <Lightbulb className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand mb-1">AI Recommendation</p>
                <p className="text-[11px] leading-relaxed text-zinc-300">For Sci-Fi novels, a slightly tighter line height (1.3) and a modern serif like Caslon often improves readability.</p>
                <button className="mt-2 text-[10px] font-bold text-brand uppercase tracking-wider hover:underline" aria-label="Apply AI recommendation">Apply Now</button>
              </div>
            </div>
            <button
              onClick={() => setShowAiTip(false)}
              className="absolute -top-2 -right-2 size-5 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700"
              aria-label="Dismiss recommendation"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function FormattingView({ project }) {
  const { buildState, startBuild } = useDocumentBuild();
  const [selectedFont, setSelectedFont] = useState("EB Garamond");

  const projectContent = (() => {
    if (!project) return null;
    const key = `research-draft-${project._id || project.id}-intro`;
    return localStorage.getItem(key) || null;
  })();

  const handleGenerateExport = (html, options) => {
    startBuild(html, {
      templateId: "default",
      styles: options,
    });
    if (options?.fontFamily) setSelectedFont(options.fontFamily.split(",")[0].replace(/'/g, "").trim());
  };

  return (
    <main className="flex flex-1 overflow-hidden">
      <LeftFormatPanel
        onGenerateExport={handleGenerateExport}
        buildState={buildState}
        projectContent={projectContent}
      />
      <RightPreviewPanel
        projectContent={projectContent}
        selectedFont={selectedFont}
      />
    </main>
  );
}
