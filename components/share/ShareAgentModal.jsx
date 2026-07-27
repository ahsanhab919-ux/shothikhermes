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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useCreatePrivateShareMutation,
  useCreatePublicShareMutation,
} from "@/redux/api/shareAgent/shareAgentApi";
import {
  Copy,
  Info,
  Link as LinkIcon,
  Mail,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const ShareAgentModal = ({
  open,
  onClose,
  agentId,
  agentData,
  defaultTab = 0,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Advanced settings
  const [settings, setSettings] = useState({
    requireSignIn: false,
    allowCopy: true,
    allowExport: true,
    trackViews: true,
    password: "",
    expiryDate: "",
  });

  const [createPrivateShare, { isLoading: isPrivateLoading }] =
    useCreatePrivateShareMutation();
  const [createPublicShare, { isLoading: isPublicLoading }] =
    useCreatePublicShareMutation();

  // Reset tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Auto-hide snackbar after 4 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    // Reset state when switching tabs
    setEmails([]);
    setCurrentEmail("");
    setMessage("");
    setShareLink("");
  };

  const handleAddEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentEmail && emailRegex.test(currentEmail)) {
      if (!emails.includes(currentEmail)) {
        setEmails([...emails, currentEmail]);
        setCurrentEmail("");
      } else {
        showSnackbar("Email already added", "warning");
      }
    } else {
      showSnackbar("Please enter a valid email address", "error");
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showSnackbar("Link copied to clipboard!", "success");
    } catch (err) {
      showSnackbar("Failed to copy link", "error");
    }
  };

  const handlePrivateShare = async () => {
    if (emails.length === 0) {
      showSnackbar("Please add at least one email address", "error");
      return;
    }

    try {
      const response = await createPrivateShare({
        agentId,
        emails,
        message: message || undefined,
        content: agentData || {}, // Send the research content
        settings: {
          ...settings,
          expiryDate: settings.expiryDate || undefined,
          password: settings.password || undefined,
        },
      }).unwrap();

      if (response.success) {
        setShareLink(response.data.shareLink);
        showSnackbar(
          `Successfully sent to ${response.data.emailsSent} recipient(s)!`,
          "success",
        );
        // Don't close the modal so user can copy the link
      }
    } catch (error) {
      console.error("Error creating private share:", error);
      showSnackbar(
        error?.data?.error || "Failed to create private share",
        "error",
      );
    }
  };

  const handlePublicShare = async () => {
    try {
      const response = await createPublicShare({
        agentId,
        message: message || undefined,
        content: agentData || {}, // Send the research content
        settings: {
          ...settings,
          expiryDate: settings.expiryDate || undefined,
          password: settings.password || undefined,
        },
      }).unwrap();

      if (response.success) {
        setShareLink(response.data.shareLink);
        showSnackbar("Public share link created!", "success");
      }
    } catch (error) {
      console.error("Error creating public share:", error);
      showSnackbar(
        error?.data?.error || "Failed to create public share",
        "error",
      );
    }
  };

  const handleClose = () => {
    // Reset all state
    setActiveTab(0);
    setEmails([]);
    setCurrentEmail("");
    setMessage("");
    setShareLink("");
    setSettings({
      requireSignIn: false,
      allowCopy: true,
      allowExport: true,
      trackViews: true,
      password: "",
      expiryDate: "",
    });
    setShowAdvanced(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="min-h-[500px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="text-lg font-semibold">
                {agentData?.type === "ai-detector"
                  ? "Share AI Detection Report"
                  : agentData?.type === "sheet"
                    ? "Share Sheet"
                    : "Share AI Research"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab.toString()}
            onValueChange={(value) => handleTabChange(parseInt(value))}
            className="w-full"
          >
            <div className="border-border border-b px-3">
              <TabsList className="w-full">
                <TabsTrigger value="0" className="flex-1 gap-2">
                  <Mail className="h-4 w-4" />
                  Private (Email)
                </TabsTrigger>
                <TabsTrigger value="1" className="flex-1 gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Public Link
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-3 pt-4">
              <TabsContent value="0" className="mt-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  Share this{" "}
                  {agentData?.type === "ai-detector"
                    ? "AI Detection Report"
                    : agentData?.type === "sheet"
                      ? "Sheet"
                      : "research"}{" "}
                  privately by sending an email invitation
                </p>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email-input">Add email addresses</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email-input"
                      placeholder="Enter email and press Enter"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddEmail}
                      disabled={!currentEmail}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Press Enter or click + to add
                  </p>
                </div>

                {/* Email Chips */}
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emails.map((email, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                      >
                        {email}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="private-message">
                    Custom message (optional)
                  </Label>
                  <Textarea
                    id="private-message"
                    placeholder="Add a personal message to your email..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="1" className="mt-0 space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Anyone with this link can view your research. You can
                    customize access settings below.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="public-message">Description (optional)</Label>
                  <Textarea
                    id="public-message"
                    placeholder="Add a description for this shared link..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="space-y-4">
            {/* Share Link Display */}
            {shareLink && (
              <div className="border-primary bg-primary/10 rounded-md border p-4">
                <p className="text-primary mb-2 text-sm font-medium">
                  ✓ Share link created successfully!
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCopyLink}
                        size="icon"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy link</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mb-2"
              >
                <Settings className="mr-2 h-4 w-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </Button>

              {showAdvanced && (
                <div className="border-border bg-background space-y-4 rounded-md border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor="require-signin"
                        className="text-sm font-medium"
                      >
                        Require sign-in
                      </Label>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Viewers must be logged in to access
                      </p>
                    </div>
                    <Switch
                      id="require-signin"
                      checked={settings.requireSignIn}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, requireSignIn: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="allow-copy" className="text-sm font-medium">
                      Allow copying content
                    </Label>
                    <Switch
                      id="allow-copy"
                      checked={settings.allowCopy}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowCopy: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label
                      htmlFor="allow-export"
                      className="text-sm font-medium"
                    >
                      Allow exporting
                    </Label>
                    <Switch
                      id="allow-export"
                      checked={settings.allowExport}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowExport: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label
                      htmlFor="track-views"
                      className="text-sm font-medium"
                    >
                      Track views
                    </Label>
                    <Switch
                      id="track-views"
                      checked={settings.trackViews}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, trackViews: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password protection (optional)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={settings.password}
                      onChange={(e) =>
                        setSettings({ ...settings, password: e.target.value })
                      }
                      placeholder="Leave empty for no password"
                    />
                    <p className="text-muted-foreground text-xs">
                      Leave empty for no password
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry date (optional)</Label>
                    <Input
                      id="expiry-date"
                      type="datetime-local"
                      value={settings.expiryDate}
                      onChange={(e) =>
                        setSettings({ ...settings, expiryDate: e.target.value })
                      }
                    />
                    <p className="text-muted-foreground text-xs">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-3 pb-2">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            {activeTab === 0 && (
              <Button
                variant="default"
                onClick={handlePrivateShare}
                disabled={isPrivateLoading || emails.length === 0}
              >
                {isPrivateLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send to {emails.length} recipient(s)
                  </>
                )}
              </Button>
            )}
            {activeTab === 1 && (
              <Button
                variant="default"
                onClick={handlePublicShare}
                disabled={isPublicLoading}
              >
                {isPublicLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Generate Public Link
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snackbar Toast */}
      {snackbar.open && (
        <div className="fixed bottom-5 left-1/2 z-50 max-w-md min-w-[300px] -translate-x-1/2">
          <Alert
            variant={snackbar.severity === "error" ? "destructive" : "default"}
            className={cn(
              snackbar.severity === "success" &&
                "border-primary bg-primary/10 text-primary",
              snackbar.severity === "warning" &&
                "border-border bg-background text-foreground",
            )}
          >
            <AlertDescription className="flex items-center justify-between">
              <span>{snackbar.message}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseSnackbar}
                className="ml-2 h-4 w-4"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default ShareAgentModal;
