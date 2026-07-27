/* eslint-disable react-hooks/exhaustive-deps */
import FileList from "@/components/common/FileList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import useFileUpload from "@/hooks/useFileUpload";
import useNavItemFiles from "@/hooks/useNavItemFiles";
import useSheetAiToken from "@/hooks/useRegisterSheetService";
import { cn } from "@/lib/utils";
import { useUploadPresentationFilesMutation } from "@/redux/api/presentation/presentationApi";
import { useUploadResearchFilesMutation } from "@/redux/api/research/researchChatApi";
import { useUploadSheetFilesMutation } from "@/redux/api/sheet/sheetApi";
import { setSheetToken, setShowLoginModal } from "@/redux/slices/auth";
import {
  Bot,
  Briefcase,
  BookOpen,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  LinkIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Presentation,
  Rocket,
  Search,
  Send,
  Sparkles,
  Table,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SearchDropdown from "./SearchDropDown";
import { useAgentContext } from "./shared/AgentContextProvider";
import {
  handleResearchRequest,
  handleSheetGenerationRequest,
  handleSlideCreation,
} from "./super-agent/agentPageUtils";

const NAVIGATION_ITEMS = [
  {
    id: "chat",
    label: "AI Chat",
    icon: <MessageCircle className="size-4" />,
    isNew: false,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "slides",
    label: "AI Slides",
    icon: <Presentation className="size-4" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "sheets",
    label: "AI Sheets",
    icon: <Table className="size-4" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "research",
    label: "Deep research",
    icon: <Search className="size-4" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "browse",
    label: "Work for me",
    icon: <Bot className="size-4" />,
    isNew: false,
    isComingSoon: true,
    isDisabled: true,
  },
];

const suggestedPrompts = {
  chat: [
    { text: "Explain quantum computing in simple terms", icon: MessageCircle, color: "text-blue-600" },
    { text: "Help me write a professional email to my team", icon: MessageCircle, color: "text-purple-600" },
    { text: "What are the best practices for remote work?", icon: MessageCircle, color: "text-orange-600" },
    { text: "Summarize the key trends in AI for 2025", icon: MessageCircle, color: "text-emerald-600" },
  ],
  slides: [
    { text: "Business presentation about Digital Marketing", icon: Briefcase, color: "text-blue-600" },
    { text: "Academic presentation about AI in Education", icon: GraduationCap, color: "text-purple-600" },
    { text: "Product launch deck for a SaaS platform", icon: Rocket, color: "text-orange-600" },
    { text: "Training materials for team onboarding", icon: BookOpen, color: "text-emerald-600" },
  ],
  sheets: [
    { text: "Compare pricing of top 10 gyms in a sheet", icon: Table, color: "text-blue-600" },
    { text: "List top 5 Italian restaurants with ratings", icon: Table, color: "text-orange-600" },
    { text: "Generate 10 school and contact notes", icon: Table, color: "text-purple-600" },
  ],
  research: [
    { text: "Recent studies on intermittent fasting and longevity", icon: Search, color: "text-blue-600" },
    { text: "Compare top 5 project management tools", icon: Search, color: "text-orange-600" },
    { text: "Latest laws on crypto trading in the US and Europe", icon: Search, color: "text-purple-600" },
  ],
  browse: [],
};

const PLACEHOLDERS = {
  chat: "Ask me anything...",
  slides: "What would you like to present?",
  sheets: "What data would you like to generate?",
  research: "What would you like to research?",
  browse: "What would you like me to work on?",
};

const SUBTITLES = {
  chat: "Chat with AI about anything — get answers, ideas, and help",
  slides: "Create stunning presentations in seconds",
  sheets: "Generate spreadsheets and data tables instantly",
  research: "Deep research with AI-powered analysis",
  browse: "Let AI work on tasks and find information for you",
};

export default function AgentLandingPage({ initialTab, hideNavigation, hideHeader } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAgentType } = useAgentContext();
  const [inputValue, setInputValue] = useState("");
  const [selectedNavItem, setSelectedNavItem] = useState(initialTab ?? "chat");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const { accessToken, sheetToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [uploadFilesForSlides, { isLoading: isUploadingSlides }] =
    useUploadPresentationFilesMutation();
  const [uploadFilesForSheets, { isLoading: isUploadingSheets }] =
    useUploadSheetFilesMutation();
  const [uploadFilesForResearch, { isLoading: isUploadingResearch }] =
    useUploadResearchFilesMutation();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isInitiatingPresentation, setIsInitiatingPresentation] =
    useState(false);
  const [isInitiatingSheet, setIsInitiatingSheet] = useState(false);
  const [isInitiatingResearch, setIsInitiatingResearch] = useState(false);

  const {
    currentFiles,
    currentUrls,
    addFiles,
    removeFile,
    clearCurrentNavItem,
    clearAllNavItems,
    hasFiles,
  } = useNavItemFiles(selectedNavItem);

  const { handleFileSelect, isUploading } = useFileUpload({
    uploadFunction: async (uploadData) => {
      switch (selectedNavItem) {
        case "slides":
          return await uploadFilesForSlides(uploadData).unwrap();
        case "sheets":
          return await uploadFilesForSheets(uploadData).unwrap();
        case "research":
          return await uploadFilesForResearch(uploadData).unwrap();
        default:
          throw new Error(`Invalid agent type: ${selectedNavItem}`);
      }
    },
    isUploading:
      isUploadingSlides || isUploadingSheets || isUploadingResearch,
    addFiles,
    prepareUploadData: (files, userId) => ({
      files,
      userId,
    }),
    getUserId: () => user?._id || null,
    onUploadStart: (fileCount) => {
      showToast(
        `Uploading ${fileCount} file${fileCount > 1 ? "s" : ""}...`,
        "info",
      );
    },
    onSuccess: (uploadedFiles, result) => {
      const fileCount = uploadedFiles.length;
      showToast(
        `${fileCount} file${fileCount > 1 ? "s" : ""} uploaded successfully`,
        "success",
      );
    },
    onError: (error) => {
      showToast(
        error.message || "Failed to upload files. Please try again.",
        "error",
      );
    },
    onValidationError: (message) => {
      showToast(message, "error");
    },
  });

  const [researchModel, setResearchModel] = useState("gemini-2.0-flash");
  const [topLevel, setTopLevel] = useState(3);

  const isMobile = useResponsive("down", "sm");

  const user = useSelector((state) => state.auth.user);

  const { sheetAIToken, refreshSheetAIToken } = useSheetAiToken();

  useEffect(() => {
    if (!sheetAIToken) return;
    dispatch(setSheetToken(sheetAIToken));
  }, [sheetAIToken, dispatch]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("shothik_has_visited");
    if (!hasVisited) {
      setIsFirstTimeUser(true);
      setShowOnboarding(true);
      localStorage.setItem("shothik_has_visited", "true");
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && NAVIGATION_ITEMS.some((item) => item.id === tab)) {
      setSelectedNavItem(tab);
      if (tab === "sheets") {
        setInputValue("Create a list for ");
      } else if (tab === "slides") {
        setInputValue("Create a presentation about ");
      } else if (tab === "research") {
        setInputValue("");
      }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    if (isUploading) {
      showToast(
        "Please wait for file uploads to complete before submitting",
        "error",
      );
      return;
    }

    setIsSubmitting(true);

    const email = user?.email;

    try {
      switch (selectedNavItem) {
        case "chat":
          showToast("AI Chat is coming soon! Try our other tools for now.", "info");
          return;
        case "slides":
          return await handleSlideCreation(
            inputValue,
            currentUrls,
            currentFiles,
            setAgentType,
            dispatch,
            setLoginDialogOpen,
            setIsSubmitting,
            setIsInitiatingPresentation,
            router,
            showToast,
          );
        case "sheets":
          return await handleSheetGenerationRequest(
            inputValue,
            setAgentType,
            dispatch,
            setLoginDialogOpen,
            setIsSubmitting,
            setIsInitiatingSheet,
            router,
            email,
            showToast,
            refreshSheetAIToken,
          );
        case "research":
          return await handleResearchRequest(
            inputValue,
            researchModel,
            topLevel,
            setIsInitiatingResearch,
            setLoginDialogOpen,
            setIsSubmitting,
            showToast,
            router,
            webSearchEnabled,
          );
        case "browse":
          return;
        default:
          return;
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavItemClick = (itemId) => {
    setSelectedNavItem(itemId);
    if (itemId === "slides") {
      setInputValue("Create a presentation about ");
    } else if (itemId === "sheets") {
      setInputValue("Create a list for ");
    } else {
      setInputValue("");
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  const showToast = (message, variant = "destructive") => {
    if (variant === "destructive" || variant === "error") {
      toast.error(message);
    } else if (variant === "success") {
      toast.success(message);
    } else {
      toast.info(message);
    }
  };

  const handleAttachClick = () => {
    document.getElementById("file-upload-input").click();
  };

  const handleImageUploadClick = () => {
    document.getElementById("image-upload-input").click();
  };

  const handleRemoveFile = (index, filename) => {
    removeFile(index);
  };

  const handlePromptClick = (promptText) => {
    setInputValue(promptText);
  };

  const isProcessing =
    isInitiatingPresentation ||
    isInitiatingSheet ||
    isInitiatingResearch ||
    isUploading;

  const showAttach = ["slides", "sheets", "research"].includes(selectedNavItem);
  const showImageUpload = ["slides"].includes(selectedNavItem);
  const showWebSearch = ["research"].includes(selectedNavItem);

  return (
    <div className="bg-background text-foreground relative flex min-h-[calc(100vh-100px)] flex-col">
      {showOnboarding && (
        <div className="bg-primary/10 border-primary/20 fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border p-4 shadow-lg backdrop-blur-sm sm:left-auto sm:right-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-primary mb-1 font-semibold">
                Welcome to Shothik AI!
              </h3>
              <p className="text-muted-foreground text-sm">
                Create AI-powered presentations, spreadsheets, and research
                in seconds. Pick a suggestion below or type your own prompt.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedNavItem("slides");
                    setInputValue(
                      "Create a presentation about Digital Marketing Trends 2025",
                    );
                    handleCloseOnboarding();
                  }}
                >
                  Try Example
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseOnboarding}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseOnboarding}
              className="h-6 w-6 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {!hideHeader && (
            <div className="mb-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
                <Sparkles className="text-primary size-6" />
              </div>
              <h1 className="mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                What can I help you with?
              </h1>
              <p className="text-muted-foreground text-sm">
                {SUBTITLES[selectedNavItem]}
              </p>
            </div>
          )}

          {!hideNavigation && (
            <div className="mb-5 flex flex-wrap items-center justify-center gap-1.5">
              {NAVIGATION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  disabled={item.isDisabled}
                  data-rybbit-event="Agent"
                  data-rybbit-prop-agent={item.label}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    selectedNavItem === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                    item.isDisabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex h-4 items-center rounded-full px-1 text-[9px] font-bold">
                      New
                    </span>
                  )}
                  {item.isComingSoon && (
                    <span className="bg-muted-foreground/20 text-muted-foreground absolute -top-1.5 -right-1.5 flex h-4 items-center rounded-full px-1 text-[9px] font-medium">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <Card className="bg-card overflow-hidden rounded-2xl border shadow-lg">
            <CardContent className="p-0">
              <div className="p-4 pb-2">
                <Textarea
                  placeholder={PLACEHOLDERS[selectedNavItem]}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="max-h-32 min-h-[56px] resize-none border-none px-1 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="border-t px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-0.5">
                    {selectedNavItem === "research" && (
                      <SearchDropdown
                        setResearchModel={setResearchModel}
                        setTopLevel={setTopLevel}
                      />
                    )}

                    <input
                      id="file-upload-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />

                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />

                    {showAttach && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleAttachClick}
                              className="text-muted-foreground hover:text-primary size-8 rounded-full"
                              data-rybbit-event="File Attach"
                            >
                              <Paperclip className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p>Attach files (PDF, DOCX, TXT, CSV, XLSX)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {showImageUpload && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleImageUploadClick}
                              className="text-muted-foreground hover:text-primary size-8 rounded-full"
                              data-rybbit-event="Image Upload"
                            >
                              <ImageIcon className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p>Upload images</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {showWebSearch && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                              className={cn(
                                "size-8 rounded-full transition-colors",
                                webSearchEnabled
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "text-muted-foreground hover:text-primary",
                              )}
                              data-rybbit-event="Web Search Toggle"
                            >
                              <Globe className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p>{webSearchEnabled ? "Web search enabled" : "Enable web search"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim() || isProcessing}
                            size="icon"
                            className="bg-primary hover:bg-primary/90 size-9 rounded-full shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            data-rybbit-event="Agent Start"
                          >
                            {isProcessing ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {isUploading && (
                        <TooltipContent>
                          <p>Please wait for file uploads to complete</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {(currentFiles?.length > 0 || isUploading) && (
                <div className="border-t px-4 py-2">
                  <FileList
                    files={currentFiles || []}
                    onRemove={handleRemoveFile}
                    maxVisibleFiles={3}
                    title="Attached Files"
                    showHeader={true}
                    isUploading={isUploading}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(suggestedPrompts[selectedNavItem] || []).map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt.text)}
                    data-rybbit-event="Suggested Prompt"
                    data-rybbit-prop-prompt={prompt.text}
                    className={cn(
                      "group flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                      "bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                      prompt.color === "text-blue-600" && "bg-blue-500/10",
                      prompt.color === "text-purple-600" && "bg-purple-500/10",
                      prompt.color === "text-orange-600" && "bg-orange-500/10",
                      prompt.color === "text-emerald-600" && "bg-emerald-500/10",
                    )}>
                      <Icon className={cn("size-3.5", prompt.color)} />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground text-sm leading-snug transition-colors">
                      {prompt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <LoginDialog
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
      />
    </div>
  );
}

const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to use this feature. Please log in to
            continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              dispatch(setShowLoginModal(true));
              setLoginDialogOpen(false);
            }}
          >
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
