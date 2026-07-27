"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useShare } from "@/hooks/useShare";
import {
  Calendar,
  Download,
  Eye,
  MessageSquare,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ShareModal = ({
  open,
  onClose,
  shareData,
  contentType = "research",
  title = "Share Content",
}) => {
  const {
    shareResearch,
    shareChat,
    shareDocument,
    copyToClipboard,
    isLoading,
    error,
    shareResult,
  } = useShare();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: true,
    allowComments: false,
    allowDownload: true,
    expiresAt: "",
    maxViews: "",
    tags: [],
  });

  const [newTag, setNewTag] = useState("");

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && shareData) {
      setFormData({
        title: shareData.title || "",
        description: shareData.description || "",
        isPublic: true,
        allowComments: false,
        allowDownload: true,
        expiresAt: "",
        maxViews: "",
        tags: shareData.tags || [],
      });
    }
  }, [open, shareData]);

  const handleInputChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleShare = async () => {
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
          content: {
            ...shareData,
            title: formData.title || shareData.title,
            description: formData.description,
            tags: formData.tags,
          },
          createdAt: new Date().toISOString(),
        };

        sessionStorage.setItem(
          `share_${shareId}`,
          JSON.stringify(shareDataToStore),
        );

        // Copy to clipboard
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

        toast.success("Share created and link copied to clipboard!");
      } else {
        throw new Error("Only research content sharing is supported");
      }
    } catch (err) {
      toast.error(err.message || "Failed to create share");
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      isPublic: true,
      allowComments: false,
      allowDownload: true,
      expiresAt: "",
      maxViews: "",
      tags: [],
    });
    setNewTag("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="min-h-[500px] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="text-primary size-5" />
              <span>{title}</span>
            </div>
            <button
              onClick={handleClose}
              className="focus:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Basic Information</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  placeholder="Enter a title for your share"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  placeholder="Describe what you're sharing"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Tags</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1 pr-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-accent hover:text-accent-foreground ml-1 rounded-full transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Permissions & Settings</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="size-4" />
                  <Label htmlFor="isPublic" className="text-sm font-normal">
                    Make public (anyone with link can view)
                  </Label>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  <Label
                    htmlFor="allowComments"
                    className="text-sm font-normal"
                  >
                    Allow comments
                  </Label>
                </div>
                <Switch
                  id="allowComments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, allowComments: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="size-4" />
                  <Label
                    htmlFor="allowDownload"
                    className="text-sm font-normal"
                  >
                    Allow download
                  </Label>
                </div>
                <Switch
                  id="allowDownload"
                  checked={formData.allowDownload}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, allowDownload: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Advanced Options */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Advanced Options</p>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <div className="relative">
                  <Calendar className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={handleInputChange("expiresAt")}
                    className="pl-10"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Leave empty for no expiration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxViews">Maximum Views</Label>
                <div className="relative">
                  <Eye className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="maxViews"
                    type="number"
                    value={formData.maxViews}
                    onChange={handleInputChange("maxViews")}
                    className="pl-10"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Leave empty for unlimited views
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button onClick={handleClose} disabled={isLoading} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            variant="default"
            disabled={isLoading}
            className="gap-2"
          >
            <Share2 className="size-4" />
            {isLoading ? "Creating Share..." : "Create Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
