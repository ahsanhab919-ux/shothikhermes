"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  useCreateAgentReplicaMutation,
  useLazyVerifySharedAgentQuery,
} from "@/redux/api/shareAgent/shareAgentApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowLeft, Eye, Save, User } from "lucide-react";
import { marked } from "marked";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const SharedAgentPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shareId } = params;

  const [password, setPassword] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [sharedData, setSharedData] = useState(null);

  const { accessToken, user } = useSelector((state) => state.auth);
  const isAuthenticated = !!accessToken;
  const dispatch = useDispatch();

  const [verifySharedAgent, { isLoading, data, error: verifyError }] =
    useLazyVerifySharedAgentQuery();
  const [createReplica, { isLoading: isCreatingReplica }] =
    useCreateAgentReplicaMutation();

  useEffect(() => {
    if (shareId) {
      loadSharedAgent();
    }
  }, [shareId]);

  // Debug auth state changes
  useEffect(() => {
  }, [accessToken, isAuthenticated, user]);

  useEffect(() => {
    if (verifyError) {
      const errorData = verifyError?.data;
      if (errorData?.requiresPassword) {
        setPasswordDialogOpen(true);
      } else if (errorData?.requiresAuth) {
        setError("Please sign in to view this shared content");
      } else {
        setError(errorData?.error || "Failed to load shared content");
      }
    }
  }, [verifyError]);

  useEffect(() => {
    if (data?.success) {
      setSharedData(data.data);
      setError(null);
    }
  }, [data]);

  const loadSharedAgent = async () => {
    try {
      await verifySharedAgent({
        shareId,
        password: password || undefined,
      }).unwrap();
    } catch (err) {
      console.error("Error loading shared agent:", err);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password) {
      setError("Password is required");
      return;
    }
    setPasswordDialogOpen(false);
    loadSharedAgent();
  };

  const handleSaveAsCopy = async () => {
    if (!isAuthenticated || !user) {
      // Open the login modal instead of redirecting
      dispatch(setShowLoginModal(true));
      return;
    }

    try {
      // Create replica first
      const response = await createReplica({
        sharedAgentId: sharedData.agent._id,
        currentUserId: user?.id,
        source: "shared_link",
        metadata: {
          sharedBy: sharedData.shareInfo.sharedBy,
          shareType: sharedData.shareInfo.visibility,
          originalShareId: shareId,
        },
      }).unwrap();


      if (response.success) {
        // Redirect to the research page with the new agent ID
        router.push(`/agents/research?id=${response.newAgentId}`);
      } else {
        setError(
          response.message ||
            "Failed to create copy. This feature is coming soon.",
        );
      }
    } catch (err) {
      console.error("Error creating replica:", err);
      setError(
        err?.data?.message ||
          "Failed to create a copy. This feature is coming soon.",
      );
    }
  };

  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Function to process markdown content to HTML with proper reference styling
  const processMarkdownContent = (content) => {
    if (!content) return "";

    // Ensure content is a string
    let contentStr =
      typeof content === "string" ? content : String(content || "");

    // Clean any [object Object] strings from the content
    contentStr = contentStr.replace(/\[object Object\]/g, "");

    // Process references to make them styled like in ResearchContentWithReferences
    // Convert [1], [2], etc. to styled superscript spans
    const processedContent = contentStr.replace(
      /\[(\d+(?:,\s*\d+)*)\]/g,
      (match, numbers) => {
        const refNumbers = numbers.split(",").map((n) => parseInt(n.trim()));

        return refNumbers
          .map((refNum) => {
            return `<sup class="text-primary font-medium">[${refNum}]</sup>`;
          })
          .join("");
      },
    );

    // Use marked to process the markdown
    return marked(processedContent);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Spinner className="size-12" />
        <p className="text-muted-foreground">Loading shared content...</p>
      </div>
    );
  }

  if (error && !passwordDialogOpen) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="ml-4"
            >
              Go Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!sharedData) {
    return null;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Button>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-semibold">
                    Shared AI Research
                  </h1>
                  <div className="mb-2 flex items-center gap-2">
                    <User className="text-muted-foreground size-4" />
                    <p className="text-muted-foreground text-sm">
                      Shared by: {sharedData.shareInfo.sharedBy.name}
                    </p>
                  </div>
                  {sharedData.shareInfo.message && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        {sharedData.shareInfo.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      sharedData.shareInfo.visibility === "public"
                        ? "default"
                        : "outline"
                    }
                  >
                    <Eye className="mr-1 size-3" />
                    {sharedData.shareInfo.visibility}
                  </Badge>
                  {sharedData.shareInfo.views !== null && (
                    <Badge variant="outline">
                      {sharedData.shareInfo.views} views
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    handleSaveAsCopy();
                  }}
                  disabled={isCreatingReplica}
                >
                  {isCreatingReplica ? (
                    <>
                      <Spinner className="mr-2 size-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Save as Copy to My Chat
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Content Display - Matching Research Agent Page Design */}
        <div className="mx-auto max-w-full">
          {sharedData.agent.type === "research" ? (
            <div>
              {/* Main Title */}
              {sharedData.agent.title && (
                <h2 className="text-foreground mb-6 text-center text-2xl font-bold">
                  {sharedData.agent.title}
                </h2>
              )}

              {/* Research Content */}
              <div
                className={cn(
                  "prose dark:prose-invert max-w-none",
                  "prose-headings:font-bold prose-headings:break-words",
                  "prose-h1:text-2xl prose-h1:mb-4",
                  "prose-h2:text-xl prose-h2:mb-4",
                  "prose-h3:text-lg prose-h3:mb-4",
                  "prose-h4:text-base prose-h4:mb-4",
                  "prose-p:mb-4 prose-p:break-words prose-p:hyphens-auto",
                  "prose-a:text-primary prose-a:break-all",
                  "prose-code:bg-muted-foreground/10 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:break-all prose-code:before:content-none prose-code:after:content-none",
                  "prose-pre:bg-muted-foreground/10 prose-pre:p-3 prose-pre:rounded-lg",
                  "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
                  "prose-img:rounded-lg prose-img:max-w-full",
                  "prose-th:p-2 prose-th:text-left prose-td:p-2",
                )}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(processMarkdownContent(sharedData.agent.content)),
                }}
              />

              {/* Sources Section - Matching Research Agent Page */}
              {sharedData.agent.sources &&
                sharedData.agent.sources.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-foreground mb-6 text-xl font-semibold">
                      References
                    </h3>

                    <div className="mb-4 flex flex-col flex-wrap gap-4 md:flex-row">
                      {sharedData.agent.sources
                        .slice(0, 6)
                        .map((source, index) => (
                          <div
                            key={index}
                            className={cn(
                              "border-border bg-card hover:bg-muted flex-[1_1_100%] rounded-lg border p-4 transition-colors",
                              "md:min-w-[calc(50%-8px)] md:flex-[1_1_calc(50%-8px)]",
                            )}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <div className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                <span className="text-primary-foreground text-xs font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <p className="text-foreground truncate text-sm font-semibold">
                                {source.title ||
                                  source.domain ||
                                  `Source ${index + 1}`}
                              </p>
                            </div>
                            <p className="text-muted-foreground block max-w-full truncate text-xs">
                              {source.url ||
                                source.domain ||
                                "No URL available"}
                            </p>
                          </div>
                        ))}
                    </div>

                    {sharedData.agent.sources.length > 6 && (
                      <p className="text-primary mb-6 cursor-pointer text-sm underline">
                        +{sharedData.agent.sources.length - 6} more sources
                        available
                      </p>
                    )}
                  </div>
                )}
            </div>
          ) : sharedData.agent.messages ? (
            // Regular agent messages display
            sharedData.agent.messages.map((message, index) => (
              <Card
                key={index}
                className={cn(
                  "mb-4 border-l-4 p-6",
                  message.role === "user"
                    ? "bg-muted/50 border-l-primary"
                    : "border-l-primary",
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    variant={message.role === "user" ? "default" : "secondary"}
                  >
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </Badge>
                </div>
                <p className="text-base whitespace-pre-wrap">
                  {typeof message.content === "string"
                    ? message.content
                    : message.content?.message ||
                      message.content?.data?.content ||
                      JSON.stringify(message.content, null, 2)}
                </p>
              </Card>
            ))
          ) : (
            <Alert>
              <AlertDescription>No content available</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            Shared on{" "}
            {new Date(sharedData.shareInfo.createdAt).toLocaleDateString()} via
            Shothik AI
          </p>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription className="mb-4">
              This shared content is password protected. Please enter the
              password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                aria-invalid={!!error}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              variant="default"
              disabled={!password}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SharedAgentPage;
