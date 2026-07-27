"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { handleNativePptxExport } from "@/lib/nativePresentationExporter";
import { handlePDFExport } from "@/lib/pdfPresentationExporter";
import { handleAdvancedPptxExport } from "@/lib/presentationExporter";
import { cn } from "@/lib/utils";
import {
  useGenerateShareLinkMutation,
  useGetShareAnalyticsQuery,
  useUpdateShareSettingsMutation,
} from "@/redux/api/share/shareApi";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Edit as EditIcon,
  FileDown,
  FileText,
  Image as ImageIcon,
  Linkedin,
  Link as LinkIcon,
  Loader2,
  Mail,
  MessageCircle,
  Play,
  Share2,
  Twitter,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { usePresentation } from "./context/SlideContextProvider";

export default function SlidePreviewNavbar({
  slidesData,
  shareSettings,
  PresentationTitle,
  isSharedPage = false,
  projectId: projectIdProp,
}) {
  // 
  const { openPresentation } = usePresentation();
  const isMobile = useResponsive("down", "sm");
  const isTablet = useResponsive("down", "md");
  const router = useRouter();

  const searchParams = useSearchParams();
  const presentationId = projectIdProp || searchParams.get("project_id");

  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfOptions, setPdfOptions] = useState({
    format: "presentation",
    orientation: "landscape",
    quality: [0.92],
    margin: [10],
  });

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareSettingsState, setShareSettingsState] = useState({
    allowComments: true,
    allowDownload: true,
    expiryDate: null,
    password: "",
    requireSignIn: false,
    trackViews: true,
  });
  const [shareStats, setShareStats] = useState({
    views: 0,
    uniqueVisitors: 0,
    lastViewed: null,
  });

  // RTK Query hooks
  const [generateShareLink, { isLoading: isGeneratingLink }] =
    useGenerateShareLinkMutation();
  const [updateShareSettings] = useUpdateShareSettingsMutation();
  const { data: analyticsData, refetch: refetchAnalytics } =
    useGetShareAnalyticsQuery(presentationId, {
      skip: !presentationId || !shareLink,
    });

  // Update share stats when analytics data changes
  useEffect(() => {
    if (analyticsData?.analytics) {
      setShareStats(analyticsData.analytics);
    }
  }, [analyticsData]);

  const handleExportClick = () => {
    setExportOpen(true);
  };

  const handleExportClose = () => {
    setExportOpen(false);
  };

  const showSnackbar = (message, severity = "success") => {
    if (severity === "success") {
      toast.success(message);
    } else if (severity === "error") {
      toast.error(message);
    } else if (severity === "warning") {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  };

  const handleImagePptxExport = async () => {
    handleExportClose();
    if (!slidesData?.slides || slidesData.slides.length === 0) {
      showSnackbar("No slides available to export", "error");
      return;
    }

    setIsExporting(true);
    try {
      const result = await handleAdvancedPptxExport(slidesData.slides, {
        fileName: "presentation-images.pptx",
      });

      if (result.success) {
        showSnackbar(
          "Presentation exported successfully as images!",
          "success",
        );
      } else {
        showSnackbar(result.error || "Export failed", "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      showSnackbar("An error occurred during export", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePptxExportClick = async () => {
    handleExportClose();
    if (!slidesData?.slides || slidesData.slides.length === 0) {
      showSnackbar("No slides available to export", "error");
      return;
    }

    setIsExporting(true);
    try {
      const result = await handleNativePptxExport(slidesData.slides, {
        fileName: "presentation-editable.pptx",
      });

      if (result.success) {
        showSnackbar("Editable presentation exported successfully!", "success");
      } else {
        console.error("Native Export Failed:", result.error);
        showSnackbar(result.error || "Native export failed", "error");
      }
    } catch (error) {
      console.error("Native export error:", error);
      showSnackbar("An error occurred during native export", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExportClick = () => {
    handleExportClose();
    setPdfDialogOpen(true);
  };

  const handlePDFDialogClose = () => {
    setPdfDialogOpen(false);
  };

  const handlePDFExportConfirm = async () => {
    if (!slidesData?.slides || slidesData.slides.length === 0) {
      showSnackbar("No slides available to export", "error");
      return;
    }

    setPdfDialogOpen(false);
    setIsExporting(true);

    try {
      const result = await handlePDFExport(slidesData.slides, {
        fileName: "presentation.pdf",
        format: pdfOptions.format,
        orientation: pdfOptions.orientation,
        quality: pdfOptions.quality[0],
        margin: pdfOptions.margin[0],
      });

      if (result.success) {
        showSnackbar(result.message || "PDF exported successfully!", "success");
      } else {
        showSnackbar(result.error || "PDF export failed", "error");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      showSnackbar("An error occurred during PDF export", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFOptionChange = (key, value) => {
    setPdfOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSliderChange = (key, value) => {
    setPdfOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
    setShareLink("");
    setIsDiscoverable(false);
    setLinkCopied(false);
    setShareSettingsState({
      allowComments: true,
      allowDownload: true,
      expiryDate: null,
      password: "",
      requireSignIn: false,
      trackViews: true,
    });
  };

  const handleGenerateShareLink = async () => {
    if (!presentationId) {
      showSnackbar("No presentation ID available", "error");
      return;
    }

    try {
      const response = await generateShareLink(presentationId).unwrap();
      const { shareLink: newShareLink, settings } = response;
      setShareLink(newShareLink);
      setShareSettingsState(settings);
      setIsDiscoverable(settings.isDiscoverable);
      showSnackbar("Share link generated successfully!", "success");
      setTimeout(() => {
        if (newShareLink && presentationId) {
          refetchAnalytics();
        }
      }, 100);
    } catch (error) {
      console.error("Link generation error:", error);
      showSnackbar(
        error.data?.error || "Failed to generate share link",
        "error",
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      showSnackbar("Link copied to clipboard!", "success");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      showSnackbar("Failed to copy link", "error");
    }
  };

  const handleSocialShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareLink);
    const title = encodeURIComponent(
      `Check out this presentation: ${slidesData?.title || "Slides"}`,
    );

    const socialUrls = {
      email: `mailto:?subject=${title}&body=Check out this presentation: ${shareLink}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${encodedUrl}`,
    };

    if (socialUrls[platform]) {
      window.open(socialUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const handleShareSettingChange = async (key, value) => {
    if (!presentationId) {
      showSnackbar("No presentation ID available", "error");
      return;
    }

    setShareSettingsState((prev) => ({
      ...prev,
      [key]: value,
    }));

    try {
      await updateShareSettings({
        presentationId: presentationId,
        settings: { [key]: value },
      }).unwrap();
      showSnackbar("Share settings updated successfully!", "success");
    } catch (error) {
      console.error("Error updating share settings:", error);
      showSnackbar(
        error.data?.error || "Failed to update share settings",
        "error",
      );
      setShareSettingsState((prev) => ({
        ...prev,
        [key]: !value,
      }));
    }
  };

  // const isDownloadAllowed = shareSettings?.allowDownload !== false; // when exporting will fully functional only then make the export button available.
  const isDownloadAllowed = false;

  return (
    <>
      <header className="bg-background sticky top-0 z-50 border-b shadow-sm">
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-4",
            "px-2 sm:px-4 md:px-6",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
              <h1 className="text-foreground min-w-0 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap sm:text-base md:text-lg">
                {slidesData?.title || PresentationTitle || "Generating..."}
              </h1>

              {!isMobile && slidesData?.slides && (
                <Badge variant="outline" className="h-6 shrink-0 text-xs">
                  {slidesData.slides.length} slides
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="default"
              onClick={openPresentation}
              disabled={
                (!slidesData?.slides || slidesData.slides.length === 0) &&
                !slidesData
              }
              className="h-9 px-2 text-xs sm:px-4 sm:text-sm"
            >
              <Play className="h-4 w-4 sm:mr-2" />
              {!isMobile && "View Slides"}
            </Button>

            {isDownloadAllowed && (
              <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleExportClick}
                    disabled={
                      !slidesData?.slides ||
                      slidesData.slides.length === 0 ||
                      isExporting
                    }
                    className="h-9 px-2 text-xs sm:px-4 sm:text-sm"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 sm:mr-2" />
                        {!isMobile && "Export"}
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePDFExportClick}>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>Export as PDF</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      Portable document format
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImagePptxExport}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Export as Images</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      High-quality image slides in ppt
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleNativePptxExportClick}
                    disabled
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    <span>Export as Editable</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      Coming soon
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* PDF Export Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>PDF Export Options</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label>Page Format</Label>
              <Select
                value={pdfOptions.format}
                onValueChange={(value) =>
                  handlePDFOptionChange("format", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">
                    Presentation (16:9)
                  </SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Orientation</Label>
              <RadioGroup
                value={pdfOptions.orientation}
                onValueChange={(value) =>
                  handlePDFOptionChange("orientation", value)
                }
                className="flex-row"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape">Landscape</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait">Portrait</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Image Quality: {Math.round(pdfOptions.quality[0] * 100)}%
              </Label>
              <Slider
                value={pdfOptions.quality}
                onValueChange={(value) => handleSliderChange("quality", value)}
                min={0.1}
                max={1.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Margin: {pdfOptions.margin[0]}mm</Label>
              <Slider
                value={pdfOptions.margin}
                onValueChange={(value) => handleSliderChange("margin", value)}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePDFDialogClose}>
              Cancel
            </Button>
            <Button onClick={handlePDFExportConfirm}>Export PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Share2 className="text-primary h-5 w-5" />
              <DialogTitle className="text-2xl">Share Presentation</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              Generate a shareable link to collaborate on your slides
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="bg-muted/50 rounded-lg border p-6">
              <h3 className="text-primary mb-4 text-base font-semibold">
                Generate Share Link
              </h3>
              {!shareLink ? (
                <Button
                  onClick={handleGenerateShareLink}
                  disabled={isGeneratingLink}
                  className="w-full"
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Generate Share Link
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Input
                      value={shareLink}
                      readOnly
                      className="bg-background pr-10"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={handleCopyLink}
                        >
                          {linkCopied ? (
                            <Check className="text-primary h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {linkCopied ? "Copied!" : "Copy link"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Quick Share</h4>
                    <div className="flex flex-wrap gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleSocialShare("email")}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share via Email</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleSocialShare("linkedin")}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share on LinkedIn</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleSocialShare("twitter")}
                          >
                            <Twitter className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share on Twitter</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleSocialShare("whatsapp")}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share on WhatsApp</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {shareLink && (
              <div className="rounded-lg border p-6">
                <h3 className="text-primary mb-4 text-base font-semibold">
                  Privacy Settings
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Public Discovery</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {isDiscoverable
                          ? "Anyone with the link can view and share"
                          : "Only people with the link can view"}
                      </p>
                    </div>
                    <Switch
                      checked={isDiscoverable}
                      onCheckedChange={setIsDiscoverable}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Require Sign-in</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Viewers must sign in to access
                      </p>
                    </div>
                    <Switch
                      checked={shareSettingsState.requireSignIn}
                      onCheckedChange={(checked) =>
                        handleShareSettingChange("requireSignIn", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional setting is not required now 👇 */}
            {/* {shareLink && (
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  startIcon={
                    showAdvancedOptions ? <ExpandLess /> : <ExpandMore />
                  }
                  sx={{ textTransform: "none", mb: 2, fontWeight: 600 }}
                >
                  Advanced Options
                </Button>
                <Collapse in={showAdvancedOptions}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettingsState.allowComments}
                          onChange={(e) =>
                            handleShareSettingChange(
                              "allowComments",
                              e.target.checked
                            )
                          }
                          color="primary"
                        />
                      }
                      label="Allow Comments"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettingsState.allowDownload}
                          onChange={(e) =>
                            handleShareSettingChange(
                              "allowDownload",
                              e.target.checked
                            )
                          }
                          color="primary"
                        />
                      }
                      label="Allow Download"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettingsState.trackViews}
                          onChange={(e) =>
                            handleShareSettingChange(
                              "trackViews",
                              e.target.checked
                            )
                          }
                          color="primary"
                        />
                      }
                      label="Track Views & Analytics"
                    />
                    <TextField
                      fullWidth
                      label="Password Protection (Optional)"
                      type="password"
                      value={shareSettingsState.password}
                      onChange={(e) =>
                        handleShareSettingChange("password", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      helperText="Leave empty for no password protection"
                    />
                  </Box>
                </Collapse>
              </Paper>
            )} */}

            {shareLink && shareSettingsState.trackViews && (
              <div className="bg-muted/30 rounded-lg border p-6">
                <h3 className="text-muted-foreground mb-4 text-base font-semibold">
                  Analytics Preview
                </h3>
                <div className="flex flex-wrap gap-8">
                  <div className="text-center">
                    <p className="text-primary text-3xl font-bold">
                      {shareStats.views}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Total Views
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-primary text-3xl font-bold">
                      {shareStats.uniqueVisitors}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Unique Visitors
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {shareStats.lastViewed ? shareStats.lastViewed : "Never"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Last Viewed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4">
            <Button variant="outline" onClick={handleShareDialogClose}>
              Close
            </Button>
            {shareLink && (
              <Button onClick={handleCopyLink}>
                {linkCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
