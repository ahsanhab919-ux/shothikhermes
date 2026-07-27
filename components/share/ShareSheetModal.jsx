"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePrivateShareMutation,
  useCreatePublicShareMutation,
} from "@/redux/api/shareAgent/shareAgentApi";
import { Copy, Link, Mail, Share } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const ShareSheetModal = ({ open, onClose, sheetId, sheetData, chatId }) => {
  const [activeTab, setActiveTab] = useState("private");
  const [message, setMessage] = useState("");
  const [emails, setEmails] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    setShareLink(""); // Clear previous share link
  };

  const handleClose = () => {
    setActiveTab("private");
    setMessage("");
    setEmails("");
    setShareLink("");
    setShowAdvanced(false);
    setSettings({
      requireSignIn: false,
      allowCopy: true,
      allowExport: true,
      trackViews: true,
      password: "",
      expiryDate: "",
    });
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  const handlePrivateShare = async () => {
    if (!emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    const emailList = emails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    if (emailList.length === 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    try {

      const response = await createPrivateShare({
        agentId: sheetId,
        emails: emailList,
        message: message || undefined,
        content: {
          type: "sheet",
          data: sheetData,
          metadata: {
            title: "Shared Sheet Data",
            description: "A spreadsheet shared from Shothik AI",
            createdAt: new Date().toISOString(),
            originalChatId: chatId,
            chatId: chatId,
          },
        },
        settings: {
          ...settings,
          expiryDate: settings.expiryDate || undefined,
          password: settings.password || undefined,
        },
      }).unwrap();

      if (response.success) {
        // Convert the share link to point to shared-sheet page
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const shareLink = `${baseUrl}/agents/shared-sheet/${response.data.shareId}`;
        setShareLink(shareLink);
        toast.success(
          `Successfully sent to ${response.data.emailsSent} recipient(s)!`,
        );
      }
    } catch (error) {
      console.error("Error creating private share:", error);
      toast.error(error?.data?.error || "Failed to create private share");
    }
  };

  const handlePublicShare = async () => {
    try {

      const response = await createPublicShare({
        agentId: sheetId,
        message: message || undefined,
        content: {
          type: "sheet",
          data: sheetData,
          metadata: {
            title: "Shared Sheet Data",
            description: "A spreadsheet shared from Shothik AI",
            createdAt: new Date().toISOString(),
            originalChatId: chatId,
            chatId: chatId,
          },
        },
        settings: {
          ...settings,
          expiryDate: settings.expiryDate || undefined,
          password: settings.password || undefined,
        },
      }).unwrap();

      if (response.success) {
        // Convert the share link to point to shared-sheet page
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || window.location.origin;
        const shareLink = response.data.shareLink;
        setShareLink(shareLink);
        toast.success("✓ Share link created successfully!");
      }
    } catch (error) {
      console.error("Error creating public share:", error);
      toast.error(error?.data?.error || "Failed to create public share");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="min-h-[500px] max-w-2xl p-0">
        <DialogHeader className="border-border flex flex-row items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Share className="text-primary h-5 w-5" />
            <DialogTitle className="text-xl font-semibold">
              Share Sheet Data
            </DialogTitle>
          </div>
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button> */}
        </DialogHeader>

        <div className="px-6 py-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="private" className="gap-2">
                <Mail className="h-4 w-4" />
                Private (Email)
              </TabsTrigger>
              <TabsTrigger value="public" className="gap-2">
                <Link className="h-4 w-4" />
                Public Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="private" className="mt-6 space-y-4">
              <div>
                <p className="text-muted-foreground mb-4 text-sm">
                  Send this sheet directly to specific people via email.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="emails">Email addresses</Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter email addresses separated by commas"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <p className="text-muted-foreground text-xs">
                    Separate multiple emails with commas
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="public" className="mt-6 space-y-4">
              <p className="text-muted-foreground text-sm">
                Anyone with this link can view your sheet. You can customize
                access settings below.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mb-6 space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a message about this shared sheet..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {shareLink && (
            <Alert className="mb-6">
              <AlertDescription>
                ✓ Share link created successfully!
                <div className="bg-muted mt-4 rounded-md p-4">
                  <p className="mb-2 text-sm font-medium">Share Link:</p>
                  <div className="flex items-center gap-2">
                    <Input value={shareLink} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(shareLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Settings
          </Button>

          {showAdvanced && (
            <div className="bg-muted mb-6 space-y-4 rounded-md p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="requireSignIn" className="cursor-pointer">
                  Require sign-in to view
                </Label>
                <Switch
                  id="requireSignIn"
                  checked={settings.requireSignIn}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireSignIn: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowCopy" className="cursor-pointer">
                  Allow copying to personal account
                </Label>
                <Switch
                  id="allowCopy"
                  checked={settings.allowCopy}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowCopy: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowExport" className="cursor-pointer">
                  Allow data export
                </Label>
                <Switch
                  id="allowExport"
                  checked={settings.allowExport}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowExport: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="trackViews" className="cursor-pointer">
                  Track views and analytics
                </Label>
                <Switch
                  id="trackViews"
                  checked={settings.trackViews}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, trackViews: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={settings.password}
                  onChange={(e) =>
                    setSettings({ ...settings, password: e.target.value })
                  }
                  placeholder="Set a password to protect the shared link"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={settings.expiryDate}
                  onChange={(e) =>
                    setSettings({ ...settings, expiryDate: e.target.value })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Set when this share should expire
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-border border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={
              activeTab === "private" ? handlePrivateShare : handlePublicShare
            }
            disabled={isPrivateLoading || isPublicLoading}
          >
            {isPrivateLoading || isPublicLoading
              ? "Creating..."
              : activeTab === "private"
                ? "Send Emails"
                : "Generate Public Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSheetModal;
