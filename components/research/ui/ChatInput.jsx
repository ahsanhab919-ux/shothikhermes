import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useResearchStream } from "@/hooks/useResearchStream";
import { setUserPrompt } from "@/redux/slices/researchCoreSlice";
import { Send } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const ChatInput = () => {
  const [inputValue, setInputValue] = useState("");
  const [currentFiles, setCurrentFiles] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  // Loading states
  const [isInitiatingPresentation, setIsInitiatingPresentation] =
    useState(false);
  const [isInitiatingSheet, setIsInitiatingSheet] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  const [isInitiatingResearch, setIsInitiatingResearch] = useState(false);

  // REDUX
  const dispatch = useDispatch();
  const [effort, setEffort] = useState("medium");
  const [model, setModel] = useState("gemini-2.5-pro");
  const { uploadedFiles, isUploading } = useSelector(
    (state) => state.researchUi,
  );
  const { isStreaming } = useSelector((state) => state.researchCore);

  const { startResearch, cancelResearch } = useResearchStream();

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isStreaming) return;

    // return;
    try {
      dispatch(setUserPrompt(inputValue));
      setInputValue("");
      await startResearch(inputValue, { effort, model });
    } catch (error) {
      console.error("Research failed:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Simulate file upload
    document.getElementById("file-upload-input")?.click();
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file, index) => ({
      filename: file.name,
      file: file,
      id: Date.now() + index,
    }));
    setCurrentFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index, filename) => {
    setCurrentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileExtension = (filename) => {
    return filename.split(".").pop() || "file";
  };

  const truncateFilename = (filename, maxLength = 25) => {
    if (filename.length <= maxLength) return filename;
    const extension = getFileExtension(filename);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 4,
    );
    return `${truncatedName}...${extension}`;
  };

  const hasFiles = currentFiles.length;

  return (
    <div className="relative z-[11] mx-auto w-full max-w-[1000px] py-2">
      <div className="bg-background border-border mx-auto max-w-[1000px] rounded-2xl border p-6 shadow-md">
        <div className="mb-4 flex items-center gap-4">
          <Textarea
            placeholder="Enter a new research topic"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="text-foreground max-h-[120px] min-h-[40px] flex-1 resize-none border-none bg-transparent text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Hidden file input for slide file selection */}
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              {/* Attach button will be needed later */}
              {/* {(selectedNavItem === "slides") && (
              <Button
                variant="ghost"
                onClick={handleClick}
                className="text-muted-foreground"
              >
                <Link className="mr-2 h-4 w-4" />
                Attach
              </Button>
            )} */}
            </div>

            <div className="flex flex-row-reverse items-center gap-4">
              <Button
                onClick={handleSubmit}
                disabled={
                  !inputValue.trim() ||
                  isInitiatingPresentation ||
                  isInitiatingSheet ||
                  isUploading ||
                  isInitiatingResearch ||
                  isStreaming
                }
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground h-10 w-10 rounded-full"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* uploaded files preview STARTS */}
        {/* {hasFiles > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 md:pt-4 xl:pt-6">
            {currentFiles?.map((file, index) => {
              const extension = getFileExtension(file.filename);
              const truncatedName = truncateFilename(file.filename);

              return (
                <div key={`${file.filename}-${index}`}>
                  <Card className="relative border border-border rounded-lg transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary hover:-translate-y-0.5">
                    <CardContent className="p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index, file.filename)}
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground bg-muted/50 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="flex items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm font-semibold text-foreground leading-snug mb-1 break-words">
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

                      <div className="flex justify-between items-center">
                        <Badge className="bg-primary text-primary-foreground font-semibold text-xs h-5">
                          {extension.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ChatInput;
