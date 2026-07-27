"use client";

import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { toast } from "react-toastify";
import {
  useParaphrasedMutation,
  useHumanizeContendMutation,
  useSpellCheckerMutation,
  useScanAidetectorMutation,
} from "@/redux/api/tools/toolsApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { getFullAnalysis } from "@/lib/text-analysis";
import { formatCitation, formatInlineCitation } from "@/lib/citation-lookup";
import { useCitationSuggestions } from "@/hooks/useCitationSuggestions";
import { analyzePlagiarism } from "@/services/plagiarismService";
import { useWritingStudioLimits } from "@/hooks/useWritingStudioLimits";
import { useAiCoWriter } from "@/hooks/useAiCoWriter";
import { InlineSuggestion } from "@/lib/tiptap-inline-suggestion";

const WritingStudioContext = createContext(null);

export function useWritingStudio() {
  const ctx = useContext(WritingStudioContext);
  if (!ctx) throw new Error("useWritingStudio must be used within WritingStudioProvider");
  return ctx;
}

export function WritingStudioProvider({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedMode, setSelectedMode] = useState("Fluency");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [processedResult, setProcessedResult] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [aiScore, setAiScore] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState(null);
  const [savedReferences, setSavedReferences] = useState([]);
  const [citationFormat, setCitationFormat] = useState("apa");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLimitType, setUpgradeLimitType] = useState("ai_actions");
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [plagiarismError, setPlagiarismError] = useState(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showDocumentImport, setShowDocumentImport] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [documentFormat, setDocumentFormat] = useState("generic");
  const [viewMode, setViewMode] = useState("single");
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [contextPanelView, setContextPanelView] = useState("actions");
  const selectionRef = useRef({ from: 0, to: 0 });
  const analysisTimeoutRef = useRef(null);

  const {
    suggestions: citationSuggestions,
    isSearching: isCitationSearching,
    searchPapers,
    getSimilarPapers,
    suggestFromText,
    clearSuggestions,
  } = useCitationSuggestions();

  const {
    isPro,
    isAuthenticated,
    checkFeatureAccess,
    refetchAll,
    paraphraseLimits,
    humanizeLimits,
  } = useWritingStudioLimits();

  const {
    generate: aiGenerate,
    abort: aiAbort,
    reset: aiReset,
    isGenerating: aiIsGenerating,
    streamedText: aiStreamedText,
    error: aiError,
  } = useAiCoWriter();

  const inlineAutoRef = useRef(null);
  const inlineAbortRef = useRef(null);
  const [inlineEnabled, setInlineEnabled] = useState(true);

  const [paraphrase] = useParaphrasedMutation();
  const [humanize] = useHumanizeContendMutation();
  const [grammarCheck] = useSpellCheckerMutation();
  const [scanAi] = useScanAidetectorMutation();

  const checkLimit = useCallback((type) => {
    const featureMap = {
      ai_actions: "paraphrase",
      citations: "citations",
      ai_scans: "ai_detector",
      plagiarism: "plagiarism",
    };
    const feature = featureMap[type] || type;
    const access = checkFeatureAccess(feature);
    return access.allowed;
  }, [checkFeatureAccess]);

  const trackUsage = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your paper, thesis, or research here...",
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      InlineSuggestion.configure({
        onAccept: () => {},
        onDismiss: () => {},
        debounceMs: 1500,
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "writing-canvas-prose focus:outline-none min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);

      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      analysisTimeoutRef.current = setTimeout(() => {
        const analysis = getFullAnalysis(text);
        setTextAnalysis(analysis);
      }, 500);

      if (inlineEnabled && editor) {
        if (inlineAutoRef.current) clearTimeout(inlineAutoRef.current);
        if (inlineAbortRef.current) {
          inlineAbortRef.current.abort();
          inlineAbortRef.current = null;
        }
        inlineAutoRef.current = setTimeout(async () => {
          const curText = editor.getText();
          if (curText.trim().length < 20) return;
          const lastChars = curText.slice(-100);
          const controller = new AbortController();
          inlineAbortRef.current = controller;
          try {
            const resp = await fetch("/api/ai-cowriter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentText: lastChars,
                context: curText.slice(0, 1000),
                mode: "autocomplete",
              }),
              signal: controller.signal,
            });
            if (!resp.ok) return;
            const reader = resp.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let suggestion = "";
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) suggestion += data.content;
                  if (data.done) break;
                } catch {}
              }
            }
            if (suggestion.trim() && editor && !editor.isDestroyed) {
              editor.commands.setSuggestion(suggestion.trim());
            }
          } catch (err) {
            if (err.name !== "AbortError") {}
          } finally {
            inlineAbortRef.current = null;
          }
        }, 1500);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      selectionRef.current = { from, to };
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text);
      } else {
        setSelectedText("");
      }
    },
  });

  const requireAuth = useCallback(() => {
    if (!user) {
      dispatch(setShowLoginModal(true));
      return false;
    }
    return true;
  }, [user, dispatch]);

  const handleToolSelect = useCallback((toolId) => {
    if (!requireAuth()) return;
    setSelectedTool(toolId);
    setProcessedResult("");
    setShowDiff(false);
    setContextPanelView("actions");
    setContextPanelOpen(true);
  }, [requireAuth]);

  const getTextToProcess = useCallback(() => {
    const { from, to } = selectionRef.current;
    if (from !== to && editor) {
      return editor.state.doc.textBetween(from, to, " ");
    }
    if (selectedText) return selectedText;
    return editor?.getText() || "";
  }, [selectedText, editor]);

  const handleProcess = useCallback(async (toolOverride = null) => {
    const tool = toolOverride || selectedTool;
    if (!tool) {
      toast.error("Please select an AI tool first");
      return;
    }

    const text = getTextToProcess();
    if (!text.trim()) {
      toast.error("Please enter or select some text first");
      return;
    }

    if (!requireAuth()) return;

    const toolFeatureMap = {
      paraphrase: "paraphrase",
      grammar: "grammar",
      summarize: "summarize",
      humanize: "humanize",
    };
    const feature = toolFeatureMap[tool] || "paraphrase";
    const access = checkFeatureAccess(feature);

    if (!access.allowed) {
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setUpgradeLimitType("ai_actions");
        setShowUpgradeModal(true);
      }
      return;
    }

    if (toolOverride) {
      setSelectedTool(toolOverride);
      setContextPanelView("actions");
      setContextPanelOpen(true);
    }

    setIsProcessing(true);
    setProcessedResult("");
    setOriginalText(text);
    setShowDiff(false);

    try {
      let result;
      let processedText = "";

      switch (tool) {
        case "paraphrase":
          result = await paraphrase({ text, mode: selectedMode, synonymLevel: 40 }).unwrap();
          processedText = result?.data?.paraphrased_text || result?.paraphrased_text || "";
          break;
        case "humanize":
          result = await humanize({ text, readability: "University", purpose: "Academic Writing" }).unwrap();
          processedText = result?.data?.humanized_text || result?.humanized_text || "";
          break;
        case "grammar":
          result = await grammarCheck({ text, language: "en-US" }).unwrap();
          processedText = result?.data?.corrected_text || result?.corrected_text || result?.text || "";
          break;
        case "summarize":
          result = await paraphrase({ text, mode: "Shorten", synonymLevel: 20 }).unwrap();
          processedText = result?.data?.paraphrased_text || result?.paraphrased_text || "";
          break;
        default:
          toast.error("Please select an AI tool first");
          return;
      }

      if (processedText) {
        setProcessedResult(processedText);
        setShowDiff(true);
        trackUsage();
        toast.success("Text enhanced! Review the changes below.");
      } else {
        toast.error("No result received. Please try again.");
      }
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Failed to process text. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTool, getTextToProcess, requireAuth, checkFeatureAccess, dispatch, selectedMode, paraphrase, humanize, grammarCheck, trackUsage]);

  const handleAcceptChanges = useCallback(() => {
    if (!processedResult || !editor) return;
    const { from, to } = selectionRef.current;
    if (selectedText && from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(processedResult).run();
    } else {
      editor.commands.setContent(`<p>${processedResult}</p>`);
    }
    setProcessedResult("");
    setOriginalText("");
    setSelectedText("");
    setShowDiff(false);
    toast.success("Changes applied!");
  }, [processedResult, editor, selectedText]);

  const handleRejectChanges = useCallback(() => {
    setProcessedResult("");
    setOriginalText("");
    setShowDiff(false);
    toast.info("Changes rejected");
  }, []);

  const handleAiInsert = useCallback((text) => {
    if (!editor || !text) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
    } else {
      editor.chain().focus().insertContent(" " + text).run();
    }
  }, [editor]);

  const handleScanForAI = useCallback(async () => {
    const text = editor?.getText() || "";
    if (!text.trim() || text.trim().split(/\s+/).length < 50) {
      toast.error("Please write at least 50 words before scanning");
      return;
    }
    const access = checkFeatureAccess("ai_detector");
    if (!access.allowed) {
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setUpgradeLimitType("ai_scan");
        setShowUpgradeModal(true);
      }
      return;
    }
    setIsScanning(true);
    try {
      const result = await scanAi({ text }).unwrap();
      const score = result?.data?.ai_percentage || result?.ai_percentage || 0;
      setAiScore(Math.round(score));
      trackUsage();
      toast.success("Scan complete!");
    } catch {
      toast.error("Failed to scan. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }, [editor, checkFeatureAccess, dispatch, scanAi, trackUsage]);

  const handleCheckPlagiarism = useCallback(async () => {
    const text = editor?.getText() || "";
    if (!text.trim() || text.trim().split(/\s+/).length < 50) {
      toast.error("Please write at least 50 words before checking");
      return;
    }
    const access = checkFeatureAccess("plagiarism");
    if (!access.allowed) {
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setUpgradeLimitType("plagiarism");
        setShowUpgradeModal(true);
      }
      return;
    }
    setIsCheckingPlagiarism(true);
    setPlagiarismError(null);
    try {
      const result = await analyzePlagiarism({ text });
      setPlagiarismResult(result);
      trackUsage();
      toast.success("Plagiarism check complete!");
    } catch (error) {
      const errorMessage = error?.message || "Failed to check plagiarism. Please try again.";
      setPlagiarismError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingPlagiarism(false);
    }
  }, [editor, checkFeatureAccess, dispatch, trackUsage]);

  const handleSetLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    editor?.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleExport = useCallback(async (format, includeRefs = true) => {
    const exportFeature = format === "docx" ? "export_docx" : format === "html" ? "export_html" : "export_txt";
    const access = checkFeatureAccess(exportFeature);
    if (!access.allowed) {
      setUpgradeLimitType("export");
      setShowUpgradeModal(true);
      return;
    }
    const content = editor?.getHTML() || "";
    const text = editor?.getText() || "";
    const docFmt = documentFormat || "generic";
    const fileName = documentTitle?.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_") || "document";
    let referencesText = "";
    let referencesHtml = "";
    if (includeRefs && savedReferences.length > 0) {
      referencesText = "\n\n---\n\nReferences\n\n" +
        savedReferences.map((ref) => formatCitation(ref, citationFormat)).join("\n\n");
      referencesHtml = `<hr><h2>References</h2>` +
        savedReferences.map((ref) => `<p>${formatCitation(ref, citationFormat)}</p>`).join("");
    }
    if (format === "txt") {
      const blob = new Blob([text + referencesText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "html") {
      const formatStyles = {
        apa: "body{font-family:'Times New Roman',serif;font-size:12pt;max-width:800px;margin:1in auto;padding:20px;line-height:2}h1,h2,h3{margin-top:1.5em}h1{text-align:center;font-weight:bold}h2{font-weight:bold;text-align:left}p{margin:0 0 0 0;text-indent:0.5in}p:first-of-type{text-indent:0}",
        ieee: "body{font-family:'Times New Roman',serif;font-size:10pt;max-width:800px;margin:40px auto;padding:20px;line-height:1.2;column-count:2;column-gap:20px}h1{font-size:24pt;text-align:center;column-span:all;font-weight:normal}h2{font-size:10pt;text-transform:uppercase;font-weight:bold}p{margin:0.5em 0;text-align:justify}",
        generic: "body{font-family:'Times New Roman',serif;font-size:12pt;max-width:800px;margin:1in auto;padding:20px;line-height:1.5}h1,h2,h3{margin-top:1.5em}p{margin:1em 0}",
      };
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle || "Document"}</title><style>${formatStyles[docFmt] || formatStyles.generic}</style></head><body>${content}${referencesHtml}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "docx") {
      try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, LineRuleType } = await import("docx");
        const isApa = docFmt === "apa";
        const isIeee = docFmt === "ieee";
        const fontSize = isIeee ? 20 : 24;
        const lineSpacing = isApa ? { line: 480, lineRule: LineRuleType?.EXACT || "exact" } : isIeee ? { line: 240 } : { line: 360 };
        const fontName = "Times New Roman";
        const extractTextRuns = (node, TR, inheritBold = false, inheritItalic = false) => {
          const runs = [];
          const processChild = (child, bold = inheritBold, italic = inheritItalic) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const t = child.textContent;
              if (t) runs.push(new TR({ text: t, bold, italics: italic, font: fontName, size: fontSize }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const tag = child.tagName.toLowerCase();
              const isBold = bold || tag === "strong" || tag === "b";
              const isItalic = italic || tag === "em" || tag === "i";
              child.childNodes.forEach((c) => processChild(c, isBold, isItalic));
            }
          };
          node.childNodes.forEach((child) => processChild(child));
          return runs.length > 0 ? runs : [new TR({ text: node.textContent || "", font: fontName, size: fontSize })];
        };
        const htmlToDocxElements = (html) => {
          const elements = [];
          const div = document.createElement("div");
          div.innerHTML = html;
          const processNode = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const tag = node.tagName.toLowerCase();
            const centered = node.style?.textAlign === "center";
            if (tag === "h1") {
              elements.push(new Paragraph({
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_1,
                alignment: isApa ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: lineSpacing,
              }));
            } else if (tag === "h2") {
              elements.push(new Paragraph({
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.LEFT,
                spacing: lineSpacing,
              }));
            } else if (tag === "h3") {
              elements.push(new Paragraph({
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_3,
                spacing: lineSpacing,
              }));
            } else if (tag === "p") {
              elements.push(new Paragraph({
                children: extractTextRuns(node, TextRun),
                spacing: lineSpacing,
                alignment: centered ? AlignmentType.CENTER : (isIeee ? AlignmentType.JUSTIFIED : AlignmentType.LEFT),
                indent: isApa && !centered ? { firstLine: convertInchesToTwip ? convertInchesToTwip(0.5) : 720 } : undefined,
              }));
            } else if (tag === "ul") {
              node.querySelectorAll(":scope > li").forEach((li) => {
                elements.push(new Paragraph({
                  children: [new TextRun({ text: "• ", font: fontName, size: fontSize }), ...extractTextRuns(li, TextRun)],
                  spacing: lineSpacing,
                }));
              });
            } else if (tag === "ol") {
              let idx = 0;
              node.querySelectorAll(":scope > li").forEach((li) => {
                idx++;
                elements.push(new Paragraph({
                  children: [new TextRun({ text: `${idx}. `, font: fontName, size: fontSize }), ...extractTextRuns(li, TextRun)],
                  spacing: lineSpacing,
                }));
              });
            } else if (tag === "blockquote") {
              elements.push(new Paragraph({
                children: extractTextRuns(node, TextRun, false, true),
                indent: { left: 720 },
                spacing: lineSpacing,
              }));
            } else if (tag === "hr") {
              elements.push(new Paragraph({ children: [new TextRun({ text: "", font: fontName, size: fontSize })] }));
            } else if (tag === "div") {
              node.childNodes.forEach((child) => {
                if (child.nodeType === Node.ELEMENT_NODE) processNode(child);
                else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
                  elements.push(new Paragraph({
                    children: [new TextRun({ text: child.textContent, font: fontName, size: fontSize })],
                    spacing: lineSpacing,
                  }));
                }
              });
            } else {
              node.childNodes.forEach((child) => { if (child.nodeType === Node.ELEMENT_NODE) processNode(child); });
            }
          };
          div.childNodes.forEach((child) => processNode(child));
          return elements;
        };
        const docElements = htmlToDocxElements(content + referencesHtml);
        const marginTwips = convertInchesToTwip ? convertInchesToTwip(1) : 1440;
        const doc = new Document({
          styles: {
            default: {
              document: {
                run: { font: fontName, size: fontSize },
                paragraph: { spacing: lineSpacing },
              },
            },
          },
          sections: [{
            properties: {
              page: {
                margin: { top: marginTwips, bottom: marginTwips, left: marginTwips, right: marginTwips },
              },
            },
            children: docElements.length > 0 ? docElements : [new Paragraph({ children: [new TextRun({ text, font: fontName, size: fontSize })] })],
          }],
        });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error("Failed to export DOCX");
        return;
      }
    }
    toast.success(`Exported as ${format.toUpperCase()}${docFmt !== "generic" ? ` (${docFmt.toUpperCase()} format)` : ""}${includeRefs && savedReferences.length > 0 ? " with references" : ""}`);
  }, [editor, savedReferences, citationFormat, documentFormat, documentTitle, checkFeatureAccess]);

  const handleSaveReference = useCallback((item) => {
    const exists = savedReferences.some(
      (ref) => (ref.doi && ref.doi === item.doi) || (ref.title === item.title && ref.year === item.year)
    );
    if (!exists) {
      setSavedReferences((prev) => [...prev, item]);
      toast.success("Added to references!");
      return true;
    }
    toast.info("This reference is already saved");
    return false;
  }, [savedReferences]);

  const handleInsertInlineCitation = useCallback((inlineText, item) => {
    if (!editor) return;
    const existingIdx = savedReferences.findIndex(
      (ref) => (ref.doi && ref.doi === item.doi) || (ref.title === item.title && ref.year === item.year)
    );
    let refNumber;
    if (existingIdx !== -1) {
      refNumber = existingIdx + 1;
    } else {
      refNumber = savedReferences.length + 1;
    }
    const actualInline = formatInlineCitation(item, citationFormat, refNumber);
    editor.chain().focus().insertContent(actualInline).run();
    if (existingIdx === -1) {
      setSavedReferences((prev) => [...prev, item]);
    }
    const docText = editor.getText();
    const referencesHeadingExists = /\n\s*References\s*\n/i.test(docText) || docText.trim().endsWith("References");
    const formattedRef = formatCitation(item, citationFormat);
    const refEntry = citationFormat === "ieee" || citationFormat === "vancouver"
      ? `[${refNumber}] ${formattedRef}`
      : formattedRef;
    if (existingIdx === -1) {
      if (!referencesHeadingExists) {
        editor.chain().focus("end").insertContent([
          { type: "paragraph", content: [] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "References" }] },
          { type: "paragraph", content: [{ type: "text", text: refEntry }] },
        ]).run();
      } else {
        editor.chain().focus("end").insertContent([
          { type: "paragraph", content: [{ type: "text", text: refEntry }] },
        ]).run();
      }
    }
    toast.success("Citation inserted!");
  }, [editor, savedReferences, citationFormat]);

  const value = useMemo(() => ({
    editor,
    user,
    dispatch,
    documentTitle, setDocumentTitle,
    selectedTool, setSelectedTool, handleToolSelect,
    selectedMode, setSelectedMode,
    isProcessing,
    selectedText,
    processedResult, setProcessedResult,
    originalText,
    wordCount,
    showDiff, setShowDiff,
    aiScore, isScanning,
    linkUrl, setLinkUrl,
    showLinkInput, setShowLinkInput,
    textAnalysis,
    savedReferences, setSavedReferences,
    citationFormat, setCitationFormat,
    showOnboarding, setShowOnboarding,
    showUpgradeModal, setShowUpgradeModal,
    upgradeLimitType, setUpgradeLimitType,
    isCheckingPlagiarism,
    plagiarismResult,
    plagiarismError,
    showExportPanel, setShowExportPanel,
    showDocumentImport, setShowDocumentImport,
    showTemplatePicker, setShowTemplatePicker,
    documentFormat, setDocumentFormat,
    viewMode, setViewMode,
    contextPanelOpen, setContextPanelOpen,
    contextPanelView, setContextPanelView,
    selectionRef,
    citationSuggestions, isCitationSearching, searchPapers, getSimilarPapers, suggestFromText, clearSuggestions,
    isPro, isAuthenticated, checkFeatureAccess, paraphraseLimits, humanizeLimits,
    aiGenerate, aiAbort, aiReset, aiIsGenerating, aiStreamedText, aiError,
    inlineEnabled, setInlineEnabled,
    checkLimit, trackUsage,
    requireAuth,
    handleProcess,
    handleAcceptChanges,
    handleRejectChanges,
    handleAiInsert,
    handleScanForAI,
    handleCheckPlagiarism,
    handleSetLink,
    handleExport,
    handleSaveReference,
    handleInsertInlineCitation,
    getTextToProcess,
  }), [
    editor, user, dispatch,
    documentTitle, selectedTool, selectedMode, isProcessing, selectedText,
    processedResult, originalText, wordCount, showDiff, aiScore, isScanning,
    linkUrl, showLinkInput, textAnalysis, savedReferences, citationFormat,
    showOnboarding, showUpgradeModal, upgradeLimitType,
    isCheckingPlagiarism, plagiarismResult, plagiarismError,
    showExportPanel, showDocumentImport, showTemplatePicker, documentFormat, viewMode, contextPanelOpen, contextPanelView,
    citationSuggestions, isCitationSearching, searchPapers, getSimilarPapers, suggestFromText, clearSuggestions,
    isPro, isAuthenticated, checkFeatureAccess, paraphraseLimits, humanizeLimits,
    aiGenerate, aiAbort, aiReset, aiIsGenerating, aiStreamedText, aiError,
    inlineEnabled,
    checkLimit, trackUsage, requireAuth,
    handleProcess, handleAcceptChanges, handleRejectChanges,
    handleAiInsert, handleScanForAI, handleCheckPlagiarism,
    handleSetLink, handleExport, handleSaveReference, handleInsertInlineCitation, getTextToProcess,
    handleToolSelect,
  ]);

  return (
    <WritingStudioContext.Provider value={value}>
      {children}
    </WritingStudioContext.Provider>
  );
}
