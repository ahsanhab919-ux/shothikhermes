"use client";

import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import { trackToolUsed } from "@/lib/posthog";
import useDebounce from "@/hooks/useDebounce";
import useLoadingText from "@/hooks/useLoadingText";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import TopNavigation from "./TopNavigation";
import { summarizeText } from "@/services/summarize.service";

// Tiptap imports
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChevronDown, ChevronUp, FileText, List, Pilcrow } from "lucide-react";

import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import useScreenSize from "@/hooks/ui/useScreenSize";
import InitialInputActions from "./InitialInputActions";
import InputActions from "./InputActions";
import OutputActions from "./OutputActions";

const modes = [
  {
    icon: <Pilcrow className="size-[1em]" />,
    name: "Paragraph",
  },
  {
    icon: <List className="size-[1em]" />,
    name: "Key Sentences",
  },
  {
    icon: <FileText className="size-[1em]" />,
    name: "Abstract",
  },
];

const LENGTH = {
  20: "Short",
  40: "Regular",
  60: "Medium",
  80: "Long",
};

const HIGHLIGHT_CONFIG = {
  backgroundColor: "#ffeb3b",
  color: "var(--primary)",
  padding: "2px 4px",
  borderRadius: "3px",
  fontWeight: "500",
};

// Tiptap Editor Component
const TiptapEditor = ({
  content,
  onChange,
  placeholder,
  readOnly = false,
  highlightedKeywords = [],
  className = "",
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: { class: "text-inherit" },
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: { class: "highlighted-keyword" },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Enter text here...",
      }),
    ],
    content: "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-content focus:outline-none text-foreground bg-transparent",
        // Remove right padding to bring scrollbar tight to text
        style:
          "outline: none; min-height: 400px; padding: 16px 0 16px 16px; font-family: inherit; font-size: 1rem; line-height: 1.5; width: 100%;",
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      // allow passing either plain text or html - use setContent which accepts HTML
      editor.commands.setContent(content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  // Apply keyword highlighting
  useEffect(() => {
    if (!editor || content == null) return;

    // Try to clear highlight via commands if available, but guard it
    try {
      if (editor?.commands?.unsetHighlight) {
        editor.commands.unsetHighlight();
      }
    } catch (e) {
      // ignore if command not available
    }

    const { state } = editor;
    let tr = state.tr;

    // Remove all previous highlight marks safely
    if (state.schema.marks.highlight) {
      tr = tr.removeMark(
        0,
        state.doc.content.size,
        state.schema.marks.highlight,
      );
    }

    highlightedKeywords?.forEach((keyword) => {
      if (!keyword || typeof keyword !== "string") return;

      // Escape special regex characters
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedKeyword, "gi");

      state.doc.descendants((node, pos) => {
        if (!node.isText) return;

        let match;
        while ((match = regex.exec(node.text)) !== null) {
          const start = pos + match.index;
          const end = start + match[0].length;

          // Apply highlight mark
          tr = tr.addMark(
            start,
            end,
            state.schema.marks.highlight.create({
              color: HIGHLIGHT_CONFIG.backgroundColor,
            }),
          );
        }
      });
    });

    // Avoid dispatching no-op transactions
    if (tr.docChanged || tr.storedMarksSet) {
      editor.view.dispatch(tr);
    }
  }, [editor, highlightedKeywords, content]);

  if (!editor) return null;

  return (
    <div className={cn("tiptap-wrapper", className)} style={{ minWidth: 0 }}>
      <EditorContent className="h-full w-full flex-1" editor={editor} />
      <style jsx global>{`
        /* Ensure wrapper and editors can shrink correctly inside flex/grid layouts */
        .tiptap-wrapper {
          width: 100%;
          min-width: 0;
        }

        .tiptap-content mark,
        .tiptap-content .highlighted-keyword {
          transition: all 0.2s ease;
          border-radius: ${HIGHLIGHT_CONFIG.borderRadius} !important;
          /* Show highlight with background so it doesn't disappear or collapse text width */
          background-color: ${HIGHLIGHT_CONFIG.backgroundColor} !important;
          padding: ${HIGHLIGHT_CONFIG.padding} !important;
          color: ${HIGHLIGHT_CONFIG.color} !important;
          font-weight: ${HIGHLIGHT_CONFIG.fontWeight} !important;
        }

        .tiptap-content mark:hover,
        .tiptap-content .highlighted-keyword:hover {
          filter: brightness(0.95);
        }

        .tiptap-content {
          margin: 0 !important;
          background-color: transparent !important;
          padding: 0 !important;
          color: currentColor !important;
        }

        /* Override all prose class padding */
        .tiptap-content.prose,
        .tiptap-content.prose-sm,
        .tiptap-content.sm\:prose,
        .tiptap-content.lg\:prose-lg,
        .tiptap-content.xl\:prose-xl {
          padding: 0 !important;
          max-width: none !important;
        }

        .ProseMirror {
          box-sizing: border-box;
          margin: 0 !important;
          padding: 16px 0 16px 16px !important;
          overflow-y: auto;
        }

        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror.ProseMirror-focused {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          float: left;
          height: 0;
          pointer-events: none;
          content: "Input your text here...";
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
};

const SummarizeContentSection = () => {
  const [selectedMode, setSelectedMode] = useState(modes[0].name);
  const [currentLength, setCurrentLength] = useState(LENGTH[20]);
  const [outputContent, setOutputContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(false);
  const [isKeywordsOpen, setIsKeywordsOpen] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [stemPreprocessing, setStemPreprocessing] = useState(false);
  const abortControllerRef = useRef(null);

  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const loadingText = useLoadingText(isLoading);
  const sampleText = trySamples.summarize.English;

  const { width } = useScreenSize();

  const debouncedSelectedMode = useDebounce(selectedMode, 500);
  const debouncedCurrentLength = useDebounce(currentLength, 500);

  // Extract text content from HTML
  const extractTextFromHTML = useCallback((html) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }, []);

  // Debounced plain text for keyword extraction
  const plainText = useMemo(
    () => extractTextFromHTML(text),
    [text, extractTextFromHTML],
  );
  const debouncedPlainText = useDebounce(plainText, 1000);

  // Simple client-side keyword extraction function
  const extractKeywordsClientSide = useCallback((text) => {
    if (!text || text.trim().length < 10) return [];

    // Common stop words to filter out
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "been",
      "be",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "what",
      "which",
      "who",
      "when",
      "where",
      "why",
      "how",
      "all",
      "each",
      "every",
      "both",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "now",
    ]);

    // Extract words (2+ characters, alphanumeric)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length >= 3 && !stopWords.has(word)); // Filter short words and stop words

    // Count word frequencies
    const wordFreq = {};
    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Extract phrases (2-3 word combinations)
    const phrases = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    sentences.forEach((sentence) => {
      const sentenceWords = sentence
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !stopWords.has(word));

      // Extract 2-word phrases
      for (let i = 0; i < sentenceWords.length - 1; i++) {
        const phrase = `${sentenceWords[i]} ${sentenceWords[i + 1]}`;
        if (phrase.length >= 5) {
          phrases.push(phrase);
        }
      }

      // Extract 3-word phrases
      for (let i = 0; i < sentenceWords.length - 2; i++) {
        const phrase = `${sentenceWords[i]} ${sentenceWords[i + 1]} ${sentenceWords[i + 2]}`;
        if (phrase.length >= 8) {
          phrases.push(phrase);
        }
      }
    });

    // Count phrase frequencies
    const phraseFreq = {};
    phrases.forEach((phrase) => {
      phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
    });

    // Combine and sort by frequency
    const allKeywords = [];

    // Add frequent phrases first (they're more meaningful)
    Object.entries(phraseFreq)
      .filter(([_, freq]) => freq >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([phrase]) => {
        allKeywords.push(
          phrase
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        );
      });

    // Add frequent single words
    Object.entries(wordFreq)
      .filter(([_, freq]) => freq >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([word]) => {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        if (
          !allKeywords.some(
            (kw) =>
              kw.toLowerCase().includes(word) ||
              word.includes(kw.toLowerCase()),
          )
        ) {
          allKeywords.push(capitalized);
        }
      });

    // Remove duplicates and limit to 20
    const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 20);

    return uniqueKeywords;
  }, []);

  // Define fetchKeywords BEFORE useEffect that uses it
  const fetchKeywords = useCallback(
    async (payload) => {
      if (!payload?.text || payload.text.trim().length < 10) {
        console.warn("Text too short for keyword extraction:", payload);
        setKeywords([]);
        return;
      }

      // Validate payload text is not "No keywords found" or empty
      if (
        !payload.text ||
        payload.text.trim() === "" ||
        payload.text === "No keywords found"
      ) {
        console.error("❌ Invalid payload text:", payload.text);
        setKeywords([]);
        return;
      }

      try {
        setIsKeywordsLoading(true);

        // Try API endpoint first if accessToken is available
        if (accessToken) {
          const endpoints = [
            // "/summarize/keywords",
            "/summarize-keywords",
            // "/keywords/summarize",
            // "/extract-keywords",
          ];

          for (const endpoint of endpoints) {
            const url = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX + endpoint;

            try {
              const response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                const result = await response.json();

                // Handle different response structures
                let keywordsData = [];
                if (Array.isArray(result)) {
                  keywordsData = result;
                } else if (result?.data && Array.isArray(result.data)) {
                  keywordsData = result.data;
                } else if (result?.data && typeof result.data === "string") {
                  keywordsData = result.data
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k);
                } else if (result?.keywords && Array.isArray(result.keywords)) {
                  keywordsData = result.keywords;
                } else if (
                  result?.keywords &&
                  typeof result.keywords === "string"
                ) {
                  keywordsData = result.keywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k);
                }

                if (keywordsData.length > 0) {
                  setKeywords(keywordsData);
                  setIsKeywordsLoading(false);
                  return; // Success, exit
                }
              } else if (response.status !== 404) {
                // For non-404 errors, break and use fallback
                break;
              }
            } catch (fetchError) {
              // Continue to next endpoint or fallback
              continue;
            }
          }
        }

        // If API fails or no accessToken, use client-side extraction
        const extractedKeywords = extractKeywordsClientSide(payload.text);
        setKeywords(extractedKeywords);
      } catch (error) {
        console.error("❌ Error extracting keywords:", error);
        setKeywords([]);
      } finally {
        setIsKeywordsLoading(false);
      }
    },
    [accessToken, extractKeywordsClientSide],
  );

  // Fetch keywords when text changes
  useEffect(() => {
    const trimmedText = debouncedPlainText?.trim() || "";

    if (trimmedText.length > 10) {
      fetchKeywords({ text: trimmedText });
    } else {
      setKeywords([]);
      // Don't clear selectedKeywords when text is cleared, let user keep their selection
      if (!trimmedText) {
        setSelectedKeywords([]);
      }
    }
  }, [debouncedPlainText, fetchKeywords]);

  // Auto-submit when mode or length changes
  useEffect(() => {
    if (text && text.trim() && !isLoading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSelectedMode, debouncedCurrentLength]);

  const preprocessSTEM = useCallback((rawText) => {
    if (!stemPreprocessing) return rawText;
    return rawText
      .replace(/\$\$[\s\S]*?\$\$/g, "")
      .replace(/\$[^$]+\$/g, "")
      .replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, [stemPreprocessing]);

  const mapModeToType = useCallback((mode) => {
    const modeMap = {
      Paragraph: "paragraph",
      "Key Sentences": "key-points",
      Abstract: "abstract",
    };
    return modeMap[mode] || "key-points";
  }, []);

  const mapLengthToApi = useCallback((len) => {
    const lengthMap = {
      Short: "short",
      Regular: "medium",
      Medium: "medium",
      Long: "long",
    };
    return lengthMap[len] || "medium";
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!text?.trim()) {
      toast.warning("Please enter some text to summarize");
      return;
    }

    if (!accessToken) {
      dispatch(setShowLoginModal(true));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      trackEvent("click", "summarize", "summarize_click", 1);
      setIsLoading(true);
      setOutputContent("");
      setErrorMessage("");

      const rawText = extractTextFromHTML(text);
      const textContent = preprocessSTEM(rawText);

      if (!textContent || textContent.trim().length < 10) {
        toast.warning("Text is too short to summarize after preprocessing.");
        setIsLoading(false);
        return;
      }

      const result = await summarizeText(
        {
          text: textContent,
          type: mapModeToType(debouncedSelectedMode),
          length: mapLengthToApi(debouncedCurrentLength),
        },
        controller.signal,
      );

      if (result?.summary) {
        setOutputContent(result.summary);
      }

      const wc = rawText.split(/\s+/).filter((w) => w.length > 0).length;
      trackToolUsed("summarize", wc);
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (error?.status === 401) {
        dispatch(setShowLoginModal(true));
      } else if (error?.status === 429 || error?.status === 402) {
        dispatch(setShowAlert(true));
        dispatch(
          setAlertMessage(
            error?.userMessage || error?.message || "Usage limit reached. Please upgrade your plan.",
          ),
        );
      } else {
        const msg =
          error?.userMessage ||
          error?.message ||
          "Failed to generate summary. Please try again.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    accessToken,
    text,
    debouncedSelectedMode,
    debouncedCurrentLength,
    preprocessSTEM,
    mapModeToType,
    mapLengthToApi,
    dispatch,
    extractTextFromHTML,
  ]);

  const handleInput = useCallback((content) => {
    setText(content);
  }, []);

  const handleOutput = useCallback((content) => {
    setOutputContent(content);
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setOutputContent("");
    setKeywords([]);
    setSelectedKeywords([]);
    setErrorMessage("");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleKeywordToggle = useCallback((keyword) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((kw) => kw !== keyword);
      }

      if (prev.length >= 5) {
        toast.warning("You can select up to 5 keywords only.");
        return prev;
      }

      return [...prev, keyword];
    });
  }, []);

  // Find matching keywords in output
  const matchingKeywords = useMemo(() => {
    if (!outputContent || !selectedKeywords.length) return [];
    const outputText = extractTextFromHTML(outputContent).toLowerCase();
    return selectedKeywords.filter((keyword) =>
      outputText.includes(keyword.toLowerCase()),
    );
  }, [outputContent, selectedKeywords, extractTextFromHTML]);

  // Refs for scrollable containers
  const inputScrollRef = useRef(null);
  const outputScrollRef = useRef(null);

  return (
    <div className="w-full" role="region" aria-label="Text Summarizer">
      <div className="rounded-lg">
        {/* Top Navigation */}
        <div className="bg-card rounded-t-lg border border-b-0">
          <div className="flex flex-col gap-0 sm:flex-row sm:items-center sm:justify-between">
            <TopNavigation
              LENGTH={LENGTH}
              currentLength={currentLength}
              modes={modes}
              selectedMode={selectedMode}
              setCurrentLength={setCurrentLength}
              setSelectedMode={setSelectedMode}
            />
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0">
              <label
                htmlFor="stem-toggle"
                className="text-muted-foreground text-xs whitespace-nowrap"
              >
                STEM mode
              </label>
              <button
                id="stem-toggle"
                role="switch"
                aria-checked={stemPreprocessing}
                aria-label="Toggle STEM preprocessing to exclude LaTeX and code blocks"
                onClick={() => setStemPreprocessing((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  stemPreprocessing ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    stemPreprocessing ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* removed overflow-hidden to prevent clipping of editors; ensure children can shrink via min-width:0 */}
        <div className="relative grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-0">
          {/* Left Section */}
          <div
            className="bg-card border-border text-card-foreground relative rounded-b-lg border lg:self-stretch lg:rounded-r-none"
            style={{ minWidth: 0 }}
          >
            <div className="flex h-[calc(100vh-320px)] max-h-[550px] min-h-[400px] flex-col">
              <div
                className="relative flex-1 overflow-y-auto"
                ref={inputScrollRef}
              >
                <TiptapEditor
                  className="w-full"
                  content={text}
                  onChange={handleInput}
                  placeholder="Input your text here..."
                  readOnly={false}
                  highlightedKeywords={selectedKeywords}
                />

                {!text && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="pointer-events-auto flex flex-col items-center gap-2">
                      <InitialInputActions
                        className={"flex-nowrap"}
                        setInput={(text) => {
                          setText(text);
                        }}
                        sample={sampleText}
                        showSample={true}
                        showPaste={true}
                        showInsertDocument={false}
                      />
                      <ButtonInsertDocumentText
                        key="insert-document"
                        onApply={(value) => setText(value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {text && plainText && plainText.length > 10 && (
                <div className="bg-muted p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        Select keywords (up to 5)
                      </p>
                      <div
                        className={cn("cursor-pointer", {
                          hidden: !(keywords?.length > 0),
                        })}
                        onClick={() => setIsKeywordsOpen((prev) => !prev)}
                      >
                        {isKeywordsOpen ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      {isKeywordsLoading ? (
                        <div className="text-primary text-xs">
                          Loading keywords...
                        </div>
                      ) : keywords?.length > 0 ? (
                        <div
                          className={cn("flex max-h-29 flex-wrap gap-1", {
                            "h-6.5 overflow-hidden": !isKeywordsOpen,
                            "overflow-y-scroll": isKeywordsOpen,
                          })}
                        >
                          {keywords.map((kw, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`h-6 shrink-0 cursor-pointer rounded-full border px-3 text-xs transition-all hover:shadow-md ${
                                selectedKeywords.includes(kw)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "hover:border-primary/50 border-muted-foreground"
                              }`}
                              onClick={() => handleKeywordToggle(kw)}
                            >
                              <span className="capitalize">{kw}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-xs">
                          No keywords found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {text && (
                <div className="border-t">
                  <InputActions
                    className={"h-12 py-1"}
                    toolName="summarize"
                    userPackage={user?.package}
                    isLoading={isLoading}
                    input={text}
                    setInput={setText}
                    label={"Summarize"}
                    onClear={handleClear}
                    onSubmit={() => handleSubmit(text)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          {((1024 >= width && (outputContent || isLoading)) ||
            1024 < width) && (
            <div
              className="bg-card border-border text-card-foreground relative rounded-b-lg border lg:self-stretch lg:rounded-l-none lg:border-l-0"
              style={{ minWidth: 0 }}
            >
              <div className="flex h-[calc(100vh-320px)] max-h-[550px] min-h-[400px] flex-col">
                <div
                  className="relative flex-1 overflow-y-auto"
                  ref={outputScrollRef}
                >
                  <TiptapEditor
                    className="w-full"
                    content={
                      outputContent || (isLoading ? `<p>Analyzing...</p>` : "")
                    }
                    onChange={handleOutput}
                    placeholder="Summarized text will appear here..."
                    readOnly={true}
                    highlightedKeywords={matchingKeywords}
                  />

                  {errorMessage && !isLoading && (
                    <div
                      role="alert"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
                    >
                      <p className="text-destructive text-sm font-medium">
                        {errorMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          handleSubmit();
                        }}
                        className="text-primary text-xs underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!outputContent && !isLoading && !errorMessage && (
                    <div className="text-muted-foreground pointer-events-none absolute top-5 left-4 flex items-center justify-center text-sm">
                      Summarized text will appear here...
                    </div>
                  )}
                </div>

                {outputContent && (
                  <div className="border-t">
                    <OutputActions
                      className={"h-12 justify-center py-1 lg:justify-end"}
                      input={outputContent}
                      showSentenceCount={true}
                      showDownload={true}
                      showCopy={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummarizeContentSection;
