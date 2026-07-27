// components/InputArea.jsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUploadPresentationFilesMutation } from "@/redux/api/presentation/presentationApi";
import { MoreVertical, Send, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function InputArea({
  currentAgentType,
  inputValue,
  setInputValue,
  onSend,
  isLoading,
  setUploadedFiles,
  setFileUrls,
  uploadedFiles,
  fileUrls,
  onNewChat,
  disabled,
  placeholder,
}) {
  const { user } = useSelector((state) => state.auth);
  const [uploadFiles, { isLoading: isUploading, error: uploadError }] =
    useUploadPresentationFilesMutation();

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const showToast = (message, severity = "error") => {
    setToast({ open: true, message, severity });
  };

  const handleNewChatClick = () => {
    setShowNewChatModal(true);
  };

  const handleNewChatConfirm = () => {
    setShowNewChatModal(false);
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleNewChatCancel = () => {
    setShowNewChatModal(false);
  };

  // Updated click handler
  const handleClick = () => {
    // Trigger file input click
    document.getElementById("file-upload-input-slides").click();
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;



    // Check file type and size
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid type: ${file.type})`);
      } else if (file.size > maxSize) {
        invalidFiles.push(
          `${file.name} (too large: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      }
    }

    if (invalidFiles.length > 0) {
      showToast(`Invalid files: ${invalidFiles.join(", ")}`, "error");
      return;
    }

    // Validate user
    if (!user?._id) {
      showToast("User not authenticated", "error");
      return;
    }

    const uploadData = {
      files, // Array of File objects
      userId: user._id,
    };



    try {
      // Show loading state
      showToast("Uploading files...", "info");

      const result = await uploadFiles(uploadData).unwrap();

      showToast(`${files.length} file(s) uploaded successfully`, "success");

      if (result?.success) {
        setUploadedFiles((prev) => [...prev, ...result.data]);
        setFileUrls((prev) => [
          ...prev,
          ...result.data.map((file) => file.signed_url),
        ]);
      }

      // Clear the file input
      event.target.value = "";
    } catch (error) {
      // console.error("Upload failed:", error);

      // More detailed error messages
      let errorMessage = "Failed to upload files. Please try again.";

      if (error.status === "FETCH_ERROR") {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.status === 400) {
        errorMessage = "Bad request. Please check file format and try again.";
      } else if (error.status === 413) {
        errorMessage =
          "Files too large. Please reduce file size and try again.";
      } else if (error.data) {
        errorMessage = error.data.message || errorMessage;
      }

      showToast(errorMessage, "error");
      setUploadedFiles([]); // Reset on error

      // Clear the file input on error
      event.target.value = "";
    }
  };

  const truncateFilename = (filename, maxLength = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = getFileExtension(filename);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 4,
    );
    return `${truncatedName}...${extension}`;
  };

  const handleRemoveFile = (index, filename) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
  };

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase();
  };

  return (
    <>
      <div className="bg-muted/40 p-3 sm:p-4">
        <div className="border-border/80 bg-card relative rounded-2xl border p-3 shadow-sm">
          {/* uploaded files preview STARTS */}
          {uploadedFiles?.length > 0 && (
            <div className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2 md:grid-cols-1 md:pt-2 xl:pt-3">
              {uploadedFiles?.map((file, index) => {
                const extension = getFileExtension(file.filename);
                const truncatedName = truncateFilename(file.filename);

                return (
                  <div
                    key={`${file.filename}-${index}`}
                    className="border-border bg-card hover:border-primary relative max-w-[120px] rounded-lg border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index, file.filename)}
                      className="bg-muted/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground absolute top-2 right-2 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    {/* File icon and info */}
                    <div className="mb-2 flex items-start pr-2">
                      <div className="min-w-0 flex-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-foreground mb-1 text-sm leading-tight font-semibold break-words">
                                {truncatedName}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{file.filename}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* File extension chip */}
                    <div className="flex items-center justify-between">
                      <span className="bg-primary text-primary-foreground inline-flex h-5 items-center rounded-sm px-2 text-xs font-semibold">
                        {extension.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* uploaded files preview ENDS */}

          <div className="mb-2 flex items-center gap-2">
            <Textarea
              placeholder={
                placeholder ||
                (currentAgentType === "presentation"
                  ? "Create a presentation about..."
                  : "Ask anything, create anything...")
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              disabled={disabled}
              className="text-foreground placeholder:text-muted-foreground border-border/70 bg-muted/60 focus-visible:ring-primary/30 focus-visible:ring-offset-card max-h-[120px] min-h-[60px] resize-none rounded-xl border px-4 py-3 text-base shadow-none transition focus-visible:ring-2 focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex flex-row-reverse items-center justify-between">
            {/* This will be needed later */}
            {/* <input
              id="file-upload-input-slides"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />

            <Button
              variant="ghost"
              onClick={handleClick}
              className="text-muted-foreground hover:text-primary"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach
            </Button> */}

            <div className="flex items-center gap-1">
              {/* Three-dot menu button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-10 w-10"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleNewChatClick}>
                    <span className="text-sm">New Chat</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => onSend()}
                disabled={
                  !inputValue.trim() || isLoading || isUploading || disabled
                }
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground h-10 w-10"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="relative">
          <div className="border-border bg-background absolute -top-[250px] right-5 z-[1000] w-80 rounded-lg border p-6 shadow-xl">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChatCancel}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>

            <h2 className="mb-2 text-xl font-semibold">Start New Chat</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              This will clear the current conversation and start fresh. Are you
              sure you want to continue?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleNewChatCancel}
                variant="outline"
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button onClick={handleNewChatConfirm} variant="default">
                New Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast messages */}
      {toast.open && (
        <div className="fixed right-5 bottom-5 z-[9999] w-96">
          <div
            className={cn(
              "relative rounded-lg border p-4 shadow-lg",
              toast.severity === "error" &&
                "border-destructive bg-destructive/10 text-destructive",
              toast.severity === "success" &&
                "border-primary bg-primary/10 text-primary",
              toast.severity === "info" &&
                "border-border bg-background text-foreground",
            )}
          >
            <button
              onClick={() => setToast((prev) => ({ ...prev, open: false }))}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="pr-6 text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
