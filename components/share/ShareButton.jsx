"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShare } from "@/hooks/useShare";
import { cn } from "@/lib/utils";
import { Copy, Globe, Settings, Share } from "lucide-react";
import { useState } from "react";
import ShareModal from "./ShareModal";

const ShareButton = ({
  shareData,
  contentType = "research",
  title = "Share",
  variant = "icon", // 'icon', 'button', 'menu'
  size = "medium",
  onShare,
  disabled = false,
}) => {
  const {
    shareResearch,
    shareChat,
    shareDocument,
    copyToClipboard,
    isLoading,
  } = useShare();

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [quickShareLoading, setQuickShareLoading] = useState(false);

  const handleClick = () => {
    if (variant !== "menu") {
      handleQuickShare();
    }
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

  const handleQuickShare = async () => {
    setQuickShareLoading(true);
    try {
      // Direct client-side sharing - no backend dependency
      const shareId = Math.random().toString(36).substring(2, 15);
      const frontendUrl = window.location.origin;

      if (contentType === "research") {
        const shareUrl = `${frontendUrl}/shared/${contentType}/${shareId}`;

        // Store data in sessionStorage
        const shareDataToStore = {
          shareId,
          contentType,
          content: shareData,
          createdAt: new Date().toISOString(),
        };

        sessionStorage.setItem(
          `share_${shareId}`,
          JSON.stringify(shareDataToStore),
        );

        // Copy the shareable URL to clipboard
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }

        // Open the proper shareable URL directly
        window.open(shareUrl, "_blank");

        alert("Share link copied to clipboard and opened in new tab!");

        if (onShare) {
          onShare({ data: { shareUrl } });
        }
      } else {
        throw new Error("Only research content sharing is supported");
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert(`Failed to create share link: ${error.message}`);
    } finally {
      setQuickShareLoading(false);
    }
  };

  const handleAdvancedShare = () => {
    setShareModalOpen(true);
    handleClose();
  };

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await copyToClipboard(currentUrl);
      handleClose();
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
  };

  const renderIconButton = () => (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || quickShareLoading}
      variant="ghost"
      size={size === "small" ? "icon-sm" : "icon"}
      className="text-muted-foreground hover:text-primary"
    >
      <Share className={cn(size === "small" ? "h-4 w-4" : "h-5 w-5")} />
    </Button>
  );

  const renderButton = () => (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2",
        "bg-background border-border border",
        "transition-colors",
        disabled || isLoading || quickShareLoading
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-accent cursor-pointer",
      )}
    >
      <Share className="h-4 w-4" />
      <span className="text-sm">
        {isLoading || quickShareLoading ? "Sharing..." : title}
      </span>
    </div>
  );

  const renderMenu = () => (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isLoading || quickShareLoading}
          variant="ghost"
          size={size === "small" ? "icon-sm" : "icon"}
          className="text-muted-foreground hover:text-primary"
        >
          <Share className={cn(size === "small" ? "h-4 w-4" : "h-5 w-5")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuItem
          onClick={handleQuickShare}
          disabled={isLoading || quickShareLoading}
          className="flex items-start gap-2"
        >
          <Globe className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm">Quick Share</span>
            <span className="text-muted-foreground text-xs">
              Share publicly with default settings
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAdvancedShare}
          className="flex items-start gap-2"
        >
          <Settings className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm">Advanced Share</span>
            <span className="text-muted-foreground text-xs">
              Customize sharing options
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-start gap-2"
        >
          <Copy className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm">Copy Page Link</span>
            <span className="text-muted-foreground text-xs">
              Copy current page URL
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {variant === "menu"
        ? renderMenu()
        : variant === "button"
          ? renderButton()
          : renderIconButton()}

      <ShareModal
        open={shareModalOpen}
        onClose={handleShareModalClose}
        shareData={shareData}
        contentType={contentType}
        title={`Share ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
      />
    </>
  );
};

export default ShareButton;
