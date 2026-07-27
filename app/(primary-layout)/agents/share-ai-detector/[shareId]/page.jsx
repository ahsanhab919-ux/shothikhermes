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
  useLazyVerifySharedAgentQuery,
} from "@/redux/api/shareAgent/shareAgentApi";
import { ArrowLeft, Eye, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useIsDark from "@/hooks/ui/useIsDark";
import { getColorByPerplexity } from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection/helpers/pdfHelper";

const SharedAiDetectorPage = () => {
  const params = useParams();
  const router = useRouter();
  const { shareId } = params;
  const isDark = useIsDark();

  const [password, setPassword] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [sharedData, setSharedData] = useState(null);

  const { accessToken, user } = useSelector((state) => state.auth);
  const isAuthenticated = !!accessToken;

  const [verifySharedAgent, { isLoading, data, error: verifyError }] =
    useLazyVerifySharedAgentQuery();

  useEffect(() => {
    if (shareId) {
      loadSharedAgent();
    }
  }, [shareId]);

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
      console.error("Error loading shared AI Detector:", err);
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

  const agentData = sharedData.agent;
  const result = agentData?.result;
  const text = agentData?.text || "";

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
                    Shared AI Detection Report
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
            </CardContent>
          </Card>
        </div>

        {/* AI Detector Content Display */}
        <div className="mx-auto max-w-full">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Input Text Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Original Text</h2>
                <div className="bg-muted max-h-[600px] overflow-y-auto rounded-md p-4">
                  <p className="whitespace-pre-wrap text-sm">{text}</p>
                </div>
              </CardContent>
            </Card>

            {/* Result Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">AI Detection Result</h2>
                {result && result.sentences ? (
                  <div className="bg-muted max-h-[600px] overflow-y-auto rounded-md p-4">
                    {result.sentences.map((item, index) => (
                      <Fragment key={index}>
                        <span
                          style={{
                            backgroundColor: getColorByPerplexity(
                              item.highlight_sentence_for_ai,
                              item.perplexity,
                              isDark,
                            ),
                          }}
                        >
                          {item.sentence}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No detection result available</AlertDescription>
                  </Alert>
                )}

                {/* Summary Stats */}
                {result && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-muted-foreground text-xs">AI Percentage</p>
                      <p className="text-lg font-semibold">
                        {result.ai_percentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-muted-foreground text-xs">Human Confidence</p>
                      <p className="text-lg font-semibold">
                        {result.average_ai_confidence
                          ? (100 - result.average_ai_confidence).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-muted-foreground text-xs">Total Sentences</p>
                      <p className="text-lg font-semibold">
                        {result.total_sentences || 0}
                      </p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-muted-foreground text-xs">Total Words</p>
                      <p className="text-lg font-semibold">
                        {result.total_words || 0}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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

export default SharedAiDetectorPage;

