import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useUploadImageMutation } from "@/redux/api/auth/authApi";
import { ArrowUp, Paperclip, Upload } from "lucide-react";
import * as motion from "motion/react-client";
import { useCallback, useRef, useState } from "react";
import AttachmentPreview from "./AttachmentPreview";
import ModelSwitcher from "./ModelSwitcher";
import { searchGroups } from "./utils";

const models = [
  {
    value: "shothik-brain-1.0",
    label: "Shothik Brain",
    icon: "/moscot.png",
    description: "shothik brain 1.0",
    vision: true,
    experimental: false,
    category: "Stable",
  },
  {
    value: "deepseek-r1-distill-llama-70b",
    label: "Deepseek R1 Distill Llama 70b",
    icon: "/deepseek-r1.png",
    description: "deepseek-r1-distill-llama-70b",
    vision: true,
    experimental: false,
    category: "Stable",
  },
  {
    value: "llama-3.3-70b-instruct",
    label: "Llama 3.3 70b Instruct",
    icon: "/meta_llma.png",
    description: "llama 3.3 70b instruct",
    vision: true,
    experimental: false,
    category: "Stable",
  },
  {
    value: "qwen2.5-coder-32b-instruct",
    label: "Qwen2.5 Coder 32b Instruct",
    icon: "/gwen.png",
    description: "Qwen2.5 Coder 32b Instruct",
    vision: true,
    experimental: false,
    category: "Stable",
  },
  {
    value: "shothik-brain-1.5",
    label: "Shothik Brain 1.5",
    icon: "/moscot.png",
    description: "shothik brain 1.5",
    vision: true,
    experimental: true,
    category: "Experimental",
  },
];

const MAX_IMAGES = 4;

const ToolbarButton = ({ group, isSelected, onClick }) => {
  const Icon = group.icon;
  const isMobile = useResponsive("sm");

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const buttonContent = (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9", isSelected && "bg-accent")}
      onClick={handleClick}
    >
      <Icon size={20} />
    </Button>
  );

  // Use regular button for mobile
  if (isMobile) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent className="bg-background text-foreground border-border max-w-[220px] border">
        <div className="flex flex-col">
          <p className="text-xs font-semibold">{group.name}</p>
          <p className="text-muted-foreground text-[10px]">
            {group.description}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const SelectionContent = ({ ...props }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout={false}
      initial={false}
      animate={{
        width: isExpanded ? "auto" : "30px",
        gap: isExpanded ? "15px" : 0,
        paddingRight: isExpanded ? "0.5rem" : 0,
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {searchGroups.map((group) => {
        const showItem = isExpanded || props.selectedGroup === group.id;
        return (
          <motion.div
            key={group.id}
            layout={false}
            animate={{
              width: showItem ? "28px" : 0,
              opacity: showItem ? 1 : 0,
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            style={{ margin: 0 }}
          >
            <ToolbarButton
              group={group}
              isSelected={props.selectedGroup === group.id}
              onClick={() => props.onGroupSelect(group)}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

const FormComponent = ({
  input,
  setInput,
  attachments,
  setAttachments,
  hasSubmitted,
  setHasSubmitted,
  isLoading,
  handleSubmit,
  fileInputRef,
  inputRef,
  selectedModel,
  setSelectedModel,
  selectedGroup,
  setSelectedGroup,
}) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const postSubmitFileInputRef = useRef(null);
  const [uploadImage] = useUploadImageMutation();

  const handleGroupSelect = useCallback(
    (group) => {
      setSelectedGroup(group.id);
      inputRef.current?.focus();
    },
    [setSelectedGroup, inputRef],
  );

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await uploadImage(formData).unwrap();
      return {
        url: data.image,
        name: "",
        contentType: "image/",
        size: 0,
      };
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
      throw error;
    }
  };

  const handleFileChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      const totalAttachments = attachments.length + files.length;

      if (totalAttachments > MAX_IMAGES) {
        toast.error("You can only attach up to 5 images.");
        return;
      }

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...uploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
        toast.error(
          "Failed to upload one or more files. Please try again.",
        );
      } finally {
        setUploadQueue([]);
        event.target.value = "";
      }
    },
    [attachments, setAttachments],
  );

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (attachments.length >= MAX_IMAGES) return;

      if (e.dataTransfer.items && e.dataTransfer.items[0].kind === "file") {
        setIsDragging(true);
      }
    },
    [attachments.length],
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const getFirstVisionModel = useCallback(() => {
    return models.find((model) => model.vision)?.value || selectedModel;
  }, [selectedModel]);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length === 0) {
        toast.error("Only image files are supported");
        return;
      }

      const totalAttachments = attachments.length + files.length;
      if (totalAttachments > MAX_IMAGES) {
        toast.error("You can only attach up to 5 images.");
        return;
      }

      // Switch to vision model if current model doesn't support vision
      const currentModel = models.find((m) => m.value === selectedModel);
      if (!currentModel?.vision) {
        const visionModel = getFirstVisionModel();
        setSelectedModel(visionModel);
        toast.info(
          `Switched to ${
            models.find((m) => m.value === visionModel)?.label
          } for image support`,
        );
      }

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...uploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
        toast.error(
          "Failed to upload one or more files. Please try again.",
        );
      } finally {
        setUploadQueue([]);
      }
    },
    [
      attachments.length,
      setAttachments,
      uploadFile,
      selectedModel,
      setSelectedModel,
      getFirstVisionModel,
    ],
  );

  const onSubmit = (event) => {
    event.preventDefault();

    if (input.trim() || attachments.length > 0) {
      setHasSubmitted(true);

      handleSubmit();

      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      toast.warning("Please enter a search query or attach an image.");
    }
  };

  const triggerFileInput = useCallback(() => {
    if (attachments.length >= MAX_IMAGES) {
      toast.error(`You can only attach up to ${MAX_IMAGES} images`);
      return;
    }

    if (hasSubmitted) {
      postSubmitFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  }, [attachments.length, hasSubmitted, fileInputRef]);

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        isDragging && "border-primary",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-background/90 absolute inset-0 z-50 m-2 flex items-center justify-center rounded-xl border border-dashed backdrop-blur-sm"
        >
          <div className="flex items-center gap-8 px-3 py-4">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
              <Upload size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop images here</p>
              <p className="text-muted-foreground text-xs">
                Max {MAX_IMAGES} images
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        accept="image/*"
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={attachment.url}
              attachment={attachment}
              onRemove={() => removeAttachment(index)}
              isUploading={false}
            />
          ))}
          {uploadQueue.map((filename) => (
            <AttachmentPreview
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
                size: 0,
              }}
              onRemove={() => {}}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          {!hasSubmitted ? (
            <>
              <SelectionContent
                selectedGroup={selectedGroup}
                onGroupSelect={handleGroupSelect}
              />
              <ModelSwitcher
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                showExperimentalModels={true}
                attachments={attachments}
                models={models}
              />
            </>
          ) : null}

          <Input
            name="question"
            type="text"
            ref={inputRef}
            placeholder={
              hasSubmitted ? "Ask a new question..." : "Ask a question..."
            }
            className="flex-1 border-none"
            value={input || ""}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="bg-primary/5 hover:bg-primary/10 h-9 w-9"
            onClick={(event) => {
              event.preventDefault();
              triggerFileInput();
            }}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4 rotate-45" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="bg-primary/5 hover:bg-primary/10 h-9 w-9"
            onClick={onSubmit}
            disabled={!input || isLoading}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormComponent;
